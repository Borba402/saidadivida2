import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, Home, Clock, TrendingUp, CheckSquare,
  LogOut, ChevronLeft, ChevronRight, Plus,
  Settings, HelpCircle, MoreHorizontal, Download,
} from 'lucide-react';
import { isPushSupported, isSubscribed, subscribe, unsubscribe } from '../services/notificationService';
import AjustesModal from './AjustesModal';

const NAV_ITEMS = [
  { id: 'home',      icon: Home,        label: 'Início' },
  { id: 'history',   icon: Clock,       label: 'Histórico' },
  { id: 'analytics', icon: TrendingUp,  label: 'Analytics' },
  { id: 'tasks',     icon: CheckSquare, label: 'Tarefas' },
];

const TAB_ITEMS = [
  { id: 'home',      icon: Home,        label: 'Início' },
  { id: 'history',   icon: Clock,       label: 'Histórico' },
  null, // central + button placeholder
  { id: 'analytics', icon: TrendingUp,  label: 'Analytics' },
  { id: 'tasks',     icon: CheckSquare, label: 'Tarefas' },
];

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('theme-light', saved === 'light');
  return saved;
}

function getInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || '';
  return name.charAt(0).toUpperCase() || '?';
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Usuário'
  );
}

function SidebarNavItem({ id, icon: Icon, label, active, onClick, collapsed }) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-tour={`nav-${id}`}
      data-tooltip={collapsed ? label : undefined}
      className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
      onClick={() => onClick(id)}
      onKeyDown={e => e.key === 'Enter' && onClick(id)}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span className="sidebar__item-label">{label}</span>}
    </div>
  );
}

export default function Sidebar({
  currentView, onNavigate, onLogout, userId, user,
  onTelegram, onShowTour, onNewItem,
}) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sdd-sidebar-collapsed') === '1',
  );
  const [notifEnabled, setNotifEnabled]   = useState(false);
  const [notifLoading, setNotifLoading]   = useState(false);
  const [theme, setTheme]                 = useState(initTheme);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS]                 = useState(false);
  const [showIOSTip, setShowIOSTip]       = useState(false);
  const [ajustesOpen, setAjustesOpen]     = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const profileRef = useRef(null);

  // Notif init
  useEffect(() => {
    if (isPushSupported()) isSubscribed().then(setNotifEnabled);
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (ios && !standalone) setIsIOS(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [profileMenuOpen]);

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

  const handleNav = (id) => { onNavigate(id); setMobileSheetOpen(false); };

  const toggleCollapsed = () => {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('sdd-sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  };

  const showInstallBtn = installPrompt || isIOS;
  const initial       = getInitial(user);
  const nome          = getDisplayName(user);

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="mobile-topbar">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="lime-text" />
          <span className="font-bold text-sm">SaiDaDívida</span>
        </div>
        <button
          className="mobile-topbar__avatar"
          onClick={() => setMobileSheetOpen(true)}
          aria-label="Perfil e ajustes"
        >
          {initial}
        </button>
      </header>

      {/* ── iOS install tip ── */}
      {showIOSTip && (
        <div className="ios-install-tip" onClick={() => setShowIOSTip(false)}>
          <p>Toque em <strong>Compartilhar</strong> <span style={{ fontSize: '1.1em' }}>⎙</span> e depois em <strong>"Adicionar à Tela de Início"</strong></p>
          <span className="ios-install-tip__close">Fechar ✕</span>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <Wallet size={20} className="lime-text" style={{ flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: '0.92rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              SaiDaDívida
            </span>
          )}
          <button
            className="sidebar__collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(item => (
            <SidebarNavItem
              key={item.id}
              {...item}
              active={currentView === item.id}
              onClick={handleNav}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          {/* Ajustes */}
          <div
            role="button"
            tabIndex={0}
            data-tour="nav-ajustes"
            data-tooltip={collapsed ? 'Ajustes' : undefined}
            className="sidebar__footer-item"
            onClick={() => setAjustesOpen(true)}
            onKeyDown={e => e.key === 'Enter' && setAjustesOpen(true)}
            aria-label="Ajustes"
          >
            <Settings size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span className="sidebar__item-label">Ajustes</span>}
          </div>

          {/* Ajuda */}
          <div
            role="button"
            tabIndex={0}
            data-tooltip={collapsed ? 'Ajuda' : undefined}
            className="sidebar__footer-item"
            onClick={onShowTour}
            onKeyDown={e => e.key === 'Enter' && onShowTour()}
            aria-label="Ajuda / Tutorial"
          >
            <HelpCircle size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span className="sidebar__item-label">Ajuda</span>}
          </div>

          {/* Instalar (optional) */}
          {showInstallBtn && (
            <div
              role="button"
              tabIndex={0}
              data-tooltip={collapsed ? 'Instalar App' : undefined}
              className="sidebar__footer-item"
              onClick={handleInstall}
              onKeyDown={e => e.key === 'Enter' && handleInstall()}
              aria-label="Instalar App"
              style={{ color: 'var(--lime)' }}
            >
              <Download size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="sidebar__item-label">Instalar App</span>}
            </div>
          )}

          <div className="sidebar__divider" />

          {/* Profile card */}
          <div className="sidebar__profile" ref={profileRef}>
            <button
              className="sidebar__avatar"
              onClick={() => setProfileMenuOpen(v => !v)}
              aria-label="Opções de perfil"
              aria-expanded={profileMenuOpen}
            >
              {initial}
            </button>

            {!collapsed && (
              <>
                <div className="sidebar__profile-text">
                  <span className="sidebar__profile-name">{nome}</span>
                  <span className="sidebar__profile-sub">Ver perfil</span>
                </div>
                <button
                  className="sidebar__profile-more"
                  onClick={() => setProfileMenuOpen(v => !v)}
                  aria-label="Mais opções"
                  aria-expanded={profileMenuOpen}
                >
                  <MoreHorizontal size={14} />
                </button>
              </>
            )}

            {profileMenuOpen && (
              <div className="sidebar__profile-dropdown">
                <button
                  className="sidebar__profile-dropdown-item sidebar__profile-dropdown-item--danger"
                  onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                >
                  <LogOut size={14} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile tab bar ── */}
      <nav className="tab-bar" aria-label="Navegação">
        {TAB_ITEMS.map((item, i) => {
          if (!item) {
            return (
              <button
                key="plus"
                className="tab-bar__plus"
                onClick={onNewItem}
                aria-label="Novo item"
              >
                <Plus size={22} />
              </button>
            );
          }
          const { id, icon: Icon, label } = item;
          return (
            <button
              key={id}
              data-tour={`nav-${id}`}
              className={`tab-bar__item${currentView === id ? ' tab-bar__item--active' : ''}`}
              onClick={() => handleNav(id)}
              aria-label={label}
              aria-current={currentView === id ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="tab-bar__item-label">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Mobile sheet ── */}
      {mobileSheetOpen && (
        <div className="mobile-sheet-overlay" onClick={() => setMobileSheetOpen(false)}>
          <div className="mobile-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-sheet__header">
              <div className="sidebar__avatar mobile-sheet__avatar">{initial}</div>
              <div>
                <div className="mobile-sheet__name">{nome}</div>
                <div className="sidebar__profile-sub">{user?.email || ''}</div>
              </div>
            </div>

            <div className="mobile-sheet__divider" />

            <button className="mobile-sheet__item" onClick={() => { setMobileSheetOpen(false); setAjustesOpen(true); }}>
              <Settings size={17} />
              <span>Ajustes</span>
            </button>

            <button className="mobile-sheet__item" onClick={() => { setMobileSheetOpen(false); onShowTour(); }}>
              <HelpCircle size={17} />
              <span>Ajuda / Tutorial</span>
            </button>

            {showInstallBtn && (
              <button className="mobile-sheet__item" onClick={() => { setMobileSheetOpen(false); handleInstall(); }}>
                <Download size={17} />
                <span>Instalar App</span>
              </button>
            )}

            <div className="mobile-sheet__divider" />

            <button
              className="mobile-sheet__item mobile-sheet__item--danger"
              onClick={() => { setMobileSheetOpen(false); onLogout(); }}
            >
              <LogOut size={17} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Ajustes modal ── */}
      <AjustesModal
        open={ajustesOpen}
        onClose={() => setAjustesOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notifEnabled={notifEnabled}
        notifLoading={notifLoading}
        onToggleNotif={handleToggleNotif}
        onTelegram={onTelegram}
      />
    </>
  );
}
