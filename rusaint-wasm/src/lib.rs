use std::sync::Arc;

use rusaint::application::chapel::ChapelApplication;
use rusaint::client::USaintClientBuilder;
use rusaint::model::SemesterType;
use rusaint::obtain_ssu_sso_token;
use rusaint::USaintSession;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use worker::*;

fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[derive(Deserialize)]
struct AuthTokenRequest {
    id: String,
    password: String,
}

#[derive(Serialize)]
struct AuthTokenResponse {
    token: String,
}

#[derive(Serialize, Deserialize)]
struct CachedAuth {
    token: String,
    password_hash: String,
}

#[derive(Deserialize)]
struct ChapelRequest {
    token: String,
    year: u32,
    semester: String,
}

fn parse_semester(s: &str) -> Result<SemesterType> {
    match s {
        "1" | "one" | "One" => Ok(SemesterType::One),
        "summer" | "Summer" => Ok(SemesterType::Summer),
        "2" | "two" | "Two" => Ok(SemesterType::Two),
        "winter" | "Winter" => Ok(SemesterType::Winter),
        _ => Err(Error::RustError(format!("Invalid semester: {s}"))),
    }
}

// 로컬 Docker 환경용 Redis 캐시 (WEBDIS_URL 미설정 시 비활성화)
async fn webdis_get(url: &str, key: &str) -> Option<String> {
    if url.is_empty() {
        return None;
    }
    let req_url = format!("{}/GET/{}", url, key);
    let req = Request::new(&req_url, Method::Get).ok()?;
    let mut resp = Fetch::Request(req).send().await.ok()?;
    let text = resp.text().await.ok()?;
    let json: serde_json::Value = serde_json::from_str(&text).ok()?;
    match &json["GET"] {
        serde_json::Value::String(s) => Some(s.clone()),
        _ => None,
    }
}

async fn webdis_setex(url: &str, key: &str, seconds: u64, value: &str) {
    if url.is_empty() {
        return;
    }
    let req_url = format!("{}/SETEX/{}/{}", url, key, seconds);
    let mut init = RequestInit::new();
    init.with_method(Method::Put)
        .with_body(Some(wasm_bindgen::JsValue::from_str(value)));
    if let Ok(req) = Request::new_with_init(&req_url, &init) {
        let _ = Fetch::Request(req).send().await;
    }
}

async fn webdis_del(url: &str, key: &str) {
    if url.is_empty() {
        return;
    }
    let req_url = format!("{}/DEL/{}", url, key);
    if let Ok(req) = Request::new(&req_url, Method::Get) {
        let _ = Fetch::Request(req).send().await;
    }
}

const OPENAPI_SPEC: &str = r##"{
  "openapi": "3.0.3",
  "info": {
    "title": "rusaint Chapel API",
    "description": "SSU u-saint 채플 정보 조회 API. rusaint 라이브러리를 WASM으로 컴파일하여 Cloudflare Worker에서 실행합니다.",
    "version": "0.2.0"
  },
  "paths": {
    "/auth/token": {
      "post": {
        "summary": "SSO 토큰 발급",
        "description": "SSO 아이디/비밀번호로 인증하여 sToken을 발급합니다.",
        "operationId": "getAuthToken",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/AuthTokenRequest" },
              "example": {
                "id": "20211234",
                "password": "mypassword"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "토큰 발급 성공",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/AuthTokenResponse" }
              }
            }
          },
          "401": {
            "description": "인증 실패",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" },
                "example": { "error": "Authentication failed: 아이디와 비밀번호가 일치하지 않습니다." }
              }
            }
          },
          "500": {
            "description": "서버 오류",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/chapel": {
      "post": {
        "summary": "채플 정보 조회",
        "description": "SSO 토큰으로 인증 후 해당 학기의 채플 정보를 반환합니다.",
        "operationId": "getChapelInfo",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/ChapelRequest" },
              "example": {
                "token": "<sso_token>",
                "year": 2026,
                "semester": "1"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "채플 정보 조회 성공",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ChapelInformation" }
              }
            }
          },
          "400": {
            "description": "잘못된 요청 (파라미터 오류)",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" },
                "example": { "error": "Invalid semester: 3" }
              }
            }
          },
          "401": {
            "description": "인증 실패 (토큰 만료 또는 무효)",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" },
                "example": { "error": "Authentication failed: 토큰이 유효하지 않습니다." }
              }
            }
          },
          "500": {
            "description": "서버 오류",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "AuthTokenRequest": {
        "type": "object",
        "required": ["id", "password"],
        "properties": {
          "id": {
            "type": "string",
            "description": "학번 (SSO ID)",
            "example": "20211234"
          },
          "password": {
            "type": "string",
            "description": "비밀번호 (SSO Password)",
            "example": "mypassword"
          }
        }
      },
      "AuthTokenResponse": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string",
            "description": "SSO sToken"
          }
        }
      },
      "ChapelRequest": {
        "type": "object",
        "required": ["token", "year", "semester"],
        "properties": {
          "token": {
            "type": "string",
            "description": "SSO sToken (/auth/token 으로 발급)",
            "example": "<sso_token>"
          },
          "year": {
            "type": "integer",
            "description": "학년도",
            "example": 2026
          },
          "semester": {
            "type": "string",
            "description": "학기 (1, 2, summer, winter)",
            "enum": ["1", "2", "summer", "winter"],
            "example": "1"
          }
        }
      },
      "ChapelInformation": {
        "type": "object",
        "properties": {
          "year": { "type": "integer", "description": "학년도", "example": 2026 },
          "semester": {
            "type": "string",
            "description": "학기",
            "enum": ["One", "Two", "Summer", "Winter"],
            "example": "One"
          },
          "general_information": { "$ref": "#/components/schemas/GeneralChapelInformation" },
          "attendances": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/ChapelAttendance" }
          },
          "absence_requests": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/ChapelAbsenceRequest" }
          }
        }
      },
      "GeneralChapelInformation": {
        "type": "object",
        "properties": {
          "division": { "type": "integer", "description": "분반", "example": 2150101507 },
          "chapel_time": { "type": "string", "description": "시간표", "example": "수 10:30-11:20 (08110-반광준)" },
          "chapel_room": { "type": "string", "description": "강의실", "example": "한경직기념관 08110" },
          "floor_level": { "type": "integer", "description": "층수", "example": 2 },
          "seat_number": { "type": "string", "description": "좌석번호", "example": "G - 8 - 2" },
          "absence_time": { "type": "integer", "description": "결석일수", "example": 0 },
          "result": { "type": "string", "description": "성적", "example": "P" },
          "note": { "type": "string", "description": "비고", "example": "" }
        }
      },
      "ChapelAttendance": {
        "type": "object",
        "properties": {
          "division": { "type": "integer", "description": "분반" },
          "class_date": { "type": "string", "description": "수업일자", "example": "2026.03.11" },
          "category": { "type": "string", "description": "강의구분", "example": "메시지 채플" },
          "instructor": { "type": "string", "description": "강사", "example": "반광준" },
          "instructor_department": { "type": "string", "description": "소속", "example": "교목실" },
          "title": { "type": "string", "description": "제목" },
          "attendance": { "type": "string", "description": "출결상태", "example": "출석" },
          "result": { "type": "string", "description": "평가", "example": "높음" },
          "note": { "type": "string", "description": "비고" }
        }
      },
      "ChapelAbsenceRequest": {
        "type": "object",
        "properties": {
          "year": { "type": "integer", "description": "학년도" },
          "semester": { "type": "string", "description": "학기" },
          "absence_detail": { "type": "string", "description": "결석구분상세" },
          "absence_start": { "type": "string", "description": "결석시작일자" },
          "absence_end": { "type": "string", "description": "결석종료일자" },
          "absence_reason_kr": { "type": "string", "description": "결석사유(국문)" },
          "absence_reason_en": { "type": "string", "description": "결석사유(영문)" },
          "application_date": { "type": "string", "description": "신청일자" },
          "approval_date": { "type": "string", "description": "승인일자" },
          "denial_reason": { "type": "string", "description": "거부사유" },
          "status": { "type": "string", "description": "상태" }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": { "type": "string", "description": "에러 메시지" }
        }
      }
    }
  }
}"##;

const SWAGGER_HTML: &str = r#"<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>rusaint Chapel API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>"#;

fn cors_headers() -> Result<Headers> {
    let headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Content-Type")?;
    Ok(headers)
}

fn cors_response(response: Response) -> Result<Response> {
    let headers = cors_headers()?;
    let mut resp_headers = response.headers().clone();
    for (key, value) in headers.entries() {
        resp_headers.set(&key, &value)?;
    }
    Ok(response.with_headers(resp_headers))
}

#[event(fetch)]
async fn fetch(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let router = Router::new();

    let response = router
        .options("/auth/token", |_, _| {
            let headers = cors_headers()?;
            Ok(Response::empty()?.with_headers(headers))
        })
        .options("/auth/logout", |_, _| {
            let headers = cors_headers()?;
            Ok(Response::empty()?.with_headers(headers))
        })
        .options("/chapel", |_, _| {
            let headers = cors_headers()?;
            Ok(Response::empty()?.with_headers(headers))
        })
        .get("/openapi.json", |_, _| {
            let headers = Headers::new();
            headers.set("Content-Type", "application/json")?;
            headers.set("Access-Control-Allow-Origin", "*")?;
            Ok(Response::ok(OPENAPI_SPEC)?.with_headers(headers))
        })
        .get("/docs", |_, _| {
            let headers = Headers::new();
            headers.set("Content-Type", "text/html; charset=utf-8")?;
            Ok(Response::ok(SWAGGER_HTML)?.with_headers(headers))
        })
        .post_async("/auth/token", |mut req, ctx| async move {
            let body: AuthTokenRequest = match req.json().await {
                Ok(b) => b,
                Err(_) => {
                    return cors_response(Response::error(
                        r#"{"error":"Invalid request body. Expected JSON with id, password fields."}"#,
                        400,
                    )?);
                }
            };

            let kv_key = format!("token:{}", body.id);
            let webdis_url = ctx.var("WEBDIS_URL").map(|v| v.to_string()).unwrap_or_default();

            // WEBDIS_URL이 설정된 경우 Redis 우선, 없으면 Cloudflare KV 사용
            if !webdis_url.is_empty() {
                if let Some(cached_json) = webdis_get(&webdis_url, &kv_key).await {
                    if let Ok(cached) = serde_json::from_str::<CachedAuth>(&cached_json) {
                        if cached.password_hash == hash_password(&body.password) {
                            let resp = AuthTokenResponse { token: cached.token };
                            let json = serde_json::to_string(&resp)
                                .map_err(|e| Error::RustError(e.to_string()))?;
                            let headers = cors_headers()?;
                            headers.set("Content-Type", "application/json")?;
                            return Ok(Response::ok(json)?.with_headers(headers));
                        }
                    }
                }
            } else if let Ok(kv) = ctx.kv("CHAPEL_AUTH_CACHE") {
                if let Ok(Some(cached_json)) = kv.get(&kv_key).text().await {
                    if let Ok(cached) = serde_json::from_str::<CachedAuth>(&cached_json) {
                        if cached.password_hash == hash_password(&body.password) {
                            let resp = AuthTokenResponse { token: cached.token };
                            let json = serde_json::to_string(&resp)
                                .map_err(|e| Error::RustError(e.to_string()))?;
                            let headers = cors_headers()?;
                            headers.set("Content-Type", "application/json")?;
                            return Ok(Response::ok(json)?.with_headers(headers));
                        }
                    }
                }
            }

            // 캐시 미스 또는 비밀번호 불일치 — SSO 서버 호출
            match obtain_ssu_sso_token(&body.id, &body.password).await {
                Ok(token) => {
                    let cached = CachedAuth {
                        token: token.clone(),
                        password_hash: hash_password(&body.password),
                    };
                    // WEBDIS_URL 설정 시 Redis에 저장, 없으면 Cloudflare KV에 저장
                    if !webdis_url.is_empty() {
                        if let Ok(json) = serde_json::to_string(&cached) {
                            webdis_setex(&webdis_url, &kv_key, 82800, &json).await;
                        }
                    } else if let Ok(kv) = ctx.kv("CHAPEL_AUTH_CACHE") {
                        if let Ok(json) = serde_json::to_string(&cached) {
                            if let Ok(builder) = kv.put(&kv_key, &json) {
                                let _ = builder.expiration_ttl(82800).execute().await;
                            }
                        }
                    }
                    let resp = AuthTokenResponse { token };
                    let json = serde_json::to_string(&resp)
                        .map_err(|e| Error::RustError(e.to_string()))?;
                    let headers = cors_headers()?;
                    headers.set("Content-Type", "application/json")?;
                    Ok(Response::ok(json)?.with_headers(headers))
                }
                Err(e) => cors_response(Response::error(
                    format!(r#"{{"error":"Authentication failed: {}"}}"#, e),
                    401,
                )?),
            }
        })
        .post_async("/auth/logout", |mut req, ctx| async move {
            #[derive(Deserialize)]
            struct LogoutRequest { id: String }
            let webdis_url = ctx.var("WEBDIS_URL").map(|v| v.to_string()).unwrap_or_default();
            if let Ok(body) = req.json::<LogoutRequest>().await {
                let kv_key = format!("token:{}", body.id);
                if !webdis_url.is_empty() {
                    webdis_del(&webdis_url, &kv_key).await;
                } else if let Ok(kv) = ctx.kv("CHAPEL_AUTH_CACHE") {
                    let _ = kv.delete(&kv_key).await;
                }
            }
            cors_response(Response::ok("{}")?.with_headers(cors_headers()?))
        })
        .post_async("/chapel", |mut req, _ctx| async move {
            let body: ChapelRequest = match req.json().await {
                Ok(b) => b,
                Err(_) => {
                    return cors_response(Response::error(
                        r#"{"error":"Invalid request body. Expected JSON with token, year, semester fields."}"#,
                        400,
                    )?);
                }
            };

            let ts = || js_sys::Date::new_0().to_iso_string().as_string().unwrap_or_default();
            console_log!(
                "[{}] CHAPEL REQUEST body={}",
                ts(),
                serde_json::json!({
                    "token": "***",
                    "year": body.year,
                    "semester": body.semester,
                })
            );

            let semester = match parse_semester(&body.semester) {
                Ok(s) => s,
                Err(e) => {
                    let err_body = format!(r#"{{"error":"Invalid semester: {}"}}"#, e);
                    console_log!("[{}] CHAPEL RESPONSE 400 body={}", ts(), err_body);
                    return cors_response(Response::error(err_body, 400)?);
                }
            };

            let session = match USaintSession::with_token("", &body.token).await {
                Ok(s) => Arc::new(s),
                Err(e) => {
                    let err_body = format!(r#"{{"error":"Authentication failed: {}"}}"#, e);
                    console_log!("[{}] CHAPEL RESPONSE 401 body={}", ts(), err_body);
                    return cors_response(Response::error(err_body, 401)?);
                }
            };

            let mut app: ChapelApplication = match USaintClientBuilder::new()
                .session(session)
                .build_into::<ChapelApplication>()
                .await
            {
                Ok(a) => a,
                Err(e) => {
                    let err_body = format!(r#"{{"error":"Failed to initialize chapel app: {}"}}"#, e);
                    console_log!("[{}] CHAPEL RESPONSE 500 body={}", ts(), err_body);
                    return cors_response(Response::error(err_body, 500)?);
                }
            };

            match app.information(body.year, semester).await {
                Ok(info) => {
                    let json = serde_json::to_string(&info)
                        .map_err(|e| Error::RustError(e.to_string()))?;
                    console_log!("[{}] CHAPEL RESPONSE 200 body={}", ts(), json);
                    let headers = cors_headers()?;
                    headers.set("Content-Type", "application/json")?;
                    Ok(Response::ok(json)?.with_headers(headers))
                }
                Err(e) => {
                    let err_body = format!(r#"{{"error":"Failed to fetch chapel info: {}"}}"#, e);
                    console_log!("[{}] CHAPEL RESPONSE 500 body={}", ts(), err_body);
                    cors_response(Response::error(err_body, 500)?)
                }
            }
        })
        .run(req, _env)
        .await;

    response
}
