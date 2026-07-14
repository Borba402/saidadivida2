import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { listCompromissos, listItens, getMesAtual } from '../services/compromissoService';
import { getCategory } from '../lib/categories';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtK = (v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`;

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="chart-tooltip__value">
          {p.name}: {String(p.value).startsWith('-') || typeof p.value === 'number' && p.name.toLowerCase().includes('saldo')
            ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};


export default function AnalyticsTab({ userId }) {
  const [compromissos, setCompromissos] = useState([]);
  const [allItens, setAllItens] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cs = await listCompromissos(userId);
      setCompromissos(cs);
      const allI = await Promise.all(cs.map(c => listItens(c.id)));
      setAllItens(allI.flat());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const mesAtual = getMesAtual();
  const compromissoAtual = compromissos.find(c => c.mes_referencia === mesAtual);
  const itensAtuais = allItens.filter(i => {
    const compAtual = compromissos.find(c => c.mes_referencia === mesAtual);
    return compAtual && i.compromisso_id === compAtual.id;
  });

  const totalComprometidoAtual = itensAtuais.reduce((s, i) => s + Number(i.valor), 0);
  const rendaAtual = Number(compromissoAtual?.renda_mensal ?? 0);
  const saldoAtual = rendaAtual - totalComprometidoAtual;
  const totalPagoAtual = itensAtuais.reduce((s, i) => s + (i.pago ? Number(i.valor) : 0), 0);

  // Projection: sort months and compute saldo per month
  const balanceData = useMemo(() => {
    const sorted = [...compromissos].sort((a, b) => {
      const parseRef = (m) => {
        const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const [mes, ano] = m.mes_referencia.split('/');
        return new Date(Number(ano), MESES.indexOf(mes), 1);
      };
      return parseRef(a) - parseRef(b);
    });

    return sorted.map(c => {
      const itens = allItens.filter(i => i.compromisso_id === c.id);
      const total = itens.reduce((s, i) => s + Number(i.valor), 0);
      const saldo = Number(c.renda_mensal) - total;
      const [mes] = c.mes_referencia.split('/');
      const abrev = mes.slice(0, 3);
      return { mes: abrev, saldo: Math.round(saldo), comprometido: Math.round(total), renda: Math.round(c.renda_mensal) };
    }).filter(d => d.renda > 0 || d.comprometido > 0);
  }, [compromissos, allItens]);

  // Category breakdown for current month
  const catData = useMemo(() => {
    const map = {};
    itensAtuais.forEach(i => {
      map[i.categoria] = (map[i.categoria] || 0) + Number(i.valor);
    });
    return Object.entries(map)
      .map(([cat, valor]) => ({ cat, valor: Math.round(valor) }))
      .sort((a, b) => b.valor - a.valor);
  }, [itensAtuais]);

  return (
    <div className="analytics-page">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <TrendingUp size={20} className="lime-text" />
        <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Analytics</h2>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpis">
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: saldoAtual >= 0 ? 'var(--lime-dim)' : 'var(--danger-light)' }}>
            <DollarSign size={20} style={{ color: saldoAtual >= 0 ? 'var(--sdd-accent)' : 'var(--sdd-negative)' }} />
          </div>
          <div>
            <p className="kpi-card__label">Saldo do Mês</p>
            <p className="kpi-card__value" style={{ color: saldoAtual >= 0 ? 'var(--sdd-accent)' : 'var(--sdd-negative)' }}>{fmt(saldoAtual)}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <TrendingUp size={20} style={{ color: 'var(--sdd-warning)' }} />
          </div>
          <div>
            <p className="kpi-card__label">Comprometido</p>
            <p className="kpi-card__value" style={{ color: 'var(--sdd-warning)' }}>{fmt(totalComprometidoAtual)}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--sdd-positive)' }} />
          </div>
          <div>
            <p className="kpi-card__label">Pago no Mês</p>
            <p className="kpi-card__value" style={{ color: 'var(--sdd-positive)' }}>{fmt(totalPagoAtual)}</p>
          </div>
        </div>
      </div>

      {/* Saldo por mês */}
      <div className="analytics-card">
        <div className="analytics-card__title">
          <TrendingUp size={16} className="lime-text" /> Saldo por Mês
        </div>
        {balanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={balanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sdd-border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'var(--sdd-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--sdd-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={55} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="saldo" stroke="var(--sdd-accent)" strokeWidth={2.5} fill="url(#limeGrad)" dot={false} name="Saldo" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">Nenhum dado com renda cadastrada.</div>
        )}
      </div>

      {/* Category breakdown */}
      {catData.length > 0 && (
        <div className="analytics-card">
          <div className="analytics-card__title">
            <PieChart size={16} className="lime-text" /> Gastos por Categoria — {mesAtual}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sdd-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--sdd-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <YAxis dataKey="cat" type="category" tick={{ fill: 'var(--sdd-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {catData.map((entry, i) => (
                  <Cell key={i} fill={getCategory(entry.cat).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comprometido vs Renda per month */}
      {balanceData.length > 0 && (
        <div className="analytics-card">
          <div className="analytics-card__title">
            <DollarSign size={16} className="lime-text" /> Renda vs. Comprometido por Mês
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={balanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sdd-border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'var(--sdd-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--sdd-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={55} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ color: 'var(--sdd-text-dim)', fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="renda" name="Renda" fill="var(--sdd-accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="comprometido" name="Comprometido" fill="var(--sdd-warning)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
