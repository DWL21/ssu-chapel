from datetime import date


_BADGE_BASE = (
    "display:inline-block;width:70px;padding:4px 0;font-size:12px;"
    "text-align:center;border-radius:3px;white-space:nowrap;overflow:hidden;"
    "text-overflow:ellipsis;box-sizing:border-box;"
)


def _status_style(status: str) -> str:
    if status == "진행":
        return _BADGE_BASE + "font-weight:600;color:#fff;background-color:#4ec6c1;"
    if status == "마감":
        return _BADGE_BASE + "font-weight:600;color:#fff;background-color:#e74c3c;"
    return ""


def _category_style() -> str:
    return _BADGE_BASE + "color:#888;border:1px solid #ccc;"


def _render_notice_row(notice: dict) -> str:
    status_html = (
        f'<span style="{_status_style(notice["status"])}">{notice["status"]}</span>'
        if notice.get("status")
        else ""
    )

    category_html = (
        f'<span style="{_category_style()}">{notice["category"]}</span>'
        if notice.get("category")
        else ""
    )

    link = notice.get("link", "#")
    if link and not link.startswith("http"):
        link = f"https://scatch.ssu.ac.kr{link}"

    return f"""
    <tr style="border-bottom:1px solid #f0f0f0;height:52px;">
      <td style="padding:0 8px;height:52px;vertical-align:middle;text-align:center;">
        {status_html}
      </td>
      <td style="padding:0 8px;height:52px;vertical-align:middle;text-align:center;">
        {category_html}
      </td>
      <td style="padding:0 8px;height:52px;vertical-align:middle;">
        <a href="{link}" style="color:#333;text-decoration:none;font-size:14px;">{notice["title"]}</a>
      </td>
      <td style="padding:0 8px;height:52px;vertical-align:middle;text-align:left;color:#999;font-size:13px;">
        {notice.get("department", "")}
      </td>
    </tr>"""


def build_email_html(notices: list[dict], target_date: date | None = None) -> str:
    """공지사항 목록을 HTML 이메일 본문으로 변환한다.

    Args:
        notices: 크롤러에서 가져온 공지사항 딕셔너리 리스트.
        target_date: 메일 상단에 표시할 날짜. None이면 오늘 날짜.
    """
    if target_date is None:
        target_date = date.today()

    display_date = target_date.strftime("%Y.%m.%d")

    rows_html = ""
    for notice in notices:
        rows_html += _render_notice_row(notice)

    count = len(notices)

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
      <td align="center" style="padding:24px 16px;">

        <!-- Header -->
        <table role="presentation" width="1000" cellpadding="0" cellspacing="0"
               style="max-width:1000px;width:100%;background-color:#4ec6c1;border-radius:8px 8px 0 0;">
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">
                숭실대학교 공지사항
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">
                {display_date} · 새 공지 {count}건
              </p>
            </td>
          </tr>
        </table>

        <!-- Body -->
        <table role="presentation" width="1000" cellpadding="0" cellspacing="0"
               style="max-width:1000px;width:100%;background-color:#fff;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;">
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">
                <!-- Column Header -->
                <colgroup>
                  <col style="width:100px;">
                  <col style="width:100px;">
                  <col>
                  <col style="width:200px;">
                </colgroup>
                <tr style="border-bottom:2px solid #e8e8e8;background-color:#fafafa;">
                  <td style="padding:10px 8px;text-align:center;font-size:12px;font-weight:600;color:#999;">
                    상태
                  </td>
                  <td style="padding:10px 8px;text-align:center;font-size:12px;font-weight:600;color:#999;">
                    카테고리
                  </td>
                  <td style="padding:10px 8px;font-size:12px;font-weight:600;color:#999;">
                    제목
                  </td>
                  <td style="padding:10px 8px;text-align:left;font-size:12px;font-weight:600;color:#999;">
                    등록부서
                  </td>
                </tr>
                {rows_html}
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="1000" cellpadding="0" cellspacing="0"
               style="max-width:1000px;width:100%;background-color:#fafafa;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <a href="https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/"
                 style="display:inline-block;padding:10px 28px;font-size:13px;font-weight:600;color:#4ec6c1;border:1px solid #4ec6c1;border-radius:4px;text-decoration:none;">
                전체 공지사항 보기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#bbb;">
                본 메일은 숭실대학교 공지사항 구독 서비스에 의해 자동 발송되었습니다.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>"""
