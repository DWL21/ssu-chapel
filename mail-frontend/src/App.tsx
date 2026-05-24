import { useState, useMemo, useEffect, useRef } from 'react';
import UnsubscribePage from './UnsubscribePage';
import PrivacyPage from './PrivacyPage';
import TermsPage from './TermsPage';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8001';

/* ───────── Confetti ─────────────────────────────────────── */
const CONFETTI_COLORS = ['#4ec6c1', '#3aa9a4', '#f5c518', '#22c55e', '#f87171', '#a78bfa', '#38bdf8', '#fb923c'];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 8, h: 10 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2.5 + Math.random() * 3.5,
      opacity: 1,
    }));
    let raf: number;
    let done = false;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allOut = true;
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed;
        if (p.y > canvas.height * 0.7) p.opacity = Math.max(0, p.opacity - 0.025);
        if (p.y < canvas.height + 20) allOut = false;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (!allOut && !done) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { done = true; cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />;
}

/* ───────── Ticker data ──────────────────────────────────── */
const TICKER_ITEMS = [
  { cat: '장학',     title: '2026-1 국가장학금 2차 신청 마감' },
  { cat: '채용',     title: '삼성전자 DS부문 신입 채용설명회' },
  { cat: '학사',     title: '2026학년도 1학기 수강신청 일정' },
  { cat: '국제교류', title: '2026 봄학기 교환학생 모집 공고' },
  { cat: '비교과',   title: '총장 초청 봄 콘서트 (5/24)' },
  { cat: '봉사',     title: '1365 자원봉사 정기 활동 모집' },
];

/* ───────── Data ─────────────────────────────────────────── */
const CATEGORIES = [
  { value: '학사',         hint: '수강·학적·졸업' },
  { value: '장학',         hint: '장학금 공고' },
  { value: '국제교류',     hint: '교환·어학연수' },
  { value: '외국인유학생', hint: '비자·생활' },
  { value: '채용',         hint: '취업·인턴' },
  { value: '비교과·행사',  hint: '특강·문화행사' },
  { value: '교원채용',     hint: '교원 공고' },
  { value: '교직',         hint: '교원자격' },
  { value: '봉사',         hint: '봉사활동' },
  { value: '기타',         hint: '그 외' },
];

interface NoticeItem {
  status: string;
  category: string;
  department: string;
  title: string;
}

const SAMPLE_NOTICES: Record<string, NoticeItem[]> = {
  '학사': [
    { status: '진행', category: '학사', department: '학사팀', title: '2026학년도 1학기 수강신청 일정 안내' },
    { status: '진행', category: '학사', department: '학사팀', title: '성적 정정 기간 및 절차 공고' },
    { status: '마감', category: '학사', department: '학사팀', title: '조기졸업 신청 마감 안내' },
  ],
  '장학': [
    { status: '진행', category: '장학', department: '장학팀', title: '2026-1 국가장학금 2차 신청 마감 (~5/20)' },
    { status: '진행', category: '장학', department: '장학팀', title: '교내 우수장학생 추천 모집' },
  ],
  '국제교류': [
    { status: '진행', category: '국제교류', department: '국제처', title: '2026 봄학기 교환학생 모집 공고' },
    { status: '진행', category: '국제교류', department: '국제처', title: '어학연수 프로그램 설명회 안내' },
  ],
  '외국인유학생': [
    { status: '진행', category: '외국인유학생', department: '국제처', title: '외국인 유학생 비자 연장 안내' },
    { status: '진행', category: '외국인유학생', department: '국제처', title: '한국어 도우미 프로그램 신청' },
  ],
  '채용': [
    { status: '진행', category: '채용', department: '취업지원팀', title: '삼성전자 DS부문 신입 채용설명회 (5/22)' },
    { status: '진행', category: '채용', department: '취업지원팀', title: '현대자동차 R&D 인턴 모집 공고' },
    { status: '마감', category: '채용', department: '취업지원팀', title: '취업 동아리 SCBP 신규 부원 모집' },
  ],
  '비교과·행사': [
    { status: '진행', category: '비교과·행사', department: '학생지원팀', title: '총장 초청 봄 콘서트 (5/24)' },
    { status: '진행', category: '비교과·행사', department: '도서관', title: '독서마라톤 5월 챌린지 시작' },
  ],
  '교원채용': [
    { status: '진행', category: '교원채용', department: '총무·인사팀', title: '2026학년도 1학기 전임교원 공개채용 공고' },
  ],
  '교직': [
    { status: '진행', category: '교직', department: '교직지원실', title: '교원자격증 발급 신청 안내' },
  ],
  '봉사': [
    { status: '진행', category: '봉사', department: '학생복지팀', title: '1365 자원봉사 정기 활동 모집' },
    { status: '진행', category: '봉사', department: '학생복지팀', title: '지역 아동센터 학습 멘토링 봉사자 모집' },
  ],
  '기타': [
    { status: '진행', category: '기타', department: '총무팀', title: '학내 셔틀버스 운행 시간표 변경' },
    { status: '마감', category: '기타', department: '도서관', title: '도서관 휴관 안내' },
  ],
};

const todayLabel = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day}`;
};

function nextEightCountdown() {
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const ms = target.getTime() - now.getTime();
  const h = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  return `${h}시간 ${min}분`;
}

/* ───────── Icons ────────────────────────────────────────── */
function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="btn__arrow"
      style={{ transform: flip ? 'rotate(180deg)' : 'none' }}>
      <path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="chip__tick">
      <path d="M2.5 6.2L4.7 8.4 9.5 3.6" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ───────── Ticker ───────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker">
      <div className="ticker__inner">
        {items.map((it, i) => (
          <span className="ticker__item" key={i}>
            <span className="ticker__cat">{it.cat}</span>
            {it.title}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Splash screen ───────────────────────────────── */
function Splash({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 1400);
    const t2 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`splash ${hide ? 'splash--hide' : ''}`}>
      <div className="splash__logo">
        숭실<em>메일</em>
        <span className="splash__dot" />
      </div>
      <div className="splash__sub">ssu-mail</div>
    </div>
  );
}

/* ───────── Ripple button ────────────────────────────────── */
function RippleBtn({ className, onClick, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
    onClick?.(e);
  };

  return (
    <button ref={btnRef} className={`ripple-btn ${className ?? ''}`} onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}

/* ───────── Header ───────────────────────────────────────── */
function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <a className="brand" href="#top">
          <span className="brand__word">숭실메일</span>
          <span className="brand__dot" />
          <span className="brand__sub">ssu-mail</span>
        </a>
        <nav className="site-nav">
          <span className="site-nav__links" style={{ display: 'inline-flex', gap: 24 }}>
            <a href="#how">소개</a>
            <a href="#subscribe">구독</a>
            <a href="#faq">FAQ</a>
          </span>
          <a className="site-nav__back" href="#subscribe">
            구독하기
            <Arrow />
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ───────── Hero ─────────────────────────────────────────── */
function HeroMailMock() {
  const cards = [
    { status: '진행', cat: '채용', dept: '총무·인사팀', title: '2026년 숭실대학교 교무처 교무팀 계약직 직원 모집' },
    { status: '진행', cat: '장학', dept: '장학팀', title: '2026년 대통령과학장학금 신규장학생 선발 공고' },
    { status: '',     cat: '비교과·행사', dept: '한국기독교문화연구원', title: '2026 한국기독교문화연구원 해외 석학초청강좌 I' },
  ];
  return (
    <div className="mailmock" aria-hidden="true">
      <div className="mailmock__head">
        <div className="mailmock__head-left">
          <h4>숭실대학교 공지사항</h4>
          <p>{todayLabel()} · 새 공지 {cards.length}건</p>
        </div>
        <div className="mailmock__time">매일 08:00</div>
      </div>
      <div className="mailmock__body">
        {cards.map((c, i) => (
          <div className="mailmock__card" key={i}>
            <div className="mailmock__badges">
              {c.status && (
                <span className="mailmock__badge mailmock__badge--status">{c.status}</span>
              )}
              <span className="mailmock__badge mailmock__badge--cat">{c.cat}</span>
              <span className="mailmock__badge mailmock__badge--dept">{c.dept}</span>
            </div>
            <div className="mailmock__title">{c.title}</div>
          </div>
        ))}
      </div>
      <div className="mailmock__foot">
        <a className="mailmock__foot-btn" href="https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?f&keyword" target="_blank" rel="noopener noreferrer">전체 공지사항 보기</a>
      </div>
    </div>
  );
}

const HERO_LINES = ['놓치기엔 너무 중요한 공지를,', '한 통의 메일로.'];

function Hero() {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const type = async () => {
      await new Promise(r => setTimeout(r, 300));
      for (let i = 1; i <= HERO_LINES[0].length; i++) {
        if (cancelled) return;
        setLine1(HERO_LINES[0].slice(0, i));
        await new Promise(r => setTimeout(r, 45));
      }
      await new Promise(r => setTimeout(r, 180));
      for (let i = 1; i <= HERO_LINES[1].length; i++) {
        if (cancelled) return;
        setLine2(HERO_LINES[1].slice(0, i));
        await new Promise(r => setTimeout(r, 55));
      }
      await new Promise(r => setTimeout(r, 400));
      if (!cancelled) setDone(true);
    };
    type();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setShowCursor(p => !p), 530);
    return () => clearInterval(id);
  }, [done]);

  return (
    <section className="hero" id="top">
      <HeroParticles />
      <div className="wrap hero__grid">
        <div>
          <div className="eyebrow hero__eyebrow">숭실메일 · ssu-mail</div>
          <h1 className="hero__title">
            {line1 || <span style={{ opacity: 0 }}>{HERO_LINES[0]}</span>}
            {' '}
            {line2 ? <em>{line2}</em> : null}
            {!done && <span className="hero__cursor" style={{ opacity: showCursor ? 1 : 0 }}>|</span>}
          </h1>
          <p className="hero__lede" style={{ opacity: done ? 1 : 0, transition: 'opacity 0.6s' }}>
            장학금 마감, 수강신청, 채용 공고까지 — 흩어진 학교 공지를
            카테고리별로 골라 매일 아침 한 번에 정리해 보내드립니다.
          </p>
          <a href="#subscribe" className="btn-hero-cta" style={{ opacity: done ? 1 : 0, transition: 'opacity 0.6s 0.2s' }}>
            지금 구독하기 <Arrow />
          </a>
        </div>
        <HeroMailMock />
      </div>
    </section>
  );
}

/* ───────── How it works ─────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '1', title: '관심 카테고리를 고릅니다', body: '학사·장학부터 채용·봉사까지 10개 카테고리 중 보고 싶은 것만 골라 담아요.' },
    { n: '2', title: '이메일 주소를 입력합니다', body: '받아볼 메일 주소를 알려주세요. 학교 메일도 개인 메일도 모두 가능합니다.' },
    { n: '3', title: '인증 후 구독 완료', body: '6자리 인증번호를 확인하면 끝. 매일 아침 08시, 새 공지가 자동으로 도착합니다.' },
  ];
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          steps.forEach((_, i) => {
            setTimeout(() => setVisible(prev => { const next = [...prev]; next[i] = true; return next; }), i * 180);
          });
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="section" id="how" ref={sectionRef}>
      <div className="wrap">
        <div className="section__head">
          <div className="section__label">How it works</div>
          <h2 className="section__title">세 단계면 충분합니다.</h2>
        </div>
        <div className="how">
          {steps.map((s, i) => (
            <div className={`how__step how__step--anim ${visible[i] ? 'how__step--visible' : ''}`} key={s.n}>
              <span className="how__num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Subscribe flow ───────────────────────────────── */
function Stepper({ step, onJump, mode }: { step: number; onJump: (n: number) => void; mode?: 'new' | 'existing' }) {
  const items = [
    { n: 1, label: '이메일' },
    { n: 2, label: '인증' },
    { n: 3, label: mode === 'existing' ? '수정' : '카테고리' },
  ];
  return (
    <div className="steps">
      {items.map((it, i) => {
        const state = step === it.n ? 'steps__item--active' : step > it.n ? 'steps__item--done' : '';
        return (
          <>
            <button key={it.n} className={`steps__item ${state}`} onClick={() => onJump(it.n)}>
              <span className="steps__num">{step > it.n ? '✓' : it.n}</span>
              {it.label}
            </button>
            {i < items.length - 1 && <span key={`bar-${it.n}`} className="steps__bar" />}
          </>
        );
      })}
    </div>
  );
}

function StepCategories({
  selected, toggleCat, selectAll,
}: {
  selected: string[];
  toggleCat: (v: string) => void;
  selectAll: () => void;
}) {
  return (
    <>
      <div className="form-card__head">
        <h3 className="form-card__title">어떤 공지를 받을까요?</h3>
      </div>
      <p className="form-card__sub">보고 싶은 카테고리를 골라주세요. 언제든지 바꿀 수 있어요.</p>
      <div className="chips__actions">
        <span className="chips__count">{selected.length} / {CATEGORIES.length} 선택됨</span>
        <button className="chips__select-all" onClick={selectAll}>
          {selected.length === CATEGORIES.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>
      <div className="chips" role="group" aria-label="카테고리 선택">
        {CATEGORIES.map(c => {
          const on = selected.includes(c.value);
          return (
            <RippleBtn key={c.value} className={`chip ${on ? 'chip--on chip--bounce' : ''}`}
              onClick={() => toggleCat(c.value)} aria-pressed={on}>
              <Tick />
              {c.value}
            </RippleBtn>
          );
        })}
      </div>
    </>
  );
}

const EMAIL_DOMAINS = ['@soongsil.ac.kr', '@gmail.com', '@naver.com', '@kakao.com'];

function StepEmail({
  email, setEmail, selectedCount,
}: {
  email: string;
  setEmail: (v: string) => void;
  selectedCount: number;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    const atIdx = val.indexOf('@');
    if (atIdx !== -1) {
      const typed = val.slice(atIdx);
      const filtered = EMAIL_DOMAINS.filter(d => d.startsWith(typed) && d !== typed);
      setSuggestions(filtered.map(d => val.slice(0, atIdx) + d));
    } else {
      setSuggestions([]);
    }
  };

  return (
    <>
      <div className="form-card__head">
        <h3 className="form-card__title">어디로 보내드릴까요?</h3>
      </div>
      <div className="field" style={{ position: 'relative' }}>
        <label className="field__label" htmlFor="emailInput">이메일 주소</label>
        <input id="emailInput" className="input" type="email"
          placeholder="20261234@soongsil.ac.kr" value={email}
          onChange={handleChange} autoFocus autoComplete="off" spellCheck={false} />
        {suggestions.length > 0 && (
          <div className="email-suggestions">
            {suggestions.map(s => (
              <button key={s} className="email-suggestion" onMouseDown={() => { setEmail(s); setSuggestions([]); }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StepCode({
  email, code, setCode, onEditEmail,
}: {
  email: string;
  code: string[];
  setCode: (c: string[]) => void;
  onEditEmail: () => void;
}) {
  const value = code.join('');
  const [secs, setSecs] = useState(300);

  useEffect(() => {
    setSecs(300);
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < digits.length; i++) next[i] = digits[i];
    setCode(next);
  };

  return (
    <>
      <div className="form-card__head">
        <h3 className="form-card__title">인증번호를 확인해주세요</h3>
      </div>
      <p className="form-card__sub">방금 발송된 6자리 인증번호를 입력해주세요.</p>
      <div className="recap">
        <span className="recap__label">To</span>
        <span className="recap__value">{email}</span>
        <button className="recap__edit" onClick={onEditEmail}>변경</button>
      </div>
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="field__label" htmlFor="codeInput" style={{ margin: 0 }}>인증번호 6자리</label>
          <span className={`code-timer ${secs <= 60 ? 'code-timer--warn' : ''}`}>{mm}:{ss}</span>
        </div>
        <input
          id="codeInput"
          className="input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={value}
          placeholder="인증번호 6자리 입력"
          onChange={handleChange}
          autoFocus
          autoComplete="one-time-code"
          spellCheck={false}
        />
        {secs === 0 && <p style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)' }}>인증번호가 만료됐습니다. 이전으로 돌아가 다시 요청해주세요.</p>}
      </div>
    </>
  );
}

function StepDone({ email, count, unsubscribed, mode }: {
  email: string; count: number; unsubscribed?: boolean; mode?: 'new' | 'existing';
}) {
  return (
    <>
      {!unsubscribed && <Confetti />}
      <div className="success">
        <div className="success__mark">{unsubscribed ? '👋' : '✓'}</div>
        <h3 className="success__title">
          {unsubscribed ? '구독 해지 완료' : mode === 'existing' ? '구독 수정 완료' : '구독이 완료되었습니다'}
        </h3>
        <p className="success__sub">
          {unsubscribed
            ? <>{email}의 구독이 해지되었습니다.</>
            : <>내일 아침 08:00, <strong>{email}</strong>로<br />
               {mode === 'existing' ? '수정된 ' : '선택하신 '}{count}개 카테고리의 새 공지가 도착합니다.</>
          }
        </p>
        {!unsubscribed && <div className="success__meta">첫 메일까지 약 {nextEightCountdown()}</div>}
      </div>
    </>
  );
}

/* ───────── Live mail preview ────────────────────────────── */
function MailPreview({ selected }: { selected: string[] }) {
  const items = useMemo(
    () => selected.flatMap(cat => (SAMPLE_NOTICES[cat] || []).map(n => ({ ...n }))),
    [selected]
  );

  return (
    <div className="mail">
      <div className="mail__chrome">
        <h4>숭실대학교 공지사항</h4>
        <p>{todayLabel()} · {selected.length === 0 ? '구독 카테고리 미선택' : `새 공지 ${items.length}건`}</p>
      </div>
      <div className="mail__body">
        {selected.length === 0 ? (
          <div className="mail__empty">
            <span>✉</span>
            <p>왼쪽에서 카테고리를 골라보세요.<br />실제로 받게 될 메일이 여기에 채워집니다.</p>
          </div>
        ) : (
          items.map((n, i) => (
            <div className="mail__card" key={i}>
              <div className="mail__badges">
                {n.status && (
                  <span
                    className="mail__badge mail__badge--status"
                    style={n.status === '마감' ? { background: '#e74c3c' } : undefined}
                  >
                    {n.status}
                  </span>
                )}
                <span className="mail__badge mail__badge--cat">{n.category}</span>
                <span className="mail__badge mail__badge--dept">{n.department}</span>
              </div>
              <p className="mail__item-title">{n.title}</p>
            </div>
          ))
        )}
      </div>
      <div className="mail__foot">
        <a className="mail__foot-btn" href="https://scatch.ssu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?f&keyword" target="_blank" rel="noopener noreferrer">전체 공지사항 보기</a>
        <p className="mail__foot-note">
          본 메일은 숭실대학교 공지사항 구독 서비스에 의해 자동 발송되었습니다.<br />
          <a href="#">구독 해지</a>
        </p>
      </div>
    </div>
  );
}

function Subscribe() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleCat = (v: string) => {
    setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    setError(null);
  };
  const selectAll = () => setSelected(selected.length === CATEGORIES.length ? [] : CATEGORIES.map(c => c.value));
  const goBack = () => { setError(null); if (step > 1) setStep(step - 1); };
  const goStep = (n: number) => { if (n < step) { setError(null); setStep(n); } };

  const goNext = async () => {
    setError(null);
    if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('올바른 이메일 형식이 아닙니다.'); return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/request-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || '인증번호 발송에 실패했습니다.');
        }
        setStep(2);
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
      } finally { setLoading(false); }
    } else if (step === 2) {
      if (code.join('').length !== 6) { setError('6자리 인증번호를 모두 입력해주세요.'); return; }
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/subscriptions/me?email=${encodeURIComponent(email.trim())}&auth_code=${encodeURIComponent(code.join(''))}`,
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || '인증에 실패했거나 인증번호가 만료되었습니다.');
        }
        const data = await res.json();
        if (data.is_registered) {
          setMode('existing');
          setSelected(data.subscribed_categories);
        } else {
          setMode('new');
        }
        setStep(3);
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
      } finally { setLoading(false); }
    } else if (step === 3) {
      if (selected.length === 0) { setError('구독할 카테고리를 1개 이상 골라주세요.'); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), categories: selected, auth_code: code.join('') }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || '처리에 실패했습니다.');
        }
        setStep(4);
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
      } finally { setLoading(false); }
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('구독을 전체 해지하시겠습니까?')) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscriptions/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), auth_code: code.join('') }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || '해지에 실패했습니다.');
      }
      setUnsubscribed(true);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally { setLoading(false); }
  };

  const barTitle = step === 4
    ? (unsubscribed ? '구독 해지 완료' : mode === 'existing' ? '구독 수정 완료' : '구독 완료')
    : step === 3 && mode === 'existing' ? '구독 수정하기' : '공지 구독하기';
  const barSub = [
    '받아볼 이메일 주소를 알려주세요',
    '인증번호로 본인 메일을 확인합니다',
    mode === 'existing' ? '카테고리를 수정하거나 해지할 수 있습니다' : '카테고리를 골라 메일링을 시작하세요',
    unsubscribed ? '구독 해지가 완료되었습니다' : '내일 아침부터 새 공지를 받아보세요',
  ][step - 1];

  return (
    <section className="subscribe-page" id="subscribe">
      <div className="wrap">
        <div className="section__head">
          <div className="section__label">Subscribe</div>
          <h2 className="section__title">
            원하는 공지만,<br /><em>골라서 받으세요.</em>
          </h2>
        </div>
        <div className="sub-grid">
          <div>
            <Stepper step={step} onJump={goStep} mode={mode} />
            <div className="form-card">
              <div className="form-card__bar">
                <h4>{barTitle}</h4>
                <p>{barSub}</p>
              </div>
              <div className="form-card__inner">
                {step === 1 && <StepEmail email={email} setEmail={setEmail} selectedCount={selected.length} />}
                {step === 2 && <StepCode email={email} code={code} setCode={setCode} onEditEmail={() => { setError(null); setStep(1); }} />}
                {step === 3 && (
                  <>
                    <StepCategories selected={selected} toggleCat={toggleCat} selectAll={selectAll} />
                    {mode === 'existing' && (
                      <button className="btn-unsub" onClick={handleUnsubscribe} disabled={loading}>
                        구독 전체 해지
                      </button>
                    )}
                  </>
                )}
                {step === 4 && <StepDone email={email} count={selected.length} unsubscribed={unsubscribed} mode={mode} />}

                {error && <div className="field-error">{error}</div>}

                {step !== 4 && (
                  <div className="actions">
                    <div className="actions__left">
                      {step > 1 && (
                        <button className="btn btn--ghost" onClick={goBack} disabled={loading}>
                          <Arrow flip /> 이전
                        </button>
                      )}
                    </div>
                    <button className="btn btn--primary" onClick={goNext}
                      disabled={loading || (step === 3 && selected.length === 0)}>
                      {loading && '처리 중...'}
                      {!loading && step === 1 && '인증번호 받기'}
                      {!loading && step === 2 && '인증번호 확인'}
                      {!loading && step === 3 && (mode === 'existing' ? '수정 완료' : '구독 완료')}
                      {!loading && <Arrow />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="preview">
            <MailPreview selected={selected} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── FAQ 아코디언 ─────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const qs = [
    { q: '유료인가요?', a: '아니요, 모두 무료입니다. 광고도, 트래킹 픽셀도 넣지 않습니다. 학내 공지를 더 쉽게 받아보자는 학생 사이드 프로젝트로 운영됩니다.' },
    { q: '공식 채널인가요?', a: '학교 공식 서비스는 아닙니다. 숭실대학교 홈페이지의 공개 공지를 크롤링해 정리해 보내드리며, 원문은 항상 메일 안의 링크에서 확인할 수 있습니다.' },
    { q: '구독을 해제하려면 어떻게 하나요?', a: "모든 메일 하단의 '구독 해지' 링크 한 번이면 끝입니다. 별도 계정 가입이 없기 때문에 비밀번호도 필요하지 않습니다." },
    { q: '어떤 정보를 저장하나요?', a: '메일 주소와 선택한 카테고리만 저장합니다. 학번이나 비밀번호는 저장하지 않으며, 발송 외 다른 용도로 사용하지 않습니다.' },
  ];
  return (
    <section className="section fade-section" id="faq">
      <div className="wrap">
        <div className="section__head">
          <div className="section__label">FAQ</div>
          <h2 className="section__title">궁금할 만한 <em>네 가지</em>.</h2>
        </div>
        <div className="faq">
          {qs.map((it, i) => (
            <div className={`faq__item faq__item--accordion ${open === i ? 'faq__item--open' : ''}`} key={i}
              onClick={() => setOpen(open === i ? null : i)}>
              <span className="faq__num">{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div className="faq__q-row">
                  <h3 className="faq__q">{it.q}</h3>
                  <span className="faq__chevron">{open === i ? '−' : '+'}</span>
                </div>
                <div className="faq__body" style={{ maxHeight: open === i ? '200px' : '0' }}>
                  <p className="faq__a">{it.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Footer ───────────────────────────────────────── */
function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__row">
          <div>
            <div className="foot__brand">숭실<span className="accent">메일</span></div>
            <div className="foot__brand-sub">ssu-mail</div>
          </div>
          <div className="foot__cols">
            <div className="foot__col">
              <h4 className="foot__col-title">Product</h4>
              <ul>
                <li><a href="#how">소개</a></li>
                <li><a href="#subscribe">구독</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div className="foot__col">
              <h4 className="foot__col-title">Legal</h4>
              <ul>
                <li><a href="#/privacy">개인정보 처리방침</a></li>
                <li><a href="#/terms">이용약관</a></li>
              </ul>
            </div>
            <div className="foot__col">
              <h4 className="foot__col-title">Project</h4>
              <ul>
                <li><a href="https://ssu-chapel.pages.dev/?utm_source=ssu-mails&utm_campaign=cross_link">채플 정보 조회</a></li>
                <li><a href="https://github.com/DWL21/ssu-chapel">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="foot__base">
          <span>© 2026 SSU-MAIL · NOT AN OFFICIAL SOONGSIL UNIVERSITY SERVICE</span>
          <span>BUILT BY STUDENTS · OPEN-SOURCE</span>
        </div>
      </div>
    </footer>
  );
}

/* ───────── App ──────────────────────────────────────────── */
/* ───────── Scroll to top ────────────────────────────────── */
/* ───────── Scroll fade-in hook ─────────────────────────── */
function useFadeIn() {
  useEffect(() => {
    const els = document.querySelectorAll('.fade-section');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('fade-section--visible', e.isIntersecting)),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ───────── Mouse glow ───────────────────────────────────── */
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return;
      glowRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return <div ref={glowRef} className="mouse-glow" />;
}

/* ───────── Hero particles ───────────────────────────────── */
function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 48;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      opacity: 0.2 + Math.random() * 0.4,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78,198,193,${p.opacity})`;
        ctx.fill();
      }

      // draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(78,198,193,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="hero-particles" />;
}

/* ───────── Scroll to top ────────────────────────────────── */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      className={`scroll-top ${visible ? 'scroll-top--visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="맨 위로"
    >
      ↑
    </button>
  );
}

function getHash() {
  return window.location.hash.replace(/^#\/?/, '') || '';
}

export default function App() {
  useFadeIn();
  const [splashDone, setSplashDone] = useState(false);

  const unsubscribeToken = useMemo(
    () => new URLSearchParams(window.location.search).get('unsubscribe'),
    []
  );

  const [hash, setHash] = useState(getHash);
  useEffect(() => {
    const handler = () => setHash(getHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (unsubscribeToken) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <UnsubscribePage apiBase={API_BASE} token={unsubscribeToken} />
        </div>
      </div>
    );
  }

  if (hash === 'privacy') return <PrivacyPage />;
  if (hash === 'terms') return <TermsPage />;

  return (
    <>
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      <MouseGlow />
      <Header />
      <Hero />
      <Ticker />
      <HowItWorks />
      <Subscribe />
      <FAQ />
      <Footer />
      <ScrollToTop />
    </>
  );
}
