import { useState } from 'react';
import { CATEGORIES } from './categories';

interface Props {
  apiBase: string;
  onSuccess?: () => void;
}

type Step = 'input' | 'verify';
type Msg = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function SubscriptionForm({ apiBase, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [email, setEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const toggleCategory = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === CATEGORIES.length ? [] : CATEGORIES.map(c => c.value));
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMsg({ type: 'error', text: '이메일을 입력해주세요.' });
      return;
    }
    if (selected.length === 0) {
      setMsg({ type: 'error', text: '구독할 카테고리를 1개 이상 선택해주세요.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '인증번호 발송에 실패했습니다.');
      }
      setMsg({ type: 'info', text: '이메일로 6자리 인증번호를 발송했습니다. (최대 5분 소요)' });
      setStep('verify');
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : '오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authCode.length !== 6) {
      setMsg({ type: 'error', text: '6자리 인증번호를 정확히 입력해주세요.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          categories: selected,
          auth_code: authCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '인증에 실패했거나 인증번호가 만료되었습니다.');
      }
      setMsg({
        type: 'success',
        text: '🎉 구독이 완료되었습니다. 매일 아침 8시(KST)에 요약 메일을 보내드립니다.',
      });
      setTimeout(() => onSuccess?.(), 2500);
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : '오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === 'input' ? handleRequestCode : handleVerify}>
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {step === 'input' && (
        <>
          <div className="form-group">
            <label htmlFor="email">이메일 주소</label>
            <input
              id="email"
              className="input-field"
              type="email"
              placeholder="student@soongsil.ac.kr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="category-header">
              <label>구독할 카테고리</label>
              <button type="button" className="btn-link" onClick={toggleAll} disabled={loading}>
                {selected.length === CATEGORIES.length ? '모두 해제' : '모두 선택'}
              </button>
            </div>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <label
                  key={cat.value}
                  className={`category-chip ${selected.includes(cat.value) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                    disabled={loading}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '인증번호 받기'}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
          <div className="verify-meta">
            <p>
              수신 이메일: <strong>{email}</strong>
            </p>
            <p style={{ margin: 0 }}>
              받은 6자리 인증번호를 입력해주세요. 메일이 보이지 않으면 스팸함도 확인해주세요.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="code">인증번호</label>
            <input
              id="code"
              className="input-field input-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={authCode}
              onChange={e => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={loading}
              autoFocus
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '구독 완료'}
          </button>

          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setStep('input');
              setAuthCode('');
              setMsg(null);
            }}
            disabled={loading}
            style={{ marginTop: '1rem', display: 'block', textAlign: 'center', width: '100%' }}
          >
            ← 이메일 다시 입력
          </button>
        </>
      )}
    </form>
  );
}
