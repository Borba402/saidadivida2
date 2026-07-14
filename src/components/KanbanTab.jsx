import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, TrendingUp, Clock, AlertCircle, CheckCircle2,
  GripVertical
} from 'lucide-react';
import { getMesAtual, getOrCreateCompromisso, listItens } from '../services/compromissoService';

const FOCUS_KEY = 'saidadivida_kanban_focus_v2';
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const COLUMNS = [
  { id: 'focus',   label: 'Em Foco',  icon: TrendingUp,   color: 'var(--sdd-accent)',    desc: 'Itens prioritários' },
  { id: 'pending', label: 'A Pagar',  icon: Clock,         color: 'var(--sdd-warning)',   desc: 'Aguardando pagamento' },
  { id: 'overdue', label: 'Vencido',  icon: AlertCircle,   color: 'var(--sdd-negative)',  desc: 'Prazo ultrapassado' },
  { id: 'done',    label: 'Pago',     icon: CheckCircle2,  color: 'var(--sdd-positive)',  desc: 'Pagamentos concluídos' },
];

function resolveCol(item, focusSet) {
  if (item.pago) return 'done';
  const hoje = new Date().toISOString().split('T')[0];
  if (item.data_vencimento && item.data_vencimento < hoje) return 'overdue';
  if (focusSet.has(item.id)) return 'focus';
  return 'pending';
}

export default function KanbanTab({ userId }) {
  const [itens, setItens] = useState([]);
  const [focusSet, setFocusSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FOCUS_KEY) || '[]')); } catch { return new Set(); }
  });
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado] = useState(getMesAtual());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const compromisso = await getOrCreateCompromisso(userId, mesSelecionado);
      const items = await listItens(compromisso.id);
      setItens(items);
    } finally {
      setLoading(false);
    }
  }, [userId, mesSelecionado]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    localStorage.setItem(FOCUS_KEY, JSON.stringify([...focusSet]));
  }, [focusSet]);

  const handleDrop = (colId) => {
    if (!draggingId) return;
    const item = itens.find(i => i.id === draggingId);
    if (!item) return;

    if (colId === 'focus' && !item.pago) {
      setFocusSet(prev => new Set([...prev, item.id]));
    } else if (colId !== 'focus') {
      setFocusSet(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
    setDraggingId(null);
    setDropTarget(null);
  };

  const move = (itemId, colId) => {
    const item = itens.find(i => i.id === itemId);
    if (!item) return;
    if (colId === 'focus' && !item.pago) {
      setFocusSet(prev => new Set([...prev, itemId]));
    } else {
      setFocusSet(prev => { const s = new Set(prev); s.delete(itemId); return s; });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
        Carregando Kanban...
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="kanban-page">
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <LayoutDashboard size={20} className="lime-text" />
          <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Kanban — {mesSelecionado}</h2>
        </div>
        <div className="empty-state">
          <LayoutDashboard size={48} className="text-muted" />
          <p className="text-muted text-sm">Nenhum item em <strong>{mesSelecionado}</strong>.</p>
          <p className="text-xs text-muted">Adicione itens na aba <strong>Início</strong> para organizar no Kanban.</p>
        </div>
      </div>
    );
  }

  const totalComprometido = itens.reduce((s, i) => s + Number(i.valor), 0);
  const totalPago = itens.reduce((s, i) => s + (i.pago ? Number(i.valor) : 0), 0);

  return (
    <div className="kanban-page">
      <div className="kanban-page__header">
        <div className="section-header">
          <LayoutDashboard size={20} className="lime-text" />
          <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Kanban — {mesSelecionado}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="kanban-balance-chip">
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Pago:</span>
            <span className="font-bold" style={{ color: 'var(--sdd-positive)', fontSize: '0.88rem' }}>{fmt(totalPago)}</span>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>/ {fmt(totalComprometido)}</span>
          </div>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(({ id, label, icon: Icon, color, desc }) => {
          const cards = itens.filter(item => resolveCol(item, focusSet) === id);
          const isDropTarget = dropTarget === id;
          const isAutoCol = id === 'overdue' || id === 'done';

          return (
            <div
              key={id}
              className={`kanban-col ${isDropTarget ? 'kanban-col--drop' : ''}`}
              onDragOver={e => { e.preventDefault(); setDropTarget(id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={e => { e.preventDefault(); handleDrop(id); }}
            >
              <div className="kanban-col__header">
                <div className="flex items-center gap-2">
                  <Icon size={15} style={{ color }} />
                  <span className="font-medium" style={{ fontSize: '0.85rem' }}>{label}</span>
                </div>
                <span className="kanban-count-badge" style={{ background: `${color}20`, color }}>
                  {cards.length}
                </span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '0.75rem' }}>{desc}</p>

              <div className="kanban-col__cards">
                {cards.length === 0 && !isAutoCol && (
                  <div className={`kanban-drop-zone ${isDropTarget ? 'kanban-drop-zone--active' : ''}`}>
                    Solte aqui
                  </div>
                )}
                {cards.map(item => (
                  <div
                    key={item.id}
                    className={`kanban-card ${draggingId === item.id ? 'kanban-card--dragging' : ''} ${item.pago ? 'kanban-card--pago' : ''}`}
                    draggable={!isAutoCol}
                    onDragStart={e => { setDraggingId(item.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                  >
                    <div className="kanban-card__top">
                      {!isAutoCol && <GripVertical size={13} className="text-muted" style={{ flexShrink: 0, cursor: 'grab' }} />}
                      <span className="font-medium" style={{ fontSize: '0.85rem', flex: 1, lineHeight: 1.3 }}>{item.nome_item}</span>
                      <span className="badge-mini" style={{ background: `${color}18`, color }}>
                        {item.categoria}
                      </span>
                    </div>

                    <div className="kanban-card__metrics">
                      <div className="kanban-metric">
                        <span style={{ fontSize: '0.65rem', color: 'var(--sdd-text-muted)' }}>Valor</span>
                        <span className="font-bold" style={{ fontSize: '0.88rem' }}>{fmt(item.valor)}</span>
                      </div>
                      {item.data_vencimento && (
                        <div className="kanban-metric">
                          <span style={{ fontSize: '0.65rem', color: 'var(--sdd-text-muted)' }}>Vencimento</span>
                          <span style={{ fontSize: '0.8rem' }}>
                            {new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isAutoCol && (
                      <div className="kanban-card__actions">
                        {id !== 'focus' && (
                          <button className="kanban-move-btn" onClick={() => move(item.id, 'focus')} title="Colocar em foco" style={{ '--col': 'var(--sdd-accent)' }}>
                            <TrendingUp size={11} style={{ color: 'var(--sdd-accent)' }} /> Foco
                          </button>
                        )}
                        {id === 'focus' && (
                          <button className="kanban-move-btn" onClick={() => move(item.id, 'pending')} title="Remover do foco" style={{ '--col': 'var(--sdd-warning)' }}>
                            <Clock size={11} style={{ color: 'var(--sdd-warning)' }} /> Pendente
                          </button>
                        )}
                      </div>
                    )}
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
