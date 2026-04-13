from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["test"])

HTML = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>Notice Crawler Test</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; color: #222; }
  h1 { margin-bottom: 0.5rem; }
  .row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin: 1rem 0; }
  input, button { padding: 0.5rem 0.75rem; font-size: 14px; border-radius: 6px; border: 1px solid #ccc; }
  button { cursor: pointer; background: #2563eb; color: white; border: none; }
  button.secondary { background: #6b7280; }
  button.danger { background: #dc2626; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .status { font-size: 13px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { border-bottom: 1px solid #eee; padding: 0.5rem 0.4rem; text-align: left; font-size: 13px; vertical-align: top; }
  th { background: #f3f4f6; }
  td.title { max-width: 360px; }
  td.title a { color: #2563eb; text-decoration: none; }
  td.title a:hover { text-decoration: underline; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-size: 12px; }
  .empty { color: #888; padding: 1rem; text-align: center; }
</style>
</head>
<body>
  <h1>Notice Crawler Test</h1>
  <div class="status" id="dbStatus">DB 상태 로딩 중…</div>

  <div class="row">
    <label>page <input id="page" type="number" value="1" min="1" style="width:70px"></label>
    <label>category <input id="category" type="text" placeholder="(전체)" style="width:140px"></label>
    <button id="refresh">크롤링 & 저장</button>
    <button id="reload" class="secondary">DB 건수 새로고침</button>
    <button id="clear" class="danger">DB 비우기</button>
  </div>

  <div class="status" id="result"></div>

  <table id="table" style="display:none">
    <thead>
      <tr><th>#</th><th>카테고리</th><th>제목</th><th>부서</th><th>날짜</th><th>조회</th></tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="empty" id="empty" style="display:none">새 공지 없음</div>

<script>
const $ = (id) => document.getElementById(id);
const setStatus = (t) => $("result").textContent = t;

async function loadCount() {
  try {
    const r = await fetch("/notices/count");
    const d = await r.json();
    $("dbStatus").textContent = `DB 저장된 공지: ${d.count}건`;
  } catch (e) { $("dbStatus").textContent = "DB 상태 조회 실패: " + e; }
}

function render(notices) {
  const tb = $("tbody"); tb.innerHTML = "";
  if (!notices || notices.length === 0) {
    $("table").style.display = "none";
    $("empty").style.display = "block";
    return;
  }
  $("empty").style.display = "none";
  $("table").style.display = "";
  notices.forEach((n, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><span class="badge">${n.category || ""}</span></td>
      <td class="title"><a href="${n.link}" target="_blank" rel="noopener">${n.title || ""}</a></td>
      <td>${n.department || ""}</td>
      <td>${n.date || ""}</td>
      <td>${n.views ?? ""}</td>`;
    tb.appendChild(tr);
  });
}

$("refresh").onclick = async () => {
  setStatus("크롤링 중…");
  const page = $("page").value || 1;
  const category = encodeURIComponent($("category").value || "");
  try {
    const r = await fetch(`/notices/refresh?page=${page}&category=${category}`, { method: "POST" });
    const d = await r.json();
    setStatus(`새 공지 ${d.new_count}건 추가됨`);
    render(d.new_notices);
    loadCount();
  } catch (e) { setStatus("에러: " + e); }
};

$("clear").onclick = async () => {
  if (!confirm("notices 테이블을 전부 비웁니다. 계속?")) return;
  await fetch("/notices", { method: "DELETE" });
  setStatus("DB 비움");
  render([]);
  loadCount();
};

$("reload").onclick = loadCount;
loadCount();
</script>
</body>
</html>
"""


@router.get("/test", response_class=HTMLResponse)
async def test_page():
    return HTMLResponse(HTML)
