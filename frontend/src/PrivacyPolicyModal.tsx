interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '1rem',
          padding: '1.5rem', maxWidth: '480px', width: '100%',
          maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>개인정보 처리 방침</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.25rem', color: '#64748b', lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.75' }}>
          <p>
            숭실대학교 채플 좌석 조회 서비스(이하 "서비스")는 이용자의 개인정보를 소중히 여기며,
            아래와 같이 처리 방침을 안내드립니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>1. 수집하는 개인정보 항목</h3>
          <p>서비스 이용을 위해 숭실대학교 SSO 학번 및 비밀번호를 입력받습니다.</p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>2. 개인정보의 이용 목적</h3>
          <p>입력된 정보는 숭실대학교 학사 시스템에 로그인하여 채플 좌석 정보를 조회하는 용도로만 사용됩니다.</p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>3. 개인정보의 보관 및 파기</h3>
          <p>
            조회 결과의 빠른 제공을 위해 인증 토큰 및 채플 정보는 서버 캐시에 일시적으로 보관될 수 있습니다.
            보관된 정보는 캐시 만료 시 자동으로 파기되며, 서비스 목적 외의 용도로 활용되지 않습니다.
            비밀번호 원문은 캐시에 저장되지 않습니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>4. 제3자 제공</h3>
          <p>수집된 개인정보는 숭실대학교 학사 시스템 이외의 어떠한 제3자에게도 제공되지 않습니다.</p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>5. 이용자의 권리</h3>
          <p>이용자는 언제든지 서비스 이용을 중단할 수 있으며, 추가적인 문의사항은 서비스 관리자에게 연락하실 수 있습니다.</p>

          <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
            시행일: 2026년 3월 24일
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '1.25rem', width: '100%',
            padding: '0.65rem', borderRadius: '0.5rem',
            background: 'var(--primary, #6366f1)', color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
