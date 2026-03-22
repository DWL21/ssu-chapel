import { useState, useEffect } from 'react';

// 구역별 최대 열 수 (실제 배치도 기준)
// 1층: A(좌측fan), B, C(중앙), D, E(우측fan)
// 2층: F(좌), G, H(중앙), I, J(우)
const SECTION_MAX_COLS: Record<string, number> = {
  A: 6,  B: 7,  C: 11, D: 7,  E: 6,
  F: 9,  G: 7,  H: 9,  I: 6,  J: 7,
};

// "G - 8 - 2" 형식 파싱 (구역 - 행 - 열)
function parseSeat(seatStr: string): { section: string | null; row: string | null; col: string | null } {
  const m3 = seatStr.match(/^([A-Za-z]+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
  if (m3) return { section: m3[1].toUpperCase(), row: m3[2], col: m3[3] };
  const m2 = seatStr.match(/^([A-Za-z]+)\s*-?\s*(\d+)$/);
  if (m2) return { section: m2[1].toUpperCase(), row: null, col: m2[2] };
  return { section: null, row: null, col: seatStr };
}

interface SeatViewerProps {
  seatNumber: string;
  floorLevel: number;
  chapelRoom: string;
}


function SeatViewer({ seatNumber, floorLevel, chapelRoom }: SeatViewerProps) {
  const { section, row, col } = parseSeat(seatNumber);

  return (
    <div className="seat-viewer-card">
      <div className="seat-viewer-title">나의 지정 좌석</div>
      <div className="seat-info-row">
        {section && (
          <>
            <div className="seat-section-box">
              <div className="seat-big-value">{section}</div>
              <div className="seat-meta-label">구역</div>
            </div>
            <div className="seat-divider-vertical" />
          </>
        )}
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
        <div className="seat-location-box">
          <div className="seat-floor-pill">{floorLevel}층</div>
          <div className="seat-room-text">{chapelRoom}</div>
        </div>
      </div>

      <div className="chapel-mini-map">
        <div className="chapel-mini-label">강의실 위치 안내</div>
        <div className="chapel-floors-container">
          <div className="chapel-stage-bar">중앙무대</div>
          {([
            { floor: 1, floorSections: ['A', 'B', 'C', 'D', 'E'] },
            { floor: 2, floorSections: ['F', 'G', 'H', 'I', 'J'] },
            { floor: 3, floorSections: [] },
          ] as { floor: number; floorSections: string[] }[]).map(({ floor, floorSections }) => {
            const isActive = floor === floorLevel;
            return (
              <div key={floor} className={`chapel-floor-row${isActive ? ' active-floor' : ' inactive-floor'}`}>
                <span className="chapel-floor-label">{floor}층</span>
                <div className="chapel-floor-sections">
                  {floorSections.length > 0 ? floorSections.map(s => (
                    <div key={s} className={`chapel-section-cell${s === section && isActive ? ' active' : ''}`}>
                      {s}
                    </div>
                  )) : (
                    <div className={`chapel-section-cell no-label${isActive ? ' active' : ''}`}>
                      {isActive && section ? `${section}구역` : '좌석'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* 구역 좌석 배치도 */}
        {section && row && col && (() => {
          const userRow = parseInt(row);
          const userCol = parseInt(col);
          if (isNaN(userRow) || isNaN(userCol)) return null;
          const maxRow = Math.max(userRow + 2, 8);
          const sectionColMax = section ? (SECTION_MAX_COLS[section] ?? 8) : 8;
          const maxCol = Math.max(userCol, sectionColMax);
          return (
            <div className="seat-section-map">
              <div className="seat-section-title">{section}구역 좌석 배치</div>
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
                {Array.from({ length: maxRow }, (_, ri) => {
                  const r = ri + 1;
                  return (
                    <div key={r} className="seat-grid-row">
                      <div className={`seat-row-label${r === userRow ? ' my-row' : ''}`}>{r}</div>
                      {Array.from({ length: maxCol }, (_, ci) => {
                        const c = ci + 1;
                        const isMine = r === userRow && c === userCol;
                        return (
                          <div key={c} className={`seat-cell${isMine ? ' my-seat' : ''}`}>
                            {isMine ? '★' : ''}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="chapel-mini-footer">
          <span className="you-badge">
            내 자리: {section ?? '?'}구역{row ? ` ${row}행` : ''}{col ? ` ${col}열` : ''}
          </span>
        </div>
      </div>
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
  // Auth states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Persisted auth (restored from localStorage on mount)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ssu_stoken'));

  // 현재 연도/학기 자동 결정 (2~8월 → 1학기, 9~1월 → 2학기)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = String(new Date().getFullYear());
  const currentSemester = currentMonth >= 9 ? '2' : '1';

  // Chapel data states
  const [year] = useState(currentYear);
  const [semester] = useState(currentSemester);
  const [loading, setLoading] = useState(false);
  const [showSeatingImage, setShowSeatingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapelData, setChapelData] = useState<ChapelResponse | null>(null);

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

      const data: ChapelResponse = await response.json();
      setChapelData(data);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      setAuthError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

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
      const newToken: string = data.token;
      const id = userId.trim();

      localStorage.setItem('ssu_stoken', newToken);
      localStorage.setItem('ssu_userid', id);
      setToken(newToken);
      setShowLoginModal(false);
      setPassword('');
      fetchChapelData(newToken, year, semester);
    } catch (err: any) {
      setAuthError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    // KV 캐시 무효화 (실패해도 로컬 로그아웃은 진행)
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
    setUserId('');
    setPassword('');
    setError(null);
  };

  const openLoginModal = () => {
    setAuthError(null);
    setShowLoginModal(true);
  };

  useEffect(() => {
    if (token) {
      fetchChapelData(token, year, semester);
    }
  }, []);

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
          {token && (
            <button className="btn-icon" onClick={handleLogout}>
              로그아웃
            </button>
          )}
        </div>

        {/* 나의 채플 정보 */}
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
          const totalSessions = chapelData.attendances.length;
          const attendedCount = chapelData.attendances.filter(a => a.attendance === '출석').length;
          const absentCount = chapelData.general_information.absence_time;
          const requiredAttendance = Math.ceil(totalSessions * 0.8);
          const remainingAbsences = (totalSessions - requiredAttendance) - absentCount;
          const isOfficiallyPassed = chapelData.general_information.result === 'P';

          return (
            <>
              <div className="dashboard-grid">
                <div className="stat-card">
                  <span className="stat-label">채플 시간</span>
                  <span className="stat-value">{chapelData.general_information.chapel_time.split('(')[0].trim()}</span>
                  <span className="stat-subtitle">{chapelData.general_information.chapel_time.includes('(') ? chapelData.general_information.chapel_time.split('(')[1].replace(')', '') : ''}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">출결 현황</span>
                  <span className="stat-value">
                    {attendedCount}
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}> / {requiredAttendance}회 필요</span>
                  </span>
                  <span className="stat-subtitle" style={{
                    color: isOfficiallyPassed ? 'var(--success-color)'
                      : remainingAbsences > 0 ? 'var(--success-color)'
                      : remainingAbsences === 0 ? '#d97706'
                      : 'var(--error-color)'
                  }}>
                    {isOfficiallyPassed
                      ? '통과 기준 충족'
                      : remainingAbsences === 0
                      ? '결석 한도 도달'
                      : remainingAbsences < 0
                      ? `한도 ${Math.abs(remainingAbsences)}회 초과`
                      : ''}
                  </span>
                </div>
              </div>

              <SeatViewer
                seatNumber={chapelData.general_information.seat_number}
                floorLevel={chapelData.general_information.floor_level}
                chapelRoom={chapelData.general_information.chapel_room}
              />
            </>
          );
        })() : (
          loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div className="spinner" style={{ margin: '0 auto 0.75rem', borderColor: '#e5e7eb', borderTopColor: 'var(--primary)' }}></div>
              채플 정보를 불러오는 중...
            </div>
          ) : (
            !token && (
              <div className="login-prompt-card">
                <div className="login-prompt-icon">🔒</div>
                <p className="login-prompt-text">로그인하여 내 채플 정보를 확인하세요</p>
                <p className="login-prompt-sub">좌석 배치, 출결 현황 등 개인 채플 정보를 조회할 수 있습니다.</p>
                <button className="btn-login-prompt" onClick={openLoginModal}>
                  로그인하기
                </button>
              </div>
            )
          )
        )}

        {/* 좌석 안내도 토글 */}
        <div className="seating-image-toggle">
          <button
            className="seating-toggle-btn"
            onClick={() => setShowSeatingImage(prev => !prev)}
          >
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
          <div className="modal-panel glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">SSU Chapel 로그인</h2>
              <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            </div>

            {authError && <div className="alert-error">{authError}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="userId">학번 (SSO 아이디)</label>
                <input
                  id="userId"
                  type="text"
                  className="input-field"
                  placeholder="예: 20261234"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={authLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label htmlFor="password" style={{ marginBottom: 0 }}>비밀번호</label>
                  <a
                    href="https://smartid.ssu.ac.kr/Symtra_Sso/smln_pwd.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    비밀번호 찾기
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  placeholder="SSO 비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={authLoading}>
                {authLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
              * 개인정보는 안전하게 보호되며, 채플 정보를 조회하는 데에만 사용되고 서버에 저장되지 않습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
