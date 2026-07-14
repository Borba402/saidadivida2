import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer, Zap, Coffee } from 'lucide-react';
import { addXP, getLevelProgress, getTodaySessions, incrementSession } from '../services/xpService';

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;
const RADIUS = 82;
const CIRC = 2 * Math.PI * RADIUS;

export default function FocusTimer({ dividas = [], onXPGained }) {
  const [phase, setPhase] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_SEC);
  const [running, setRunning] = useState(false);
  const [focus, setFocus] = useState('');
  const [sessions, setSessions] = useState(() => getTodaySessions());
  const [popup, setPopup] = useState(null);
  const tickRef = useRef(null);

  const total = phase === 'focus' ? FOCUS_SEC : BREAK_SEC;
  const progress = (total - timeLeft) / total;
  const dashOffset = CIRC * (1 - progress);
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const handleComplete = useCallback(() => {
    clearInterval(tickRef.current);
    setRunning(false);

    if (phase === 'focus') {
      const gained = 100;
      const totalXP = addXP(gained);
      const count = incrementSession();
      setSessions(count);
      setPopup(gained);
      setTimeout(() => setPopup(null), 2800);
      onXPGained?.(gained, totalXP);
      setPhase('break');
      setTimeLeft(BREAK_SEC);
    } else {
      setPhase('focus');
      setTimeLeft(FOCUS_SEC);
    }
  }, [phase, onXPGained]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleComplete(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, handleComplete]);

  const reset = () => {
    clearInterval(tickRef.current);
    setRunning(false);
    setPhase('focus');
    setTimeLeft(FOCUS_SEC);
  };

  const switchPhase = (p) => {
    reset();
    setPhase(p);
    setTimeLeft(p === 'focus' ? FOCUS_SEC : BREAK_SEC);
  };

  const { level, percent: lvlPct } = getLevelProgress();
  const strokeColor = phase === 'focus' ? 'var(--sdd-accent)' : 'var(--sdd-positive)';

  return (
    <div className="timer-page">
      <div className="timer-card">
        {/* Header */}
        <div className="timer-card__header">
          <Timer size={20} className="lime-text" />
          <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Timer Foco</h2>
          <span className="badge-lime-sm">Pomodoro</span>
        </div>

        {/* Phase tabs */}
        <div className="phase-tabs">
          <button
            className={`phase-tab ${phase === 'focus' ? 'phase-tab--active' : ''}`}
            onClick={() => switchPhase('focus')}
          >
            <Timer size={14} /> Foco 25min
          </button>
          <button
            className={`phase-tab ${phase === 'break' ? 'phase-tab--active phase-tab--break' : ''}`}
            onClick={() => switchPhase('break')}
          >
            <Coffee size={14} /> Pausa 5min
          </button>
        </div>

        {/* Debt selector */}
        {dividas.length > 0 && (
          <div className="timer-select">
            <label className="input-label">Foco em qual dívida?</label>
            <select
              className="input-field"
              value={focus}
              onChange={e => setFocus(e.target.value)}
            >
              <option value="">— Selecionar —</option>
              {dividas.map(d => (
                <option key={d.id} value={d.id}>{d.descricao}</option>
              ))}
            </select>
          </div>
        )}

        {/* SVG ring timer */}
        <div className="timer-ring-wrap">
          {popup !== null && (
            <div className="xp-popup">
              <Zap size={14} /> +{popup} XP
            </div>
          )}
          <svg width="210" height="210" viewBox="0 0 210 210">
            <circle cx="105" cy="105" r={RADIUS} fill="none" stroke="var(--sdd-border)" strokeWidth="10" />
            <circle
              cx="105" cy="105" r={RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 105 105)"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
            />
            {/* Glow */}
            <circle
              cx="105" cy="105" r={RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeOpacity="0.15"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 105 105)"
              filter="url(#glow)"
            />
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <text x="105" y="98" textAnchor="middle" dominantBaseline="middle"
              fill="var(--sdd-text)" fontSize="36" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="-2">
              {mm}:{ss}
            </text>
            <text x="105" y="128" textAnchor="middle" dominantBaseline="middle"
              fill={strokeColor} fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="3">
              {phase === 'focus' ? 'FOCO' : 'PAUSA'}
            </text>
          </svg>
        </div>

        {/* Controls */}
        <div className="timer-controls">
          <button className="btn btn-outline-dark timer-control-btn" onClick={reset} title="Reiniciar">
            <RotateCcw size={18} />
          </button>
          <button
            className={`timer-main-btn ${running ? 'timer-main-btn--pause' : 'timer-main-btn--play'}`}
            onClick={() => setRunning(r => !r)}
          >
            {running ? <><Pause size={20} /> Pausar</> : <><Play size={20} /> Iniciar</>}
          </button>
        </div>

        {/* Stats row */}
        <div className="timer-stats">
          <div className="timer-stat">
            <span className="timer-stat__value lime-text">{sessions}</span>
            <span className="timer-stat__label">Sessões hoje</span>
          </div>
          <div className="timer-stat-divider" />
          <div className="timer-stat">
            <span className="timer-stat__value lime-text">{sessions * 100}</span>
            <span className="timer-stat__label">XP conquistado</span>
          </div>
          <div className="timer-stat-divider" />
          <div className="timer-stat">
            <span className="timer-stat__value lime-text">{level}</span>
            <span className="timer-stat__label">Nível atual</span>
          </div>
        </div>

        {/* Level progress mini bar */}
        <div className="timer-lvl-bar">
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>Progresso Nível {level}</span>
          <div className="xp-track" style={{ flex: 1 }}>
            <div className="xp-fill" style={{ width: `${Math.round(lvlPct * 100)}%` }} />
          </div>
          <span className="lime-text" style={{ fontSize: '0.7rem', fontWeight: 600 }}>{Math.round(lvlPct * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
