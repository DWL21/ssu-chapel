"""이메일 템플릿 미리보기 — 실행하면 preview_email.html 을 생성한다."""

from datetime import date
from app.email_template import build_email_html

sample_notices = [
    {
        "date": "2026.04.09",
        "status": "진행",
        "category": "채용",
        "title": "2026년 숭실대학교 교무처 교무팀 계약직 직원 모집",
        "department": "총무·인사팀",
        "views": 216,
        "link": "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?slug=example1",
    },
    {
        "date": "2026.04.09",
        "status": "진행",
        "category": "채용",
        "title": "2026년 숭실대학교 글로벌미래교육원 미래교육팀 계약직원 모집",
        "department": "총무·인사팀",
        "views": 147,
        "link": "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?slug=example2",
    },
    {
        "date": "2026.04.09",
        "status": "진행",
        "category": "채용",
        "title": "2026년 숭실대학교 입학처 입학사정관 계약직 직원 모집",
        "department": "총무·인사팀",
        "views": 177,
        "link": "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?slug=example3",
    },
    {
        "date": "2026.04.09",
        "status": "진행",
        "category": "장학",
        "title": "2026년 (재)고속도로장학재단 미래기술분야 자격취득 지원사업 대상자 모집 안내(~4/19일)",
        "department": "장학팀",
        "views": 304,
        "link": "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?slug=example4",
    },
    {
        "date": "2026.04.09",
        "status": "",
        "category": "비교과·행사",
        "title": "[한국기독교문화연구원] 2026 한국기독교문화연구원 해외 석학초청강좌 I",
        "department": "한국기독교문화연구원",
        "views": 140,
        "link": "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?slug=example5",
    },
    {
        "date": "2026.04.09",
        "status": "진행",
        "category": "장학",
        "title": "2026년 대통령과학장학금 신규장학생 선발 공고",
        "department": "장학팀",
        "views": 482,
        "link": "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?slug=example6",
    },
]

html = build_email_html(sample_notices, target_date=date(2026, 4, 9))

with open("preview_email.html", "w", encoding="utf-8") as f:
    f.write(html)

print("preview_email.html 생성 완료 — 브라우저에서 열어 확인하세요.")
