import React, { useState } from 'react';
import { Wallet, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp, signInWithGoogle } from '../services/authService';

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        await signUp(email.trim(), password);
        setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      const msg = err?.message || '';
      if (!msg || msg === '{}' || msg === '[]') {
        setError(mode === 'register'
          ? 'Não foi possível criar a conta. Este e-mail pode já estar cadastrado.'
          : 'Erro ao entrar. Verifique e-mail e senha.');
      } else if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
      } else if (msg.includes('Password should be')) {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError('Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Falha com Google. Certifique-se de que o provider está ativo no Supabase.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <Wallet size={34} className="lime-text" />
          <h1 className="font-bold" style={{ fontSize: '1.7rem', letterSpacing: '-0.03em' }}>
            SaiDaDívida
          </h1>
        </div>
        <p className="text-muted text-sm text-center mb-6" style={{ lineHeight: 1.65 }}>
          Controle seus compromissos financeiros mês a mês.
        </p>

        {/* Mode toggle */}
        <div className="login-mode-toggle">
          <button
            className={`login-mode-btn ${mode === 'login' ? 'login-mode-btn--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            <LogIn size={14} /> Entrar
          </button>
          <button
            className={`login-mode-btn ${mode === 'register' ? 'login-mode-btn--active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            <UserPlus size={14} /> Cadastrar
          </button>
        </div>

        {/* Feedback */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="error-banner" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: 'var(--sdd-positive)' }}>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">E-mail</label>
            <input
              type="email"
              className="input-field"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ width: '100%', marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider__line" />
          <span className="login-divider__text">ou</span>
          <div className="login-divider__line" />
        </div>

        {/* Google */}
        <button className="btn-google" onClick={handleGoogle} disabled={googleLoading}>
          {GOOGLE_ICON}
          {googleLoading ? 'Redirecionando...' : 'Entrar com o Google'}
        </button>
      </div>
    </div>
  );
}
