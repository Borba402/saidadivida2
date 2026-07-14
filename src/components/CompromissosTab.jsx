import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from './ui/Button';
import CategoryBadge from './ui/CategoryBadge';
import { getCategory } from '../lib/categories';
import {
  Plus, Trash2, Calendar,
  Edit3, Check, X,
  ChevronDown, PlusCircle, AlertTriangle, Repeat2, Save, Lightbulb, Loader2,
  Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import MonthNavigator from './MonthNavigator';
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
const compact = (v) => Math.round(v).toLocaleString('pt-BR');
const horaParaSaudacao = (h) => (h >= 5 && h < 12) ? 'Bom dia' : (h >= 12 && h < 18) ? 'Boa tarde' : 'Boa noite';
const isItemVencido = (item) => !item.pago && !!item.data_vencimento && new Date(item.data_vencimento + 'T00:00:00') < new Date();

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

export default function CompromissosTab({ userId, user, newItemTrigger }) {
  const meses = getMesesDisponiveis();
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [compromisso, setCompromisso]   = useState(null);
  const [itens, setItens]               = useState([]);
  const [rendasExtra, setRendasExtra]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [addForm, setAddForm]           = useState(false);
  const [swipeX, setSwipeX]             = useState({});
  const touchStartX                     = useRef({});
  const [newItem, setNewItem]           = useState(EMPTY_ITEM);
  const [editingRenda, setEditingRenda] = useState(false);
  const [rendaInput, setRendaInput]     = useState('');
  const [formError, setFormError]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [addRendaForm, setAddRendaForm] = useState(false);
  const [newRenda, setNewRenda]         = useState(EMPTY_RENDA);
  const [rendaFormError, setRendaFormError] = useState('');
  const [savingRenda, setSavingRenda]   = useState(false);
  const [editingItemId, setEditingItemId]   = useState(null);
  const [editItemData, setEditItemData]     = useState({});
  const [savingEdit, setSavingEdit]         = useState(false);
  const [recurringBills, setRecurringBills] = useState([]);

  // Phase 9
  const [valoresOcultos, setValoresOcultos]         = useState(() => localStorage.getItem('sdd-valores-ocultos') === '1');
  const [rendaMetricExpanded, setRendaMetricExpanded] = useState(false);
  const [situacaoExpanded, setSituacaoExpanded]       = useState(false);
  const [toast, setToast]                             = useState(null);
  const [pctAnimado, setPctAnimado]                   = useState(0);
  const [horaAtual, setHoraAtual]                     = useState(() => new Date().getHours());

  const nomeUsuario = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'você';

  const loadMes = useCallback(async (mes) => {
    setLoading(true);
    try {
      const c = await getOrCreateCompromisso(userId, mes);
      setCompromisso(c);
      setRendaInput(c.renda_mensal?.toString() || '0');
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

  // Computed values (needed for effects below)
  const totalGastos   = itens.reduce((s, i) => s + Number(i.valor), 0);
  const totalPago     = itens.reduce((s, i) => s + (i.pago ? Number(i.valor) : 0), 0);
  const rendaPrincipal = Number(compromisso?.renda_mensal ?? 0);
  const totalExtras   = rendasExtra.reduce((s, r) => s + Number(r.valor), 0);
  const totalRenda    = rendaPrincipal + totalExtras;
  const saldo         = totalRenda - totalGastos;
  const faltaPagar    = totalGastos - totalPago;
  const pct           = totalGastos > 0 ? Math.round((totalPago / totalGastos) * 100) : 0;
  const itensPagos    = itens.filter(i => i.pago).length;
  const dv = (v) => valoresOcultos ? '••••' : `R$ ${compact(v)}`;

  // Atualiza saudação a cada minuto
  useEffect(() => {
    const id = setInterval(() => setHoraAtual(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Tab bar "+" abre formulário de novo item
  useEffect(() => {
    if (newItemTrigger > 0) setAddForm(true);
  }, [newItemTrigger]);

  // Animate progress bar: reset on load, then fill
  useEffect(() => {
    if (loading) { setPctAnimado(0); return; }
    const t = setTimeout(() => setPctAnimado(pct), 80);
    return () => clearTimeout(t);
  }, [loading, pct]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Handlers ──────────────────────────────────

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
        pago: newItem.pago ?? false,
      });
      if (newItem.recorrente) {
        try { await setBillRecurring(created, userId); } catch (recErr) { console.error('Erro recorrência:', recErr); }
      }
      setItens(prev => [...prev, created]);
      setNewItem(EMPTY_ITEM);
      setAddForm(false);
    } finally {
      setSaving(false);
    }
  };

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

  const handleSaveEdit = async (itemId) => {
    if (!editItemData.nome_item.trim() || !editItemData.valor || Number(editItemData.valor) <= 0) return;
    setSavingEdit(true);
    try {
      const updated = await updateItem(itemId, {
        nome_item: editItemData.nome_item,
        valor: Number(editItemData.valor),
        data_vencimento: editItemData.data_vencimento || null,
        categoria: editItemData.categoria,
      });
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

  const handleCancelEdit = () => { setEditingItemId(null); setEditItemData({}); };

  const handleDelete = async (id) => {
    await deleteItem(id);
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const handleToggle = async (item) => {
    const updated = await togglePago(item.id, !item.pago);
    setItens(prev => prev.map(i => i.id === updated.id ? updated : i));
    if (!item.pago) {
      setToast({
        msg: 'Item pago',
        onDesfazer: async () => {
          const reverted = await togglePago(item.id, false);
          setItens(prev => prev.map(i => i.id === reverted.id ? reverted : i));
          setToast(null);
        },
      });
    } else {
      setToast(null);
    }
  };

  const handleSwipeStart = (id, e) => { touchStartX.current[id] = e.touches[0].clientX; };
  const handleSwipeMove  = (id, e) => {
    const start = touchStartX.current[id];
    if (start === undefined) return;
    const dx = e.touches[0].clientX - start;
    if (dx > 0) setSwipeX(prev => ({ ...prev, [id]: Math.min(dx, SWIPE_THRESHOLD + 30) }));
  };
  const handleSwipeEnd = async (item) => {
    const dx = swipeX[item.id] || 0;
    if (dx >= SWIPE_THRESHOLD) await handleToggle(item);
    setSwipeX(prev => ({ ...prev, [item.id]: 0 }));
    delete touchStartX.current[item.id];
  };

  const toggleOculto = () => {
    setValoresOcultos(v => {
      const novo = !v;
      localStorage.setItem('sdd-valores-ocultos', novo ? '1' : '0');
      return novo;
    });
  };

  const mesFechado = itens.length > 0 && itensPagos === itens.length;

  // ── JSX ───────────────────────────────────────

  return (
    <div className="compromissos-page">
      {loading ? <SkeletonHome /> : (
        <>
          {/* ── Home header ── */}
          <div className="home-header">
            <div className="home-header__text">
              <h1 className="home-greeting">{horaParaSaudacao(horaAtual)}, {nomeUsuario}</h1>
              <p className="home-subtitle">
                {itens.length === 0
                  ? `Nenhum item em ${mesSelecionado.split('/')[0]} ainda.`
                  : pct >= 100
                    ? `${mesSelecionado.split('/')[0]} está 100% quitado. Mês fechado!`
                    : `${mesSelecionado.split('/')[0]} está ${pct}% quitado — faltam R$ ${compact(faltaPagar)} para fechar o mês`}
              </p>
            </div>
            <div className="home-header__controls">
              <MonthNavigator
                meses={meses}
                mesSelecionado={mesSelecionado}
                onChange={setMesSelecionado}
              />
              <button className="eye-btn" onClick={toggleOculto}
                aria-label={valoresOcultos ? 'Mostrar valores' : 'Ocultar valores'}>
                {valoresOcultos ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* ── Progress card ── */}
          {itens.length > 0 && (
            <div className={`progress-card${pct >= 100 ? ' progress-card--complete' : ''}`}>
              <div className="progress-card__top">
                <span className="progress-card__pct">{pct}%</span>
                <span className="progress-card__count">{itensPagos} de {itens.length} itens pagos</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar__track">
                  <div className="progress-bar__fill" style={{ width: `${pctAnimado}%` }} />
                </div>
              </div>
              <div className="progress-card__legend">
                <span>{valoresOcultos ? '••••' : `R$ ${compact(totalPago)} pagos`}</span>
                <span>{valoresOcultos ? '••••' : `R$ ${compact(totalGastos)} no total`}</span>
              </div>
            </div>
          )}

          {/* ── Metric cards ── */}
          <div className="metric-cards">

            {/* Renda do mês */}
            <div className="metric-card metric-card--expandable"
              onClick={() => setRendaMetricExpanded(v => !v)}>
              <div className="metric-card__header">
                <span className="metric-card__label">Renda do mês</span>
                <ChevronDown size={14} className={`metric-card__chevron${rendaMetricExpanded ? ' metric-card__chevron--open' : ''}`} />
              </div>
              <span className="metric-card__value">{dv(totalRenda)}</span>
              {rendaMetricExpanded && (
                <div className="metric-card__detail" onClick={e => e.stopPropagation()}>
                  <div className="metric-detail-row">
                    <span className="metric-detail-row__label">Renda principal</span>
                    <span className="metric-detail-row__val lime-text">{valoresOcultos ? '••••' : fmt(rendaPrincipal)}</span>
                  </div>
                  {rendasExtra.length > 0 && (
                    <>
                      <div className="metric-detail-divider" />
                      <p className="metric-detail-section">Rendas extras</p>
                      {rendasExtra.map(r => (
                        <div key={r.id} className="metric-detail-row">
                          <span className="metric-detail-row__label">{r.descricao}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="metric-detail-row__val" style={{ color: 'var(--sdd-positive)' }}>
                              {valoresOcultos ? '••••' : fmt(r.valor)}
                            </span>
                            <Button variant="ghost" size="icon" danger onClick={() => handleDeleteRendaExtra(r.id)}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="metric-detail-row metric-detail-row--total">
                        <span className="metric-detail-row__label">Total extras</span>
                        <span className="metric-detail-row__val" style={{ color: 'var(--sdd-positive)' }}>
                          {valoresOcultos ? '••••' : `+${fmt(totalExtras)}`}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="metric-detail-divider" />

                  {/* Editar renda principal */}
                  {editingRenda ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.35rem' }}>
                      <input type="number" className="input-field"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', flex: 1 }}
                        value={rendaInput} onChange={e => setRendaInput(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveRenda(); if (e.key === 'Escape') setEditingRenda(false); }} />
                      <button className="btn-icon-plain lime-text" onClick={handleSaveRenda}><Check size={15} /></button>
                      <button className="btn-icon-plain" onClick={() => setEditingRenda(false)}><X size={15} /></button>
                    </div>
                  ) : (
                    <button className="btn-ghost-sm" onClick={() => setEditingRenda(true)} style={{ marginTop: '0.35rem' }}>
                      <Edit3 size={12} /> Editar renda principal
                    </button>
                  )}

                  {/* Toggle recorrente */}
                  <label className="recurring-toggle-row" style={{ marginTop: '0.5rem' }}>
                    <div className="recurring-toggle">
                      <input type="checkbox" checked={compromisso?.renda_recorrente || false}
                        onChange={handleToggleRendaRecorrente} />
                      <span className="recurring-toggle__slider" />
                    </div>
                    <span className="recurring-toggle-row__label">
                      <Repeat2 size={13} /> Receber todo mês
                    </span>
                  </label>

                  {/* Adicionar renda extra */}
                  <button className="btn-ghost-sm"
                    onClick={() => setAddRendaForm(v => !v)}
                    style={{ marginTop: '0.25rem' }}>
                    <PlusCircle size={12} /> {addRendaForm ? 'Cancelar' : 'Adicionar renda extra'}
                  </button>
                  {addRendaForm && (
                    <form onSubmit={handleAddRendaExtra}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <input type="text" className="input-field" placeholder="Descrição (ex: Freelance)"
                        value={newRenda.descricao} onChange={e => setNewRenda(v => ({ ...v, descricao: e.target.value }))} />
                      <input type="number" step="0.01" min="0.01" className="input-field" placeholder="Valor (R$)"
                        value={newRenda.valor} onChange={e => setNewRenda(v => ({ ...v, valor: e.target.value }))} />
                      {rendaFormError && <p className="text-danger text-xs">{rendaFormError}</p>}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Button type="submit" variant="primary" size="sm" disabled={savingRenda}>
                          <Check size={13} /> Salvar
                        </Button>
                        <Button type="button" variant="ghost" size="sm"
                          onClick={() => { setAddRendaForm(false); setNewRenda(EMPTY_RENDA); }}>
                          <X size={13} />
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Falta pagar */}
            <div className="metric-card">
              <span className="metric-card__label">Falta pagar</span>
              <span className="metric-card__value">{dv(faltaPagar)}</span>
            </div>

            {/* Situação */}
            <div className="metric-card metric-card--expandable"
              onClick={() => setSituacaoExpanded(v => !v)}
              style={{ justifyContent: 'center' }}>
              <div className="metric-card__header">
                <span className="metric-card__label">Situação</span>
                <ChevronDown size={14} className={`metric-card__chevron${situacaoExpanded ? ' metric-card__chevron--open' : ''}`} />
              </div>
              {mesFechado ? (
                <div className="situacao-pill situacao-pill--ok" aria-label="Mês fechado">
                  <CheckCircle2 size={12} /> Mês fechado
                </div>
              ) : totalGastos > totalRenda ? (
                <div className="situacao-pill situacao-pill--danger" aria-label="Acima da renda">
                  <AlertTriangle size={12} /> Acima da renda
                </div>
              ) : (
                <div className="situacao-pill situacao-pill--ok" aria-label="Dentro da renda">
                  <CheckCircle2 size={12} /> Dentro da renda
                </div>
              )}
              {situacaoExpanded && (
                <div className="metric-card__detail" onClick={e => e.stopPropagation()}>
                  <div className="metric-detail-row">
                    <span className="metric-detail-row__label">Saldo</span>
                    <span className="metric-detail-row__val"
                      style={{ color: saldo >= 0 ? 'var(--sdd-positive)' : 'var(--sdd-negative)' }}>
                      {valoresOcultos ? '••••' : fmt(saldo)}
                    </span>
                  </div>
                  <div className="metric-detail-row">
                    <span className="metric-detail-row__label">Comprometido</span>
                    <span className="metric-detail-row__val">{valoresOcultos ? '••••' : fmt(totalGastos)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Items section header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 className="section-title">Itens do mês</h3>
              <span className="section-label">{mesSelecionado} · {itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
            </div>
            <Button data-tour="new-item" variant={addForm ? 'secondary' : 'primary'} size="sm"
              onClick={() => { setAddForm(v => !v); setNewItem(EMPTY_ITEM); setFormError(''); }}>
              <Plus size={15} /> {addForm ? 'Fechar' : 'Novo Item'}
            </Button>
          </div>

          {/* ── Add item modal ── */}
          {addForm && (
            <div className="item-modal-overlay" role="dialog" aria-modal="true" aria-label="Novo item"
              onClick={e => { if (e.target === e.currentTarget) { setAddForm(false); setNewItem(EMPTY_ITEM); setFormError(''); } }}>
              <div className="item-modal">
                <div className="item-modal__header">
                  <h2>Novo item</h2>
                  <Button variant="ghost" size="icon" aria-label="Fechar"
                    onClick={() => { setAddForm(false); setNewItem(EMPTY_ITEM); setFormError(''); }}>
                    <X size={18} />
                  </Button>
                </div>
                <form onSubmit={handleAddItem}>
                  <div className="item-modal__body">
                    <div>
                      <label className="item-modal__label">Nome do item *</label>
                      <input type="text" className="input-field item-modal__input"
                        placeholder="Ex: Aluguel, Supermercado"
                        value={newItem.nome_item}
                        onChange={e => setNewItem(v => ({ ...v, nome_item: e.target.value }))} autoFocus />
                    </div>
                    <div className="item-modal__row">
                      <div>
                        <label className="item-modal__label">Valor (R$) *</label>
                        <input type="number" step="0.01" min="0.01" className="input-field item-modal__input"
                          placeholder="0,00" value={newItem.valor}
                          onChange={e => setNewItem(v => ({ ...v, valor: e.target.value }))} />
                      </div>
                      <div>
                        <label className="item-modal__label">Vencimento</label>
                        <input type="date" className="input-field item-modal__input"
                          value={newItem.data_vencimento}
                          onChange={e => setNewItem(v => ({ ...v, data_vencimento: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="item-modal__label">Categoria</label>
                      <div className="cat-chips-row">
                        {CATEGORIAS.map(c => {
                          const { icon: CatIcon, color, bg } = getCategory(c);
                          const isSelected = newItem.categoria === c;
                          return (
                            <button key={c} type="button" className="cat-chip"
                              style={isSelected ? { background: bg, borderColor: color, color, fontWeight: 700 } : {}}
                              onClick={() => setNewItem(v => ({ ...v, categoria: c }))}>
                              <CatIcon size={11} strokeWidth={2} />
                              {c}
                              {isSelected && (
                                <span className="cat-chip__x"
                                  onClick={e => { e.stopPropagation(); setNewItem(v => ({ ...v, categoria: 'Outros' })); }}>
                                  <X size={10} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="item-modal__label">Opções</label>
                      <div className="action-circles-row">
                        <div className="action-circle">
                          <button type="button"
                            className={`action-circle__btn${newItem.recorrente ? ' action-circle__btn--active' : ''}`}
                            onClick={() => setNewItem(v => ({ ...v, recorrente: !v.recorrente }))}
                            aria-label={newItem.recorrente ? 'Desativar repetição mensal' : 'Repetir todo mês'}>
                            <Repeat2 size={19} />
                          </button>
                          <span className={`action-circle__label${newItem.recorrente ? ' action-circle__label--active' : ''}`}>
                            Repetir
                          </span>
                        </div>
                      </div>
                    </div>
                    {!newItem.data_vencimento && (
                      <div className="date-warning">
                        <AlertTriangle size={13} />
                        <span>Sem data de vencimento, lembretes não funcionarão.</span>
                      </div>
                    )}
                    {formError && <p className="text-danger text-xs">{formError}</p>}
                  </div>
                  <div className="item-modal__footer">
                    <button type="submit" className="save-circle-btn" disabled={saving} aria-label="Salvar item">
                      {saving
                        ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Check size={22} />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Items table ── */}
          {itens.length === 0 && !addForm ? (
            <div className="empty-state-rich">
              <div className="empty-state-rich__circle">
                <Calendar size={36} className="lime-text" />
              </div>
              <p className="empty-state-rich__title">Nenhum item em {mesSelecionado}</p>
              <p className="empty-state-rich__desc">
                Adicione suas contas e despesas para acompanhar seu progresso financeiro.
              </p>
              <Button variant="primary" onClick={() => setAddForm(true)}>
                <Plus size={16} /> Adicionar primeiro item
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
                    const vencido   = isItemVencido(item);

                    if (isEditing) {
                      return (
                        <React.Fragment key={item.id}>
                          <tr className="items-table__row items-table__row--editing">
                            <td>
                              <input className="input-field input-field--inline" value={editItemData.nome_item}
                                onChange={e => setEditItemData(v => ({ ...v, nome_item: e.target.value }))} autoFocus />
                            </td>
                            <td>
                              <select className="input-field input-field--inline" value={editItemData.categoria}
                                onChange={e => setEditItemData(v => ({ ...v, categoria: e.target.value }))}>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            <td>
                              <input type="date" className="input-field input-field--inline"
                                value={editItemData.data_vencimento}
                                onChange={e => setEditItemData(v => ({ ...v, data_vencimento: e.target.value }))} />
                            </td>
                            <td>
                              <input type="number" step="0.01" min="0.01"
                                className="input-field input-field--inline"
                                style={{ textAlign: 'right' }} value={editItemData.valor}
                                onChange={e => setEditItemData(v => ({ ...v, valor: e.target.value }))} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button className={`pago-toggle${item.pago ? ' pago-toggle--checked' : ''}`}
                                onClick={() => handleToggle(item)}
                                aria-label={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}>
                                {item.pago && <Check size={13} strokeWidth={3} />}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(item.id)}
                                  disabled={savingEdit} style={{ color: 'var(--sdd-accent)' }}>
                                  <Save size={15} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                  <X size={15} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr className="items-table__row--editing">
                            <td colSpan={6} style={{ padding: '0.4rem 0.75rem 0.75rem', borderTop: 'none' }}>
                              <label className="recurring-toggle-row" style={{ gap: '0.5rem' }}>
                                <div className="recurring-toggle">
                                  <input type="checkbox" checked={editItemData.recorrente || false}
                                    onChange={e => setEditItemData(v => ({ ...v, recorrente: e.target.checked }))} />
                                  <span className="recurring-toggle__slider" />
                                </div>
                                <span className="recurring-toggle-row__label"
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                                  <Repeat2 size={13} /> Repetir todo mês
                                </span>
                              </label>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    }

                    const dx = swipeX[item.id] || 0;
                    const swipeProgress = Math.min(dx / SWIPE_THRESHOLD, 1);
                    const swipeColor = item.pago ? '239,68,68' : '34,197,94';
                    return (
                      <tr key={item.id}
                        className={`items-table__row ${item.pago ? 'items-table__row--pago' : ''}`}
                        onTouchStart={e => handleSwipeStart(item.id, e)}
                        onTouchMove={e => handleSwipeMove(item.id, e)}
                        onTouchEnd={() => handleSwipeEnd(item)}
                        style={{
                          transform: `translateX(${dx}px)`,
                          transition: dx === 0 ? 'transform 0.25s ease' : 'none',
                          boxShadow: dx > 0
                            ? `inset ${dx + 20}px 0 ${dx}px -${dx * 0.8}px rgba(${swipeColor},${swipeProgress * 0.18})`
                            : undefined,
                        }}>
                        <td className="items-table__name">{item.nome_item}</td>
                        <td><CategoryBadge category={item.categoria} outline /></td>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {item.data_vencimento
                            ? new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
                            : <span style={{ color: 'var(--border-hover)' }}>Sem data</span>}
                        </td>
                        <td style={{
                          textAlign: 'right',
                          fontSize: '0.9rem',
                          fontWeight: vencido ? 700 : 400,
                          color: vencido ? 'var(--sdd-negative)' : item.pago ? 'var(--sdd-text-muted)' : undefined,
                        }}>
                          {valoresOcultos ? '••••' : fmt(item.valor)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className={`pago-toggle${item.pago ? ' pago-toggle--checked' : ''}`}
                            onClick={() => handleToggle(item)}
                            title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                            aria-label={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}>
                            {item.pago && <Check size={13} strokeWidth={3} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <Button variant="ghost" size="icon" onClick={() => handleStartEdit(item)}>
                              <Edit3 size={15} />
                            </Button>
                            <Button variant="ghost" size="icon" danger onClick={() => handleDelete(item.id)}>
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
                      {itensPagos} de {itens.length} pagos
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', paddingTop: '0.75rem' }}>
                      {valoresOcultos ? '••••' : fmt(totalGastos)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}

          {/* ── Toast ── */}
          {toast && (
            <div className="sdd-toast" role="status" aria-live="polite">
              <span className="sdd-toast__msg">{toast.msg}</span>
              <button className="sdd-toast__desfazer" onClick={toast.onDesfazer}>Desfazer</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
