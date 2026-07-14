import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_ABREV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function parseRef(mesRef) {
  const [nome, ano] = mesRef.split('/');
  return { mes: MESES_FULL.indexOf(nome), ano: Number(ano) };
}
function toRef(mes, ano) { return `${MESES_FULL[mes]}/${ano}`; }

export default function MonthNavigator({ meses, mesSelecionado, onChange }) {
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef(null);
  const { mes, ano }            = parseRef(mesSelecionado);
  const [popoverAno, setPopoverAno] = useState(ano);

  const mesIdx  = meses.indexOf(mesSelecionado);
  const prevMes = mesIdx > 0               ? meses[mesIdx - 1] : null;
  const nextMes = mesIdx < meses.length - 1 ? meses[mesIdx + 1] : null;

  // Sync popover year when selection changes
  useEffect(() => { setPopoverAno(parseRef(mesSelecionado).ano); }, [mesSelecionado]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft'  && prevMes) { onChange(prevMes); e.preventDefault(); }
    if (e.key === 'ArrowRight' && nextMes) { onChange(nextMes); e.preventDefault(); }
  };

  const selectMonth = (m) => {
    const ref = toRef(m, popoverAno);
    if (meses.includes(ref)) { onChange(ref); setOpen(false); }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    const ref = toRef(now.getMonth(), now.getFullYear());
    if (meses.includes(ref)) onChange(ref);
    setOpen(false);
  };

  return (
    <div
      className="month-nav-v2"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Navegador de meses"
    >
      {/* ── Pill ── */}
      <div className="month-pill">
        <button
          className="month-pill__arrow"
          disabled={!prevMes}
          onClick={() => prevMes && onChange(prevMes)}
          aria-label="Mês anterior"
          tabIndex={-1}
        >
          <ChevronLeft size={15} />
        </button>

        <div className="month-pill__divider" />

        <button
          className="month-pill__center"
          onClick={() => setOpen(v => !v)}
          aria-label="Escolher mês"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className="month-pill__label">{MESES_FULL[mes]} {ano}</span>
          <ChevronDown
            size={12}
            className={`month-pill__chevron${open ? ' month-pill__chevron--open' : ''}`}
          />
        </button>

        <div className="month-pill__divider" />

        <button
          className="month-pill__arrow"
          disabled={!nextMes}
          onClick={() => nextMes && onChange(nextMes)}
          aria-label="Próximo mês"
          tabIndex={-1}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Popover ── */}
      {open && (
        <div className="month-popover" role="dialog" aria-label="Calendário de meses">
          {/* Year nav */}
          <div className="month-popover__year-row">
            <button className="month-popover__year-btn"
              onClick={() => setPopoverAno(v => v - 1)} aria-label="Ano anterior">
              <ChevronLeft size={14} />
            </button>
            <span className="month-popover__year">{popoverAno}</span>
            <button className="month-popover__year-btn"
              onClick={() => setPopoverAno(v => v + 1)} aria-label="Próximo ano">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 4×3 grid */}
          <div className="month-popover__grid">
            {MESES_ABREV.map((abrev, i) => {
              const ref        = toRef(i, popoverAno);
              const isSelected = ref === mesSelecionado;
              const hasData    = meses.includes(ref);
              return (
                <button
                  key={i}
                  className={[
                    'month-popover__cell',
                    isSelected ? 'month-popover__cell--selected' : '',
                    hasData && !isSelected ? 'month-popover__cell--has-data' : '',
                    !hasData ? 'month-popover__cell--empty' : '',
                  ].join(' ')}
                  onClick={() => selectMonth(i)}
                  disabled={!hasData}
                  tabIndex={hasData ? 0 : -1}
                >
                  {abrev}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="month-popover__footer">
            <button className="month-popover__goto" onClick={goToCurrentMonth}>
              Ir para o mês atual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
