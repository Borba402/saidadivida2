import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, ArrowRight, Check, Menu, X, Star,
  Wallet, LayoutDashboard, TrendingUp, CheckSquare, Timer, Shield,
  BarChart2, Target
} from 'lucide-react';
import { createAvaliacao, getMediaAvaliacoes } from '../services/avaliacaoService';

/* ── Animated counter ────────────────────── */
function AnimatedNumber({ num, suffix }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) {
        fired.current = true;
        const dur = 1800;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(ease * num));
          if (p < 1) requestAnimationFrame(tick);
          else setVal(num);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [num]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Star rating ─────────────────────────── */
function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="lp-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`lp-star-btn ${n <= (hover || value) ? 'lp-star-btn--active' : ''}`}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
        >
          <Star size={32} fill={n <= (hover || value) ? '#f59e0b' : 'none'} />
        </button>
      ))}
    </div>
  );
}

/* ── Data ────────────────────────────────── */
const STATS = [
  { num: 78, suffix: '%', label: 'das pessoas com controle financeiro quitam dívidas em até 2 anos', color: '#3b82f6', border: 'rgba(59,130,246,0.35)', glow: 'rgba(59,130,246,0.2)' },
  { num: 30, suffix: '%', label: 'mais economizado por quem planeja os gastos mensalmente', color: '#a3e635', border: 'rgba(163,230,53,0.35)', glow: 'rgba(163,230,53,0.15)' },
  { num: 67, suffix: 'M',  label: 'de brasileiros endividados hoje — SERASA 2024', color: '#f59e0b', border: 'rgba(245,158,11,0.35)', glow: 'rgba(245,158,11,0.15)' },
  { num: 3,  suffix: 'x',  label: 'mais chances de aposentadoria confortável com planejamento', color: '#a78bfa', border: 'rgba(167,139,250,0.35)', glow: 'rgba(167,139,250,0.15)' },
];

const STEPS = [
  { n: '01', Icon: Wallet,    title: 'Lance renda e gastos',  desc: 'Cadastre sua renda mensal, rendas extras e compromissos financeiros. Veja saldo disponível em tempo real.', color: '#3b82f6', rgb: '59,130,246' },
  { n: '02', Icon: BarChart2, title: 'Acompanhe e analise',   desc: 'Use o Kanban para visualizar suas contas e o Analytics para entender para onde vai seu dinheiro mês a mês.', color: '#a3e635', rgb: '163,230,53' },
  { n: '03', Icon: Target,    title: 'Foco e resultado',      desc: 'Timer de foco integrado, tarefas organizadas e histórico de progresso financeiro mês a mês.', color: '#a78bfa', rgb: '167,139,250' },
];

const FEATURES = [
  { Icon: Wallet,          title: 'Compromissos Mensais', desc: 'Lance renda, rendas extras e gastos. Saldo em tempo real, marque contas como pagas.', color: '#3b82f6' },
  { Icon: LayoutDashboard, title: 'Kanban Financeiro',    desc: 'Colunas A Pagar, Em Foco, Vencido e Pago. Arraste e organize visualmente suas contas.', color: '#a78bfa' },
  { Icon: TrendingUp,      title: 'Analytics',            desc: 'Gráficos de saldo, gastos por categoria e comparativo renda vs comprometido.', color: '#a3e635' },
  { Icon: CheckSquare,     title: 'Tarefas Diárias',      desc: 'Crie tarefas com vencimento, prioridade alta/normal/baixa e anotações detalhadas.', color: '#f59e0b' },
  { Icon: Timer,           title: 'Timer de Foco',        desc: 'Técnica Pomodoro com XP por sessão. Gamificação que te mantém disciplinado.', color: '#ec4899' },
  { Icon: Shield,          title: 'Dados 100% Seguros',   desc: 'Login com e-mail ou Google. Autenticação e Row Level Security via Supabase.', color: '#22c55e' },
];

/* ── Component ───────────────────────────── */
export default function LandingPage({ onStart }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(
    () => localStorage.getItem('saidadivida_survey') === 'done'
  );
  const [media, setMedia] = useState(null);

  useEffect(() => {
    getMediaAvaliacoes().then(setMedia).catch(() => {});
  }, []);

  const handleSurvey = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await createAvaliacao({ nota: rating, comentario: comment });
      localStorage.setItem('saidadivida_survey', 'done');
      setSubmitted(true);
      const updated = await getMediaAvaliacoes();
      setMedia(updated);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="lp">

      {/* ── NAV ─────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav__inner">
          <div className="lp-logo">
            <div className="lp-logo__icon"><Zap size={18} /></div>
            <span className="lp-logo__name">SaiDaDívida</span>
          </div>

          <div className="lp-nav__links">
            <a href="#como-funciona" className="lp-nav__link">Como funciona</a>
            <a href="#funcionalidades" className="lp-nav__link">Funcionalidades</a>
            <a href="#avaliacoes" className="lp-nav__link">Avaliações</a>
            <button className="lp-btn-ghost-sm" onClick={onStart}>Entrar</button>
            <button className="lp-btn-cta" onClick={onStart}>
              <span className="lp-btn-cta__shine" />
              Começar Grátis
            </button>
          </div>

          <button className="lp-nav__hamburger" onClick={() => setMobileMenu(v => !v)}>
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="lp-nav__mobile">
            <a href="#como-funciona" onClick={() => setMobileMenu(false)}>Como funciona</a>
            <a href="#funcionalidades" onClick={() => setMobileMenu(false)}>Funcionalidades</a>
            <a href="#avaliacoes" onClick={() => setMobileMenu(false)}>Avaliações</a>
            <button className="lp-btn-cta" style={{ width: '100%', justifyContent: 'center' }} onClick={onStart}>
              <span className="lp-btn-cta__shine" />
              Começar Grátis →
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────── */}
      <section className="lp-hero">
        {/* Animated background orbs */}
        <div className="lp-orb lp-orb--1" />
        <div className="lp-orb lp-orb--2" />
        <div className="lp-orb lp-orb--3" />
        <div className="lp-orb lp-orb--4" />
        <div className="lp-grid-bg" />

        <div className="lp-hero__content">
          <div className="lp-hero__badge">
            <Zap size={13} />
            Controle financeiro inteligente
          </div>

          {/* Bolt with rings */}
          <div className="lp-bolt-wrap">
            <div className="lp-bolt-ring lp-bolt-ring--1" />
            <div className="lp-bolt-ring lp-bolt-ring--2" />
            <div className="lp-bolt-ring lp-bolt-ring--3" />
            <div className="lp-bolt">
              <Zap size={56} />
            </div>
          </div>

          <h1 className="lp-hero__title">
            Dívidas são<br />
            <span className="lp-text-animated">problemas do passado.</span>
          </h1>

          <p className="lp-hero__sub">
            Gerencie sua renda, controle seus gastos mensais e quite suas dívidas
            com planejamento inteligente — tudo em um só lugar.
          </p>

          <div className="lp-hero__ctas">
            <button className="lp-btn-cta lp-btn-cta--hero" onClick={onStart}>
              <span className="lp-btn-cta__shine" />
              Começar Grátis
              <ArrowRight size={20} />
            </button>
            <button className="lp-btn-outline-hero" onClick={onStart}>
              Já tenho conta
            </button>
          </div>

          <div className="lp-hero__checks">
            <span><Check size={13} /> Grátis para sempre</span>
            <span className="lp-dot">·</span>
            <span><Check size={13} /> Sem cartão</span>
            <span className="lp-dot">·</span>
            <span><Check size={13} /> Dados seguros</span>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────── */}
      <section className="lp-section lp-stats-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Números reais</div>
            <h2 className="lp-section-title">A matemática do controle financeiro</h2>
            <p className="lp-section-sub">Dados que mostram por que planejar transforma sua vida</p>
          </div>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="lp-stat-card"
                style={{ '--sc': s.color, '--sb': s.border, '--sg': s.glow }}
              >
                <div className="lp-stat-card__glow" />
                <span className="lp-stat-card__value">
                  <AnimatedNumber num={s.num} suffix={s.suffix} />
                </span>
                <span className="lp-stat-card__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section className="lp-section" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Processo</div>
            <h2 className="lp-section-title">Simples assim</h2>
            <p className="lp-section-sub">Três passos para transformar sua relação com o dinheiro</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step" style={{ '--sc': s.color, '--rgb': s.rgb }}>
                <div className="lp-step__num">{s.n}</div>
                <div className="lp-step__icon-wrap">
                  <s.Icon size={30} />
                </div>
                <h3 className="lp-step__title">{s.title}</h3>
                <p className="lp-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────── */}
      <section className="lp-section lp-features-section" id="funcionalidades">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Funcionalidades</div>
            <h2 className="lp-section-title">Tudo em um só lugar</h2>
            <p className="lp-section-sub">Ferramentas pensadas para quem quer sair das dívidas de verdade</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card" style={{ '--fc': f.color }}>
                <div className="lp-feature-card__icon">
                  <f.Icon size={24} />
                </div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SURVEY ──────────────────────────── */}
      <section className="lp-section lp-survey-section" id="avaliacoes">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Comunidade</div>
            <h2 className="lp-section-title">Sua opinião importa</h2>
            <p className="lp-section-sub">Nos ajude a melhorar o SaiDaDívida com um feedback rápido</p>
          </div>

          <div className="lp-survey-box">
            {media && (
              <div className="lp-survey-media">
                <StarRating value={Math.round(media.media)} readonly />
                <p className="lp-survey-media__text">
                  <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>{media.media.toFixed(1)}</strong>
                  <span> / 5 &nbsp;·&nbsp; {media.total} avaliação{media.total !== 1 ? 'ões' : ''}</span>
                </p>
              </div>
            )}

            {submitted ? (
              <div className="lp-survey-thanks">
                <div className="lp-survey-thanks__icon"><Check size={32} /></div>
                <h3>Obrigado pelo feedback!</h3>
                <p>Sua avaliação nos ajuda a melhorar cada vez mais.</p>
              </div>
            ) : (
              <form className="lp-survey-form" onSubmit={handleSurvey}>
                <p className="lp-survey-form__question">Como você avalia o SaiDaDívida?</p>
                <StarRating value={rating} onChange={setRating} />
                <textarea
                  className="lp-survey-form__textarea"
                  placeholder="Deixe um comentário (opcional)..."
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <button
                  type="submit"
                  className="lp-btn-cta"
                  disabled={!rating || submitting}
                >
                  <span className="lp-btn-cta__shine" />
                  {submitting ? 'Enviando...' : 'Enviar avaliação'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-orb lp-orb--cta1" />
        <div className="lp-orb lp-orb--cta2" />
        <div className="lp-container lp-cta-section__content">
          <div className="lp-bolt lp-bolt--sm">
            <Zap size={36} />
          </div>
          <h2 className="lp-cta-section__title">
            Pronto para sair<br />
            <span className="lp-text-animated">das dívidas?</span>
          </h2>
          <p className="lp-cta-section__sub">
            Crie sua conta grátis agora e comece a transformar sua vida financeira hoje.
          </p>
          <button className="lp-btn-cta lp-btn-cta--hero" onClick={onStart}>
            <span className="lp-btn-cta__shine" />
            Criar conta grátis
            <ArrowRight size={20} />
          </button>
          <p style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '0.5rem' }}>
            Grátis para sempre · Sem cartão de crédito
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-logo">
            <div className="lp-logo__icon lp-logo__icon--sm"><Zap size={14} /></div>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f0f0f0' }}>SaiDaDívida</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#4b5563' }}>
            © 2025 SaiDaDívida — Feito para quem quer mudar de vida.
          </p>
        </div>
      </footer>
    </div>
  );
}
