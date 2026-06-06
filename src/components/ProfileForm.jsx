import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, DollarSign, Calendar, TrendingUp } from 'lucide-react';

export default function ProfileForm({ perfil, onSave }) {
  const [isOpen, setIsOpen] = useState(true);
  
  const [apelido, setApelido] = useState(perfil?.apelido || '');
  const [rendaMensal, setRendaMensal] = useState(perfil?.renda_mensal || '');
  const [diaRecebimento, setDiaRecebimento] = useState(perfil?.dia_recebimento || '');
  const [temRendaExtra, setTemRendaExtra] = useState(perfil?.tem_renda_extra || false);
  const [valorRendaExtra, setValorRendaExtra] = useState(perfil?.valor_renda_extra || '');
  const [disponibilidadeExtra, setDisponibilidadeExtra] = useState(perfil?.disponibilidade_extra || 'nenhuma');
  
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!apelido.trim()) newErrors.apelido = "Apelido é obrigatório";
    if (!rendaMensal || Number(rendaMensal) < 0) newErrors.rendaMensal = "Renda mensal deve ser ≥ 0";
    if (!diaRecebimento || Number(diaRecebimento) < 1 || Number(diaRecebimento) > 31) {
      newErrors.diaRecebimento = "Dia deve ser entre 1 e 31";
    }
    if (temRendaExtra && (!valorRendaExtra || Number(valorRendaExtra) < 0)) {
      newErrors.valorRendaExtra = "Valor da renda extra deve ser ≥ 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        apelido,
        renda_mensal: Number(rendaMensal),
        dia_recebimento: Number(diaRecebimento),
        tem_renda_extra: temRendaExtra,
        valor_renda_extra: temRendaExtra ? Number(valorRendaExtra) : 0,
        disponibilidade_extra: temRendaExtra ? disponibilidadeExtra : 'nenhuma'
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="card mb-6" style={{ overflow: 'hidden', padding: 0 }}>
      <div 
        className="collapsible-header flex items-center justify-between" 
        style={{ padding: '1.5rem', backgroundColor: isOpen ? 'var(--bg-body)' : 'var(--bg-card)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <User className="text-primary" size={24} />
          <h2 className="font-bold text-main" style={{ fontSize: '1.25rem' }}>Perfil Financeiro</h2>
        </div>
        {isOpen ? <ChevronUp className="text-muted" /> : <ChevronDown className="text-muted" />}
      </div>
      
      {isOpen && (
        <div className="slide-down" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label flex items-center gap-2">
                  <User size={16}/> Apelido
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Como quer ser chamado?"
                  value={apelido} 
                  onChange={e => setApelido(e.target.value)} 
                />
                {errors.apelido && <span className="text-xs text-danger">{errors.apelido}</span>}
              </div>
              
              <div className="input-group">
                <label className="input-label flex items-center gap-2">
                  <Calendar size={16}/> Dia de Recebimento
                </label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Ex: 5"
                  min="1" max="31"
                  value={diaRecebimento} 
                  onChange={e => setDiaRecebimento(e.target.value)} 
                />
                {errors.diaRecebimento && <span className="text-xs text-danger">{errors.diaRecebimento}</span>}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-2">
                <DollarSign size={16}/> Renda Mensal (R$)
              </label>
              <input 
                type="number" 
                step="0.01"
                className="input-field" 
                placeholder="R$ 0,00"
                min="0"
                value={rendaMensal} 
                onChange={e => setRendaMensal(e.target.value)} 
              />
              {errors.rendaMensal && <span className="text-xs text-danger">{errors.rendaMensal}</span>}
            </div>

            <div className="input-group flex-row items-center gap-2 mt-4" style={{ flexDirection: 'row' }}>
              <input 
                type="checkbox" 
                id="temRendaExtra" 
                checked={temRendaExtra} 
                onChange={e => setTemRendaExtra(e.target.checked)} 
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="temRendaExtra" className="input-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                Tenho / Quero ter Renda Extra
              </label>
            </div>

            {temRendaExtra && (
              <div className="slide-down" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label flex items-center gap-2">
                    <TrendingUp size={16}/> Valor Mensal Extra (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="R$ 0,00"
                    min="0"
                    value={valorRendaExtra} 
                    onChange={e => setValorRendaExtra(e.target.value)} 
                  />
                  {errors.valorRendaExtra && <span className="text-xs text-danger">{errors.valorRendaExtra}</span>}
                </div>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Disponibilidade de Tempo</label>
                  <select 
                    className="input-field"
                    value={disponibilidadeExtra}
                    onChange={e => setDisponibilidadeExtra(e.target.value)}
                  >
                    <option value="nenhuma">Nenhuma</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button type="submit" className="btn btn-primary">
                Salvar Perfil
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
