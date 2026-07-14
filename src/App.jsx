import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import CompromissosTab from './components/CompromissosTab';
import HistoricoTab from './components/HistoricoTab';
import AnalyticsTab from './components/AnalyticsTab';
import TarefasTab from './components/TarefasTab';
import TelegramConnect from './components/TelegramConnect';
import OnboardingTour from './components/OnboardingTour';

import { onAuthChange, signOut } from './services/authService';

function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [showTelegram, setShowTelegram] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [newItemTrigger, setNewItemTrigger] = useState(0);

  useEffect(() => {
    const unsub = onAuthChange((_event, s) => {
      setSession(s);
      if (s && !localStorage.getItem('onboarding_done')) {
        setShowTour(true);
      }
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Deseja sair da sua conta?')) return;
    await signOut();
    setCurrentView('home');
    setShowLanding(true);
  };

  // Loading state — Supabase hasn't responded yet
  if (session === undefined) {
    return (
      <div className="loading-screen">
        <Loader2 size={44} className="lime-text spin" />
        <span className="text-muted text-sm">Carregando...</span>
      </div>
    );
  }

  // Landing page (not authenticated + first visit)
  if (!session && showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
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
        userId={userId}
        user={session.user}
        onTelegram={() => setShowTelegram(true)}
        onShowTour={() => setShowTour(true)}
        onNewItem={() => { setCurrentView('home'); setNewItemTrigger(v => v + 1); }}
      />

      {showTelegram && (
        <TelegramConnect userId={userId} onClose={() => setShowTelegram(false)} />
      )}

      {showTour && (
        <OnboardingTour onFinish={() => {
          localStorage.setItem('onboarding_done', '1');
          setShowTour(false);
        }} />
      )}

      <main className="app-main">
        {currentView === 'home' && (
          <CompromissosTab
            userId={userId}
            user={session.user}
            newItemTrigger={newItemTrigger}
            onOpenTelegram={() => setShowTelegram(true)}
          />
        )}
        {currentView === 'history' && (
          <HistoricoTab userId={userId} />
        )}
        {currentView === 'analytics' && (
          <AnalyticsTab userId={userId} />
        )}
        {currentView === 'tasks' && (
          <TarefasTab userId={userId} />
        )}
      </main>
    </div>
  );
}

export default App;
