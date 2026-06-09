import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, CheckCircle2, Circle, Calendar,
  Edit3, Check, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, PlusCircle, AlertTriangle, Repeat2, Save
} from 'lucide-react';
import {
  getMesAtual, getMesesDisponiveis, getOrCreateCompromisso,
  updateCompromisso, listItens, createItem, updateItem, deleteItem, togglePago, CATEGORIAS,
  listRendasExtra, createRendaExtra, deleteRendaExtra
} from '../services/compromissoService';
import {
  materializeRecurringForMonth,
  setBillRecurring
} from '../services/recurring';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_ITEM = { nome_item: '', valor: '', data_vencimento: '', pago: false, categoria: 'Outros', recorrente: false };
const EMPTY_RENDA = { descricao: '', valor: '' };

const CAT_COLORS = {
  'Alimentação': '#f59e0b', 'Moradia': '#3b82f6', 'Transporte': '#8b5cf6',
  'Saúde': '#ef4444', 'Educação': '#06b6d4', 'Lazer': '#ec4899',
  'Vestuário': '#f97316', 'Serviços': '#6b7280', 'Dívidas': '#dc2626', 'Outros': '#9ca3af'
};

export default function CompromissosTab({ userId }) {
  const meses = getMesesDisponiveis();
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [compromisso, setCompromisso] = useState(null);
  const [itens, setItens] = useState([]);
  const [rendasExtra, setRendasExtra] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState(false);
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

  const loadMes = useCallback(async (mes) => {
    setLoading(true);
    try {
      const c = await getOrCreateCompromisso(userId, mes);
      setCompromisso(c);
      setRendaInput(c.renda_mensal?.toString() || '0');

      // Materializa as contas recorrentes primeiro
      await materializeRecurringForMonth(userId, mes, c.id);

      const [items, extras] = await Promise.all([listItens(c.id), listRendasExtra(c.id)]);
      setItens(items);
      setRendasExtra(extras);
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
    setEditItemData({
      nome_item: item.nome_item,
      valor: item.valor,
      data_vencimento: item.data_vencimento || '',
      categoria: item.categoria || 'Outros',
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
      <div className="month-nav">
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
        <div className="flex items-center justify-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
          Carregando...
        </div>
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
                          <Edit3 size={13} style={{ color: 'var(--text-muted)' }} />
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
                      <span className="balance-panel__value" style={{ color: '#22c55e' }}>+{fmt(totalExtras)}</span>
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
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => { setAddRendaForm(v => !v); setRendaFormError(''); }}
                  >
                    <PlusCircle size={13} /> Adicionar
                  </button>
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
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.875rem' }} disabled={savingRenda}>
                        <Check size={14} />
                      </button>
                      <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 0.875rem' }}
                        onClick={() => { setAddRendaForm(false); setNewRenda(EMPTY_RENDA); setRendaFormError(''); }}>
                        <X size={14} />
                      </button>
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
                        <span className="renda-extra-row__valor" style={{ color: '#22c55e' }}>{fmt(r.valor)}</span>
                        <button className="btn-icon" onClick={() => handleDeleteRendaExtra(r.id)} title="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="renda-extra-row renda-extra-row--total">
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Total extras</span>
                      <span style={{ fontWeight: 800, color: '#22c55e' }}>{fmt(totalExtras)}</span>
                      <span />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Hero */}
          <div className="progress-hero">
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
                <span className="progress-secondary-strip__value" style={{ color: 'var(--text-muted)' }}>{fmt(saldo)}</span>
              </div>
            </div>
          </div>

          {/* Items table header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 className="font-bold" style={{ fontSize: '1rem' }}>
              Itens de {mesSelecionado}
              <span className="text-muted font-medium text-sm" style={{ marginLeft: '0.5rem' }}>({itens.length} itens)</span>
            </h3>
            <button
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              onClick={() => { setAddForm(v => !v); setFormError(''); }}
            >
              <Plus size={15} /> Novo Item
            </button>
          </div>

          {/* Add item form */}
          {addForm && (
            <form onSubmit={handleAddItem} className="add-item-form slide-down">
              <div className="add-item-grid">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Nome do item *</label>
                  <input type="text" className="input-field" placeholder="Ex: Aluguel, Supermercado"
                    value={newItem.nome_item} onChange={e => setNewItem(v => ({ ...v, nome_item: e.target.value }))} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Valor (R$) *</label>
                  <input type="number" step="0.01" min="0.01" className="input-field" placeholder="0,00"
                    value={newItem.valor} onChange={e => setNewItem(v => ({ ...v, valor: e.target.value }))} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Categoria</label>
                  <select className="input-field" value={newItem.categoria}
                    onChange={e => setNewItem(v => ({ ...v, categoria: e.target.value }))}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Vencimento</label>
                  <input type="date" className="input-field" value={newItem.data_vencimento}
                    onChange={e => setNewItem(v => ({ ...v, data_vencimento: e.target.value }))} />
                </div>
              </div>

              {/* Opções extras do item */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                <label className="recurring-toggle-row">
                  <div className="recurring-toggle">
                    <input
                      type="checkbox"
                      checked={newItem.recorrente || false}
                      onChange={e => setNewItem(v => ({ ...v, recorrente: e.target.checked }))}
                    />
                    <span className="recurring-toggle__slider"></span>
                  </div>
                  <span className="recurring-toggle-row__label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Repeat2 size={14} /> Repetir todo mês
                  </span>
                </label>

                {!newItem.data_vencimento && (
                  <div className="date-warning">
                    <AlertTriangle size={13} />
                    <span>Sem data de vencimento, lembretes não funcionarão.</span>
                  </div>
                )}
              </div>

              {formError && <p className="text-danger text-xs" style={{ marginTop: '0.5rem' }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }} disabled={saving}>
                  {saving ? 'Salvando...' : <><Check size={15} /> Salvar</>}
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}
                  onClick={() => { setAddForm(false); setNewItem(EMPTY_ITEM); setFormError(''); }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Items table */}
          {itens.length === 0 && !addForm ? (
            <div className="empty-state">
              <Calendar size={40} className="text-muted" />
              <p className="text-muted text-sm">Nenhum item cadastrado em {mesSelecionado}.</p>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => setAddForm(true)}>
                <Plus size={15} /> Adicionar primeiro item
              </button>
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
                    const catColor = CAT_COLORS[item.categoria] || '#9ca3af';
                    const isEditing = editingItemId === item.id;

                    if (isEditing) {
                      // Linha em modo de edição
                      return (
                        <tr key={item.id} className="items-table__row items-table__row--editing">
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
                            <button className="toggle-pago-btn" onClick={() => handleToggle(item)}
                              title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}>
                              {item.pago
                                ? <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                                : <Circle size={20} style={{ color: 'var(--border-hover)' }} />}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                              <button
                                className="btn-icon lime-text"
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={savingEdit}
                                title="Salvar alterações"
                              >
                                <Save size={15} />
                              </button>
                              <button className="btn-icon" onClick={handleCancelEdit} title="Cancelar edição">
                                <X size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Linha normal
                    return (
                      <tr key={item.id} className={`items-table__row ${item.pago ? 'items-table__row--pago' : ''}`}>
                        <td className="items-table__name">{item.nome_item}</td>
                        <td>
                          <span className="cat-badge" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>
                            {item.categoria}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {item.data_vencimento
                            ? new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
                            : <span style={{ color: 'var(--border-hover)' }}>Sem data</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>{fmt(item.valor)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="toggle-pago-btn" onClick={() => handleToggle(item)}
                            title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}>
                            {item.pago
                              ? <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                              : <Circle size={20} style={{ color: 'var(--border-hover)' }} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button className="btn-icon" onClick={() => handleStartEdit(item)} title="Editar item">
                              <Edit3 size={15} />
                            </button>
                            <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Remover item">
                              <Trash2 size={15} />
                            </button>
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
