import React, { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Trash2, Plus, Filter } from 'lucide-react';

export default function GastosForm({ gastos, onAdd, onDelete }) {
  const [isOpen, setIsOpen] = useState(true);
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('essencial');
  const [filter, setFilter] = useState('todos');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!categoria.trim()) {
      setError('A categoria é obrigatória.');
      return;
    }
    if (!valor || Number(valor) <= 0) {
      setError('O valor deve ser maior que 0.');
      return;
    }
    
    onAdd({
      categoria: categoria.trim(),
      valor: Number(valor),
      tipo
    });

    setCategoria('');
    setValor('');
    setTipo('essencial');
    setError('');
  };

  const filteredGastos = gastos.filter(g => {
    if (filter === 'todos') return true;
    return g.tipo === filter;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="card mb-6" style={{ overflow: 'hidden', padding: 0 }}>
      <div 
        className="collapsible-header flex items-center justify-between" 
        style={{ padding: '1.5rem', backgroundColor: isOpen ? 'var(--bg-body)' : 'var(--bg-card)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <DollarSign className="text-primary" size={24} />
          <h2 className="font-bold text-main" style={{ fontSize: '1.25rem' }}>Gastos</h2>
        </div>
        {isOpen ? <ChevronUp className="text-muted" /> : <ChevronDown className="text-muted" />}
      </div>

      {isOpen && (
        <div className="slide-down" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          {/* Formulário de Adição */}
          <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <h3 className="font-medium text-sm text-muted">Adicionar Novo Gasto</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Categoria</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Moradia, Alimentação" 
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  placeholder="R$ 0,00" 
                  min="0.01"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Tipo</label>
                <select 
                  className="input-field" 
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                >
                  <option value="essencial">Essencial</option>
                  <option value="nao_essencial">Não-essencial</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 1rem' }}>
                <Plus size={18} /> Add
              </button>
            </div>
            {error && <span className="text-xs text-danger">{error}</span>}
          </form>

          {/* Filtros e Lista */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-main" style={{ fontSize: '1rem' }}>Listagem de Gastos</h3>
              
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted" />
                <button 
                  type="button" 
                  className={`btn ${filter === 'todos' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => setFilter('todos')}
                >
                  Todos
                </button>
                <button 
                  type="button" 
                  className={`btn ${filter === 'essencial' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => setFilter('essencial')}
                >
                  Essenciais
                </button>
                <button 
                  type="button" 
                  className={`btn ${filter === 'nao_essencial' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => setFilter('nao_essencial')}
                >
                  Não-essenciais
                </button>
              </div>
            </div>

            {filteredGastos.length === 0 ? (
              <p className="text-muted text-sm text-center" style={{ padding: '2rem 0' }}>
                Nenhum gasto cadastrado com este filtro.
              </p>
            ) : (
              <div>
                {filteredGastos.map(gasto => (
                  <div key={gasto.id} className="list-item">
                    <div className="list-item-content">
                      <span className="list-item-title">{gasto.categoria}</span>
                      <span className={`badge ${gasto.tipo === 'essencial' ? 'badge-success' : 'badge-danger'}`} style={{ width: 'fit-content' }}>
                        {gasto.tipo === 'essencial' ? 'Essencial' : 'Não-essencial'}
                      </span>
                    </div>
                    
                    <div className="list-item-actions">
                      <span className="list-item-value" style={{ color: gasto.tipo === 'essencial' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {formatCurrency(gasto.valor)}
                      </span>
                      <button 
                        type="button" 
                        className="btn-icon" 
                        onClick={() => onDelete(gasto.id)}
                        title="Remover Gasto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
