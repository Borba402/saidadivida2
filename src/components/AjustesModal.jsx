import React from 'react';
import { X, Bell, BellOff, Send } from 'lucide-react';
import Button from './ui/Button';
import { isPushSupported } from '../services/notificationService';

export default function AjustesModal({
  open, onClose,
  notifEnabled, notifLoading, onToggleNotif,
  onTelegram,
}) {
  if (!open) return null;

  return (
    <div
      className="item-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="item-modal" style={{ maxWidth: 400 }}>
        <div className="item-modal__header">
          <h2>Ajustes</h2>
          <Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="item-modal__body" style={{ gap: '1.25rem' }}>

          {/* Notificações */}
          {isPushSupported() && (
            <div className="ajustes-section">
              <p className="ajustes-section__title">Notificações</p>
              <div className="ajustes-row">
                <div className="ajustes-row__info">
                  {notifEnabled
                    ? <Bell size={15} style={{ color: 'var(--sdd-accent-strong)' }} />
                    : <BellOff size={15} />}
                  <span>{notifEnabled ? 'Push ativado' : 'Push desativado'}</span>
                </div>
                <label className="recurring-toggle"
                  aria-label={notifEnabled ? 'Desativar notificações' : 'Ativar notificações'}
                  style={{ opacity: notifLoading ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    checked={notifEnabled}
                    onChange={notifLoading ? undefined : onToggleNotif}
                    disabled={notifLoading}
                  />
                  <span className="recurring-toggle__slider" />
                </label>
              </div>
            </div>
          )}

          {/* Integrações */}
          <div className="ajustes-section">
            <p className="ajustes-section__title">Integrações</p>
            <div className="ajustes-row">
              <div className="ajustes-row__info">
                <Send size={15} />
                <span>Telegram Bot</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { onTelegram(); onClose(); }}>
                Configurar
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
