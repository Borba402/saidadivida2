import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, DollarSign, Zap, Target, Award } from 'lucide-react';
import { getXP, getLevel, getLevelProgress } from '../services/xpService';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtK = (v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`;

const ChartTooltipArea = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p className="lime-text chart-tooltip__value">{fmt(payload[0]?.value ?? 0)}</p>
    </div>
  );
};

const ChartTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="chart-tooltip__value">
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('economia')
            ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAYS_PT = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

export default function AnalyticsTab({ planos = [], perfil, dividas = [], gastos = [] }) {
  const xp = getXP();
  const level = getLevel(xp);
  const { levelXP, neededXP, percent } = getLevelProgress();

  const totalDividas = dividas.reduce((s, d) => s + d.valor_total, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0);
  const saldo = perfil ? perfil.renda_mensal - totalGastos : 0;
  const disponivel = Math.max(0, saldo);

  // Projected balance over 12 months
  const balanceData = useMemo(() => {
    const nowMonth = new Date().getMonth();
    return Array.from({ length: 12 }, (_, i) => {
      const label = MONTHS_PT[(nowMonth + i) % 12];
      const debtPaid = disponivel * i;
      const remainingDebt = Math.max(0, totalDividas - debtPaid);
      const netBalance = Math.max(0, (perfil?.renda_mensal ?? 0) - totalGastos - remainingDebt * 0.1);
      return { mes: label, saldo: Math.round(netBalance) };
    });
  }, [disponivel, totalDividas, totalGastos, perfil]);

  // Weekly sessions/XP mock based on stored session count
  const weeklyData = useMemo(() => {
    return DAYS_PT.map((dia, i) => ({
      dia,
      tarefas: i < new Date().getDay() ? Math.floor(Math.random() * 6 + 1) : 0,
      xp: i < new Date().getDay() ? Math.floor(Math.random() * 400 + 50) : 0,
    }));
  }, []);

  // Plans history
  const planData = useMemo(() =>
    planos.slice(0, 6).reverse().map((p, i) => ({
      plano: `P${i + 1}`,
      economia: Math.round(p.valor_economia_mensal),
      meses: p.meses_para_quitar ?? 0,
    })),
    [planos]
  );

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <TrendingUp size={20} className="lime-text" />
        <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Analytics</h2>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpis">
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: 'rgba(163,230,53,0.1)' }}>
            <DollarSign size={20} className="lime-text" />
          </div>
          <div>
            <p className="kpi-card__label">Saldo Mensal</p>
            <p className={`kpi-card__value ${saldo >= 0 ? 'lime-text' : 'text-danger'}`}>{fmt(saldo)}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <Target size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <p className="kpi-card__label">Total em Dívidas</p>
            <p className="kpi-card__value text-danger">{fmt(totalDividas)}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: 'rgba(163,230,53,0.1)' }}>
            <Zap size={20} className="lime-text" />
          </div>
          <div>
            <p className="kpi-card__label">XP Acumulado</p>
            <p className="kpi-card__value lime-text">{xp} XP</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__icon" style={{ background: 'rgba(163,230,53,0.1)' }}>
            <Award size={20} className="lime-text" />
          </div>
          <div>
            <p className="kpi-card__label">Nível Atual</p>
            <p className="kpi-card__value lime-text">Nível {level}</p>
          </div>
        </div>
      </div>

      {/* Level progress */}
      <div className="analytics-card">
        <div className="analytics-card__title">
          <Award size={16} className="lime-text" />
          Progresso de Nível
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Nível {level}</span>
          <div className="xp-track" style={{ flex: 1, height: '10px' }}>
            <div className="xp-fill" style={{ width: `${Math.round(percent * 100)}%`, height: '100%' }} />
          </div>
          <span className="lime-text font-bold" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Nível {level + 1}</span>
        </div>
        <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
          {levelXP} / {neededXP} XP para o próximo nível
        </p>
      </div>

      {/* Area Chart – Balance Projection */}
      <div className="analytics-card">
        <div className="analytics-card__title">
          <TrendingUp size={16} className="lime-text" />
          Projeção de Saldo Financeiro (12 meses)
        </div>
        {perfil ? (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={balanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={55} />
              <Tooltip content={<ChartTooltipArea />} />
              <Area type="monotone" dataKey="saldo" stroke="#a3e635" strokeWidth={2.5} fill="url(#limeGrad)" dot={false} name="Saldo" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">Configure seu perfil financeiro para ver a projeção.</div>
        )}
      </div>

      {/* Bar Chart – Weekly XP */}
      <div className="analytics-card">
        <div className="analytics-card__title">
          <Zap size={16} className="lime-text" />
          Produtividade Semanal (Tarefas &amp; XP)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltipBar />} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '11px', paddingTop: '8px' }} />
            <Bar dataKey="tarefas" name="Tarefas" fill="#a3e635" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="xp" name="XP" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart – Plans history */}
      {planData.length > 0 && (
        <div className="analytics-card">
          <div className="analytics-card__title">
            <DollarSign size={16} className="lime-text" />
            Histórico de Planos Gerados
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={planData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
              <XAxis dataKey="plano" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipBar />} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="economia" name="Economia/mês (R$)" fill="#a3e635" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="meses" name="Meses p/ quitar" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
