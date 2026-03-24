import { useState, useEffect } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import TermsOfServiceModal from './TermsOfServiceModal';

// ── 상수 ──────────────────────────────────────────────
const FLOOR_2_MAX_ROW = 6; // 2층은 1~6행, 7행부터 3층

// 구역별 행별 실제 좌석 수 (index 0 = 1행). -1 = 장애인석 행
const SECTION_ROW_COLS: Record<string, number[]> = {
  A: [5, 6, 7, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5],
  B: [6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3],
  C: [9, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
  D: [6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, -1],
  E: [5, 6, 7, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5],
  F: [8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 8, 8, 8, 6, 5],
  G: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6],
  H: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
  I: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  J: [8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 8, 8, 8, 6, 5],
};
const SECTIONS_1F  = ['A', 'B', 'C', 'D', 'E'];
const SECTIONS_23F = ['F', 'G', 'H', 'I', 'J'];
const FLOOR_GROUPS = [
  { key: '1',  label: '1층',   sections: SECTIONS_1F  },
  { key: '23', label: '2·3층', sections: SECTIONS_23F },
];

// ── 좌석 번호 파싱 ("G - 8 - 2" → section/row/col) ───
function parseSeat(seatStr: string): { section: string | null; row: string | null; col: string | null } {
  const m3 = seatStr.match(/^([A-Za-z]+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
  if (m3) return { section: m3[1].toUpperCase(), row: m3[2], col: m3[3] };
  const m2 = seatStr.match(/^([A-Za-z]+)\s*-?\s*(\d+)$/);
  if (m2) return { section: m2[1].toUpperCase(), row: null, col: m2[2] };
  return { section: null, row: null, col: seatStr };
}

// ── 강의실 위치 미니맵 ────────────────────────────────
function ChapelMiniMap({
  displaySection,
  userSection,
  onSectionClick,
}: {
  displaySection: string | null;
  userSection: string | null;
  onSectionClick: (s: string) => void;
}) {
  const userGroup  = SECTIONS_23F.includes(userSection  ?? '') ? '23' : '1';
  const viewGroup  = SECTIONS_23F.includes(displaySection ?? '') ? '23' : '1';

  return (
    <div className="chapel-floors-container">
      <div className="chapel-stage-bar">중앙무대</div>
      {FLOOR_GROUPS.map(({ key, label, sections }) => {
        const isUserFloor = key === userGroup && userSection !== null;
        const isViewFloor = key === viewGroup && displaySection !== null;
        const rowClass = isUserFloor ? 'active-floor' : isViewFloor ? 'active-floor' : 'inactive-floor';
        return (
          <div key={key} className={`chapel-floor-row ${rowClass}`}>
            <span className="chapel-floor-label">{label}</span>
            <div className="chapel-floor-sections">
              {sections.map(s => {
                const isViewed = s === displaySection;
                const isUser   = s === userSection;
                let cls = 'chapel-section-cell clickable';
                if (isViewed) cls += ' active';
                if (isUser && !isViewed) cls += ' user-marker';
                return (
                  <div key={s} className={cls} onClick={() => onSectionClick(s)} title={`${s}구역`}>
                    {s}
                    {isUser && !isViewed && <span className="user-dot" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 구역 좌석 배치도 ──────────────────────────────────
function SeatSectionGrid({
  section,
  userRow,
  userCol,
}: {
  section: string;
  userRow?: number;
  userCol?: number;
}) {
  const rowCols   = SECTION_ROW_COLS[section] ?? [];
  const is23F     = SECTIONS_23F.includes(section);
  const maxCol    = Math.max(...rowCols.filter(c => c > 0), 1);
  const totalRows = rowCols.length;

  const rows: React.ReactNode[] = [];
  for (let r = 1; r <= totalRows; r++) {
    if (is23F && r === FLOOR_2_MAX_ROW + 1) {
      rows.push(
        <div key="corridor" className="seat-floor-corridor">
          <span>— 복도 —</span>
          <span className="corridor-hint">2층 ↑  ↓ 3층</span>
        </div>
      );
    }
    const colsInRow = rowCols[r - 1];
    const isMineRow = r === userRow;

    if (colsInRow === -1) {
      rows.push(
        <div key={r} className="seat-grid-row">
          <div className={`seat-row-label${isMineRow ? ' my-row' : ''}`}>{r}</div>
          <div className="seat-wheelchair-row">♿ 장애인석</div>
        </div>
      );
      continue;
    }

    rows.push(
      <div key={r} className="seat-grid-row">
        <div className={`seat-row-label${isMineRow ? ' my-row' : ''}`}>{r}</div>
        {Array.from({ length: maxCol }, (_, ci) => {
          const c = ci + 1;
          const exists = c <= colsInRow;
          const isMine = isMineRow && c === userCol;
          if (!exists) return <div key={c} className="seat-cell seat-cell-void" />;
          return (
            <div key={c} className={`seat-cell${isMine ? ' my-seat' : ''}`}>
              {isMine ? '★' : ''}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="seat-section-map">
      <div className="seat-section-title">
        {section}구역 좌석 배치{is23F ? <span className="seat-section-floor-tag">2·3층</span> : ''}
      </div>
      <div className="seat-section-stage-hint">↑ 무대</div>
      <div className="seat-section-scroll">
        <div className="seat-grid-header">
          <div className="seat-label-spacer" />
          {Array.from({ length: maxCol }, (_, i) => (
            <div key={i + 1} className={`seat-col-label${i + 1 === userCol ? ' my-col' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>
        {rows}
      </div>
    </div>
  );
}

// ── 나의 지정 좌석 뷰어 (로그인 후) ──────────────────
interface SeatViewerProps {
  seatNumber: string;
}

function SeatViewer({ seatNumber }: SeatViewerProps) {
  const { section, row, col } = parseSeat(seatNumber);
  const [viewSection, setViewSection] = useState<string | null>(null);

  const userRow = row ? parseInt(row) : undefined;
  const userCol = col ? parseInt(col) : undefined;
  const displaySection = viewSection ?? section;
  const isViewingOwn   = !viewSection || viewSection === section;

  const handleSectionClick = (s: string) => {
    setViewSection(prev => (prev === s || s === section) && !prev ? null : s === section ? null : s);
  };

  const isUnassigned = !section;

  return (
    <div className="seat-viewer-card">
      <div className="seat-viewer-title">나의 지정 좌석</div>

      {isUnassigned ? (
        <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🪑</div>
          <div style={{ fontWeight: 600, color: '#64748b' }}>미지정</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>이번 학기 좌석이 배정되지 않았습니다.</div>
        </div>
      ) : (
        <>
          <div className="seat-info-row">
            <div className="seat-section-box">
              <div className="seat-big-value">{section}</div>
              <div className="seat-meta-label">구역</div>
            </div>
            <div className="seat-divider-vertical" />
            {row && (
              <>
                <div className="seat-number-box">
                  <div className="seat-big-value">{row}</div>
                  <div className="seat-meta-label">행</div>
                </div>
                <div className="seat-divider-vertical" />
              </>
            )}
            <div className="seat-number-box" style={{ background: '#0369a1' }}>
              <div className="seat-big-value">{col ?? '-'}</div>
              <div className="seat-meta-label">열</div>
            </div>
          </div>

          <div className="chapel-mini-map">
            <div className="chapel-mini-label-row">
              <span className="chapel-mini-label">강의실 위치 안내</span>
              {viewSection && viewSection !== section && (
                <button className="view-reset-btn" onClick={() => setViewSection(null)}>
                  내 자리로
                </button>
              )}
            </div>

            <ChapelMiniMap
              displaySection={displaySection}
              userSection={section}
              onSectionClick={handleSectionClick}
            />

            {displaySection && (
              <SeatSectionGrid
                section={displaySection}
                userRow={isViewingOwn ? userRow : undefined}
                userCol={isViewingOwn ? userCol : undefined}
              />
            )}

            <div className="chapel-mini-footer">
              <span className="you-badge">
                내 자리: {section}구역{row ? ` ${row}행` : ''}{col ? ` ${col}열` : ''}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 구역 탐색 (비로그인) ─────────────────────────────
function SectionBrowser() {
  const [viewSection, setViewSection] = useState<string | null>(null);

  const handleClick = (s: string) =>
    setViewSection(prev => (prev === s ? null : s));

  return (
    <div className="section-browser-card">
      <div className="section-browser-title">구역 탐색</div>
      <div className="section-browser-map">
        <ChapelMiniMap
          displaySection={viewSection}
          userSection={null}
          onSectionClick={handleClick}
        />
      </div>
      {viewSection && <SeatSectionGrid section={viewSection} />}
    </div>
  );
}

// ── 데이터 타입 ──────────────────────────────────────
interface ChapelResponse {
  year: number;
  semester: string;
  general_information: {
    division: number;
    chapel_time: string;
    chapel_room: string;
    floor_level: number;
    seat_number: string;
    absence_time: number;
    result: string;
    note: string;
  };
  attendances: {
    division: number;
    class_date: string;
    category: string;
    instructor: string;
    instructor_department: string;
    title: string;
    attendance: string;
    result: string;
    note: string;
  }[];
  absence_requests: any[];
}

// ── 메인 앱 ──────────────────────────────────────────
function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [userId, setUserId]     = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError]   = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ssu_stoken'));

  const currentMonth   = new Date().getMonth() + 1;
  const currentYear    = String(new Date().getFullYear());
  const currentSemester = currentMonth >= 9 ? '2' : '1';

  const [year]     = useState(currentYear);
  const [semester] = useState(currentSemester);
  const [loading, setLoading]         = useState(false);
  const [showSeatingImage, setShowSeatingImage] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [chapelData, setChapelData]   = useState<ChapelResponse | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

  const fetchChapelData = async (tok: string, yr: string, sem: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/chapel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tok, year: parseInt(yr), semester: sem }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          const storedId = localStorage.getItem('ssu_userid');
          if (storedId) {
            fetch(`${baseUrl}/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: storedId }),
            }).catch(() => {});
          }
          localStorage.removeItem('ssu_stoken');
          localStorage.removeItem('ssu_userid');
          setToken(null);
          setAuthError('인증이 만료되었습니다. 다시 로그인해주세요.');
          setShowLoginModal(true);
          (window as any).clarity?.('event', 'auth_expired');
          (window as any).gtag?.('event', 'auth_expired');
          return;
        }
        let errMsg = '채플 정보를 불러오는데 실패했습니다.';
        try {
          const errData = await response.json();
          if (response.status === 400) errMsg = `잘못된 요청입니다. (${errData.error || '학기 등 확인 필요'})`;
          else errMsg = `서버 오류 발생: ${errData.error || '알 수 없는 에러'}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      setChapelData(await response.json());
      (window as any).clarity?.('event', 'chapel_loaded');
      (window as any).gtag?.('event', 'chapel_loaded');
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      (window as any).clarity?.('event', 'chapel_load_error');
      (window as any).gtag?.('event', 'chapel_load_error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !password) { setAuthError('아이디와 비밀번호를 입력해주세요.'); return; }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${baseUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId.trim(), password: password.trim() }),
      });
      if (!response.ok) {
        let errMsg = '인증에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
        try {
          const errData = await response.json();
          if (response.status === 401) errMsg = `인증에 실패했습니다. (${errData.error || '아이디와 패스워드를 확인해주세요'})`;
          else errMsg = `오류: ${errData.error || '알 수 없는 에러'}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      localStorage.setItem('ssu_stoken', data.token);
      localStorage.setItem('ssu_userid', userId.trim());
      setToken(data.token);
      setShowLoginModal(false);
      setPassword('');
      (window as any).clarity?.('event', 'login_success');
      (window as any).clarity?.('identify', userId.trim());
      (window as any).gtag?.('event', 'login');
      fetchChapelData(data.token, year, semester);
    } catch (err: any) {
      setAuthError(err.message || '알 수 없는 오류가 발생했습니다.');
      (window as any).clarity?.('event', 'login_failed');
      (window as any).gtag?.('event', 'login_failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    const storedId = localStorage.getItem('ssu_userid');
    if (storedId) {
      fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storedId }),
      }).catch(() => {});
    }
    localStorage.removeItem('ssu_stoken');
    localStorage.removeItem('ssu_userid');
    setToken(null);
    setChapelData(null);
    setLoading(false);
    (window as any).clarity?.('event', 'logout');
    (window as any).gtag?.('event', 'logout');
    setUserId('');
    setPassword('');
    setError(null);
  };

  useEffect(() => { if (token) fetchChapelData(token, year, semester); }, []);

  const getStatusColor = (attendance: string) => {
    if (attendance === '출석') return 'status-present';
    if (attendance === '결석') return 'status-absent';
    if (attendance === '지각') return 'status-late';
    return 'status-unknown';
  };

  return (
    <div className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '1.5rem' }}>
      <div className="results-container glass-panel">
        <div className="header-action">
          <h1 className="title" style={{ margin: 0 }}>숭실대학교 채플 정보</h1>
          {token && <button className="btn-icon" onClick={handleLogout}>로그아웃</button>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '0.25rem' }}>
          <h3 className="section-title" style={{ margin: 0 }}>나의 채플 정보</h3>
          {token && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {year}년 {semester}학기
            </span>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {chapelData ? (() => {
          const totalSessions    = chapelData.attendances.length;
          const attendedCount    = chapelData.attendances.filter(a => a.attendance === '출석').length;
          const absentCount      = chapelData.general_information.absence_time;
          const requiredAttendance = Math.ceil(totalSessions * 0.8);
          const remainingAbsences  = (totalSessions - requiredAttendance) - absentCount;
          const isOfficiallyPassed = chapelData.general_information.result === 'P';
          return (
            <>
              <div className="dashboard-grid">
                <div className="stat-card">
                  <span className="stat-label">채플 시간</span>
                  <span className="stat-value">{chapelData.general_information.chapel_time.split('(')[0].trim()}</span>
                  <span className="stat-subtitle">
                    {chapelData.general_information.chapel_time.includes('(')
                      ? chapelData.general_information.chapel_time.split('(')[1].replace(')', '') : ''}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">출결 현황</span>
                  <span className="stat-value">
                    {attendedCount}
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}> / {requiredAttendance}회 필요</span>
                  </span>
<span className={`attendance-result-badge ${
                    isOfficiallyPassed ? 'badge-pass'
                      : remainingAbsences > 0 ? 'badge-ok'
                      : remainingAbsences === 0 ? 'badge-warn'
                      : 'badge-fail'
                  }`}>
                    {isOfficiallyPassed ? '✓' : remainingAbsences > 0 ? '✓' : remainingAbsences === 0 ? '!' : '✕'}
                    <span>
                      {isOfficiallyPassed ? '통과'
                        : remainingAbsences > 0 ? `여유 ${remainingAbsences}회`
                        : remainingAbsences === 0 ? '여유 없음'
                        : `${Math.abs(remainingAbsences)}회 초과`}
                    </span>
                  </span>
                </div>
              </div>

              <SeatViewer
                seatNumber={chapelData.general_information.seat_number}
              />
            </>
          );
        })() : (
          loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div className="spinner" style={{ margin: '0 auto 0.75rem', borderColor: '#e5e7eb', borderTopColor: 'var(--primary)' }} />
              채플 정보를 불러오는 중...
            </div>
          ) : !token && (
            <>
              <div className="login-prompt-card">
                <div className="login-prompt-icon">🔒</div>
                <p className="login-prompt-text">로그인하여 내 채플 정보를 확인하세요</p>
                <p className="login-prompt-sub">좌석 배치, 출결 현황 등 개인 채플 정보를 조회할 수 있습니다.</p>
                <button className="btn-login-prompt" onClick={() => { setAuthError(null); setShowLoginModal(true); }}>
                  로그인하기
                </button>
              </div>
              <SectionBrowser />
            </>
          )
        )}

        {/* 전체 좌석 안내도 토글 */}
        <div className="seating-image-toggle">
          <button className="seating-toggle-btn" onClick={() => setShowSeatingImage(p => !p)}>
            <span>한경직기념관 전체 좌석 안내도</span>
            <span className="seating-toggle-indicator">{showSeatingImage ? '▲ 닫기' : '▼ 보기'}</span>
          </button>
          {showSeatingImage && (
            <img
              src="https://chaplain.ssu.ac.kr/wp-content/uploads/sites/7/2018/05/ssu01_02_05_plan.jpg"
              alt="한경직기념관 좌석 구조"
              className="seating-chart-img"
            />
          )}
        </div>

        {/* 출결 기록 */}
        {chapelData && (
          <>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1rem', marginTop: '1.5rem' }}>출결 기록</h3>
            <div className="attendance-list">
              {chapelData.attendances.length === 0 ? (
                <div className="empty-state">출결 기록이 없습니다.</div>
              ) : (
                chapelData.attendances.map((record, index) => (
                  <div key={index} className="attendance-card">
                    <div className="attendance-header">
                      <span className="attendance-date">{record.class_date}</span>
                      <span className={`attendance-status ${getStatusColor(record.attendance)}`}>
                        {record.attendance || '-'}
                      </span>
                    </div>
                    <div className="attendance-details">
                      <span className="attendance-category">{record.category}</span>
                      <span className="attendance-instructor">
                        {record.instructor}
                        {record.instructor_department ? ` (${record.instructor_department})` : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-panel glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">U-Saint 로그인</h2>
              <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            </div>
            {authError && <div className="alert-error">{authError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="userId">학번 (U-Saint 아이디)</label>
                <input id="userId" type="text" className="input-field" placeholder="예: 20261234"
                  value={userId} onChange={e => setUserId(e.target.value)}
                  disabled={authLoading} autoComplete="username" autoFocus />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label htmlFor="password" style={{ marginBottom: 0 }}>비밀번호</label>
                  <a href="https://smartid.ssu.ac.kr/Symtra_Sso/smln_pwd.asp" target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                    비밀번호 찾기
                  </a>
                </div>
                <input id="password" type="password" className="input-field" placeholder="U-Saint 비밀번호를 입력하세요"
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={authLoading} autoComplete="current-password" />
              </div>
              <button type="submit" className="btn-primary" disabled={authLoading}>
                {authLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--primary, #6366f1)', cursor: 'pointer',
                  fontSize: '0.75rem', textDecoration: 'underline', fontWeight: 500,
                }}
              >
                개인정보 처리 방침
              </button>
              에 동의합니다.
            </p>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer style={{
        width: '100%', maxWidth: '680px', margin: '1rem auto 1.5rem',
        padding: '1rem 1rem 0',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
      }}>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfp-n6_nc1HiMZmhoYB1BYbgmNQ1_iKKd8nvO6osHfd7i86NQ/viewform"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', marginBottom: '0.75rem',
            fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}
        >
          서비스 의견 남기기 →
        </a>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            개인정보 처리방침
          </button>
          <span style={{ color: '#e2e8f0', fontSize: '0.75rem', userSelect: 'none' }}>|</span>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            이용약관
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#cbd5e1' }}>
          © {new Date().getFullYear()} 숭실대학교 채플 좌석 조회 서비스. All rights reserved.
        </p>
      </footer>

      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
      {showTermsModal && <TermsOfServiceModal onClose={() => setShowTermsModal(false)} />}
    </div>
  );
}

export default App;
