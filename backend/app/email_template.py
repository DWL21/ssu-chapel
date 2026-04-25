from datetime import date

from app.config import settings


def _render_notice_card(notice: dict) -> str:
    status = notice.get("status", "")
    category = notice.get("category", "")
    department = notice.get("department", "")
    title = notice.get("title", "")

    link = notice.get("link", "#")
    if link and not link.startswith("http"):
        link = f"https://scatch.ssu.ac.kr{link}"

    # 상태 뱃지
    status_color = "#4ec6c1" if status == "진행" else "#e74c3c" if status == "마감" else ""
    status_html = (
        f'<span style="display:inline-block;padding:2px 8px;font-size:11px;font-weight:600;'
        f'color:#fff;background:{status_color};border-radius:3px;">{status}</span> '
        if status and status_color else ""
    )

    # 카테고리 뱃지
    category_html = (
        f'<span style="display:inline-block;padding:2px 8px;font-size:11px;'
        f'color:#888;border:1px solid #ddd;border-radius:3px;">{category}</span> '
        if category else ""
    )

    # 부서
    dept_html = (
        f'<span style="font-size:12px;color:#999;">{department}</span>'
        if department else ""
    )

    return f"""
    <tr>
      <td style="padding:0 0 8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:#fff;border:1px solid #e8e8e8;border-radius:6px;">
          <tr>
            <td style="padding:12px 16px;">
              <div style="margin-bottom:6px;">
                {status_html}{category_html}{dept_html}
              </div>
              <a href="{link}" style="color:#333;text-decoration:none;font-size:14px;line-height:1.4;word-break:break-word;">
                {title}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>"""


def build_email_html(
    notices: list[dict],
    target_date: date | None = None,
    unsub_token: str | None = None,
) -> str:
    if target_date is None:
        target_date = date.today()

    display_date = target_date.strftime("%Y.%m.%d")
    count = len(notices)

    rows_html = ""
    for notice in notices:
        rows_html += _render_notice_card(notice)

    unsub_html = ""
    if unsub_token:
        unsub_url = f"{settings.frontend_origin}?unsubscribe={unsub_token}"
        unsub_html = f"""
          <tr>
            <td style="padding:8px 0 0;text-align:center;">
              <a href="{unsub_url}" style="font-size:11px;color:#bbb;text-decoration:underline;">
                구독 해지
              </a>
            </td>
          </tr>"""

    return f"""\
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>숭실대학교 공지사항 - {display_date}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:16px 12px;">

        <table role="presentation" cellpadding="0" cellspacing="0"
               style="width:100%;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#4ec6c1;border-radius:8px 8px 0 0;padding:20px 20px;">
              <h1 style="margin:0;font-size:18px;font-weight:700;color:#fff;">
                숭실대학교 공지사항
              </h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">
                {display_date} · 새 공지 {count}건
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#f9fafb;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;padding:12px 12px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                {rows_html}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;padding:16px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <a href="https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/"
                       style="display:inline-block;padding:10px 24px;font-size:13px;font-weight:600;color:#4ec6c1;border:1px solid #4ec6c1;border-radius:4px;text-decoration:none;">
                      전체 공지사항 보기
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#bbb;">
                      본 메일은 숭실대학교 공지사항 구독 서비스에 의해 자동 발송되었습니다.
                    </p>
                  </td>
                </tr>
                {unsub_html}
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>"""
