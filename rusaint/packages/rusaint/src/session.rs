use reqwest::{
    Client,
    header::{COOKIE, HOST, HeaderValue, SET_COOKIE},
};
use url::Url;
use wdpe::error::{ClientError, WebDynproError};

use crate::{
    error::{RusaintError, SsuSsoError},
    utils::{DEFAULT_USER_AGENT, default_header},
};

const SSU_USAINT_PORTAL_URL: &str = "https://saint.ssu.ac.kr/irj/portal";
const SSU_USAINT_SSO_URL: &str = "https://saint.ssu.ac.kr/webSSO/sso.jsp";
const SMARTID_LOGIN_URL: &str = "https://smartid.ssu.ac.kr/Symtra_sso/smln.asp";
const SMARTID_LOGIN_FORM_REQUEST_URL: &str = "https://smartid.ssu.ac.kr/Symtra_sso/smln_pcs.asp";

// ── Native session (reqwest_cookie_store based) ──────────────────────────────

#[cfg(feature = "native-session")]
mod native {
    use std::{
        borrow::BorrowMut,
        io::{BufRead, Write},
        sync::Arc,
    };

    use cookie_store::serde::json::{load_all, save_incl_expired_and_nonpersistent};
    use reqwest::cookie::{CookieStore, Jar};
    use reqwest_cookie_store::CookieStoreRwLock;

    use super::*;

    /// u-saint 로그인이 필요한 애플리케이션 사용 시 애플리케이션에 제공하는 세션
    #[derive(Debug, Default)]
    pub struct USaintSession(pub(super) CookieStoreRwLock);

    impl CookieStore for USaintSession {
        fn set_cookies(
            &self,
            cookie_headers: &mut dyn Iterator<Item = &HeaderValue>,
            url: &Url,
        ) {
            self.0.set_cookies(cookie_headers, url)
        }

        fn cookies(&self, url: &Url) -> Option<HeaderValue> {
            self.0.cookies(url)
        }
    }

    impl USaintSession {
        /// 익명 세션을 반환합니다.
        pub fn anonymous() -> USaintSession {
            USaintSession(CookieStoreRwLock::default())
        }

        /// SSO 로그인 토큰과 학번으로 인증된 세션을 반환합니다.
        pub async fn with_token(id: &str, token: &str) -> Result<USaintSession, RusaintError> {
            let session_store = Self::anonymous();
            let client = Client::builder()
                .user_agent(DEFAULT_USER_AGENT)
                .build()
                .unwrap();
            let portal = client
                .get(SSU_USAINT_PORTAL_URL)
                .headers(default_header())
                .header(HOST, "saint.ssu.ac.kr".parse::<HeaderValue>().unwrap())
                .send()
                .await
                .map_err(|e| {
                    WebDynproError::from(ClientError::FailedRequest(format!(
                        "failed to send request: {e}"
                    )))
                })?;
            let waf = portal.cookies().find(|cookie| cookie.name() == "WAF");

            session_store.set_cookies(
                portal
                    .headers()
                    .iter()
                    .filter_map(|header| {
                        if header.0 == SET_COOKIE {
                            Some(header.1)
                        } else {
                            None
                        }
                    })
                    .borrow_mut(),
                portal.url(),
            );

            if let Some(waf) = waf {
                let waf_cookie_str =
                    format!("WAF={}; domain=saint.ssu.ac.kr; path=/;", waf.value());
                session_store
                    .0
                    .write()
                    .unwrap()
                    .parse(
                        &waf_cookie_str,
                        &Url::parse("https://saint.ssu.ac.kr").unwrap(),
                    )
                    .unwrap();
            } else {
                tracing::warn!("WAF cookie not found in portal response");
            }
            let token_cookie_str = format!("sToken={token}; domain=.ssu.ac.kr; path=/; secure");
            let req = client
                .get(format!("{SSU_USAINT_SSO_URL}?sToken={token}&sIdno={id}"))
                .headers(default_header())
                .header(
                    COOKIE,
                    session_store
                        .cookies(&Url::parse("https://saint.ssu.ac.kr").unwrap())
                        .unwrap(),
                )
                .header(COOKIE, token_cookie_str.parse::<HeaderValue>().unwrap())
                .header(HOST, "saint.ssu.ac.kr".parse::<HeaderValue>().unwrap())
                .build()
                .map_err(|e| {
                    WebDynproError::from(ClientError::FailedRequest(format!(
                        "failed to build request: {e}"
                    )))
                })?;
            let res = client.execute(req).await.map_err(|e| {
                WebDynproError::from(ClientError::FailedRequest(format!(
                    "failed to send request: {e}"
                )))
            })?;
            let mut new_cookies = res.headers().iter().filter_map(|header| {
                if header.0 == SET_COOKIE {
                    Some(header.1)
                } else {
                    None
                }
            });
            session_store.set_cookies(&mut new_cookies, res.url());
            if let Some(sapsso_cookies) = session_store.cookies(res.url()) {
                let str = sapsso_cookies
                    .to_str()
                    .or(Err(ClientError::NoCookies(res.url().to_string())))
                    .map_err(WebDynproError::from)?;
                if str.contains("MYSAPSSO2") {
                    Ok(session_store)
                } else {
                    Err(WebDynproError::from(ClientError::NoSuchCookie(
                        "MYSAPSSO2".to_string(),
                    )))?
                }
            } else {
                Err(WebDynproError::from(ClientError::NoCookies(
                    res.url().to_string(),
                )))?
            }
        }

        /// 학번과 비밀번호로 인증된 세션을 반환합니다.
        pub async fn with_password(
            id: &str,
            password: &str,
        ) -> Result<USaintSession, RusaintError> {
            let token = super::obtain_ssu_sso_token(id, password).await?;
            Self::with_token(id, &token).await
        }

        /// 현재 세션의 쿠키를 json 형식으로 저장합니다.
        pub fn save_to_json<W: Write>(&self, writer: &mut W) -> Result<(), RusaintError> {
            let store = self.0.read().unwrap();
            save_incl_expired_and_nonpersistent(&store, writer).map_err(|_| {
                WebDynproError::from(ClientError::NoCookies(
                    "Failed to save cookies".to_string(),
                ))
            })?;
            Ok(())
        }

        /// json 형식으로 저장된 쿠키를 읽어 세션을 생성합니다.
        pub fn from_json<R: BufRead>(reader: R) -> Result<USaintSession, RusaintError> {
            let store = load_all(reader).map_err(|_| {
                WebDynproError::from(ClientError::NoCookies(
                    "Failed to load cookies".to_string(),
                ))
            })?;
            let store = CookieStoreRwLock::new(store);
            Ok(USaintSession(store))
        }
    }

    /// 학번과 비밀번호를 이용해 SSO 토큰을 발급받습니다.
    pub async fn obtain_ssu_sso_token(id: &str, password: &str) -> Result<String, SsuSsoError> {
        let jar: Arc<Jar> = Arc::new(Jar::default());
        let client = Client::builder()
            .cookie_provider(jar)
            .cookie_store(true)
            .user_agent(DEFAULT_USER_AGENT)
            .build()?;
        let body = client
            .get(SMARTID_LOGIN_URL)
            .headers(default_header())
            .send()
            .await?
            .text()
            .await?;
        let (in_tp_bit, rqst_caus_cd) = super::parse_login_form(&body)?;
        let params = [
            ("in_tp_bit", in_tp_bit.as_str()),
            ("rqst_caus_cd", rqst_caus_cd.as_str()),
            ("userid", id),
            ("pwd", password),
        ];
        let res = client
            .post(SMARTID_LOGIN_FORM_REQUEST_URL)
            .headers(default_header())
            .form(&params)
            .send()
            .await?;
        let cookie_token = {
            res.cookies()
                .find(|cookie| cookie.name() == "sToken" && !cookie.value().is_empty())
                .map(|cookie| cookie.value().to_string())
        };
        let message = if cookie_token.is_none() {
            let mut content = res.text().await?;
            let start = content.find("alert(\"").unwrap_or(0);
            let end = content.find("\");").unwrap_or(content.len());
            content.truncate(end);
            let message = content.split_off(start + 7);
            Some(message)
        } else {
            None
        };
        cookie_token.ok_or(SsuSsoError::CantFindToken(
            message.unwrap_or("Internal Error".to_string()),
        ))
    }
}

#[cfg(feature = "native-session")]
pub use native::USaintSession;
#[cfg(feature = "native-session")]
pub use native::obtain_ssu_sso_token;

// ── WASM-compatible session (domain-aware cookie store) ──────────────────────

#[cfg(not(feature = "native-session"))]
mod wasm_session {
    use std::collections::HashMap;
    use std::sync::RwLock;

    use super::*;

    /// u-saint 로그인이 필요한 애플리케이션 사용 시 애플리케이션에 제공하는 세션 (WASM 호환)
    #[derive(Debug, Default)]
    pub struct USaintSession {
        /// domain -> (cookie_name -> cookie_value)
        pub(crate) cookies: RwLock<HashMap<String, HashMap<String, String>>>,
    }

    impl USaintSession {
        /// 익명 세션을 반환합니다.
        pub fn anonymous() -> USaintSession {
            USaintSession {
                cookies: RwLock::new(HashMap::new()),
            }
        }

        /// Set-Cookie 헤더들을 파싱하여 도메인별로 쿠키를 저장합니다.
        pub fn store_cookies_from_headers(
            &self,
            headers: &reqwest::header::HeaderMap,
            url: &Url,
        ) {
            let domain = url.host_str().unwrap_or("").to_string();
            let mut store = self.cookies.write().unwrap();
            for value in headers.get_all(SET_COOKIE).iter() {
                if let Ok(cookie_str) = value.to_str() {
                    if let Some(name_value) = cookie_str.split(';').next() {
                        if let Some((name, value)) = name_value.split_once('=') {
                            let name = name.trim().to_string();
                            let value = value.trim().to_string();
                            let cookie_domain = cookie_str
                                .split(';')
                                .find_map(|part| {
                                    let part = part.trim();
                                    if part.to_lowercase().starts_with("domain=") {
                                        Some(
                                            part[7..]
                                                .trim()
                                                .trim_start_matches('.')
                                                .to_string(),
                                        )
                                    } else {
                                        None
                                    }
                                })
                                .unwrap_or_else(|| domain.clone());
                            store
                                .entry(cookie_domain)
                                .or_insert_with(HashMap::new)
                                .insert(name, value);
                        }
                    }
                }
            }
        }

        /// 특정 URL에 대한 쿠키 헤더 값을 반환합니다.
        pub fn cookie_header_for_url(&self, url: &Url) -> Option<HeaderValue> {
            let host = url.host_str().unwrap_or("");
            let store = self.cookies.read().unwrap();
            let mut cookies = Vec::new();
            for (domain, domain_cookies) in store.iter() {
                if host == domain || host.ends_with(&format!(".{domain}")) {
                    for (name, value) in domain_cookies {
                        cookies.push(format!("{name}={value}"));
                    }
                }
            }
            if cookies.is_empty() {
                None
            } else {
                HeaderValue::from_str(&cookies.join("; ")).ok()
            }
        }

        /// 쿠키를 직접 저장합니다.
        pub fn set_cookie(&self, domain: &str, name: &str, value: &str) {
            let mut store = self.cookies.write().unwrap();
            store
                .entry(domain.trim_start_matches('.').to_string())
                .or_insert_with(HashMap::new)
                .insert(name.to_string(), value.to_string());
        }

        /// SSO 로그인 토큰으로 인증된 세션을 반환합니다.
        pub async fn with_token(id: &str, token: &str) -> Result<USaintSession, RusaintError> {
            let session_store = Self::anonymous();
            let client = Client::builder()
                .user_agent(DEFAULT_USER_AGENT)
                .build()
                .map_err(|e| {
                    WebDynproError::from(ClientError::FailedRequest(format!(
                        "failed to build client: {e}"
                    )))
                })?;

            // Step 1: visit portal to collect WAF and session cookies
            let portal = client
                .get(SSU_USAINT_PORTAL_URL)
                .headers(default_header())
                .header(HOST, "saint.ssu.ac.kr".parse::<HeaderValue>().unwrap())
                .send()
                .await
                .map_err(|e| {
                    WebDynproError::from(ClientError::FailedRequest(format!(
                        "failed to send request: {e}"
                    )))
                })?;

            session_store.store_cookies_from_headers(portal.headers(), portal.url());

            // Set sToken cookie on ssu.ac.kr domain
            session_store.set_cookie("ssu.ac.kr", "sToken", token);

            // Step 2: call SSO with token, carrying portal cookies
            let saint_url = Url::parse("https://saint.ssu.ac.kr").unwrap();
            let mut cookie_parts = Vec::new();
            if let Some(existing) = session_store.cookie_header_for_url(&saint_url) {
                if let Ok(s) = existing.to_str() {
                    cookie_parts.push(s.to_string());
                }
            }
            cookie_parts.push(format!("sToken={token}"));
            let cookie_header = cookie_parts.join("; ");

            let req = client
                .get(format!("{SSU_USAINT_SSO_URL}?sToken={token}&sIdno={id}"))
                .headers(default_header())
                .header(COOKIE, cookie_header.parse::<HeaderValue>().map_err(|e| {
                    WebDynproError::from(ClientError::FailedRequest(format!(
                        "failed to build cookie header: {e}"
                    )))
                })?)
                .header(HOST, "saint.ssu.ac.kr".parse::<HeaderValue>().unwrap())
                .build()
                .map_err(|e| {
                    WebDynproError::from(ClientError::FailedRequest(format!(
                        "failed to build request: {e}"
                    )))
                })?;

            let res = client.execute(req).await.map_err(|e| {
                WebDynproError::from(ClientError::FailedRequest(format!(
                    "failed to send request: {e}"
                )))
            })?;

            session_store.store_cookies_from_headers(res.headers(), res.url());

            if let Some(sapsso_cookies) = session_store.cookie_header_for_url(res.url()) {
                let str = sapsso_cookies
                    .to_str()
                    .or(Err(ClientError::NoCookies(res.url().to_string())))
                    .map_err(WebDynproError::from)?;
                if str.contains("MYSAPSSO2") {
                    Ok(session_store)
                } else {
                    Err(WebDynproError::from(ClientError::NoSuchCookie(
                        "MYSAPSSO2".to_string(),
                    )))?
                }
            } else {
                Err(WebDynproError::from(ClientError::NoCookies(
                    res.url().to_string(),
                )))?
            }
        }

        /// 학번과 비밀번호로 인증된 세션을 반환합니다.
        pub async fn with_password(
            id: &str,
            password: &str,
        ) -> Result<USaintSession, RusaintError> {
            let token = super::obtain_ssu_sso_token(id, password).await?;
            Self::with_token(id, &token).await
        }
    }

    /// 학번과 비밀번호를 이용해 SSO 토큰을 발급받습니다. (WASM 호환)
    pub async fn obtain_ssu_sso_token(id: &str, password: &str) -> Result<String, SsuSsoError> {
        let client = Client::builder()
            .user_agent(DEFAULT_USER_AGENT)
            .build()?;

        // Step 1: GET login form, collect session cookies
        let login_resp = client
            .get(SMARTID_LOGIN_URL)
            .headers(default_header())
            .send()
            .await?;

        let mut login_cookies = Vec::new();
        for value in login_resp.headers().get_all(SET_COOKIE).iter() {
            if let Ok(cookie_str) = value.to_str() {
                if let Some(name_value) = cookie_str.split(';').next() {
                    login_cookies.push(name_value.to_string());
                }
            }
        }

        let body = login_resp.text().await?;
        let (in_tp_bit, rqst_caus_cd) = super::parse_login_form(&body)?;

        let params = [
            ("in_tp_bit", in_tp_bit.as_str()),
            ("rqst_caus_cd", rqst_caus_cd.as_str()),
            ("userid", id),
            ("pwd", password),
        ];

        let form_body: String = params
            .iter()
            .map(|(k, v)| {
                format!(
                    "{}={}",
                    url::form_urlencoded::byte_serialize(k.as_bytes()).collect::<String>(),
                    url::form_urlencoded::byte_serialize(v.as_bytes()).collect::<String>()
                )
            })
            .collect::<Vec<_>>()
            .join("&");

        // Step 2: POST credentials, carrying session cookies
        let mut req = client
            .post(SMARTID_LOGIN_FORM_REQUEST_URL)
            .headers(default_header())
            .header(
                reqwest::header::CONTENT_TYPE,
                "application/x-www-form-urlencoded",
            )
            .body(form_body);

        if !login_cookies.is_empty() {
            req = req.header(COOKIE, login_cookies.join("; "));
        }

        let res = req.send().await?;

        let cookie_token = res
            .headers()
            .get_all(SET_COOKIE)
            .iter()
            .find_map(|value| {
                value.to_str().ok().and_then(|s| {
                    s.split(';').next()?.split_once('=').and_then(|(name, val)| {
                        if name.trim() == "sToken" && !val.trim().is_empty() {
                            Some(val.trim().to_string())
                        } else {
                            None
                        }
                    })
                })
            });

        let message = if cookie_token.is_none() {
            let mut content = res.text().await?;
            let start = content.find("alert(\"").unwrap_or(0);
            let end = content.find("\");").unwrap_or(content.len());
            content.truncate(end);
            let message = content.split_off(start + 7);
            Some(message)
        } else {
            None
        };
        cookie_token.ok_or(SsuSsoError::CantFindToken(
            message.unwrap_or("Internal Error".to_string()),
        ))
    }
}

#[cfg(not(feature = "native-session"))]
pub use wasm_session::USaintSession;
#[cfg(not(feature = "native-session"))]
pub use wasm_session::obtain_ssu_sso_token;

// ── Shared helpers ───────────────────────────────────────────────────────────

fn parse_login_form(body: &str) -> Result<(String, String), SsuSsoError> {
    let document = scraper::Html::parse_document(body);
    let in_tp_bit_selector = scraper::Selector::parse(r#"input[name="in_tp_bit"]"#).unwrap();
    let rqst_caus_cd_selector =
        scraper::Selector::parse(r#"input[name="rqst_caus_cd"]"#).unwrap();
    let in_tp_bit = document
        .select(&in_tp_bit_selector)
        .next()
        .ok_or(SsuSsoError::CantLoadForm)?
        .value()
        .attr("value")
        .ok_or(SsuSsoError::CantLoadForm)?;
    let rqst_caus_cd = document
        .select(&rqst_caus_cd_selector)
        .next()
        .ok_or(SsuSsoError::CantLoadForm)?
        .value()
        .attr("value")
        .ok_or(SsuSsoError::CantLoadForm)?;
    Ok((in_tp_bit.to_owned(), rqst_caus_cd.to_owned()))
}
