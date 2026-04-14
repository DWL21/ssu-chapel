import { useState } from 'react';

interface EmailSubscriptionFormProps {
  onClose?: () => void;
  isDarkMode: boolean;
}

const CATEGORIES = [
  { value: '전체', label: '전체' },
  { value: '학사', label: '학사' },
  { value: '장학', label: '장학' },
  { value: '국제교류', label: '국제교류' },
  { value: '외국인유학생', label: '외국인유학생' },
  { value: '채용', label: '채용' },
  { value: '비교과·행사', label: '비교과·행사' },
  { value: '교원채용', label: '교원채용' },
  { value: '교직', label: '교직' },
  { value: '봉사', label: '봉사' },
  { value: '기타', label: '기타' },
];

export default function EmailSubscriptionForm({ onClose, isDarkMode }: EmailSubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(CATEGORIES.map(c => c.value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: '이메일을 입력해주세요.' });
      return;
    }

    if (selectedCategories.length === 0) {
      setMessage({ type: 'error', text: '구독할 카테고리를 1개 이상 선택해주세요.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${baseUrl}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          categories: selectedCategories,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || '구독 신청에 실패했습니다.');
      }

      setMessage({
        type: 'success',
        text: '공지사항 구독이 완료되었습니다! 매일 9시에 요약 메일을 보내드립니다.',
      });
      
      setTimeout(() => {
        setEmail('');
        setSelectedCategories([]);
        onClose?.();
      }, 2000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || '오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="subscription-form-card"
      style={{
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
      }}
    >
      <h3
        style={{
          margin: '0 0 1rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: isDarkMode ? '#f1f5f9' : '#1e293b',
        }}
      >
        📧 공지사항 이메일 구독
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.2rem' }}>
          <label
            htmlFor="subscription-email"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isDarkMode ? '#cbd5e1' : '#475569',
            }}
          >
            이메일 주소
          </label>
          <input
            id="subscription-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
              color: isDarkMode ? '#f1f5f9' : '#1e293b',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.6rem',
            }}
          >
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isDarkMode ? '#cbd5e1' : '#475569',
              }}
            >
              구독할 카테고리
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '0.8rem',
                color: isDarkMode ? '#38bdf8' : '#002147',
                cursor: 'pointer',
                fontWeight: 500,
                textDecoration: 'underline',
              }}
            >
              {selectedCategories.length === CATEGORIES.length ? '모두 해제' : '모두 선택'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '0.6rem',
            }}
          >
            {CATEGORIES.map(category => (
              <label
                key={category.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.6rem',
                  borderRadius: '6px',
                  backgroundColor: selectedCategories.includes(category.value)
                    ? isDarkMode
                      ? '#0c4a6e'
                      : '#f0f9ff'
                    : isDarkMode
                      ? '#334155'
                      : '#f8fafc',
                  border: `1px solid ${
                    selectedCategories.includes(category.value)
                      ? isDarkMode
                        ? '#0369a1'
                        : '#e0f2fe'
                      : isDarkMode
                        ? '#475569'
                        : '#cbd5e1'
                  }`,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.value)}
                  onChange={() => handleCategoryToggle(category.value)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                />
                <span
                  style={{
                    color: selectedCategories.includes(category.value)
                      ? isDarkMode
                        ? '#38bdf8'
                        : '#002147'
                      : isDarkMode
                        ? '#cbd5e1'
                        : '#475569',
                  }}
                >
                  {category.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {message && (
          <div
            style={{
              padding: '0.8rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              backgroundColor:
                message.type === 'success'
                  ? isDarkMode
                    ? '#064e3b'
                    : '#ecfdf5'
                  : isDarkMode
                    ? '#7f1d1d'
                    : '#fef2f2',
              color:
                message.type === 'success'
                  ? isDarkMode
                    ? '#86efac'
                    : '#059669'
                  : isDarkMode
                    ? '#f87171'
                    : '#dc2626',
              border: `1px solid ${
                message.type === 'success'
                  ? isDarkMode
                    ? '#10b981'
                    : '#a7f3d0'
                  : isDarkMode
                    ? '#b91c1c'
                    : '#fecaca'
              }`,
            }}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: isDarkMode ? '#38bdf8' : '#002147',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {loading ? '처리 중...' : '구독하기'}
        </button>
      </form>

      <p
        style={{
          margin: '1rem 0 0',
          fontSize: '0.75rem',
          color: isDarkMode ? '#64748b' : '#94a3b8',
          lineHeight: '1.4',
        }}
      >
        ✓ 매일 9시에 선택한 카테고리의 새 공지사항 요약을 이메일로 받아보세요.
        <br />✓ 언제든지 이메일로 구독을 해제할 수 있습니다.
      </p>
    </div>
  );
}
