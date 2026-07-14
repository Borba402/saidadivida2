import React, { useState, useEffect, useCallback } from 'react';
import Button from './ui/Button';
import { Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Calendar, AlertCircle } from 'lucide-react';
import {
  listTarefas, createTarefa, deleteTarefa, toggleConcluida, updateTarefa, PRIORIDADES
} from '../services/tarefasService';

const FILTROS = [
  { id: 'todas',     label: 'Todas' },
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'concluidas',label: 'Concluídas' },
];

const PRIORIDADE_STYLE = {
  baixa:  { label: 'Baixa',  cls: 'tarefa-badge--baixa' },
  normal: { label: 'Normal', cls: 'tarefa-badge--normal' },
  alta:   { label: 'Alta',   cls: 'tarefa-badge--alta' },
};

function isVencida(dataVenc) {
  if (!dataVenc) return false;
  return new Date(dataVenc + 'T00:00:00') < new Date(new Date().toDateString());
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const EMPTY_FORM = { titulo: '', anotacoes: '', data_vencimento: '', prioridade: 'normal' };

export default function TarefasTab({ userId }) {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTarefas(userId);
      setTarefas(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateTarefa(editingId, {
          titulo: form.titulo.trim(),
          anotacoes: form.anotacoes || null,
          data_vencimento: form.data_vencimento || null,
          prioridade: form.prioridade,
        });
        setTarefas(prev => prev.map(t => t.id === editingId ? updated : t));
      } else {
        const nova = await createTarefa(userId, {
          titulo: form.titulo.trim(),
          anotacoes: form.anotacoes || null,
          data_vencimento: form.data_vencimento || null,
          prioridade: form.prioridade,
        });
        setTarefas(prev => [nova, ...prev]);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tarefa) => {
    const updated = await toggleConcluida(tarefa.id, !tarefa.concluida);
    setTarefas(prev => prev.map(t => t.id === tarefa.id ? updated : t));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta tarefa?')) return;
    await deleteTarefa(id);
    setTarefas(prev => prev.filter(t => t.id !== id));
  };

  const handleEdit = (tarefa) => {
    setForm({
      titulo: tarefa.titulo,
      anotacoes: tarefa.anotacoes || '',
      data_vencimento: tarefa.data_vencimento || '',
      prioridade: tarefa.prioridade || 'normal',
    });
    setEditingId(tarefa.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = tarefas.filter(t => {
    if (filtro === 'pendentes') return !t.concluida;
    if (filtro === 'concluidas') return t.concluida;
    return true;
  });

  const counts = {
    todas: tarefas.length,
    pendentes: tarefas.filter(t => !t.concluida).length,
    concluidas: tarefas.filter(t => t.concluida).length,
  };

  return (
    <div className="tarefas-page">
      {/* Header */}
      <div className="tarefas-header">
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Tarefas</h1>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>
            {counts.pendentes} pendente{counts.pendentes !== 1 ? 's' : ''} · {counts.concluidas} concluída{counts.concluidas !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => { setShowForm(v => !v); if (editingId) handleCancel(); }}
        >
          <Plus size={16} />
          {showForm ? 'Fechar' : 'Nova Tarefa'}
        </Button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="tarefas-form-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>
            {editingId ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Título *</label>
              <input
                className="input-field"
                placeholder="O que precisa ser feito?"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Vencimento</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.data_vencimento}
                  onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Prioridade</label>
                <select
                  className="input-field"
                  value={form.prioridade}
                  onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                >
                  {PRIORIDADES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <label className="input-label">Anotações</label>
              <textarea
                className="input-field"
                placeholder="Detalhes, links, observações..."
                rows={3}
                value={form.anotacoes}
                onChange={e => setForm(f => ({ ...f, anotacoes: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving || !form.titulo.trim()}>
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="tarefas-filtros">
        {FILTROS.map(f => (
          <button
            key={f.id}
            className={`tarefas-filtro-btn ${filtro === f.id ? 'tarefas-filtro-btn--active' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
            <span className="tarefas-filtro-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="empty-state">
          <span className="text-muted text-sm">Carregando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={40} className="text-muted" />
          <p className="text-muted">
            {filtro === 'concluidas' ? 'Nenhuma tarefa concluída.' :
             filtro === 'pendentes'  ? 'Nenhuma tarefa pendente.' :
             'Nenhuma tarefa ainda. Crie a primeira!'}
          </p>
        </div>
      ) : (
        <div className="tarefas-list">
          {filtered.map(tarefa => {
            const vencida = !tarefa.concluida && isVencida(tarefa.data_vencimento);
            const exp = expanded[tarefa.id];
            const pStyle = PRIORIDADE_STYLE[tarefa.prioridade] || PRIORIDADE_STYLE.normal;

            return (
              <div
                key={tarefa.id}
                className={`tarefa-card ${tarefa.concluida ? 'tarefa-card--concluida' : ''} ${vencida ? 'tarefa-card--vencida' : ''}`}
              >
                <div className="tarefa-card__main">
                  {/* Checkbox */}
                  <button
                    className="tarefa-check-btn"
                    onClick={() => handleToggle(tarefa)}
                    title={tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                  >
                    {tarefa.concluida
                      ? <CheckSquare size={20} style={{ color: 'var(--success)' }} />
                      : <Square size={20} style={{ color: 'var(--text-muted)' }} />
                    }
                  </button>

                  {/* Content */}
                  <div className="tarefa-card__content" onClick={() => handleEdit(tarefa)} style={{ cursor: 'pointer' }}>
                    <span className={`tarefa-titulo ${tarefa.concluida ? 'tarefa-titulo--done' : ''}`}>
                      {tarefa.titulo}
                    </span>
                    <div className="tarefa-meta">
                      <span className={`tarefa-badge ${pStyle.cls}`}>{pStyle.label}</span>
                      {tarefa.data_vencimento && (
                        <span className={`tarefa-date ${vencida ? 'tarefa-date--vencida' : ''}`}>
                          {vencida && <AlertCircle size={11} />}
                          <Calendar size={11} />
                          {formatDate(tarefa.data_vencimento)}
                          {vencida && ' · Vencida'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tarefa-card__actions">
                    {tarefa.anotacoes && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(tarefa.id)}
                        title={exp ? 'Ocultar notas' : 'Ver notas'}
                      >
                        {exp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      danger
                      onClick={() => handleDelete(tarefa.id)}
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>

                {/* Anotações expandidas */}
                {exp && tarefa.anotacoes && (
                  <div className="tarefa-anotacoes">
                    {tarefa.anotacoes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
