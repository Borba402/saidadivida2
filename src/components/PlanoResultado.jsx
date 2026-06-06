import React from 'react';
import { DollarSign, ShieldAlert, TrendingUp, Calendar } from 'lucide-react';

export default function PlanoResultado({ plano, temRendaExtra, valorRendaExtra }) {
  if (!plano) return null;

  const { valor_economia_mensal, valor_disponivel, meses_para_quitar, meses_com_renda_extra, recomendacoes } = plano;
  
  const listaRecomendacoes = recomendacoes ? recomendacoes.split('\n') : [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isNoFolga = valor_disponivel <= 0;

  return (
    <div className="slide-down">
      <h2 className="font-bold mb-6 text-main" style={{ fontSize: '1.5rem' }}>Meu Plano de Quitação</h2>
      
      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <DollarSign size={20} />
            <span className="font-medium text-sm text-muted">Economia Mensal com Cortes</span>
          </div>
          <span className="font-bold text-main" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>
            {formatCurrency(valor_economia_mensal)}
          </span>
          <p className="text-xs text-muted">Obtido com redução de 70% de gastos não-essenciais</p>
        </div>

        <div className="card flex flex-col gap-2" style={{ borderLeft: `6px solid ${isNoFolga ? 'var(--danger)' : 'var(--success)'}` }}>
          <div className="flex items-center gap-2" style={{ color: isNoFolga ? 'var(--danger)' : 'var(--success)' }}>
            <TrendingUp size={20} />
            <span className="font-medium text-sm text-muted">Valor Disponível para Dívidas</span>
          </div>
          <span className="font-bold" style={{ fontSize: '1.8rem', color: isNoFolga ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(valor_disponivel)}
          </span>
          <p className="text-xs text-muted">
            {isNoFolga ? 'Seu orçamento está deficitário!' : 'Valor que será direcionado mensalmente para quitação.'}
          </p>
        </div>
      </div>

      {/* Simulação e Comparação Lado a Lado */}
      <div className="card mb-6">
        <h3 className="font-bold text-main mb-4" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} className="text-primary" /> Tempo Estimado de Quitação (Método Avalanche)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Cenário Base */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span className="font-medium text-sm text-muted">Cenário Base (Sem Renda Extra)</span>
            <div style={{ marginTop: '0.5rem' }}>
              {meses_para_quitar === null ? (
                <span className="font-bold text-danger" style={{ fontSize: '1.8rem' }}>Inviável</span>
              ) : (
                <span className="font-bold text-main" style={{ fontSize: '2rem' }}>
                  {meses_para_quitar} {meses_para_quitar === 1 ? 'mês' : 'meses'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-2">Usando apenas o valor disponível do seu orçamento</p>
          </div>

          {/* Cenário Renda Extra */}
          <div style={{ padding: '1rem', backgroundColor: temRendaExtra ? 'var(--primary-light)' : 'var(--bg-body)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span className="font-medium text-sm text-muted">
              Cenário Alternativo {temRendaExtra && `(+ ${formatCurrency(valorRendaExtra)}/mês)`}
            </span>
            <div style={{ marginTop: '0.5rem' }}>
              {meses_com_renda_extra === null ? (
                <span className="font-bold text-danger" style={{ fontSize: '1.8rem' }}>Inviável</span>
              ) : (
                <span className="font-bold text-primary" style={{ fontSize: '2rem' }}>
                  {meses_com_renda_extra} {meses_com_renda_extra === 1 ? 'mês' : 'meses'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-2">
              {temRendaExtra ? 'Acelerando a quitação com o acréscimo da sua renda extra' : 'Ative a renda extra no seu perfil para ver a simulação'}
            </p>
          </div>
        </div>
      </div>

      {/* Bloco de Recomendações */}
      <div className="card mb-6">
        <h3 className="font-bold text-main mb-4" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} className="text-warning" /> Recomendações Personalizadas
        </h3>
        
        <ul className="flex flex-col gap-3" style={{ listStyle: 'none' }}>
          {listaRecomendacoes.map((rec, idx) => {
            const isUrgente = rec.startsWith('Urgente:') || rec.startsWith('Alerta:');
            const isIncentivo = rec.startsWith('Incentivo:');
            let iconColor = 'var(--text-muted)';
            let bgColor = 'transparent';
            let border = '1px solid var(--border-color)';
            
            if (isUrgente) {
              bgColor = 'var(--danger-light)';
              iconColor = 'var(--danger)';
              border = '1px solid var(--danger)';
            } else if (isIncentivo) {
              bgColor = 'var(--primary-light)';
              iconColor = 'var(--primary)';
              border = '1px solid var(--primary)';
            }

            return (
              <li 
                key={idx} 
                className="flex gap-2 items-center text-sm" 
                style={{ 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: bgColor,
                  border: border,
                  color: isUrgente ? 'var(--danger)' : 'var(--text-main)'
                }}
              >
                <div style={{ minWidth: '8px', height: '8px', borderRadius: '50%', backgroundColor: iconColor }}></div>
                <span>{rec}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
