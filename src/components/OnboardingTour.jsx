import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    target: null,
    title: 'Bem-vindo ao SaiDaDívida! 👋',
    desc: 'Em menos de 1 minuto você vai conhecer tudo que o app tem a oferecer. Vamos lá?',
  },
  {
    target: '[data-tour="month-nav"]',
    title: 'Navegador de Mês',
    desc: 'Navegue entre os meses usando as setas. Cada mês tem suas próprias contas e histórico independente.',
    position: 'bottom',
  },
  {
    target: '[data-tour="progress-ring"]',
    title: 'Painel de Progresso',
    desc: 'O anel mostra quanto você já pagou do total comprometido. Quanto mais verde, melhor! Abaixo você vê o valor restante.',
    position: 'bottom',
  },
  {
    target: '[data-tour="new-item"]',
    title: 'Adicionar Conta',
    desc: 'Clique aqui para cadastrar uma nova conta ou despesa. Você pode definir categoria, vencimento e repetição mensal automática.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-history"]',
    title: 'Histórico',
    desc: 'Veja todos os meses anteriores. Cada mês tem um dashboard completo com gráfico de gastos por categoria.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-analytics"]',
    title: 'Analytics',
    desc: 'Gráficos de evolução do seu saldo mês a mês e comparativo entre renda e gastos comprometidos.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-tasks"]',
    title: 'Tarefas',
    desc: 'Crie tarefas financeiras com prioridade, prazo e anotações. Ideal para metas e lembretes importantes.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-telegram"]',
    title: 'Bot do Telegram',
    desc: 'Vincule sua conta e registre gastos pelo Telegram sem abrir o app. Ex: "gastei 50 no mercado".',
    position: 'top',
  },
  {
    target: null,
    title: 'Tudo pronto! 🎉',
    desc: 'Agora você conhece o SaiDaDívida. Comece cadastrando sua renda e suas contas do mês. Para ver este tutorial de novo, acesse o menu lateral.',
  },
];

const PAD = 10;

export default function OnboardingTour({ onFinish }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    if (!current.target) { setRect(null); return; }
    const el = document.querySelector(current.target);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setRect(r);
      else setRect(null);
    } else {
      setRect(null);
    }
  }, [current.target]);

  useEffect(() => {
    const t = setTimeout(updateRect, 60);
    window.addEventListener('resize', updateRect);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateRect); };
  }, [updateRect]);

  const next = () => step === STEPS.length - 1 ? onFinish() : setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = Math.min(300, vw - 32);

  let tooltipStyle = {};
  if (!rect) {
    tooltipStyle = {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: tooltipW,
    };
  } else {
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(16, Math.min(centerX - tooltipW / 2, vw - tooltipW - 16));
    if (current.position === 'top') {
      tooltipStyle = {
        position: 'fixed',
        bottom: vh - (rect.top - PAD - 12),
        left,
        width: tooltipW,
      };
    } else {
      tooltipStyle = {
        position: 'fixed',
        top: rect.bottom + PAD + 12,
        left,
        width: tooltipW,
      };
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <>
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
            zIndex: 9998,
            pointerEvents: 'none',
            transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 9998, pointerEvents: 'none' }} />
      )}

      <div
        style={{
          ...tooltipStyle,
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>{current.title}</h3>
          <button
            onClick={onFinish}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 0 0 8px', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.65, marginBottom: '1rem' }}>
          {current.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? 'var(--lime)' : 'var(--border-color)',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {step > 0 && (
              <button className="btn btn-outline" onClick={prev} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                <ChevronLeft size={13} />
              </button>
            )}
            <button className="btn btn-primary" onClick={next} style={{ padding: '0.35rem 0.9rem', fontSize: '0.78rem' }}>
              {isLast ? 'Começar!' : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Próximo <ChevronRight size={13} /></span>}
            </button>
          </div>
        </div>

        {step === 0 && (
          <button
            onClick={onFinish}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.75rem', width: '100%', textAlign: 'center', display: 'block' }}
          >
            Pular tutorial
          </button>
        )}
      </div>
    </>
  );
}
