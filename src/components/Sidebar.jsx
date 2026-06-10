import React, { useState, useEffect } from 'react';
import {
  Wallet, Home, Clock, TrendingUp,
  LogOut, ChevronLeft, ChevronRight, Menu, X, CheckSquare,
  Bell, BellOff, Sun, Moon, Download, Send
} from 'lucide-react';
import { isPushSupported, isSubscribed, subscribe, unsubscribe } from '../services/notificationService';

const NAV_ITEMS = [
  { id: 'home',      icon: Home,        label: 'Início' },
  { id: 'history',   icon: Clock,       label: 'Histórico' },
  { id: 'analytics', icon: TrendingUp,  label: 'Analytics' },
  { id: 'tasks',     icon: CheckSquare, label: 'Tarefas' },
];

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('theme-light', saved === 'light');
  return saved;
}

export default function Sidebar({ currentView, onNavigate, onLogout, userId, onTelegram }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [theme, setTheme] = useState(initTheme);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (isPushSupported()) isSubscribed().then(setNotifEnabled);
  }, []);

  // Captura o prompt de instalação PWA (Android/Chrome)
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

    // Detecta iOS fora do modo standalone
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (ios && !standalone) setIsIOS(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('theme-light', next === 'light');
  };

  const handleInstall = async () => {
    if (isIOS) { setShowIOSTip(v => !v); return; }
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleToggleNotif = async () => {
    if (!userId) return;
    setNotifLoading(true);
    try {
      if (notifEnabled) {
        await unsubscribe(userId);
        setNotifEnabled(false);
      } else {
        await subscribe(userId);
        setNotifEnabled(true);
      }
    } catch (e) {
      alert(e.message || 'Erro ao configurar notificações');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNav = (id) => { onNavigate(id); setMobileOpen(false); };

  const showInstallBtn = installPrompt || isIOS;

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="lime-text" />
          <span className="font-bold text-sm">SaiDaDívida</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-icon-plain" onClick={handleToggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-icon-plain" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* iOS install tip */}
      {showIOSTip && (
        <div className="ios-install-tip" onClick={() => setShowIOSTip(false)}>
          <p>Toque em <strong>Compartilhar</strong> <span style={{ fontSize: '1.1em' }}>⎙</span> e depois em <strong>"Adicionar à Tela de Início"</strong></p>
          <span className="ios-install-tip__close">Fechar ✕</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__logo">
          <Wallet size={22} className="lime-text" style={{ flexShrink: 0 }} />
          {!collapsed && <span className="font-bold" style={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}>SaiDaDívida</span>}
        </div>

        <button className="sidebar__collapse-btn" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              role="button"
              tabIndex={0}
              data-label={collapsed ? '' : label}
              className={`sidebar__item ${currentView === id ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav(id)}
              onKeyDown={e => e.key === 'Enter' && handleNav(id)}
              title={label}
              aria-label={label}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
            </div>
          ))}
        </nav>

        {/* Telegram */}
        <div
          role="button"
          tabIndex={0}
          data-label={collapsed ? '' : 'Telegram Bot'}
          className="sidebar__logout"
          onClick={onTelegram}
          onKeyDown={e => e.key === 'Enter' && onTelegram()}
          title="Conectar Telegram"
          aria-label="Conectar Telegram"
          style={{ color: '#229ED9' }}
        >
          <Send size={18} style={{ flexShrink: 0 }} />
        </div>

        {/* Instalar App */}
        {showInstallBtn && (
          <div
            role="button"
            tabIndex={0}
            data-label={collapsed ? '' : 'Instalar App'}
            className="sidebar__logout"
            onClick={handleInstall}
            onKeyDown={e => e.key === 'Enter' && handleInstall()}
            title="Instalar App"
            aria-label="Instalar App"
            style={{ color: 'var(--lime)' }}
          >
            <Download size={18} style={{ flexShrink: 0 }} />
          </div>
        )}

        {/* Tema claro/escuro */}
        <div
          role="button"
          tabIndex={0}
          data-label={collapsed ? '' : (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro')}
          className="sidebar__logout"
          onClick={handleToggleTheme}
          onKeyDown={e => e.key === 'Enter' && handleToggleTheme()}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          aria-label="Alternar tema"
        >
          {theme === 'dark'
            ? <Sun size={18} style={{ flexShrink: 0 }} />
            : <Moon size={18} style={{ flexShrink: 0 }} />}
        </div>

        {/* Notificações */}
        {isPushSupported() && (
          <div
            role="button"
            tabIndex={0}
            data-label={collapsed ? '' : (notifEnabled ? 'Notificações On' : 'Notificações Off')}
            className={`sidebar__logout ${notifEnabled ? 'sidebar__notif--on' : ''}`}
            onClick={notifLoading ? undefined : handleToggleNotif}
            onKeyDown={e => e.key === 'Enter' && !notifLoading && handleToggleNotif()}
            title={notifEnabled ? 'Desativar notificações' : 'Ativar notificações'}
            aria-label={notifEnabled ? 'Desativar notificações' : 'Ativar notificações'}
            style={{ opacity: notifLoading ? 0.5 : 1, cursor: notifLoading ? 'wait' : 'pointer' }}
          >
            {notifEnabled
              ? <Bell size={18} style={{ flexShrink: 0, color: '#a3e635' }} />
              : <BellOff size={18} style={{ flexShrink: 0 }} />}
          </div>
        )}

        {/* Logout */}
        <div
          role="button"
          tabIndex={0}
          data-label={collapsed ? '' : 'Sair'}
          className="sidebar__logout"
          onClick={onLogout}
          onKeyDown={e => e.key === 'Enter' && onLogout()}
          title="Sair"
          aria-label="Sair"
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
        </div>
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
        <button
          className="mobile-nav-btn"
          onClick={onTelegram}
          style={{ color: '#229ED9' }}
        >
          <Send size={20} />
          <span>Bot</span>
        </button>
      </nav>
    </>
  );
}
