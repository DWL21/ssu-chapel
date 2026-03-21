import { useState, useEffect } from 'react';

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
  const [storedUserId, setStoredUserId] = useState<string | null>(() => localStorage.getItem('ssu_userid'));

  // Chapel data states
  const [year, setYear] = useState('2026');
  const [semester, setSemester] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapelData, setChapelData] = useState<ChapelResponse | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

  const fetchChapelData = async (id: string, tok: string, yr: string, sem: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/chapel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token: tok, year: parseInt(yr), semester: sem }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('ssu_stoken');
          localStorage.removeItem('ssu_userid');
          setToken(null);
          setStoredUserId(null);
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
      setStoredUserId(id);
      setShowLoginModal(false);
      setPassword('');
      fetchChapelData(id, newToken, year, semester);
    } catch (err: any) {
      setAuthError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ssu_stoken');
    localStorage.removeItem('ssu_userid');
    setToken(null);
    setStoredUserId(null);
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
    if (token && storedUserId) {
      fetchChapelData(storedUserId, token, year, semester);
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
        <h3 className="section-title">나의 채플 정보</h3>

        {/* 연도/학기 셀렉터 (로그인 후 메인 페이지에 표시) */}
        {token && (
          <div className="semester-selector">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="year">연도</label>
              <select
                id="year"
                className="input-field"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
              >
                <option value="2026">2026년</option>
                <option value="2025">2025년</option>
                <option value="2024">2024년</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="semester">학기</label>
              <select
                id="semester"
                className="input-field"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                disabled={loading}
              >
                <option value="1">1학기</option>
                <option value="2">2학기</option>
                <option value="summer">여름학기</option>
                <option value="winter">겨울학기</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn-primary"
                style={{ width: 'auto', marginTop: 0, padding: '0.75rem 1rem' }}
                onClick={() => storedUserId && token && fetchChapelData(storedUserId, token, year, semester)}
                disabled={loading}
              >
                {loading ? <><div className="spinner"></div>조회 중...</> : '조회'}
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert-error">{error}</div>}

        {chapelData ? (
          <>
            <div className="dashboard-grid">
              <div className="stat-card">
                <span className="stat-label">채플 시간</span>
                <span className="stat-value">{chapelData.general_information.chapel_time.split('(')[0].trim()}</span>
                <span className="stat-subtitle">{chapelData.general_information.chapel_time.includes('(') ? chapelData.general_information.chapel_time.split('(')[1].replace(')', '') : ''}</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">지정 좌석</span>
                <span className="stat-value" style={{ color: '#a855f7' }}>{chapelData.general_information.seat_number}</span>
                <span className="stat-subtitle">{chapelData.general_information.chapel_room} ({chapelData.general_information.floor_level}층)</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">결석 횟수 / 결과</span>
                <span className="stat-value">
                  {chapelData.general_information.absence_time}회
                  <span className={`badge ${chapelData.general_information.result === 'P' ? 'success' : ''}`} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}>
                    {chapelData.general_information.result || '진행중'}
                  </span>
                </span>
              </div>
            </div>
          </>
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
        )}

        {/* 좌석 안내도 */}
        <div className="seating-chart-container">
          <div className="seating-chart-title">한경직기념관 좌석안내도</div>
          <img
            src="https://chaplain.ssu.ac.kr/wp-content/uploads/sites/7/2018/05/ssu01_02_05_plan.jpg"
            alt="한경직기념관 좌석 구조"
            className="seating-chart-img"
          />
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
                {authLoading ? (
                  <>
                    <div className="spinner"></div>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
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
