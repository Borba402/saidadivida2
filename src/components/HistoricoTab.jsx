import React, { useState, useEffect, useCallback } from 'react';
import { History, TrendingUp, TrendingDown, Calendar, BarChart2 } from 'lucide-react';
import Button from './ui/Button';
import CategoryBadge from './ui/CategoryBadge';
import { listCompromissos, listItens } from '../services/compromissoService';
import MonthDashboard from './MonthDashboard';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export default function HistoricoTab({ userId }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashRegistro, setDashRegistro] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const compromissos = await listCompromissos(userId);
      const enriched = await Promise.all(
        compromissos.map(async (c) => {
          const itens = await listItens(c.id);
          const totalGastos = itens.reduce((s, i) => s + Number(i.valor), 0);
          const totalPago = itens.reduce((s, i) => s + (i.pago ? Number(i.valor) : 0), 0);
          const saldo = Number(c.renda_mensal) - totalGastos;
          return { ...c, itens, totalGastos, totalPago, saldo, count: itens.length };
        })
      );
      enriched.sort((a, b) => {
        const parseDate = (m) => {
          const [mes, ano] = m.mes_referencia.split('/');
          const idx = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].indexOf(mes);
          return new Date(Number(ano), idx, 1);
        };
        return parseDate(b) - parseDate(a);
      });
      setRegistros(enriched);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
        Carregando histórico...
      </div>
    );
  }

  const mesesComDados = registros.filter(r => r.count > 0);

  if (mesesComDados.length === 0) {
    return (
      <div className="historico-page">
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <History size={20} className="lime-text" />
          <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Histórico de Compromissos</h2>
        </div>
        <div className="empty-state">
          <Calendar size={40} className="text-muted" />
          <p className="text-muted text-sm">Nenhum compromisso registrado ainda.</p>
          <p className="text-muted text-xs">Adicione itens na aba <strong>Início</strong> para criar seu histórico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historico-page">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <History size={20} className="lime-text" />
        <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Histórico de Compromissos</h2>
        <span className="text-muted font-medium text-sm">({mesesComDados.length} meses)</span>
      </div>

      <MonthDashboard registro={dashRegistro} onClose={() => setDashRegistro(null)} />

      <div className="historico-list">
        {registros.map(r => (
          <div key={r.id} className="historico-card">
            <div className="historico-card__header">
              <div>
                <h3 className="font-bold" style={{ fontSize: '1rem' }}>{r.mes_referencia}</h3>
                <span className="text-muted text-xs">{r.count} itens</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {r.count > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => setDashRegistro(r)}>
                    <BarChart2 size={13} /> Dash
                  </Button>
                )}
                <div className={`historico-saldo-badge ${r.saldo >= 0 ? 'historico-saldo-badge--ok' : 'historico-saldo-badge--neg'}`}>
                  {r.saldo >= 0
                    ? <TrendingUp size={11} strokeWidth={2.5} />
                    : <TrendingDown size={11} strokeWidth={2.5} />}
                  {r.saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                </div>
              </div>
            </div>

            <div className="historico-card__metrics">
              <div className="historico-metric">
                <span className="historico-metric__label">Renda</span>
                <span className="historico-metric__value lime-text">{fmt(r.renda_mensal)}</span>
              </div>
              <div className="historico-metric">
                <span className="historico-metric__label">Comprometido</span>
                <span className="historico-metric__value text-danger">{fmt(r.totalGastos)}</span>
              </div>
              <div className="historico-metric">
                <span className="historico-metric__label">Pago</span>
                <span className="historico-metric__value" style={{ color: 'var(--sdd-positive)' }}>{fmt(r.totalPago)}</span>
              </div>
              <div className="historico-metric">
                <span className="historico-metric__label">Saldo</span>
                <span className="historico-metric__value" style={{ color: r.saldo >= 0 ? 'var(--sdd-positive)' : 'var(--sdd-negative)' }}>
                  {fmt(r.saldo)}
                </span>
              </div>
            </div>

            {r.count > 0 && (
              <>
                {/* Categorias do mês */}
                {(() => {
                  const cats = [...new Set(r.itens.map(i => i.categoria).filter(Boolean))];
                  return cats.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                      {cats.slice(0, 5).map(c => <CategoryBadge key={c} category={c} size="sm" />)}
                      {cats.length > 5 && (
                        <span className="text-xs text-muted" style={{ alignSelf: 'center' }}>+{cats.length - 5}</span>
                      )}
                    </div>
                  );
                })()}
                <div className="historico-card__bar-wrap">
                  <div className="historico-bar">
                    <div
                      className="historico-bar__fill"
                      style={{ width: `${Math.min(100, r.totalGastos > 0 ? (r.totalPago / r.totalGastos) * 100 : 0)}%` }}
                      title={`${Math.round(r.totalPago / (r.totalGastos || 1) * 100)}% pago`}
                    />
                  </div>
                  <span className="text-xs text-muted">
                    {r.itens.filter(i => i.pago).length}/{r.count} itens pagos
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
