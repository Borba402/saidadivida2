import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import CompromissosTab from './components/CompromissosTab';
import HistoricoTab from './components/HistoricoTab';
import KanbanTab from './components/KanbanTab';
import AnalyticsTab from './components/AnalyticsTab';
import TarefasTab from './components/TarefasTab';
import FocusTimer from './components/FocusTimer';

import { onAuthChange, signOut } from './services/authService';
import { getLevelProgress, addXP } from './services/xpService';

function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [currentView, setCurrentView] = useState('home');
  const [xpData, setXpData] = useState(() => getLevelProgress());

  useEffect(() => {
    const unsub = onAuthChange((_event, s) => {
      setSession(s);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Deseja sair da sua conta?')) return;
    await signOut();
    setCurrentView('home');
  };

  const handleXPGained = useCallback(() => {
    setXpData(getLevelProgress());
  }, []);

  // Loading state — Supabase hasn't responded yet
  if (session === undefined) {
    return (
      <div className="loading-screen">
        <Loader2 size={44} className="lime-text spin" />
        <span className="text-muted text-sm">Carregando...</span>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return <LoginPage />;
  }

  const userId = session.user.id;

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        xpData={xpData}
      />

      <main className="app-main">
        {currentView === 'home' && (
          <CompromissosTab userId={userId} />
        )}
        {currentView === 'history' && (
          <HistoricoTab userId={userId} />
        )}
        {currentView === 'kanban' && (
          <KanbanTab userId={userId} />
        )}
        {currentView === 'analytics' && (
          <AnalyticsTab userId={userId} />
        )}
        {currentView === 'tasks' && (
          <TarefasTab userId={userId} />
        )}
        {currentView === 'timer' && (
          <FocusTimer dividas={[]} onXPGained={handleXPGained} />
        )}
      </main>
    </div>
  );
}

export default App;
