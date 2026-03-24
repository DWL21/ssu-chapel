interface TermsOfServiceModalProps {
  onClose: () => void;
}

export default function TermsOfServiceModal({ onClose }: TermsOfServiceModalProps) {
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
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>이용약관</h2>
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
            숭실대학교 채플 좌석 조회 서비스(이하 "서비스")는 학생 편의를 위해 제공되는
            비공식 조회 도구입니다. 서비스를 이용하기 전에 아래 약관을 주의 깊게 읽어 주십시오.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>제1조 (목적)</h3>
          <p>
            본 약관은 서비스 이용에 관한 기본적인 사항을 정하는 것을 목적으로 합니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>제2조 (서비스의 내용)</h3>
          <p>
            서비스는 숭실대학교 U-Saint 학사 시스템에 연동하여 채플 좌석 배치 및 출결 정보를 조회하는 기능을 제공합니다.
            서비스는 숭실대학교와 공식적으로 제휴된 서비스가 아닙니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>제3조 (이용자의 의무)</h3>
          <p>
            이용자는 본인의 학번 및 비밀번호를 사용하여 서비스를 이용하여야 하며, 타인의 계정 정보를 이용하거나
            서비스를 부정한 목적으로 사용하는 행위를 해서는 안 됩니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>제4조 (서비스 이용의 제한)</h3>
          <p>
            서비스는 예고 없이 변경되거나 중단될 수 있습니다. 서비스 제공자는 서비스 중단으로 인한
            손해에 대해 책임을 지지 않습니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>제5조 (면책)</h3>
          <p>
            서비스 제공자는 서비스 이용으로 인한 직접적·간접적 손해에 대해 책임을 지지 않습니다.
            제공되는 정보의 정확성에 대해 보증하지 않으며, 최종 확인은 숭실대학교 공식 시스템(U-Saint)을 이용하시기 바랍니다.
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1rem 0 0.4rem' }}>제6조 (저작권)</h3>
          <p>
            서비스의 모든 콘텐츠 및 코드에 대한 저작권은 서비스 제작자에게 있으며,
            무단 복제·배포를 금지합니다.
          </p>

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
