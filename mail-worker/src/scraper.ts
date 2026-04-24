import type { Notice } from './types';

const SCATCH_NOTICE_PATH = '/공지사항/';

const CATEGORY_PARAMS: Record<string, string> = {
  '전체': '',
  '학사': '학사',
  '장학': '장학',
  '국제교류': '국제교류',
  '외국인유학생': '외국인유학생',
  '채용': '채용',
  '비교과·행사': '비교과·행사',
  '교원채용': '교원채용',
  '교직': '교직',
  '봉사': '봉사',
  '기타': '기타',
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// WAF 쿠키 취득 후 본문 fetch (두 번 요청)
async function fetchWithWaf(url: string): Promise<string | null> {
  // 1차 요청 — WAF 쿠키 취득
  const first = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SSUMailBot/1.0)',
      'Accept': 'text/html',
    },
    redirect: 'follow',
  });

  const setCookie = first.headers.get('set-cookie') ?? '';
  const wafMatch = setCookie.match(/WAF=([^;]+)/);
  const wafCookie = wafMatch ? `WAF=${wafMatch[1]}` : '';

  // 2차 요청 — 실제 콘텐츠
  const second = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SSUMailBot/1.0)',
      'Accept': 'text/html',
      'Cookie': wafCookie,
    },
    redirect: 'follow',
  });

  if (!second.ok) return null;
  return second.text();
}

async function fetchNoticesFromPage(
  pageUrl: string,
  category: string,
): Promise<Notice[]> {
  const html = await fetchWithWaf(pageUrl);
  if (!html) return [];

  const notices: Notice[] = [];

  // <li class="start"> 또는 <li class=""> 로 각 공지 항목 분리
  const itemRegex = /<li\s+class="[^"]*">([\s\S]*?)<\/li>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(html)) !== null) {
    const item = itemMatch[1];

    // 날짜: notice_col1 내 텍스트
    const dateMatch = item.match(/notice_col1[^>]*>([\s\S]*?)<\/div>/i);
    const postedAt = dateMatch ? stripTags(dateMatch[1]).match(/\d{4}\.\d{2}\.\d{2}/)?.[0] ?? '' : '';

    // 링크 + 제목: notice_col3 내 <a>
    const col3Match = item.match(/notice_col3[^>]*>([\s\S]*?)<\/div>\s*<div/i);
    if (!col3Match) continue;

    const col3 = col3Match[1];
    const linkMatch = col3.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const href = linkMatch[1].trim();
    const innerHtml = linkMatch[2];

    // 제목: m-pt-5 span 내 텍스트
    const titleSpan = innerHtml.match(/<span[^>]*m-pt-5[^>]*>([\s\S]*?)<\/span>/i);
    const title = titleSpan ? stripTags(titleSpan[1]) : stripTags(innerHtml);

    if (!title || !href) continue;

    // 카테고리 레이블: label 클래스 span
    const labelMatch = innerHtml.match(/<span[^>]*label[^>]*>([\s\S]*?)<\/span>/i);
    const labelCat = labelMatch ? stripTags(labelMatch[1]) : category;

    // 부서: notice_col4
    const col4Match = item.match(/notice_col4[^>]*>([\s\S]*?)<\/div>/i);
    const dept = col4Match ? stripTags(col4Match[1]) : '';

    // 고유 ID: slug 파라미터
    const slugMatch = href.match(/slug=([^&]+)/);
    const noticeId = slugMatch ? decodeURIComponent(slugMatch[1]) : href;

    notices.push({
      noticeId,
      category: labelCat || category,
      title,
      url: href,
      postedAt,
      department: dept,
    });
  }

  return notices;
}

export async function fetchNotices(
  baseUrl: string,
  categories: string[],
): Promise<Notice[]> {
  const uniqueCategories = [...new Set(categories)];
  const all: Notice[] = [];

  // 전체 구독이면 카테고리 필터 없이 1번만 요청
  if (uniqueCategories.includes('전체')) {
    const url = `${baseUrl}${SCATCH_NOTICE_PATH}?f&keyword`;
    const notices = await fetchNoticesFromPage(url, '전체');
    all.push(...notices);
  } else {
    await Promise.allSettled(
      uniqueCategories.map(async (cat) => {
        const param = CATEGORY_PARAMS[cat] ?? '';
        const url = `${baseUrl}${SCATCH_NOTICE_PATH}?f&category=${encodeURIComponent(param)}&keyword`;
        const notices = await fetchNoticesFromPage(url, cat);
        all.push(...notices);
      }),
    );
  }

  // 중복 제거
  const seen = new Set<string>();
  return all.filter((n) => {
    if (seen.has(n.noticeId)) return false;
    seen.add(n.noticeId);
    return true;
  });
}
