import { useState, useEffect } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import EmailSubscriptionForm from './EmailSubscriptionForm';

const FLOOR_2_MAX_ROW = 6;

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

function parseSeat(seatStr: string): { section: string | null; row: string | null; col: string | null } {
  const m3 = seatStr.match(/^([A-Za-z]+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
  if (m3) return { section: m3[1].toUpperCase(), row: m3[2], col: m3[3] };
  const m2 = seatStr.match(/^([A-Za-z]+)\s*-?\s*(\d+)$/);
  if (m2) return { section: m2[1].toUpperCase(), row: null, col: m2[2] };
  return { section: null, row: null, col: seatStr };
}

// -----------------------------------------------------------
// 🚀 추가된 핵심 로직: 미래 날짜의 가짜 결석을 '예정'으로 바꿔줍니다!
// -----------------------------------------------------------
function getActualAttendance(recordDateStr: string, originalAttendance: string) {
  if (!recordDateStr) return originalAttendance;
  
  // 날짜 형식 변환 (유세인트의 "YYYY.MM.DD" 등을 표준 "YYYY-MM-DD"로)
  const formattedDateStr = recordDateStr.replace(/\./g, '-');
  const classDate = new Date(formattedDateStr);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간은 제외하고 자정 기준으로 날짜만 비교

  // 만약 수업 날짜가 오늘보다 나중(미래)인데 시스템에 '결석'으로 찍혀있다면?
  if (classDate > today && originalAttendance === '결석') {
    return '예정'; // 강제로 '예정' 상태로 변경
  }
  return originalAttendance;
}

function ChapelMiniMap({
  displaySection,
  userSection,
  onSectionClick,
  isDarkMode
}: {
  displaySection: string | null;
  userSection: string | null;
  onSectionClick: (s: string) => void;
  isDarkMode: boolean;
}) {
  const userGroup  = SECTIONS_23F.includes(userSection  ?? '') ? '23' : '1';
  const viewGroup  = SECTIONS_23F.includes(displaySection ?? '') ? '23' : '1';

  return (
    <div className="chapel-floors-container">
      <div className="chapel-stage-bar" style={{ backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#94a3b8' : '#64748b' }}>중앙무대</div>
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
                  <div key={s} className={cls} onClick={() => onSectionClick(s)} title={`${s}구역`}
                    style={{
                        backgroundColor: isViewed ? (isDarkMode ? '#38bdf8' : '#002147') : (isDarkMode ? '#1e293b' : '#f8fafc'),
                        color: isViewed ? '#fff' : (isDarkMode ? '#cbd5e1' : '#64748b'),
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0'
                    }}>
                    {s}
                    {isUser && !isViewed && <span className="user-dot seat-ping" />}
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

function SeatSectionGrid({
  section,
  userRow,
  userCol,
  isDarkMode
}: {
  section: string;
  userRow?: number;
  userCol?: number;
  isDarkMode: boolean;
}) {
  const rowCols   = SECTION_ROW_COLS[section] ?? [];
  const is23F     = SECTIONS_23F.includes(section);
  const maxCol    = Math.max(...rowCols.filter(c => c > 0), 1);
  const totalRows = rowCols.length;

  const rows: React.ReactNode[] = [];
  for (let r = 1; r <= totalRows; r++) {
    if (is23F && r === FLOOR_2_MAX_ROW + 1) {
      rows.push(
        <div key="corridor" className="seat-floor-corridor" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', backgroundColor: isDarkMode ? '#334155' : '#f8fafc' }}>
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
          <div className="seat-wheelchair-row" style={{ color: isDarkMode ? '#f87171' : '#ef4444' }}>♿ 장애인석</div>
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
            <div key={c} className={`seat-cell${isMine ? ' my-seat seat-ping' : ''}`}
                 style={{
                    backgroundColor: isMine ? (isDarkMode ? '#38bdf8' : '#002147') : (isDarkMode ? '#334155' : '#e2e8f0'),
                    borderColor: isDarkMode ? '#475569' : '#cbd5e1'
                 }}>
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
      <div className="seat-section-stage-hint" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>↑ 무대</div>
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

interface SeatViewerProps {
  seatNumber: string;
  isDarkMode: boolean;
}

function SeatViewer({ seatNumber, isDarkMode }: SeatViewerProps) {
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
    <div className="seat-viewer-card" style={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
      <div className="seat-viewer-title">나의 지정 좌석</div>

      {isUnassigned ? (
        <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🪑</div>
          <div style={{ fontWeight: 600 }}>미지정</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>이번 학기 좌석이 배정되지 않았습니다.</div>
        </div>
      ) : (
        <>
          <div className="seat-info-row">
            <div className="seat-section-box" style={{ backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', color: isDarkMode ? '#f1f5f9' : '#002147' }}>
              <div className="seat-big-value">{section}</div>
              <div className="seat-meta-label">구역</div>
            </div>
            <div className="seat-divider-vertical" style={{ backgroundColor: isDarkMode ? '#475569' : '#e2e8f0' }} />
            {row && (
              <>
                <div className="seat-number-box" style={{ backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', color: isDarkMode ? '#f1f5f9' : '#002147' }}>
                  <div className="seat-big-value">{row}</div>
                  <div className="seat-meta-label">행</div>
                </div>
                <div className="seat-divider-vertical" style={{ backgroundColor: isDarkMode ? '#475569' : '#e2e8f0' }} />
              </>
            )}
            <div className="seat-number-box" style={{ background: isDarkMode ? '#0ea5e9' : '#0369a1' }}>
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
              isDarkMode={isDarkMode}
            />

            {displaySection && (
              <SeatSectionGrid
                section={displaySection}
                userRow={isViewingOwn ? userRow : undefined}
                userCol={isViewingOwn ? userCol : undefined}
                isDarkMode={isDarkMode}
              />
            )}

            <div className="chapel-mini-footer">
              <span className="you-badge" style={{ backgroundColor: isDarkMode ? '#0c4a6e' : '#f0f9ff', color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
                내 자리: {section}구역{row ? ` ${row}행` : ''}{col ? ` ${col}열` : ''}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionBrowser({ isDarkMode }: { isDarkMode: boolean }) {
  const [viewSection, setViewSection] = useState<string | null>(null);

  const handleClick = (s: string) =>
    setViewSection(prev => (prev === s ? null : s));

  return (
    <div className="section-browser-card" style={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
      <div className="section-browser-title">구역 탐색</div>
      <div className="section-browser-map">
        <ChapelMiniMap
          displaySection={viewSection}
          userSection={null}
          onSectionClick={handleClick}
          isDarkMode={isDarkMode}
        />
      </div>
      {viewSection && <SeatSectionGrid section={viewSection} isDarkMode={isDarkMode} />}
    </div>
  );
}

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

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');

  const [stampVisible, setStampVisible] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';
  }, [isDarkMode]);

  useEffect(() => {
    if (chapelData) {
      setStampVisible(false);
      const timer = setTimeout(() => {
        setStampVisible(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [chapelData]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    panel: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#1e293b',
    subText: isDarkMode ? '#94a3b8' : '#64748b',
    ssuBlue: isDarkMode ? '#38bdf8' : '#002147',
    border: isDarkMode ? '#334155' : '#e2e8f0'
  };

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
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
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
      fetchChapelData(data.token, year, semester);
    } catch (err: any) {
      setAuthError(err.message || '알 수 없는 오류가 발생했습니다.');
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
    setStampVisible(false);
    setLoading(false);
    setUserId('');
    setPassword('');
    setError(null);
  };

  useEffect(() => { if (token) fetchChapelData(token, year, semester); }, []);

  const getStatusColor = (attendance: string) => {
    if (attendance === '출석') return 'status-present';
    if (attendance === '결석') return 'status-absent';
    if (attendance === '지각') return 'status-late';
    if (attendance === '예정') return 'status-unknown'; // 예정된 수업은 회색 뱃지
    return 'status-unknown';
  };

return (
    <div className="app-container" style={{
        justifyContent: 'flex-start',
        paddingTop: '1.5rem',
        backgroundColor: theme.bg,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease'
    }}>
      <style>{`
        @keyframes seat-ping-anim {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.8); transform: scale(1); }
          70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); transform: scale(1); }
        }
        .seat-ping {
          animation: seat-ping-anim 1.5s infinite;
          z-index: 10;
          position: relative;
        }
      `}</style>

      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000,
          width: '42px', height: '42px', borderRadius: '50%', border: 'none',
          backgroundColor: theme.panel, color: theme.text,
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
        }}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className="results-container glass-panel" style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: theme.panel,
          color: theme.text,
          borderColor: theme.border
      }}>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: theme.ssuBlue }}></div>

        <div className="header-action" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="title" style={{ margin: 0, color: theme.ssuBlue }}>숭실대학교 채플 정보</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={() => setShowSubscriptionModal(true)} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>📧 구독</button>
            {token && <button className="btn-icon" onClick={handleLogout}>로그아웃</button>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '0.25rem' }}>
          <h3 className="section-title" style={{ margin: 0 }}>나의 채플 정보</h3>
          {token && (
            <span style={{ fontSize: '0.85rem', color: theme.subText, fontWeight: 500 }}>
              {year}년 {semester}학기
            </span>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {chapelData ? (() => {
          const FIX_TOTAL_SESSIONS = 14; 
          const FIX_MAX_ABSENCE = 4;     
          const requiredAttendance = FIX_TOTAL_SESSIONS - FIX_MAX_ABSENCE;

          const attendedCount    = chapelData.attendances.filter(a => a.attendance === '출석').length;
          const isOfficiallyPassed = chapelData.general_information.result === 'P';

          const completedSessions = chapelData.attendances.filter(a => a.attendance && a.attendance !== '-').length;
          const remainingSessions = FIX_TOTAL_SESSIONS - completedSessions;
          const possibleFinalAttendance = attendedCount + remainingSessions;
          const isFWarning = possibleFinalAttendance < requiredAttendance;

          const absentCount      = chapelData.general_information.absence_time;
          const remainingAbsences  = FIX_MAX_ABSENCE - absentCount;

          return (
            <>
              {isFWarning && !isOfficiallyPassed && (
                <div style={{
                    backgroundColor: isDarkMode ? '#450a0a' : '#fef2f2',
                    border: `1px solid ${isDarkMode ? '#991b1b' : '#fee2e2'}`,
                    borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <p style={{ margin: 0, color: isDarkMode ? '#fca5a5' : '#991b1b', fontWeight: 'bold', fontSize: '0.9rem' }}>결석 위험 경고!</p>
                    <p style={{ margin: 0, color: isDarkMode ? '#f87171' : '#b91c1c', fontSize: '0.8rem' }}>
                      {remainingAbsences < 0
                        ? "이미 결석 한도를 " + Math.abs(remainingAbsences) + "회 초과했습니다. F 위험!"
                        : "남은 채플을 모두 출석해도 수료 기준(80%) 미달 위험이 있습니다."}
                    </p>
                  </div>
                </div>
              )}

              <div className="dashboard-grid">
                <div className="stat-card" style={{ borderTop: `4px solid ${theme.ssuBlue}`, backgroundColor: theme.panel, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span className="stat-label" style={{ color: theme.subText, marginBottom: '12px', display: 'block' }}>채플 일정</span>
                    <span className="stat-value" style={{ color: theme.text, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', wordBreak: 'keep-all' }}>
                      {chapelData.general_information.chapel_time}
                    </span>
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.85rem', color: theme.subText, fontWeight: 500 }}>
                      {chapelData.general_information.chapel_room || '한경직기념관 대강당'}
                    </span>
                  </div>
                </div>

                <div className="stat-card" style={{ borderTop: isOfficiallyPassed ? '4px solid #10b981' : '4px solid #f59e0b', backgroundColor: theme.panel }}>
                  <span className="stat-label" style={{ color: theme.subText }}>출결 현황</span>
                  <span className="stat-value">
                    {attendedCount}
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: theme.subText }}> / {requiredAttendance}회 필요</span>
                  </span>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', marginBottom: '8px' }}>
                    {chapelData.attendances.map((record, idx) => {
                      // 🚀 실제 출결 상태 가져오기 (미래 날짜는 '예정'으로 변환)
                      const actualAttendance = getActualAttendance(record.class_date, record.attendance);

                      let bgColor = isDarkMode ? '#334155' : '#f8fafc';
                      let textColor = isDarkMode ? '#64748b' : '#cbd5e1';
                      let content: string | number = idx + 1;
                      let borderStyle = `1px dashed ${isDarkMode ? '#475569' : '#cbd5e1'}`;

                      if (actualAttendance === '출석') {
                        bgColor = isDarkMode ? '#1e3a8a' : '#eff6ff';
                        textColor = isDarkMode ? '#60a5fa' : '#3b82f6';
                        content = '출';
                        borderStyle = `1px solid ${isDarkMode ? '#2563eb' : '#bfdbfe'}`;
                      } else if (actualAttendance === '결석') {
                        bgColor = isDarkMode ? '#7f1d1d' : '#fef2f2';
                        textColor = isDarkMode ? '#f87171' : '#ef4444';
                        content = '결';
                        borderStyle = `1px solid ${isDarkMode ? '#b91c1c' : '#fecaca'}`;
                      } else if (actualAttendance === '지각') {
                        bgColor = isDarkMode ? '#78350f' : '#fffbeb';
                        textColor = isDarkMode ? '#fbbf24' : '#f59e0b';
                        content = '지';
                        borderStyle = `1px solid ${isDarkMode ? '#d97706' : '#fde68a'}`;
                      } 
                      // '예정'이거나 빈칸일 경우에는 기본값(회색 숫자) 유지!

                      return (
                        <div key={idx} style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          backgroundColor: bgColor, color: textColor, border: borderStyle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 'bold',
                          transition: 'all 0.5s ease',
                          transform: stampVisible ? 'scale(1)' : 'scale(0)',
                          opacity: stampVisible ? 1 : 0,
                          transitionDelay: `${idx * 0.05}s`
                        }}>
                          {content}
                        </div>
                      );
                    })}
                  </div>

                  <span className="stat-subtitle" style={{
                    display: 'block',
                    fontWeight: 'bold',
                    color: isOfficiallyPassed ? '#10b981'
                      : remainingAbsences > 0 ? '#10b981'
                      : remainingAbsences === 0 ? '#d97706' : '#ef4444'
                  }}>
                    {isOfficiallyPassed ? '통과 기준 충족'
                      : remainingAbsences === 0 ? '결석 한도 도달'
                      : remainingAbsences < 0 ? "한도 " + Math.abs(remainingAbsences) + "회 초과" : ''}
                  </span>
                </div>
              </div>

              <SeatViewer seatNumber={chapelData.general_information.seat_number} isDarkMode={isDarkMode} />
            </>
          );
        })() : (
          loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
              채플 정보를 불러오는 중...
            </div>
          ) : !token && (
            <>
              <div className="login-prompt-card" style={{ backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
                <div className="login-prompt-icon">🔒</div>
                <p className="login-prompt-text" style={{ color: theme.text }}>로그인하여 내 채플 정보를 확인하세요</p>
                <p className="login-prompt-sub" style={{ color: theme.subText }}>좌석 배치, 출결 현황 등 개인 채플 정보를 조회할 수 있습니다.</p>
                <button className="btn-login-prompt" onClick={() => { setAuthError(null); setShowLoginModal(true); }}>
                  로그인하기
                </button>
              </div>
              <SectionBrowser isDarkMode={isDarkMode} />
            </>
          )
        )}

        <div className="seating-image-toggle">
          <button className="seating-toggle-btn" onClick={() => setShowSeatingImage(p => !p)} style={{ color: theme.text }}>
            <span>한경직기념관 전체 좌석 안내도</span>
            <span className="seating-toggle-indicator" style={{ color: theme.subText }}>{showSeatingImage ? '▲ 닫기' : '▼ 보기'}</span>
          </button>
          {showSeatingImage && (
            <img
                src="https://chaplain.ssu.ac.kr/wp-content/uploads/sites/7/2018/05/ssu01_02_05_plan.jpg"
                alt="좌석 구조"
                className="seating-chart-img"
                style={{ filter: isDarkMode ? 'brightness(0.8) contrast(1.2)' : 'none' }}
            />
          )}
        </div>

        {chapelData && (
          <>
            <h3 style={{ marginBottom: '1rem', color: theme.text, fontSize: '1rem', marginTop: '1.5rem' }}>출결 기록</h3>
            <div className="attendance-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chapelData.attendances.map((record, index) => {
                const actualAttendance = getActualAttendance(record.class_date, record.attendance);

                return (
                  <div key={index} className="attendance-card" style={{
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      padding: '1rem'
                  }}>
                    <div className="attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="attendance-date" style={{ color: theme.text, fontWeight: 'bold' }}>{record.class_date}</span>
                      <span className={`attendance-status ${getStatusColor(actualAttendance)}`}>{actualAttendance || '-'}</span>
                    </div>
                    <div className="attendance-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: theme.subText }}>
                      <span>{record.title}</span>
                      <span>
                        {record.instructor}
                        {record.instructor_department ? ` (${record.instructor_department})` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 1. 로그인 모달 (독립) */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-panel glass-panel" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.panel, color: theme.text }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: theme.ssuBlue }}>U-Saint 로그인</h2>
              <button className="modal-close" onClick={() => setShowLoginModal(false)} style={{ color: theme.text }}>✕</button>
            </div>
            {authError && <div className="alert-error">{authError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="userId">학번 (U-Saint 아이디)</label>
                <input id="userId" type="text" className="input-field" placeholder="예: 20261234"
                  value={userId} onChange={e => setUserId(e.target.value)}
                  disabled={authLoading} autoComplete="username" autoFocus
                  style={{ backgroundColor: isDarkMode ? '#334155' : '#ffffff', color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label htmlFor="password" style={{ marginBottom: 0 }}>비밀번호</label>
                  <a href="https://smartid.ssu.ac.kr/Symtra_Sso/smln_pwd.asp" target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: theme.ssuBlue, textDecoration: 'none', fontWeight: 500 }}>
                    비밀번호 찾기
                  </a>
                </div>
                <input id="password" type="password" className="input-field" placeholder="U-Saint 비밀번호를 입력하세요"
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={authLoading} autoComplete="current-password"
                  style={{ backgroundColor: isDarkMode ? '#334155' : '#ffffff', color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={authLoading} style={{ backgroundColor: theme.ssuBlue }}>
                {authLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: theme.subText, textAlign: 'center', lineHeight: '1.5' }}>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: theme.ssuBlue, cursor: 'pointer',
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

      {/* 2. 구독 모달 (분리) */}
      {showSubscriptionModal && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
          <div className="modal-panel glass-panel" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.panel, color: theme.text, maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: theme.ssuBlue }}></h2>
              <button className="modal-close" onClick={() => setShowSubscriptionModal(false)} style={{ color: theme.text }}>✕</button>
            </div>
            <EmailSubscriptionForm isDarkMode={isDarkMode} onClose={() => setShowSubscriptionModal(false)} />
          </div>
        </div>
      )}

      {/* 3. 개인정보 모달 (분리) */}
      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
    </div>
  );
}

export default App;
