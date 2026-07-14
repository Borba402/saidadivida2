import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Trash2, Plus, Filter } from 'lucide-react';
import Button from './ui/Button';

export default function DividasForm({ dividas, onAdd, onDelete }) {
  const [isOpen, setIsOpen] = useState(true);
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [jurosMensal, setJurosMensal] = useState('');
  const [parcelasRestantes, setParcelasRestantes] = useState('');
  const [filter, setFilter] = useState('todas');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (!valorTotal || Number(valorTotal) <= 0) {
      setError('O valor total deve ser maior que 0.');
      return;
    }
    if (jurosMensal === '' || Number(jurosMensal) < 0) {
      setError('A taxa de juros deve ser maior ou igual a 0.');
      return;
    }
    if (!parcelasRestantes || Number(parcelasRestantes) < 0) {
      setError('As parcelas restantes devem ser maior ou igual a 0.');
      return;
    }

    onAdd({
      descricao: descricao.trim(),
      valor_total: Number(valorTotal),
      juros_mensal: Number(jurosMensal),
      parcelas_restantes: parseInt(parcelasRestantes, 10)
    });

    setDescricao('');
    setValorTotal('');
    setJurosMensal('');
    setParcelasRestantes('');
    setError('');
  };

  const getPriority = (juros) => {
    if (juros >= 8) return { label: 'Alta', className: 'badge-danger' };
    if (juros >= 4) return { label: 'Média', className: 'badge-warning' };
    return { label: 'Baixa', className: 'badge-success' };
  };

  const filteredDividas = dividas.filter(d => {
    if (filter === 'todas') return true;
    if (filter === 'alta') return d.juros_mensal >= 8;
    if (filter === 'baixa') return d.juros_mensal < 8;
    return true;
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
          <AlertCircle className="text-primary" size={24} />
          <h2 className="font-bold text-main" style={{ fontSize: '1.25rem' }}>Dívidas</h2>
        </div>
        {isOpen ? <ChevronUp className="text-muted" /> : <ChevronDown className="text-muted" />}
      </div>

      {isOpen && (
        <div className="slide-down" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          {/* Formulário de Adição */}
          <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <h3 className="font-medium text-sm text-muted">Adicionar Nova Dívida</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Descrição</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Cartão de Crédito, FIES" 
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Valor Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  placeholder="R$ 0,00" 
                  min="0.01"
                  value={valorTotal}
                  onChange={e => setValorTotal(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Juros (% a.m.)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input-field" 
                  placeholder="Ex: 5" 
                  min="0"
                  value={jurosMensal}
                  onChange={e => setJurosMensal(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Parcelas Restantes</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Ex: 12" 
                  min="0"
                  value={parcelasRestantes}
                  onChange={e => setParcelasRestantes(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary">
                <Plus size={18} /> Add
              </Button>
            </div>
            {error && <span className="text-xs text-danger">{error}</span>}
          </form>

          {/* Filtros e Lista */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-main" style={{ fontSize: '1rem' }}>Listagem de Dívidas</h3>
              
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted" />
                <Button type="button" variant="secondary" size="sm"
                  active={filter === 'todas'} onClick={() => setFilter('todas')}>
                  Todas
                </Button>
                <Button type="button" variant="secondary" size="sm"
                  active={filter === 'alta'} onClick={() => setFilter('alta')}>
                  Alta Prioridade
                </Button>
                <Button type="button" variant="secondary" size="sm"
                  active={filter === 'baixa'} onClick={() => setFilter('baixa')}>
                  Baixa Prioridade
                </Button>
              </div>
            </div>

            {filteredDividas.length === 0 ? (
              <p className="text-muted text-sm text-center" style={{ padding: '2rem 0' }}>
                Nenhuma dívida cadastrada com este filtro.
              </p>
            ) : (
              <div>
                {filteredDividas.map(divida => {
                  const prio = getPriority(divida.juros_mensal);
                  return (
                    <div key={divida.id} className="list-item">
                      <div className="list-item-content">
                        <span className="list-item-title">{divida.descricao}</span>
                        <div className="flex gap-2" style={{ marginTop: '0.25rem' }}>
                          <span className={`badge ${prio.className}`} style={{ width: 'fit-content' }}>
                            Prioridade: {prio.label}
                          </span>
                          <span className="badge badge-neutral" style={{ width: 'fit-content' }}>
                            {divida.juros_mensal}% a.m. • {divida.parcelas_restantes} parcelas
                          </span>
                        </div>
                      </div>
                      
                      <div className="list-item-actions">
                        <span className="list-item-value" style={{ color: divida.juros_mensal >= 8 ? 'var(--danger)' : 'var(--text-main)' }}>
                          {formatCurrency(divida.valor_total)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          danger
                          onClick={() => onDelete(divida.id)}
                          title="Remover Dívida"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
