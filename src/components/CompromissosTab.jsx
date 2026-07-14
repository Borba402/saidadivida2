import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from './ui/Button';
import CategoryBadge from './ui/CategoryBadge';
import { getCategory } from '../lib/categories';
import {
  Plus, Trash2, Calendar,
  Edit3, Check, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, PlusCircle, AlertTriangle, Repeat2, Save, Lightbulb, Loader2
} from 'lucide-react';
import {
  getMesAtual, getMesesDisponiveis, getOrCreateCompromisso,
  updateCompromisso, listItens, createItem, updateItem, deleteItem, togglePago, CATEGORIAS,
  listRendasExtra, createRendaExtra, deleteRendaExtra
} from '../services/compromissoService';
import {
  materializeRecurringForMonth,
  setBillRecurring,
  stopRecurring,
  listRecurringBills,
} from '../services/recurring';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_ITEM = { nome_item: '', valor: '', data_vencimento: '', pago: false, categoria: 'Outros', recorrente: false };
const EMPTY_RENDA = { descricao: '', valor: '' };


function SkeletonHome() {
  return (
    <div className="skeleton-page">
      <div className="skeleton skeleton-month" />
      <div className="skeleton skeleton-renda" />
      <div className="skeleton skeleton-ring" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton skeleton-header" />
        <div className="skeleton" style={{ width: 100, height: 34, borderRadius: 'var(--radius-full)' }} />
      </div>
      {[1,2,3].map(i => <div key={i} className="skeleton skeleton-item" />)}
    </div>
  );
}

const SWIPE_THRESHOLD = 80;

export default function CompromissosTab({ userId }) {
  const meses = getMesesDisponiveis();
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [compromisso, setCompromisso] = useState(null);
  const [itens, setItens] = useState([]);
  const [rendasExtra, setRendasExtra] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [swipeX, setSwipeX] = useState({});
  const touchStartX = useRef({});
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [editingRenda, setEditingRenda] = useState(false);
  const [rendaInput, setRendaInput] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rendaExpandida, setRendaExpandida] = useState(false);
  const [addRendaForm, setAddRendaForm] = useState(false);
  const [newRenda, setNewRenda] = useState(EMPTY_RENDA);
  const [rendaFormError, setRendaFormError] = useState('');
  const [savingRenda, setSavingRenda] = useState(false);

  // Estado de edição inline de itens
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemData, setEditItemData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [recurringBills, setRecurringBills] = useState([]);

  const loadMes = useCallback(async (mes) => {
    setLoading(true);
    try {
      const c = await getOrCreateCompromisso(userId, mes);
      setCompromisso(c);
      setRendaInput(c.renda_mensal?.toString() || '0');

      // Materializa as contas recorrentes primeiro
      await materializeRecurringForMonth(userId, mes, c.id);

      const [items, extras, recurring] = await Promise.all([
        listItens(c.id),
        listRendasExtra(c.id),
        listRecurringBills(userId),
      ]);
      setItens(items);
      setRendasExtra(extras);
      setRecurringBills(recurring);
    } catch (err) {
      console.error('Erro ao carregar dados do mês:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadMes(mesSelecionado); }, [mesSelecionado, loadMes]);

  const handleSaveRenda = async () => {
    if (!compromisso) return;
    const val = parseFloat(rendaInput) || 0;
    const updated = await updateCompromisso(compromisso.id, { renda_mensal: val });
    setCompromisso(updated);
    setEditingRenda(false);
  };

  const handleToggleRendaRecorrente = async () => {
    if (!compromisso) return;
    const novoValor = !compromisso.renda_recorrente;
    const updated = await updateCompromisso(compromisso.id, { renda_recorrente: novoValor });
    setCompromisso(updated);
  };

  const handleAddRendaExtra = async (e) => {
    e.preventDefault();
    setRendaFormError('');
    if (!newRenda.descricao.trim()) { setRendaFormError('Descrição é obrigatória.'); return; }
    if (!newRenda.valor || Number(newRenda.valor) <= 0) { setRendaFormError('Valor deve ser maior que zero.'); return; }
    setSavingRenda(true);
    try {
      const created = await createRendaExtra(compromisso.id, { descricao: newRenda.descricao, valor: Number(newRenda.valor) });
      setRendasExtra(prev => [...prev, created]);
      setNewRenda(EMPTY_RENDA);
      setAddRendaForm(false);
    } finally {
      setSavingRenda(false);
    }
  };

  const handleDeleteRendaExtra = async (id) => {
    await deleteRendaExtra(id);
    setRendasExtra(prev => prev.filter(r => r.id !== id));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newItem.nome_item.trim()) { setFormError('Nome do item é obrigatório.'); return; }
    if (!newItem.valor || Number(newItem.valor) <= 0) { setFormError('Valor deve ser maior que zero.'); return; }
    setSaving(true);
    try {
      const created = await createItem(compromisso.id, {
        nome_item: newItem.nome_item,
        valor: Number(newItem.valor),
        data_vencimento: newItem.data_vencimento || null,
        categoria: newItem.categoria,
        pago: newItem.pago ?? false
      });

      if (newItem.recorrente) {
        try {
          await setBillRecurring(created, userId);
        } catch (recErr) {
          console.error('Erro ao definir recorrência:', recErr);
        }
      }

      setItens(prev => [...prev, created]);
      setNewItem(EMPTY_ITEM);
      setAddForm(false);
    } finally {
      setSaving(false);
    }
  };

  // Iniciar edição inline
  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    const rb = recurringBills.find(r => r.name === item.nome_item);
    setEditItemData({
      nome_item: item.nome_item,
      valor: item.valor,
      data_vencimento: item.data_vencimento || '',
      categoria: item.categoria || 'Outros',
      recorrente: !!rb,
      recurringId: rb?.id || null,
    });
  };

  // Salvar edição inline
  const handleSaveEdit = async (itemId) => {
    if (!editItemData.nome_item.trim()) return;
    if (!editItemData.valor || Number(editItemData.valor) <= 0) return;
    setSavingEdit(true);
    try {
      const updated = await updateItem(itemId, {
        nome_item: editItemData.nome_item,
        valor: Number(editItemData.valor),
        data_vencimento: editItemData.data_vencimento || null,
        categoria: editItemData.categoria,
      });

      // Sync recorrência
      const wasRecurring = !!editItemData.recurringId;
      const wantsRecurring = !!editItemData.recorrente;
      if (!wasRecurring && wantsRecurring) {
        const rb = await setBillRecurring(updated, userId);
        setRecurringBills(prev => [...prev, { id: rb.id, name: rb.name }]);
      } else if (wasRecurring && !wantsRecurring) {
        await stopRecurring(editItemData.recurringId);
        setRecurringBills(prev => prev.filter(r => r.id !== editItemData.recurringId));
      }

      setItens(prev => prev.map(i => i.id === updated.id ? updated : i));
      setEditingItemId(null);
      setEditItemData({});
    } finally {
      setSavingEdit(false);
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemData({});
  };

  const handleDelete = async (id) => {
    await deleteItem(id);
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const handleToggle = async (item) => {
    const updated = await togglePago(item.id, !item.pago);
    setItens(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleSwipeStart = (id, e) => {
    touchStartX.current[id] = e.touches[0].clientX;
  };

  const handleSwipeMove = (id, e) => {
    const start = touchStartX.current[id];
    if (start === undefined) return;
    const dx = e.touches[0].clientX - start;
    if (dx > 0) {
      setSwipeX(prev => ({ ...prev, [id]: Math.min(dx, SWIPE_THRESHOLD + 30) }));
    }
  };

  const handleSwipeEnd = async (item) => {
    const dx = swipeX[item.id] || 0;
    if (dx >= SWIPE_THRESHOLD) await handleToggle(item);
    setSwipeX(prev => ({ ...prev, [item.id]: 0 }));
    delete touchStartX.current[item.id];
  };

  const totalGastos = itens.reduce((s, i) => s + Number(i.valor), 0);
  const totalPago = itens.reduce((s, i) => s + (i.pago ? Number(i.valor) : 0), 0);
  const rendaPrincipal = Number(compromisso?.renda_mensal ?? 0);
  const totalExtras = rendasExtra.reduce((s, r) => s + Number(r.valor), 0);
  const totalRenda = rendaPrincipal + totalExtras;
  const saldo = totalRenda - totalGastos;

  const pct = totalGastos > 0 ? Math.round((totalPago / totalGastos) * 100) : 0;
  const circumference = 408.41;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const mesIdx = meses.indexOf(mesSelecionado);
  const prevMes = mesIdx > 0 ? meses[mesIdx - 1] : null;
  const nextMes = mesIdx < meses.length - 1 ? meses[mesIdx + 1] : null;

  return (
    <div className="compromissos-page">
      {/* Month navigator */}
      <div className="month-nav" data-tour="month-nav">
        <button className="month-nav-arrow" onClick={() => prevMes && setMesSelecionado(prevMes)} disabled={!prevMes}>
          <ChevronLeft size={18} />
        </button>
        <div className="month-tabs-wrap">
          {meses.map(m => (
            <button
              key={m}
              className={`month-tab ${mesSelecionado === m ? 'month-tab--active' : ''}`}
              onClick={() => setMesSelecionado(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <button className="month-nav-arrow" onClick={() => nextMes && setMesSelecionado(nextMes)} disabled={!nextMes}>
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <SkeletonHome />
      ) : (
        <>
          {/* Renda panel (expandable) */}
          <div className={`renda-panel ${!rendaExpandida ? 'renda-panel--compact' : ''}`}>
            <div className="renda-panel__main">
              {!rendaExpandida ? (
                <div className="renda-compact-summary" onClick={() => setRendaExpandida(true)} style={{ cursor: 'pointer' }}>
                  <span className="renda-compact-summary__label">Renda Total</span>
                  <span className="renda-compact-summary__value">{fmt(totalRenda)}</span>
                  {compromisso?.renda_recorrente && (
                    <span className="renda-recorrente-badge" title="Renda recorrente ativa">
                      <Repeat2 size={11} /> Recorrente
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <div className="renda-panel__left">
                    <span className="balance-panel__label">Renda Principal</span>
                    {editingRenda ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem', width: '140px' }}
                          value={rendaInput}
                          onChange={e => setRendaInput(e.target.value)}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveRenda(); if (e.key === 'Escape') setEditingRenda(false); }}
                        />
                        <button className="btn-icon-plain lime-text" onClick={handleSaveRenda}><Check size={16} /></button>
                        <button className="btn-icon-plain" onClick={() => setEditingRenda(false)}><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="balance-panel__value lime-text">{fmt(rendaPrincipal)}</span>
                        <button className="btn-icon-plain" onClick={() => setEditingRenda(true)} title="Editar renda">
                          <Edit3 size={13} style={{ color: 'var(--sdd-text-muted)' }} />
                        </button>
                      </div>
                    )}

                    {/* Toggle renda recorrente */}
                    <label className="recurring-toggle-row" style={{ marginTop: '0.5rem' }}>
                      <div className="recurring-toggle">
                        <input
                          type="checkbox"
                          checked={compromisso?.renda_recorrente || false}
                          onChange={handleToggleRendaRecorrente}
                        />
                        <span className="recurring-toggle__slider"></span>
                      </div>
                      <span className="recurring-toggle-row__label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Repeat2 size={13} /> Receber todo mês
                      </span>
                    </label>
                  </div>

                  {rendasExtra.length > 0 && (
                    <div className="renda-panel__extras-summary">
                      <span className="balance-panel__label">+ Rendas extras</span>
                      <span className="balance-panel__value" style={{ color: 'var(--sdd-positive)' }}>+{fmt(totalExtras)}</span>
                    </div>
                  )}

                  <div className="renda-panel__total">
                    <span className="balance-panel__label">Total Renda</span>
                    <span className="balance-panel__value lime-text" style={{ fontSize: '1.15rem' }}>{fmt(totalRenda)}</span>
                  </div>
                </>
              )}

              <button
                className="btn-icon-plain"
                onClick={() => setRendaExpandida(v => !v)}
                title={rendaExpandida ? "Recolher painel" : "Gerenciar rendas extras"}
                style={{ marginLeft: 'auto' }}
              >
                {rendaExpandida ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {rendaExpandida && (
              <div className="renda-extras-panel slide-down">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Rendas Extras — {mesSelecionado}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setAddRendaForm(v => !v); setRendaFormError(''); }}
                  >
                    <PlusCircle size={13} /> Adicionar
                  </Button>
                </div>

                {addRendaForm && (
                  <form onSubmit={handleAddRendaExtra} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 2, minWidth: '140px' }}>
                      <label className="input-label">Descrição *</label>
                      <input type="text" className="input-field" placeholder="Ex: Freelance, Aluguel..." value={newRenda.descricao}
                        onChange={e => setNewRenda(v => ({ ...v, descricao: e.target.value }))} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '110px' }}>
                      <label className="input-label">Valor (R$) *</label>
                      <input type="number" step="0.01" min="0.01" className="input-field" placeholder="0,00" value={newRenda.valor}
                        onChange={e => setNewRenda(v => ({ ...v, valor: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', paddingBottom: '1px' }}>
                      <Button type="submit" variant="primary" size="icon" disabled={savingRenda} title="Salvar">
                        <Check size={14} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" title="Cancelar"
                        onClick={() => { setAddRendaForm(false); setNewRenda(EMPTY_RENDA); setRendaFormError(''); }}>
                        <X size={14} />
                      </Button>
                    </div>
                    {rendaFormError && <p className="text-danger text-xs w-full">{rendaFormError}</p>}
                  </form>
                )}

                {rendasExtra.length === 0 && !addRendaForm ? (
                  <p className="text-muted text-xs text-center" style={{ padding: '0.75rem' }}>
                    Nenhuma renda extra cadastrada. Clique em "Adicionar" para incluir.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {rendasExtra.map(r => (
                      <div key={r.id} className="renda-extra-row">
                        <span className="renda-extra-row__desc">{r.descricao}</span>
                        <span className="renda-extra-row__valor" style={{ color: 'var(--sdd-positive)' }}>{fmt(r.valor)}</span>
                        <Button variant="ghost" size="icon" danger onClick={() => handleDeleteRendaExtra(r.id)} title="Remover">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    <div className="renda-extra-row renda-extra-row--total">
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Total extras</span>
                      <span style={{ fontWeight: 800, color: 'var(--sdd-positive)' }}>{fmt(totalExtras)}</span>
                      <span />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Hero */}
          <div className="progress-hero" data-tour="progress-ring">
            <div className="progress-ring-wrap">
              <svg className="progress-ring-svg" viewBox="0 0 160 160">
                <circle className="progress-ring__track" cx="80" cy="80" r="65" />
                <circle
                  className={`progress-ring__fill ${pct === 0 ? 'progress-ring__fill--zero' : ''}`}
                  cx="80"
                  cy="80"
                  r="65"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="progress-ring-center">
                <span className={`progress-ring-center__pct ${pct === 0 ? 'progress-ring-center__pct--zero' : ''}`}>
                  {pct}%
                </span>
                <span className="progress-ring-center__label">Pago</span>
              </div>
            </div>

            <div className="progress-stats">
              <span className="progress-stats__main">
                Já pago <span>{fmt(totalPago)}</span> de {fmt(totalGastos)} comprometido
              </span>
              <span className="progress-stats__secondary">
                Restam <em>{fmt(totalGastos - totalPago)}</em> para quitar as contas do mês
              </span>
            </div>

            <div className="progress-secondary-strip">
              <div className="progress-secondary-strip__item">
                <span className="progress-secondary-strip__label">Total Comprometido</span>
                <span className="progress-secondary-strip__value text-danger">{fmt(totalGastos)}</span>
              </div>
              <div className="progress-secondary-strip__item">
                <span className="progress-secondary-strip__label">Saldo Restante</span>
                <span className="progress-secondary-strip__value" style={{ color: saldo >= 0 ? 'var(--sdd-positive)' : 'var(--sdd-negative)' }}>{fmt(saldo)}</span>
              </div>
            </div>
          </div>

          {/* Items table header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 className="section-title">Itens do mês</h3>
              <span className="section-label">{mesSelecionado} · {itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
            </div>
            <Button
              data-tour="new-item"
              variant={addForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => { setAddForm(v => !v); setNewItem(EMPTY_ITEM); setFormError(''); }}
            >
              <Plus size={15} /> {addForm ? 'Fechar' : 'Novo Item'}
            </Button>
          </div>

          {/* Add item modal — rendered as fixed overlay, position outside normal flow */}
          {addForm && (
            <div
              className="item-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Novo item"
              onClick={e => {
                if (e.target === e.currentTarget) {
                  setAddForm(false);
                  setNewItem(EMPTY_ITEM);
                  setFormError('');
                }
              }}
            >
              <div className="item-modal">
                <div className="item-modal__header">
                  <h2>Novo item</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Fechar"
                    onClick={() => { setAddForm(false); setNewItem(EMPTY_ITEM); setFormError(''); }}
                  >
                    <X size={18} />
                  </Button>
                </div>

                <form onSubmit={handleAddItem}>
                  <div className="item-modal__body">

                    {/* Nome */}
                    <div>
                      <label className="item-modal__label">Nome do item *</label>
                      <input
                        type="text"
                        className="input-field item-modal__input"
                        placeholder="Ex: Aluguel, Supermercado"
                        value={newItem.nome_item}
                        onChange={e => setNewItem(v => ({ ...v, nome_item: e.target.value }))}
                        autoFocus
                      />
                    </div>

                    {/* Valor + Vencimento */}
                    <div className="item-modal__row">
                      <div>
                        <label className="item-modal__label">Valor (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="input-field item-modal__input"
                          placeholder="0,00"
                          value={newItem.valor}
                          onChange={e => setNewItem(v => ({ ...v, valor: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="item-modal__label">Vencimento</label>
                        <input
                          type="date"
                          className="input-field item-modal__input"
                          value={newItem.data_vencimento}
                          onChange={e => setNewItem(v => ({ ...v, data_vencimento: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Categoria — chip selector */}
                    <div>
                      <label className="item-modal__label">Categoria</label>
                      <div className="cat-chips-row">
                        {CATEGORIAS.map(c => {
                          const { icon: CatIcon, color, bg } = getCategory(c);
                          const isSelected = newItem.categoria === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              className="cat-chip"
                              style={isSelected ? { background: bg, borderColor: color, color, fontWeight: 700 } : {}}
                              onClick={() => setNewItem(v => ({ ...v, categoria: c }))}
                            >
                              <CatIcon size={11} strokeWidth={2} />
                              {c}
                              {isSelected && (
                                <span
                                  className="cat-chip__x"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setNewItem(v => ({ ...v, categoria: 'Outros' }));
                                  }}
                                >
                                  <X size={10} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Opções — círculo 44px "Repetir" */}
                    <div>
                      <label className="item-modal__label">Opções</label>
                      <div className="action-circles-row">
                        <div className="action-circle">
                          <button
                            type="button"
                            className={`action-circle__btn${newItem.recorrente ? ' action-circle__btn--active' : ''}`}
                            onClick={() => setNewItem(v => ({ ...v, recorrente: !v.recorrente }))}
                            aria-label={newItem.recorrente ? 'Desativar repetição mensal' : 'Repetir todo mês'}
                          >
                            <Repeat2 size={19} />
                          </button>
                          <span className={`action-circle__label${newItem.recorrente ? ' action-circle__label--active' : ''}`}>
                            Repetir
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Avisos */}
                    {!newItem.data_vencimento && (
                      <div className="date-warning">
                        <AlertTriangle size={13} />
                        <span>Sem data de vencimento, lembretes não funcionarão.</span>
                      </div>
                    )}
                    {formError && (
                      <p className="text-danger text-xs">{formError}</p>
                    )}
                  </div>

                  {/* Footer: botão circular de salvar */}
                  <div className="item-modal__footer">
                    <button
                      type="submit"
                      className="save-circle-btn"
                      disabled={saving}
                      aria-label="Salvar item"
                    >
                      {saving
                        ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Check size={22} />
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Items table */}
          {itens.length === 0 && !addForm ? (
            <div className="empty-state-rich">
              <div className="empty-state-rich__circle">
                <Calendar size={36} className="lime-text" />
              </div>
              <p className="empty-state-rich__title">Nenhuma conta em {mesSelecionado}</p>
              <p className="empty-state-rich__desc">
                Adicione suas contas e despesas do mês para acompanhar seu progresso financeiro.
              </p>
              <Button variant="primary" onClick={() => setAddForm(true)}>
                <Plus size={16} /> Adicionar primeira conta
              </Button>
              <p className="empty-state-rich__tip">
                <Lightbulb size={13} /> Ative "Repetir todo mês" em contas fixas como aluguel e luz.
              </p>
            </div>
          ) : itens.length > 0 ? (
            <div className="items-table-wrap">
              <table className="items-table">
                <thead>
                  <tr className="items-table__head">
                    <th>Item</th>
                    <th>Categoria</th>
                    <th>Vencimento</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ textAlign: 'center' }}>Pago</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(item => {
                    const isEditing = editingItemId === item.id;

                    if (isEditing) {
                      // Linha em modo de edição
                      return (
                        <React.Fragment key={item.id}>
                        <tr className="items-table__row items-table__row--editing">
                          <td>
                            <input
                              className="input-field input-field--inline"
                              value={editItemData.nome_item}
                              onChange={e => setEditItemData(v => ({ ...v, nome_item: e.target.value }))}
                              autoFocus
                            />
                          </td>
                          <td>
                            <select
                              className="input-field input-field--inline"
                              value={editItemData.categoria}
                              onChange={e => setEditItemData(v => ({ ...v, categoria: e.target.value }))}
                            >
                              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="input-field input-field--inline"
                              value={editItemData.data_vencimento}
                              onChange={e => setEditItemData(v => ({ ...v, data_vencimento: e.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              className="input-field input-field--inline"
                              style={{ textAlign: 'right' }}
                              value={editItemData.valor}
                              onChange={e => setEditItemData(v => ({ ...v, valor: e.target.value }))}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className={`pago-toggle${item.pago ? ' pago-toggle--checked' : ''}`}
                              onClick={() => handleToggle(item)}
                              title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                              aria-label={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                            >
                              {item.pago && <Check size={13} strokeWidth={3} />}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={savingEdit}
                                title="Salvar alterações"
                                style={{ color: 'var(--sdd-accent)' }}
                              >
                                <Save size={15} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCancelEdit} title="Cancelar edição">
                                <X size={15} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="items-table__row--editing">
                          <td colSpan={6} style={{ padding: '0.4rem 0.75rem 0.75rem', borderTop: 'none' }}>
                            <label className="recurring-toggle-row" style={{ gap: '0.5rem' }}>
                              <div className="recurring-toggle">
                                <input
                                  type="checkbox"
                                  checked={editItemData.recorrente || false}
                                  onChange={e => setEditItemData(v => ({ ...v, recorrente: e.target.checked }))}
                                />
                                <span className="recurring-toggle__slider"></span>
                              </div>
                              <span className="recurring-toggle-row__label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                                <Repeat2 size={13} /> Repetir todo mês
                              </span>
                            </label>
                          </td>
                        </tr>
                        </React.Fragment>
                      );
                    }

                    // Linha normal
                    const dx = swipeX[item.id] || 0;
                    const swipeProgress = Math.min(dx / SWIPE_THRESHOLD, 1);
                    const swipeColor = item.pago ? '239,68,68' : '34,197,94';
                    return (
                      <tr
                        key={item.id}
                        className={`items-table__row ${item.pago ? 'items-table__row--pago' : ''}`}
                        onTouchStart={e => handleSwipeStart(item.id, e)}
                        onTouchMove={e => handleSwipeMove(item.id, e)}
                        onTouchEnd={() => handleSwipeEnd(item)}
                        style={{
                          transform: `translateX(${dx}px)`,
                          transition: dx === 0 ? 'transform 0.25s ease' : 'none',
                          boxShadow: dx > 0 ? `inset ${dx + 20}px 0 ${dx}px -${dx * 0.8}px rgba(${swipeColor},${swipeProgress * 0.18})` : undefined,
                        }}
                      >
                        <td className="items-table__name">{item.nome_item}</td>
                        <td>
                          <CategoryBadge category={item.categoria} />
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {item.data_vencimento
                            ? new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
                            : <span style={{ color: 'var(--border-hover)' }}>Sem data</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>{fmt(item.valor)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className={`pago-toggle${item.pago ? ' pago-toggle--checked' : ''}`}
                            onClick={() => handleToggle(item)}
                            title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                            aria-label={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                          >
                            {item.pago && <Check size={13} strokeWidth={3} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <Button variant="ghost" size="icon" onClick={() => handleStartEdit(item)} title="Editar item">
                              <Edit3 size={15} />
                            </Button>
                            <Button variant="ghost" size="icon" danger onClick={() => handleDelete(item.id)} title="Remover item">
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="items-table__total">
                    <td colSpan={3} className="text-muted" style={{ fontSize: '0.8rem', paddingTop: '0.75rem' }}>
                      {itens.filter(i => i.pago).length} de {itens.length} pagos
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', paddingTop: '0.75rem' }}>
                      {fmt(totalGastos)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
