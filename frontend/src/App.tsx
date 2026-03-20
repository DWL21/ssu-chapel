import { useState } from 'react';

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
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [year, setYear] = useState('2026');
  const [semester, setSemester] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapelData, setChapelData] = useState<ChapelResponse | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chapel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId.trim(),
          password: password.trim(),
          year: parseInt(year),
          semester: semester,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('인증에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        if (response.status === 400) throw new Error('잘못된 요청입니다. (학기 등 확인 필요)');
        throw new Error('채플 정보를 불러오는데 실패했습니다. (서버 오류)');
      }

      const data: ChapelResponse = await response.json();
      setChapelData(data);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (attendance: string) => {
    if (attendance === '출석') return 'status-present';
    if (attendance === '결석') return 'status-absent';
    if (attendance === '지각') return 'status-late';
    return 'status-unknown';
  };

  if (chapelData) {
    const { general_information, attendances } = chapelData;
    
    return (
      <div className="app-container">
        <div className="results-container glass-panel">
          <div className="header-action">
            <h1 className="title" style={{ margin: 0 }}>숭실대학교 채플 정보</h1>
            <button className="btn-icon" onClick={() => setChapelData(null)}>
              뒤로 가기
            </button>
          </div>

          <div className="dashboard-grid">
            <div className="stat-card">
              <span className="stat-label">채플 시간</span>
              <span className="stat-value">{general_information.chapel_time.split('(')[0].trim()}</span>
              <span className="stat-subtitle">{general_information.chapel_time.includes('(') ? general_information.chapel_time.split('(')[1].replace(')', '') : ''}</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-label">지정 좌석</span>
              <span className="stat-value" style={{ color: '#a855f7' }}>{general_information.seat_number}</span>
              <span className="stat-subtitle">{general_information.chapel_room} ({general_information.floor_level}층)</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-label">결석 횟수 / 결과</span>
              <span className="stat-value">
                {general_information.absence_time}회
                <span className={`badge ${general_information.result === 'P' ? 'success' : ''}`} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}>
                  {general_information.result || '진행중'}
                </span>
              </span>
            </div>
          </div>

          <div className="seating-chart-container">
            <div className="seating-chart-title">한경직기념관 좌석안내도</div>
            <img 
              src="https://chaplain.ssu.ac.kr/wp-content/uploads/sites/7/2018/05/ssu01_02_05_plan.jpg" 
              alt="한경직기념관 좌석 구조" 
              className="seating-chart-img" 
            />
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1rem', marginTop: '1.5rem' }}>출결 기록</h3>
          <div className="attendance-list">
            {attendances.length === 0 ? (
              <div className="empty-state">출결 기록이 없습니다.</div>
            ) : (
              attendances.map((record, index) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="login-form-container glass-panel">
        <h1 className="title">SSU Chapel</h1>
        <p className="subtitle">숭실대학교 채플 정보 조회</p>

        {error && <div className="alert-error">{error}</div>}

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
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="SSO 비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                조회 중...
              </>
            ) : (
              '조회하기'
            )}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
          * 개인정보는 안전하게 보호되며, 채플 정보를 조회하는 데에만 사용되고 서버에 저장되지 않습니다.
        </p>
      </div>
    </div>
  );
}

export default App;
