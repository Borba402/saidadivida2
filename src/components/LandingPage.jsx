import React, { useState, useEffect } from 'react';
import {
  Zap, ArrowRight, Check, Menu, X, Star,
  Wallet, LayoutDashboard, TrendingUp, CheckSquare, Timer, Shield,
  BarChart2, Target
} from 'lucide-react';
import { createAvaliacao, getMediaAvaliacoes } from '../services/avaliacaoService';

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
          <Star size={30} fill={n <= (hover || value) ? '#f59e0b' : 'none'} />
        </button>
      ))}
    </div>
  );
}

const STATS = [
  { value: '78%', label: 'das pessoas com controle financeiro quitam suas dívidas em até 2 anos', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.18)' },
  { value: '30%', label: 'mais economizado por quem planeja os gastos mensalmente', color: '#a3e635', bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.18)' },
  { value: '67M', label: 'de brasileiros estão endividados (SERASA 2024)', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  { value: '3x', label: 'mais chances de aposentadoria confortável com planejamento', color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.18)' },
];

const STEPS = [
  { n: '01', Icon: Wallet,   title: 'Lance renda e gastos', desc: 'Cadastre sua renda mensal, rendas extras e todos os compromissos financeiros. Veja em tempo real quanto você tem disponível.', color: '#3b82f6', rgb: '59,130,246' },
  { n: '02', Icon: BarChart2, title: 'Acompanhe e analise',  desc: 'Use o Kanban para visualizar o status das suas contas e o Analytics para entender para onde vai seu dinheiro mês a mês.', color: '#a3e635', rgb: '163,230,53' },
  { n: '03', Icon: Target,   title: 'Foco e resultado',     desc: 'Use o Timer de Foco para se manter produtivo, organize tarefas diárias e veja seu histórico de progresso financeiro.', color: '#a78bfa', rgb: '139,92,246' },
];

const FEATURES = [
  { Icon: Wallet,          title: 'Compromissos Mensais', desc: 'Lance renda, rendas extras e todos os gastos. Veja saldo em tempo real e marque contas como pagas.', color: '#3b82f6' },
  { Icon: LayoutDashboard, title: 'Kanban Financeiro',    desc: 'Visualize suas contas em colunas: A Pagar, Em Foco, Vencido e Pago — tudo organizado visualmente.', color: '#a78bfa' },
  { Icon: TrendingUp,      title: 'Analytics',            desc: 'Gráficos de saldo por mês, gastos por categoria e comparativo renda vs comprometido.', color: '#a3e635' },
  { Icon: CheckSquare,     title: 'Tarefas Diárias',      desc: 'Gerencie tarefas com vencimento, prioridade e anotações. Nunca esqueça um compromisso importante.', color: '#f59e0b' },
  { Icon: Timer,           title: 'Timer de Foco',        desc: 'Técnica Pomodoro integrada para manter o foco nas suas metas financeiras e ganhar XP por sessão.', color: '#ec4899' },
  { Icon: Shield,          title: 'Dados Seguros',        desc: 'Login com e-mail ou Google. Seus dados ficam protegidos com autenticação de ponta a ponta.', color: '#22c55e' },
];

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
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lp">
      {/* ── NAV ─────────────────────────────────── */}
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
            <button className="lp-btn-blue" onClick={onStart}>Começar Grátis</button>
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
            <button className="lp-btn-blue" style={{ width: '100%', justifyContent: 'center' }} onClick={onStart}>
              Começar Grátis →
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__glow" />
        <div className="lp-hero__glow lp-hero__glow--purple" />
        <div className="lp-hero__content">
          <div className="lp-hero__badge">
            <Zap size={12} />
            Controle financeiro inteligente
          </div>

          <div className="lp-bolt-wrap">
            <div className="lp-bolt">
              <Zap size={60} />
            </div>
          </div>

          <h1 className="lp-hero__title">
            Dívidas são<br />
            <span className="lp-gradient-text">problemas do passado.</span>
          </h1>

          <p className="lp-hero__sub">
            Gerencie sua renda, controle seus gastos mensais e quite suas dívidas
            com planejamento inteligente — tudo em um só lugar.
          </p>

          <div className="lp-hero__ctas">
            <button className="lp-btn-blue lp-btn-hero" onClick={onStart}>
              Começar Grátis
              <ArrowRight size={18} />
            </button>
            <button className="lp-btn-outline-hero" onClick={onStart}>
              Já tenho conta
            </button>
          </div>

          <div className="lp-hero__checks">
            <span><Check size={12} /> Grátis para sempre</span>
            <span className="lp-dot">·</span>
            <span><Check size={12} /> Sem cartão</span>
            <span className="lp-dot">·</span>
            <span><Check size={12} /> Dados seguros</span>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────── */}
      <section className="lp-section lp-stats-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">A matemática do controle financeiro</h2>
            <p className="lp-section-sub">Dados que mostram por que planejar transforma sua vida</p>
          </div>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="lp-stat-card"
                style={{ background: s.bg, borderColor: s.border }}
              >
                <span className="lp-stat-card__value" style={{ color: s.color }}>{s.value}</span>
                <span className="lp-stat-card__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────── */}
      <section className="lp-section" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Simples assim</h2>
            <p className="lp-section-sub">Três passos para transformar sua relação com o dinheiro</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step__num" style={{ color: s.color }}>{s.n}</div>
                <div className="lp-step__icon" style={{ color: s.color, background: `rgba(${s.rgb},0.1)` }}>
                  <s.Icon size={28} />
                </div>
                <h3 className="lp-step__title">{s.title}</h3>
                <p className="lp-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────── */}
      <section className="lp-section lp-features-section" id="funcionalidades">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Tudo em um só lugar</h2>
            <p className="lp-section-sub">Ferramentas pensadas para quem quer sair das dívidas de verdade</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-card__icon" style={{ color: f.color, background: `${f.color}18` }}>
                  <f.Icon size={22} />
                </div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SURVEY ──────────────────────────────── */}
      <section className="lp-section lp-survey-section" id="avaliacoes">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Sua opinião importa</h2>
            <p className="lp-section-sub">Nos ajude a melhorar o SaiDaDívida com um feedback rápido</p>
          </div>

          <div className="lp-survey-box">
            {media && (
              <div className="lp-survey-media">
                <StarRating value={Math.round(media.media)} readonly />
                <p className="lp-survey-media__text">
                  <strong style={{ color: '#f59e0b' }}>{media.media.toFixed(1)}</strong>/5
                  &nbsp;·&nbsp; {media.total} avaliação{media.total !== 1 ? 'ões' : ''}
                </p>
              </div>
            )}

            {submitted ? (
              <div className="lp-survey-thanks">
                <div className="lp-survey-thanks__icon"><Check size={28} /></div>
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
                  className="lp-btn-blue"
                  disabled={!rating || submitting}
                  style={{ alignSelf: 'center' }}
                >
                  {submitting ? 'Enviando...' : 'Enviar avaliação'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-cta-section__glow" />
        <div className="lp-container lp-cta-section__content">
          <div className="lp-bolt lp-bolt--sm">
            <Zap size={40} />
          </div>
          <h2 className="lp-cta-section__title">Pronto para sair das dívidas?</h2>
          <p className="lp-cta-section__sub">
            Crie sua conta grátis agora e comece a transformar sua vida financeira hoje.
          </p>
          <button className="lp-btn-blue lp-btn-hero" onClick={onStart}>
            Criar conta grátis
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-logo">
            <div className="lp-logo__icon lp-logo__icon--sm"><Zap size={14} /></div>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f0f0f0' }}>SaiDaDívida</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>
            © 2025 SaiDaDívida — Feito para quem quer mudar de vida.
          </p>
        </div>
      </footer>
    </div>
  );
}
