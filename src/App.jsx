import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProfileForm from './components/ProfileForm';
import GastosForm from './components/GastosForm';
import DividasForm from './components/DividasForm';
import PlanoResultado from './components/PlanoResultado';
import HistoricoPlanos from './components/HistoricoPlanos';

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
import { Wallet, LogIn, AlertCircle, Loader2 } from 'lucide-react';

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

  // Carrega os dados iniciais do usuário
  useEffect(() => {
    async function loadUserData() {
      const storedId = obterUsuarioLocalId();
      if (storedId) {
        setUserActiveId(storedId);
        try {
          const userPerfil = await obterPerfil(storedId);
          if (userPerfil) {
            setPerfil(userPerfil);
            
            const [loadedGastos, loadedDividas, loadedPlanos] = await Promise.all([
              listarGastosPorPerfil(userPerfil.id),
              listarDividasPorPerfil(userPerfil.id),
              listarPlanosPorPerfil(userPerfil.id)
            ]);
            
            setGastos(loadedGastos);
            setDividas(loadedDividas);
            setPlanos(loadedPlanos);
            if (loadedPlanos.length > 0) {
              setPlanoAtual(loadedPlanos[0]);
            }
          }
        } catch (err) {
          console.error("Erro ao carregar dados do usuário:", err);
          setErrorMsg("Erro ao conectar com o banco de dados. Verifique a conexão.");
        }
      }
      setIsLoading(false);
    }
    loadUserData();
  }, []);

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
      setErrorMsg("Falha ao registrar usuário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePerfil = async (dadosPerfil) => {
    setIsLoading(true);
    try {
      const idPerfil = await salvarPerfil(userActiveId, dadosPerfil);
      const updatedPerfil = { id: idPerfil, id_usuario: userActiveId, ...dadosPerfil };
      setPerfil(updatedPerfil);
      
      // Carrega dados se o perfil já existia ou inicializa vazios
      const [loadedGastos, loadedDividas, loadedPlanos] = await Promise.all([
        listarGastosPorPerfil(idPerfil),
        listarDividasPorPerfil(idPerfil),
        listarPlanosPorPerfil(idPerfil)
      ]);
      setGastos(loadedGastos);
      setDividas(loadedDividas);
      setPlanos(loadedPlanos);
      if (loadedPlanos.length > 0) {
        setPlanoAtual(loadedPlanos[0]);
      }
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao salvar perfil financeiro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGasto = async (gasto) => {
    if (!perfil) return;
    try {
      const novoGasto = await criarGasto(perfil.id, gasto);
      setGastos(prev => [...prev, novoGasto]);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao adicionar gasto.");
    }
  };

  const handleDeleteGasto = async (idGasto) => {
    try {
      await removerGasto(idGasto);
      setGastos(prev => prev.filter(g => g.id !== idGasto));
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao remover gasto.");
    }
  };

  const handleAddDivida = async (divida) => {
    if (!perfil) return;
    try {
      const novaDivida = await criarDivida(perfil.id, divida);
      setDividas(prev => [...prev, novaDivida]);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao adicionar dívida.");
    }
  };

  const handleDeleteDivida = async (idDivida) => {
    try {
      await removerDivida(idDivida);
      setDividas(prev => prev.filter(d => d.id !== idDivida));
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao remover dívida.");
    }
  };

  const handleCalculatePlan = async () => {
    if (!perfil) return;
    setIsLoading(true);
    try {
      // 1. Pega resumo consolidado através da view no Supabase
      const resumo = await obterResumoPerfil(perfil.id);
      
      if (!resumo) {
        throw new Error("Não foi possível gerar o resumo financeiro.");
      }

      // 2. Roda a calculadora localmente
      const resultadoCalculado = gerarPlano(resumo, dividas);

      // 3. Salva o plano gerado no banco de dados Supabase
      const novoPlanoSalvo = await salvarPlano(perfil.id, resultadoCalculado);
      
      setPlanoAtual(novoPlanoSalvo);
      setPlanos(prev => [novoPlanoSalvo, ...prev]);
      setCurrentView('plan');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao processar e salvar o plano.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Você tem certeza? Isso apagará todas as suas informações do banco de dados do Supabase permanentemente!")) {
      setIsLoading(true);
      try {
        if (userActiveId) {
          await limparDadosUsuario(userActiveId);
        }
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
        setErrorMsg("Erro ao limpar dados do usuário.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100vh', gap: '1rem' }}>
        <Loader2 className="text-primary animate-spin" size={48} style={{ animation: 'spin 1.5s linear infinite' }} />
        <span className="text-muted text-sm font-medium">Carregando dados com o Supabase...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Tela de Boas-Vindas se não houver usuário logado
  if (!userActiveId) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="flex items-center justify-center text-primary mb-4" style={{ gap: '0.5rem' }}>
            <Wallet size={40} />
            <h1 className="font-bold" style={{ fontSize: '1.8rem' }}>SaiDaDívida</h1>
          </div>
          <p className="text-muted text-sm mb-6">
            O planejador financeiro 100% gratuito e anônimo. Saia do vermelho sem precisar expor seus dados pessoais.
          </p>

          {errorMsg && (
            <div className="flex gap-2 text-danger bg-danger-light text-xs mb-4" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="input-group text-left" style={{ marginBottom: 0 }}>
              <label className="input-label">Digite seu Apelido</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: João, Maria, Economista123"
                value={apelidoInput}
                onChange={e => setApelidoInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
              <LogIn size={18} /> Começar Planejamento
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        hasProfile={!!perfil}
        onLogout={handleLogout}
      />

      {errorMsg && (
        <div className="flex gap-2 text-danger bg-danger-light text-sm mb-4" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <main className="main-content">
        {currentView === 'home' && (
          <div className="slide-down">
            {/* 1. Formulário de Perfil */}
            <ProfileForm 
              perfil={perfil} 
              onSave={handleSavePerfil} 
            />

            {/* 2. Seções de Gastos e Dívidas só aparecem após cadastrar o perfil */}
            {perfil ? (
              <div className="slide-down">
                <GastosForm 
                  gastos={gastos} 
                  onAdd={handleAddGasto} 
                  onDelete={handleDeleteGasto} 
                />

                <DividasForm 
                  dividas={dividas} 
                  onAdd={handleAddDivida} 
                  onDelete={handleDeleteDivida} 
                />

                {/* Ação de Cálculo */}
                <div className="flex justify-center mt-6" style={{ marginBottom: '3rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCalculatePlan}
                    style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: 'var(--radius-lg)' }}
                  >
                    Calcular Plano de Quitação
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center" style={{ padding: '2rem' }}>
                <p className="text-muted text-sm">Preencha e salve o seu <strong>Perfil Financeiro</strong> acima para poder gerenciar seus Gastos e Dívidas.</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'plan' && (
          <PlanoResultado 
            plano={planoAtual} 
            temRendaExtra={perfil?.tem_renda_extra} 
            valorRendaExtra={perfil?.valor_renda_extra} 
          />
        )}

        {currentView === 'history' && (
          <HistoricoPlanos planos={planos} />
        )}
      </main>
    </div>
  );
}

export default App;
