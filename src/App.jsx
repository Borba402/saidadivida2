import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ProfileForm from './components/ProfileForm';
import GastosForm from './components/GastosForm';
import DividasForm from './components/DividasForm';
import PlanoResultado from './components/PlanoResultado';
import HistoricoPlanos from './components/HistoricoPlanos';
import KanbanTab from './components/KanbanTab';
import AnalyticsTab from './components/AnalyticsTab';
import FocusTimer from './components/FocusTimer';

import {
  criarUsuario,
  obterUsuarioLocalId,
  salvarUsuarioLocalId,
  obterPerfil,
  salvarPerfil,
  criarGasto,
  removerGasto,
  listarGastosPorPerfil,
  criarDivida,
  removerDivida,
  listarDividasPorPerfil,
  salvarPlano,
  listarPlanosPorPerfil,
  obterResumoPerfil,
  limparDadosUsuario
} from './services/storage';

import { gerarPlano } from './services/calculadora';
import { getLevelProgress, addXP } from './services/xpService';
import { supabase } from './services/supabase';
import { Wallet, LogIn, AlertCircle, Loader2, DollarSign, TrendingDown, ArrowRight } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function App() {
  const [userActiveId, setUserActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apelidoInput, setApelidoInput] = useState('');
  const [perfil, setPerfil] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [dividas, setDividas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [planoAtual, setPlanoAtual] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [errorMsg, setErrorMsg] = useState('');
  const [xpData, setXpData] = useState(() => getLevelProgress());
  const [oauthLoading, setOauthLoading] = useState(false);

  const refreshXP = useCallback(() => setXpData(getLevelProgress()), []);

  // Load user data after ID is resolved
  const loadUserData = useCallback(async (userId) => {
    try {
      const userPerfil = await obterPerfil(userId);
      if (userPerfil) {
        setPerfil(userPerfil);
        const [g, d, p] = await Promise.all([
          listarGastosPorPerfil(userPerfil.id),
          listarDividasPorPerfil(userPerfil.id),
          listarPlanosPorPerfil(userPerfil.id)
        ]);
        setGastos(g);
        setDividas(d);
        setPlanos(p);
        if (p.length > 0) setPlanoAtual(p[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setErrorMsg('Erro ao conectar com o banco de dados.');
    }
  }, []);

  // Bootstrap: check local storage + OAuth session
  useEffect(() => {
    async function bootstrap() {
      // Check for OAuth redirect session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleOAuthSession(session.user);
        setIsLoading(false);
        return;
      }

      // Check stored anonymous user
      const storedId = obterUsuarioLocalId();
      if (storedId) {
        setUserActiveId(storedId);
        await loadUserData(storedId);
      }
      setIsLoading(false);
    }

    bootstrap();

    // Listen for OAuth sign-in event (redirect back)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleOAuthSession(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOAuthSession = async (authUser) => {
    const oauthKey = `saidadivida_oauth_${authUser.id}`;
    let userId = localStorage.getItem(oauthKey);

    if (!userId) {
      const apelido = authUser.user_metadata?.full_name
        || authUser.email?.split('@')[0]
        || 'Usuário';
      try {
        const newId = await criarUsuario(apelido);
        userId = String(newId);
        localStorage.setItem(oauthKey, userId);
        salvarUsuarioLocalId(newId);
      } catch (err) {
        console.error('Erro ao criar usuário OAuth:', err);
        return;
      }
    } else {
      salvarUsuarioLocalId(parseInt(userId, 10));
    }

    const id = parseInt(userId, 10);
    setUserActiveId(id);
    await loadUserData(id);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!apelidoInput.trim()) return;
    setIsLoading(true);
    try {
      const newUserId = await criarUsuario(apelidoInput.trim());
      salvarUsuarioLocalId(newUserId);
      setUserActiveId(newUserId);
      setApelidoInput('');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao iniciar login com Google. Verifique a configuração OAuth no Supabase.');
      setOauthLoading(false);
    }
  };

  const handleSavePerfil = async (dadosPerfil) => {
    setIsLoading(true);
    try {
      const idPerfil = await salvarPerfil(userActiveId, dadosPerfil);
      const updated = { id: idPerfil, id_usuario: userActiveId, ...dadosPerfil };
      setPerfil(updated);
      const [g, d, p] = await Promise.all([
        listarGastosPorPerfil(idPerfil),
        listarDividasPorPerfil(idPerfil),
        listarPlanosPorPerfil(idPerfil)
      ]);
      setGastos(g);
      setDividas(d);
      setPlanos(p);
      if (p.length > 0) setPlanoAtual(p[0]);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar perfil financeiro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGasto = async (gasto) => {
    if (!perfil) return;
    try {
      const novo = await criarGasto(perfil.id, gasto);
      setGastos(prev => [...prev, novo]);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao adicionar gasto.');
    }
  };

  const handleDeleteGasto = async (id) => {
    try {
      await removerGasto(id);
      setGastos(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao remover gasto.');
    }
  };

  const handleAddDivida = async (divida) => {
    if (!perfil) return;
    try {
      const nova = await criarDivida(perfil.id, divida);
      setDividas(prev => [...prev, nova]);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao adicionar dívida.');
    }
  };

  const handleDeleteDivida = async (id) => {
    try {
      await removerDivida(id);
      setDividas(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao remover dívida.');
    }
  };

  const handleCalculatePlan = async () => {
    if (!perfil) return;
    setIsLoading(true);
    try {
      const resumo = await obterResumoPerfil(perfil.id);
      if (!resumo) throw new Error('Não foi possível gerar o resumo financeiro.');
      const resultado = gerarPlano(resumo, dividas);
      const salvo = await salvarPlano(perfil.id, resultado);
      setPlanoAtual(salvo);
      setPlanos(prev => [salvo, ...prev]);
      // Grant XP for generating a plan
      const totalXP = addXP(50);
      setXpData(getLevelProgress());
      setCurrentView('plan');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao processar e salvar o plano.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Tem certeza? Isso apagará todos os seus dados permanentemente.')) return;
    setIsLoading(true);
    try {
      if (userActiveId) await limparDadosUsuario(userActiveId);
      await supabase.auth.signOut().catch(() => {});
      setUserActiveId(null);
      setPerfil(null);
      setGastos([]);
      setDividas([]);
      setPlanos([]);
      setPlanoAtual(null);
      setCurrentView('home');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao limpar dados do usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleXPGained = useCallback((amount, total) => {
    setXpData(getLevelProgress());
  }, []);

  // ── Loading screen
  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loader2 size={44} className="lime-text spin" />
        <span className="text-muted text-sm">Carregando...</span>
      </div>
    );
  }

  // ── Login screen
  if (!userActiveId) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <Wallet size={36} className="lime-text" />
            <h1 className="font-bold" style={{ fontSize: '1.75rem', letterSpacing: '-0.03em' }}>
              SaiDaDívida
            </h1>
          </div>
          <p className="text-muted text-sm text-center mb-6" style={{ lineHeight: 1.6 }}>
            Planejador financeiro 100% gratuito e anônimo. Saia do vermelho sem expor seus dados.
          </p>

          {errorMsg && (
            <div className="error-banner">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google OAuth */}
          <button className="btn-google" onClick={handleGoogleLogin} disabled={oauthLoading}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {oauthLoading ? 'Redirecionando...' : 'Entrar com o Google'}
          </button>

          {/* Divider */}
          <div className="login-divider">
            <div className="login-divider__line" />
            <span className="login-divider__text">ou use um apelido</span>
            <div className="login-divider__line" />
          </div>

          {/* Anonymous form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Seu apelido</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: João, Economista123"
                value={apelidoInput}
                onChange={e => setApelidoInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
              <LogIn size={16} /> Começar Planejamento
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated app
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0);
  const saldo = perfil ? perfil.renda_mensal - totalGastos : 0;

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        hasProfile={!!perfil}
        xpData={xpData}
      />

      <main className="app-main">
        {errorMsg && (
          <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* HOME */}
        {currentView === 'home' && (
          <div className="slide-down">
            {/* Balance panel (visible once profile exists) */}
            {perfil && (
              <div className="balance-panel">
                <div className="balance-panel__item">
                  <span className="balance-panel__label">Renda mensal</span>
                  <span className="balance-panel__value lime-text">{fmt(perfil.renda_mensal)}</span>
                </div>
                <div className="balance-panel__divider" />
                <div className="balance-panel__item">
                  <TrendingDown size={14} className="text-danger" style={{ marginBottom: 2 }} />
                  <span className="balance-panel__label">Total gastos</span>
                  <span className="balance-panel__value text-danger">{fmt(totalGastos)}</span>
                </div>
                <ArrowRight size={18} className="text-muted" style={{ flexShrink: 0 }} />
                <div className="balance-panel__item">
                  <DollarSign size={14} className={saldo >= 0 ? 'lime-text' : 'text-danger'} style={{ marginBottom: 2 }} />
                  <span className="balance-panel__label">Saldo restante</span>
                  <span className={`balance-panel__value ${saldo >= 0 ? 'lime-text' : 'text-danger'}`}>
                    {fmt(saldo)}
                  </span>
                </div>
              </div>
            )}

            <ProfileForm perfil={perfil} onSave={handleSavePerfil} />

            {perfil ? (
              <div className="slide-down">
                <GastosForm
                  gastos={gastos}
                  onAdd={handleAddGasto}
                  onDelete={handleDeleteGasto}
                  rendaMensal={perfil.renda_mensal}
                />
                <DividasForm
                  dividas={dividas}
                  onAdd={handleAddDivida}
                  onDelete={handleDeleteDivida}
                />
                <div className="flex justify-center mt-6" style={{ marginBottom: '3rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCalculatePlan}
                    style={{ padding: '0.875rem 3rem', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}
                  >
                    Calcular Plano de Quitação
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center" style={{ padding: '2rem' }}>
                <p className="text-muted text-sm">
                  Preencha e salve o <strong>Perfil Financeiro</strong> acima para gerenciar gastos e dívidas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PLAN */}
        {currentView === 'plan' && (
          <PlanoResultado
            plano={planoAtual}
            temRendaExtra={perfil?.tem_renda_extra}
            valorRendaExtra={perfil?.valor_renda_extra}
          />
        )}

        {/* HISTORY */}
        {currentView === 'history' && <HistoricoPlanos planos={planos} />}

        {/* KANBAN */}
        {currentView === 'kanban' && (
          <KanbanTab dividas={dividas} gastos={gastos} perfil={perfil} />
        )}

        {/* ANALYTICS */}
        {currentView === 'analytics' && (
          <AnalyticsTab
            planos={planos}
            perfil={perfil}
            dividas={dividas}
            gastos={gastos}
          />
        )}

        {/* TIMER */}
        {currentView === 'timer' && (
          <FocusTimer dividas={dividas} onXPGained={handleXPGained} />
        )}
      </main>
    </div>
  );
}

export default App;
