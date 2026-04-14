from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote, urlencode

app = FastAPI(title="SSU Scatch Notice Crawler")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

BASE_URL = "https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad"


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, follow_redirects=True)
        resp.raise_for_status()
        return resp.text


def parse_notice_list(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    items = soup.select("ul.notice-lists > li:not(.notice_head)")

    notices = []
    last_date = ""

    for item in items:
        # 날짜: 그룹 첫 번째만 보이지만 HTML에는 전부 존재
        date_el = item.select_one(".notice_col1 .h2")
        if date_el:
            date_text = date_el.get_text(strip=True)
            if date_text:
                last_date = date_text

        # 상태 (진행 / 마감 / 빈값)
        status_el = item.select_one(".notice_col2 .tag")
        status = status_el.get_text(strip=True) if status_el else ""

        # 제목 + 링크
        link_el = item.select_one(".notice_col3 a")
        if not link_el:
            continue
        href = link_el.get("href", "")

        title_el = item.select_one(".notice_col3 .d-inline-blcok.m-pt-5")
        title = title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True)

        # 카테고리 라벨
        category_el = item.select_one(".notice_col3 .label")
        category = category_el.get_text(strip=True) if category_el else ""

        # 등록부서
        dept_el = item.select_one(".notice_col4")
        department = dept_el.get_text(strip=True) if dept_el else ""

        # 조회수
        views_el = item.select_one(".notice_col5")
        views = int(views_el.get_text(strip=True)) if views_el and views_el.get_text(strip=True).isdigit() else 0

        notices.append({
            "date": last_date,
            "status": status,
            "title": title,
            "category": category,
            "department": department,
            "views": views,
            "link": href,
        })

    return notices


def parse_notice_detail(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    container = soup.select_one("div.bg-white")
    if not container:
        return {"title": "", "date": "", "views": 0, "category": "",
                "content_html": "", "content_text": "", "attachments": []}

    # 카테고리
    category_el = container.select_one("span.label")
    category = category_el.get_text(strip=True) if category_el else ""

    # 제목 (h1)
    title_el = container.select_one("h1")
    title = title_el.get_text(strip=True) if title_el else ""

    # 날짜 (ion-ios-calendar 옆)
    date = ""
    date_icon = container.select_one("i.ion-ios-calendar")
    if date_icon and date_icon.parent:
        date = date_icon.parent.get_text(strip=True)

    # 조회수 (ion-ios-eye 옆)
    views = 0
    views_icon = container.select_one("i.ion-ios-eye")
    if views_icon and views_icon.parent:
        views_text = views_icon.parent.get_text(strip=True)
        if views_text.isdigit():
            views = int(views_text)

    # 첨부파일 (본문 extract 전에 먼저 수집)
    attachments = []
    for a in container.select("ul.download-list a[href*='download.php']"):
        name = a.select_one("span")
        attachments.append({
            "name": name.get_text(strip=True) if name else a.get_text(strip=True),
            "url": a.get("href", ""),
        })

    # 본문: hr 이후의 div (첨부파일 목록 제외)
    content_div = container.select_one("hr ~ div")
    content_html = ""
    content_text = ""
    if content_div:
        download_list = content_div.select_one("ul.download-list")
        if download_list:
            download_list.extract()
        content_html = str(content_div)
        content_text = content_div.get_text(strip=True)

    return {
        "title": title,
        "date": date,
        "views": views,
        "category": category,
        "content_html": content_html,
        "content_text": content_text,
        "attachments": attachments,
    }


def parse_max_page(html: str) -> int:
    soup = BeautifulSoup(html, "lxml")
    page_links = soup.select("ul.pagination a")
    max_page = 1
    for a in page_links:
        href = a.get("href", "")
        if "/page/" in href:
            try:
                num = int(href.rstrip("/").split("/page/")[-1])
                max_page = max(max_page, num)
            except ValueError:
                pass
    return max_page


@app.get("/notices")
async def get_notices(
    page: int = Query(1, ge=1, description="페이지 번호"),
    category: str = Query("", description="카테고리 필터 (학사, 장학, 국제교류 등)"),
    keyword: str = Query("", description="검색 키워드"),
):
    # URL 구성
    if page > 1:
        url = f"{BASE_URL}/page/{page}/"
    else:
        url = f"{BASE_URL}/"

    params = {}
    if category or keyword:
        params["f"] = "all" if keyword else ""
        if category:
            params["category"] = category
        params["keyword"] = keyword if keyword else ""

    if params:
        url += "?" + urlencode(params)

    html = await fetch_html(url)
    notices = parse_notice_list(html)
    max_page = parse_max_page(html)

    return {
        "page": page,
        "max_page": max_page,
        "category": category,
        "keyword": keyword,
        "count": len(notices),
        "notices": notices,
    }


@app.get("/notices/detail")
async def get_notice_detail(
    slug: str = Query(..., description="공지사항 slug 또는 ID"),
    page: int = Query(1, description="목록 페이지 번호 (원본 URL 구성용)"),
):
    url = f"{BASE_URL}/?f&category&paged={page}&slug={quote(slug)}&keyword"
    html = await fetch_html(url)
    detail = parse_notice_detail(html)
    return detail
