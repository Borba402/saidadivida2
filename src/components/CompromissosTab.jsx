import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, CheckCircle2, Circle, Calendar, DollarSign,
  TrendingDown, ArrowRight, Edit3, Check, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  getMesAtual, getMesesDisponiveis, getOrCreateCompromisso,
  updateCompromisso, listItens, createItem, deleteItem, togglePago, CATEGORIAS
} from '../services/compromissoService';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_ITEM = { nome_item: '', valor: '', data_vencimento: '', pago: false, categoria: 'Outros' };

const CAT_COLORS = {
  'Alimentação': '#f59e0b', 'Moradia': '#3b82f6', 'Transporte': '#8b5cf6',
  'Saúde': '#ef4444', 'Educação': '#06b6d4', 'Lazer': '#ec4899',
  'Vestuário': '#f97316', 'Serviços': '#6b7280', 'Dívidas': '#dc2626', 'Outros': '#9ca3af'
};

function StatusChip({ pago, vencimento }) {
  const hoje = new Date().toISOString().split('T')[0];
  const vencido = !pago && vencimento && vencimento < hoje;
  if (pago) return <span className="status-chip status-chip--pago">Pago</span>;
  if (vencido) return <span className="status-chip status-chip--vencido">Vencido</span>;
  return <span className="status-chip status-chip--pendente">Pendente</span>;
}

export default function CompromissosTab({ userId }) {
  const meses = getMesesDisponiveis();
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [compromisso, setCompromisso] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [editingRenda, setEditingRenda] = useState(false);
  const [rendaInput, setRendaInput] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMes = useCallback(async (mes) => {
    setLoading(true);
    try {
      const c = await getOrCreateCompromisso(userId, mes);
      setCompromisso(c);
      setRendaInput(c.renda_mensal?.toString() || '0');
      const items = await listItens(c.id);
      setItens(items);
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

  const handleAddItem = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newItem.nome_item.trim()) { setFormError('Nome do item é obrigatório.'); return; }
    if (!newItem.valor || Number(newItem.valor) <= 0) { setFormError('Valor deve ser maior que zero.'); return; }
    setSaving(true);
    try {
      const created = await createItem(compromisso.id, {
        ...newItem,
        valor: Number(newItem.valor),
        data_vencimento: newItem.data_vencimento || null
      });
      setItens(prev => [...prev, created]);
      setNewItem(EMPTY_ITEM);
      setAddForm(false);
    } finally {
      setSaving(false);
    }
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
  const renda = Number(compromisso?.renda_mensal ?? 0);
  const saldo = renda - totalGastos;

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
          {/* Balance strip */}
          <div className="balance-panel">
            {/* Renda */}
            <div className="balance-panel__item">
              <span className="balance-panel__label">Renda Mensal</span>
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
                  <span className="balance-panel__value lime-text">{fmt(renda)}</span>
                  <button className="btn-icon-plain" onClick={() => setEditingRenda(true)} title="Editar renda">
                    <Edit3 size={13} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              )}
            </div>

            <div className="balance-panel__divider" />

            <div className="balance-panel__item">
              <TrendingDown size={13} className="text-danger" style={{ marginBottom: 2 }} />
              <span className="balance-panel__label">Total Comprometido</span>
              <span className="balance-panel__value text-danger">{fmt(totalGastos)}</span>
            </div>

            <div className="balance-panel__divider" />

            <div className="balance-panel__item">
              <span className="balance-panel__label">Já Pago</span>
              <span className="balance-panel__value" style={{ color: '#22c55e' }}>{fmt(totalPago)}</span>
            </div>

            <ArrowRight size={18} className="text-muted" style={{ flexShrink: 0 }} />

            <div className="balance-panel__item">
              <DollarSign size={13} className={saldo >= 0 ? 'lime-text' : 'text-danger'} style={{ marginBottom: 2 }} />
              <span className="balance-panel__label">Saldo Restante</span>
              <span className={`balance-panel__value ${saldo >= 0 ? 'lime-text' : 'text-danger'}`}>
                {fmt(saldo)}
              </span>
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
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Aluguel, Supermercado"
                    value={newItem.nome_item}
                    onChange={e => setNewItem(v => ({ ...v, nome_item: e.target.value }))}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input-field"
                    placeholder="0,00"
                    value={newItem.valor}
                    onChange={e => setNewItem(v => ({ ...v, valor: e.target.value }))}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Categoria</label>
                  <select
                    className="input-field"
                    value={newItem.categoria}
                    onChange={e => setNewItem(v => ({ ...v, categoria: e.target.value }))}
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Vencimento</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newItem.data_vencimento}
                    onChange={e => setNewItem(v => ({ ...v, data_vencimento: e.target.value }))}
                  />
                </div>
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
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Pago</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(item => {
                    const catColor = CAT_COLORS[item.categoria] || '#9ca3af';
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
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>
                          {fmt(item.valor)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusChip pago={item.pago} vencimento={item.data_vencimento} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="toggle-pago-btn"
                            onClick={() => handleToggle(item)}
                            title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                          >
                            {item.pago
                              ? <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                              : <Circle size={20} style={{ color: 'var(--border-hover)' }} />}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id)}
                            title="Remover item"
                          >
                            <Trash2 size={16} />
                          </button>
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
                    <td colSpan={3} />
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
