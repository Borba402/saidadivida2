import React, { useState } from 'react';
import {
  Wallet, Home, Clock, LayoutDashboard, TrendingUp, Timer,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Zap
} from 'lucide-react';
import { getLevelProgress } from '../services/xpService';

const NAV_ITEMS = [
  { id: 'home',      icon: Home,            label: 'Início' },
  { id: 'history',   icon: Clock,           label: 'Histórico' },
  { id: 'kanban',    icon: LayoutDashboard, label: 'Kanban' },
  { id: 'analytics', icon: TrendingUp,      label: 'Analytics' },
  { id: 'timer',     icon: Timer,           label: 'Foco' },
];

export default function Sidebar({ currentView, onNavigate, onLogout, xpData }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { xp, level, levelXP, neededXP, percent } = xpData || getLevelProgress();

  const handleNav = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="lime-text" />
          <span className="font-bold text-sm">SaiDaDívida</span>
        </div>
        <button className="btn-icon-plain" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop + Mobile drawer sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <Wallet size={22} className="lime-text" style={{ flexShrink: 0 }} />
          {!collapsed && <span className="font-bold" style={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}>SaiDaDívida</span>}
        </div>

        {/* Desktop collapse toggle */}
        <button className="sidebar__collapse-btn" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`sidebar__item ${currentView === id ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav(id)}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* XP / Level block */}
        <div className="sidebar__xp">
          {collapsed ? (
            <div className="sidebar__xp-pill" title={`Nível ${level} — ${xp} XP`}>
              <Zap size={14} className="lime-text" />
              <span className="lime-text font-bold" style={{ fontSize: '0.75rem' }}>{level}</span>
            </div>
          ) : (
            <div className="sidebar__xp-full">
              <div className="sidebar__xp-row">
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>NÍVEL {level}</span>
                <span className="lime-text font-bold" style={{ fontSize: '0.7rem' }}>{xp} XP</span>
              </div>
              <div className="xp-track">
                <div className="xp-fill" style={{ width: `${Math.round(percent * 100)}%` }} />
              </div>
              <span className="text-muted" style={{ fontSize: '0.65rem' }}>{levelXP}/{neededXP} para o próximo nível</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="sidebar__logout" onClick={onLogout} title={collapsed ? 'Sair' : undefined}>
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sair</span>}
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`mobile-nav-btn ${currentView === id ? 'mobile-nav-btn--active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
