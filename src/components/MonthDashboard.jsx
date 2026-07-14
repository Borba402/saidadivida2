import React from 'react';
import { X, TrendingDown, DollarSign, CheckCircle2, Wallet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { getCategory } from '../lib/categories';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const pct = (v) => `${Math.round(v)}%`;

function ProgressRing({ percent, size = 120 }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 100) / 100);
  const color = percent >= 100 ? 'var(--sdd-accent)' : percent >= 50 ? 'var(--sdd-pending)' : 'var(--sdd-negative)';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
      <div style={{ color: payload[0].fill }}>{fmt(payload[0].value)}</div>
    </div>
  );
};

export default function MonthDashboard({ registro, onClose }) {
  if (!registro) return null;

  const { mes_referencia, renda_mensal, totalGastos, totalPago, saldo, itens } = registro;
  const percent = totalGastos > 0 ? (totalPago / totalGastos) * 100 : 0;
  const pagas = itens.filter(i => i.pago);
  const pendentes = itens.filter(i => !i.pago);

  // Agrupa por categoria
  const catMap = {};
  itens.forEach(i => {
    catMap[i.categoria] = (catMap[i.categoria] || 0) + Number(i.valor);
  });
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="dash-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dash-modal__header">
          <div>
            <span className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dashboard</span>
            <h2 className="font-bold" style={{ fontSize: '1.2rem', marginTop: 2 }}>{mes_referencia}</h2>
          </div>
          <button className="btn-icon-plain" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Anel de progresso */}
        <div className="dash-ring-block">
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProgressRing percent={percent} size={130} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="font-bold" style={{ fontSize: '1.4rem', lineHeight: 1 }}>{pct(percent)}</div>
              <div className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>pago</div>
            </div>
          </div>
          <div className="dash-ring-text">
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Já pago <span style={{ color: 'var(--sdd-accent)' }}>{fmt(totalPago)}</span> de <span style={{ color: 'var(--sdd-negative)' }}>{fmt(totalGastos)}</span>
            </p>
            {totalGastos - totalPago > 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Restaram <em style={{ fontStyle: 'normal', color: 'var(--sdd-pending)', fontWeight: 700 }}>{fmt(totalGastos - totalPago)}</em> sem quitar
              </p>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="dash-metrics">
          <div className="dash-metric">
            <Wallet size={14} className="lime-text" />
            <span className="dash-metric__label">Renda</span>
            <span className="dash-metric__value lime-text">{fmt(renda_mensal)}</span>
          </div>
          <div className="dash-metric">
            <TrendingDown size={14} className="text-danger" />
            <span className="dash-metric__label">Comprometido</span>
            <span className="dash-metric__value text-danger">{fmt(totalGastos)}</span>
          </div>
          <div className="dash-metric">
            <CheckCircle2 size={14} style={{ color: 'var(--sdd-positive)' }} />
            <span className="dash-metric__label">Pago</span>
            <span className="dash-metric__value" style={{ color: 'var(--sdd-positive)' }}>{fmt(totalPago)}</span>
          </div>
          <div className="dash-metric">
            <DollarSign size={14} className={saldo >= 0 ? 'lime-text' : 'text-danger'} />
            <span className="dash-metric__label">Saldo</span>
            <span className={`dash-metric__value ${saldo >= 0 ? 'lime-text' : 'text-danger'}`}>{fmt(saldo)}</span>
          </div>
        </div>

        {/* Gráfico por categoria */}
        {catData.length > 0 && (
          <div className="dash-section">
            <h3 className="dash-section__title">Gastos por categoria</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {catData.map((entry) => (
                    <Cell key={entry.name} fill={getCategory(entry.name).color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Itens pagos / pendentes */}
        <div className="dash-section">
          <h3 className="dash-section__title">
            Itens pagos <span style={{ color: 'var(--sdd-positive)' }}>({pagas.length})</span>
            {pendentes.length > 0 && <> · Pendentes <span style={{ color: 'var(--sdd-pending)' }}>({pendentes.length})</span></>}
          </h3>
          <div className="dash-items-list">
            {[...pagas, ...pendentes].map(item => (
              <div key={item.id} className={`dash-item ${item.pago ? 'dash-item--pago' : 'dash-item--pendente'}`}>
                <span className="dash-item__name">{item.nome_item}</span>
                <span className="dash-item__valor">{fmt(item.valor)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
