use std::sync::Arc;

use rusaint::application::chapel::ChapelApplication;
use rusaint::client::USaintClientBuilder;
use rusaint::model::SemesterType;
use rusaint::USaintSession;
use serde::Deserialize;
use worker::*;

#[derive(Deserialize)]
struct ChapelRequest {
    id: String,
    password: String,
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

#[event(fetch)]
async fn fetch(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let router = Router::new();

    router
        .post_async("/chapel", |mut req, _ctx| async move {
            let body: ChapelRequest = match req.json().await {
                Ok(b) => b,
                Err(_) => {
                    return Response::error(
                        r#"{"error":"Invalid request body. Expected JSON with id, password, year, semester fields."}"#,
                        400,
                    );
                }
            };

            let semester = match parse_semester(&body.semester) {
                Ok(s) => s,
                Err(e) => {
                    return Response::error(
                        format!(r#"{{"error":"Invalid semester: {}"}}"#, e),
                        400,
                    );
                }
            };

            let session = match USaintSession::with_password(&body.id, &body.password).await {
                Ok(s) => Arc::new(s),
                Err(e) => {
                    return Response::error(
                        format!(r#"{{"error":"Authentication failed: {}"}}"#, e),
                        401,
                    );
                }
            };

            let mut app: ChapelApplication = match USaintClientBuilder::new()
                .session(session)
                .build_into::<ChapelApplication>()
                .await
            {
                Ok(a) => a,
                Err(e) => {
                    return Response::error(
                        format!(r#"{{"error":"Failed to initialize chapel app: {}"}}"#, e),
                        500,
                    );
                }
            };

            match app.information(body.year, semester).await {
                Ok(info) => {
                    let json = serde_json::to_string(&info)
                        .map_err(|e| Error::RustError(e.to_string()))?;
                    let headers = Headers::new();
                    headers.set("Content-Type", "application/json")?;
                    Ok(Response::ok(json)?.with_headers(headers))
                }
                Err(e) => Response::error(
                    format!(r#"{{"error":"Failed to fetch chapel info: {}"}}"#, e),
                    500,
                ),
            }
        })
        .run(req, _env)
        .await
}
