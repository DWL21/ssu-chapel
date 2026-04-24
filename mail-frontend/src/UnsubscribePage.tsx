import { useEffect, useState } from 'react';

interface Props {
  apiBase: string;
  token: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'success'; email?: string }
  | { kind: 'error'; message: string };

export default function UnsubscribePage({ apiBase, token }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/unsubscribe?token=${encodeURIComponent(token)}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: 'error', message: body.error || '해지 처리에 실패했습니다.' });
          return;
        }
        setState({ kind: 'success', email: body.email });
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: 'error',
          message: e instanceof Error ? e.message : '네트워크 오류',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, token]);

  return (
    <div className="glass-panel">
      <h1 className="title">구독 해지</h1>
      {state.kind === 'loading' && (
        <p className="subtitle">처리 중입니다...</p>
      )}
      {state.kind === 'success' && (
        <div className="alert alert-success">
          구독이 해지되었습니다{state.email ? ` (${state.email})` : ''}. 그동안 이용해주셔서 감사합니다.
        </div>
      )}
      {state.kind === 'error' && (
        <div className="alert alert-error">{state.message}</div>
      )}
      <p className="brand-footer" style={{ marginTop: '2rem' }}>
        <a href="/">← 다시 구독하기</a>
      </p>
    </div>
  );
}
