import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, RefreshCw, Unlink } from 'lucide-react';
import { getTelegramLink, generateLinkToken, unlinkTelegram } from '../services/telegramService';

const BOT_USERNAME = 'saidadivida_bot';

export default function TelegramConnect({ userId, onClose }) {
  const [linked, setLinked] = useState(null);   // null = carregando
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTelegramLink(userId).then(setLinked);
  }, [userId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const t = await generateLinkToken(userId);
      setToken(t);
    } catch (e) {
      alert('Erro ao gerar código: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlink = async () => {
    if (!window.confirm('Desvinculado o Telegram? Você não receberá mais os registros pelo bot.')) return;
    setLoading(true);
    await unlinkTelegram(userId);
    setLinked(null);
    setToken('');
    setLoading(false);
  };

  const openBot = () => {
    const url = token
      ? `https://t.me/${BOT_USERNAME}?start=${token}`
      : `https://t.me/${BOT_USERNAME}`;
    window.open(url, '_blank');
  };

  return (
    <div className="dash-overlay" onClick={onClose}>
      <div className="dash-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>

        <div className="dash-modal__header">
          <div>
            <span className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Integração</span>
            <h2 className="font-bold" style={{ fontSize: '1.1rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} style={{ color: '#229ED9' }} /> Telegram Bot
            </h2>
          </div>
          <button className="btn-icon-plain" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Status */}
        {linked ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <p style={{ color: '#22c55e', fontWeight: 700, marginBottom: '0.25rem' }}>✅ Conectado</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              @{linked.telegram_username || 'usuário'} · vinculado em {new Date(linked.linked_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ) : (
          <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <p style={{ color: '#f97316', fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ Não conectado</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Vincule sua conta para registrar gastos pelo Telegram.</p>
          </div>
        )}

        {/* Como usar */}
        <div className="dash-section">
          <h3 className="dash-section__title">O que você pode fazer</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['💸', 'gastei 50 no mercado', 'Registra gasto'],
              ['💸', 'paguei 1500 de aluguel', 'Registra com categoria'],
              ['/saldo', '', 'Ver resumo do mês'],
              ['/contas', '', 'Listar contas pendentes'],
            ].map(([cmd, ex, desc]) => (
              <div key={cmd} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                <code style={{ background: 'var(--bg-elevated)', padding: '0.2rem 0.5rem', borderRadius: 4, fontFamily: 'monospace', color: 'var(--lime)', flexShrink: 0 }}>
                  {cmd}
                </code>
                {ex && <span className="text-muted">{ex}</span>}
                <span className="text-muted" style={{ marginLeft: 'auto', flexShrink: 0 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        {linked ? (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={openBot}>
              <Send size={15} /> Abrir Bot
            </button>
            <button className="btn btn-outline" onClick={handleUnlink} disabled={loading}>
              <Unlink size={15} /> Desvincular
            </button>
          </div>
        ) : (
          <>
            {!token ? (
              <button className="btn btn-primary w-full" style={{ width: '100%' }} onClick={handleGenerate} disabled={loading}>
                {loading ? 'Gerando...' : '🔗 Gerar código de vinculação'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem' }} className="text-muted">
                  Seu código (válido por 10 min):
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--lime)', textAlign: 'center' }}>
                    {token}
                  </div>
                  <button className="btn btn-outline" onClick={handleCopy} title="Copiar código">
                    {copied ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={openBot}>
                    <Send size={15} /> Abrir Bot e vincular
                  </button>
                  <button className="btn btn-outline" onClick={handleGenerate} title="Gerar novo código">
                    <RefreshCw size={15} />
                  </button>
                </div>
                <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                  O bot vai abrir com o código preenchido automaticamente.
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
