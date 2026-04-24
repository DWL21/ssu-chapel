import { useMemo, useState } from 'react';
import SubscriptionForm from './SubscriptionForm';
import UnsubscribePage from './UnsubscribePage';

// 배포 시 VITE_API_BASE 환경변수로 Worker 엔드포인트 주입.
// 로컬 개발은 wrangler dev 기본 포트 (http://127.0.0.1:8787) 사용.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:8787';

export default function App() {
  const unsubscribeToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('unsubscribe');
  }, []);

  const [done, setDone] = useState(false);

  if (unsubscribeToken) {
    return (
      <div className="app-container">
        <div className="subscribe-container">
          <UnsubscribePage apiBase={API_BASE} token={unsubscribeToken} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="subscribe-container">
        <div className="glass-panel">
          <h1 className="title">📧 숭실대 공지사항 메일</h1>
          <p className="subtitle">
            매일 아침 8시, 관심 카테고리의 새 공지사항만<br />
            이메일로 모아서 보내드립니다.
          </p>

          {done ? (
            <div className="alert alert-success">
              구독 완료! 내일 아침부터 메일을 받아보실 수 있어요. 이 창은 닫으셔도 됩니다.
            </div>
          ) : (
            <SubscriptionForm apiBase={API_BASE} onSuccess={() => setDone(true)} />
          )}

          <div className="form-hint">
            <p>✓ scatch.ssu.ac.kr 공지사항을 매일 자동으로 수집합니다.</p>
            <p>✓ 언제든지 메일 하단의 해지 링크로 구독을 취소할 수 있습니다.</p>
            <p>✓ 이메일 주소는 발송 목적 외에 사용되지 않습니다.</p>
          </div>
        </div>

        <p className="brand-footer">
          숭실대 채플 조회는{' '}
          <a
            href="https://ssu-chapel.pages.dev/?utm_source=ssu-mails&utm_campaign=cross_link"
            target="_blank"
            rel="noreferrer"
          >
            ssu-chapel.pages.dev
          </a>
          에서
        </p>
      </div>
    </div>
  );
}
