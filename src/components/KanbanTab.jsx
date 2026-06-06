import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Archive, TrendingUp, AlertCircle, CheckCircle2, GripVertical, DollarSign } from 'lucide-react';

const STORAGE_KEY = 'saidadivida_kanban_v2';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', icon: Archive, color: '#6b7280', description: 'Dívidas aguardando' },
  { id: 'focus', label: 'Em Foco', icon: TrendingUp, color: '#a3e635', description: 'Prioridade atual' },
  { id: 'review', label: 'Revisão Financeira', icon: AlertCircle, color: '#f59e0b', description: 'Analisar condições' },
  { id: 'done', label: 'Concluído', icon: CheckCircle2, color: '#22c55e', description: 'Dívidas quitadas' },
];

function loadStatuses(dividas) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const init = {};
  dividas.forEach(d => {
    init[d.id] = d.juros_mensal >= 8 ? 'focus' : 'backlog';
  });
  return init;
}

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function KanbanTab({ dividas = [], gastos = [], perfil }) {
  const [statuses, setStatuses] = useState(() => loadStatuses(dividas));
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  useEffect(() => {
    setStatuses(prev => {
      const updated = { ...prev };
      dividas.forEach(d => {
        if (!(d.id in updated)) {
          updated[d.id] = d.juros_mensal >= 8 ? 'focus' : 'backlog';
        }
      });
      return updated;
    });
  }, [dividas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  }, [statuses]);

  const move = (id, colId) => setStatuses(prev => ({ ...prev, [id]: colId }));

  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0);
  const totalDividas = dividas.reduce((s, d) => s + d.valor_total, 0);
  const saldo = perfil ? perfil.renda_mensal - totalGastos : null;

  if (dividas.length === 0) {
    return (
      <div className="kanban-page">
        <div className="section-header">
          <LayoutDashboard size={20} className="lime-text" />
          <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Kanban Financeiro</h2>
        </div>
        <div className="empty-state">
          <LayoutDashboard size={48} className="text-muted" />
          <p className="text-muted">Adicione dívidas na aba <strong>Início</strong> para visualizar o Kanban.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-page">
      {/* Header */}
      <div className="kanban-page__header">
        <div className="section-header">
          <LayoutDashboard size={20} className="lime-text" />
          <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Kanban Financeiro</h2>
        </div>
        {saldo !== null && (
          <div className="kanban-balance-chip">
            <DollarSign size={14} className="lime-text" />
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Saldo livre:</span>
            <span className={`font-bold ${saldo >= 0 ? 'lime-text' : 'text-danger'}`} style={{ fontSize: '0.9rem' }}>
              {fmt(saldo)}
            </span>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="kanban-summary">
        <div className="kanban-summary__item">
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Total em dívidas</span>
          <span className="font-bold text-danger">{fmt(totalDividas)}</span>
        </div>
        <div className="kanban-summary__item">
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Dívidas cadastradas</span>
          <span className="font-bold lime-text">{dividas.length}</span>
        </div>
        {perfil && (
          <div className="kanban-summary__item">
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Renda mensal</span>
            <span className="font-bold">{fmt(perfil.renda_mensal)}</span>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="kanban-board">
        {COLUMNS.map(({ id, label, icon: Icon, color, description }) => {
          const cards = dividas.filter(d => statuses[d.id] === id);
          const isDropTarget = dropTarget === id;
          return (
            <div
              key={id}
              className={`kanban-col ${isDropTarget ? 'kanban-col--drop' : ''}`}
              onDragOver={e => { e.preventDefault(); setDropTarget(id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={e => {
                e.preventDefault();
                if (draggingId) move(draggingId, id);
                setDraggingId(null);
                setDropTarget(null);
              }}
            >
              {/* Column header */}
              <div className="kanban-col__header">
                <div className="flex items-center gap-2">
                  <Icon size={15} style={{ color }} />
                  <span className="font-medium" style={{ fontSize: '0.85rem' }}>{label}</span>
                </div>
                <span className="kanban-count-badge" style={{ background: `${color}20`, color }}>
                  {cards.length}
                </span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '0.75rem' }}>{description}</p>

              {/* Cards */}
              <div className="kanban-col__cards">
                {cards.length === 0 && (
                  <div className={`kanban-drop-zone ${isDropTarget ? 'kanban-drop-zone--active' : ''}`}>
                    Solte aqui
                  </div>
                )}
                {cards.map(d => (
                  <div
                    key={d.id}
                    className={`kanban-card ${draggingId === d.id ? 'kanban-card--dragging' : ''}`}
                    draggable
                    onDragStart={e => { setDraggingId(d.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                  >
                    <div className="kanban-card__top">
                      <GripVertical size={13} className="text-muted" style={{ flexShrink: 0, cursor: 'grab' }} />
                      <span className="font-medium" style={{ fontSize: '0.85rem', flex: 1, lineHeight: 1.3 }}>{d.descricao}</span>
                      <span
                        className="badge-mini"
                        style={{
                          background: d.juros_mensal >= 8 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                          color: d.juros_mensal >= 8 ? '#ef4444' : '#22c55e'
                        }}
                      >
                        {d.juros_mensal}%
                      </span>
                    </div>

                    <div className="kanban-card__metrics">
                      <div className="kanban-metric">
                        <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Valor total</span>
                        <span className="font-bold" style={{ fontSize: '0.85rem' }}>{fmt(d.valor_total)}</span>
                      </div>
                      <div className="kanban-metric">
                        <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Parcelas</span>
                        <span className="font-bold" style={{ fontSize: '0.85rem' }}>{d.parcelas_restantes}x</span>
                      </div>
                    </div>

                    {/* Quick move buttons */}
                    <div className="kanban-card__actions">
                      {COLUMNS.filter(c => c.id !== id).map(c => (
                        <button
                          key={c.id}
                          className="kanban-move-btn"
                          onClick={() => move(d.id, c.id)}
                          title={`Mover para ${c.label}`}
                          style={{ '--col': c.color }}
                        >
                          <c.icon size={11} style={{ color: c.color }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
