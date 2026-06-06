import React from 'react';
import { Calendar, ShieldAlert } from 'lucide-react';

export default function HistoricoPlanos({ planos }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!planos || planos.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p className="text-muted text-sm">Você ainda não gerou nenhum plano. Preencha seus dados na página principal e clique em "Calcular Plano"!</p>
      </div>
    );
  }

  return (
    <div className="slide-down">
      <h2 className="font-bold mb-6 text-main" style={{ fontSize: '1.5rem' }}>Histórico de Planos Gerados</h2>
      
      <div className="flex flex-col gap-6">
        {planos.map((plano) => {
          const listaRecomendacoes = plano.recomendacoes ? plano.recomendacoes.split('\n') : [];

          return (
            <div key={plano.id} className="card" style={{ borderLeft: '6px solid var(--primary)' }}>
              <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span className="font-medium text-xs text-muted flex items-center gap-1">
                  <Calendar size={14} /> Gerado em: {formatDate(plano.data_geracao)}
                </span>
                <span className="badge badge-success">Plano #{plano.id}</span>
              </div>

              {/* Detalhes Financeiros */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                  <span className="font-medium text-xs text-muted block">Economia Mensal com Cortes</span>
                  <div className="font-bold text-primary mt-1" style={{ fontSize: '1.15rem' }}>
                    {formatCurrency(plano.valor_economia_mensal)}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                  <span className="font-medium text-xs text-muted block">Quitação Estimada</span>
                  <div className="font-medium text-main mt-1 text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div>
                      <strong>Cenário Base:</strong> {plano.meses_para_quitar === null ? 'Inviável' : `${plano.meses_para_quitar} meses`}
                    </div>
                    <div>
                      <strong>Cenário Renda Extra:</strong> {plano.meses_com_renda_extra === null ? 'Inviável' : `${plano.meses_com_renda_extra} meses`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendações compactas */}
              <div>
                <span className="font-bold text-xs text-main mb-2 block" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldAlert size={14} className="text-warning" /> Recomendações Principais:
                </span>
                <ul className="flex flex-col gap-1" style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {listaRecomendacoes.slice(0, 3).map((rec, rIdx) => (
                    <li key={rIdx} className="text-xs text-muted flex gap-2 items-center">
                      <div style={{ minWidth: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></div>
                      <span>{rec}</span>
                    </li>
                  ))}
                  {listaRecomendacoes.length > 3 && (
                    <li className="text-xs text-muted font-medium" style={{ fontStyle: 'italic', paddingLeft: '0.75rem' }}>
                      + {listaRecomendacoes.length - 3} recomendações no plano completo
                    </li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
