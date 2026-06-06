import React from 'react';
import { Wallet, LogOut, FileText, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, hasProfile, onLogout }) {
  return (
    <nav className="card flex items-center justify-between" style={{ marginBottom: '2rem', borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
      <div className="flex items-center gap-2 text-primary">
        <Wallet size={28} />
        <h1 className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>SaiDaDívida</h1>
      </div>
      
      {hasProfile && (
        <div className="flex items-center gap-4">
          <button 
            className={`btn ${currentView === 'home' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentView('home')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <LayoutDashboard size={18} /> Início
          </button>
          
          <button 
            className={`btn ${currentView === 'plan' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentView('plan')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <FileText size={18} /> Meu Plano
          </button>
          
          <button 
            className={`btn ${currentView === 'history' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentView('history')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <FileText size={18} /> Histórico
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {hasProfile && (
           <button 
             className="btn btn-primary"
             onClick={() => setCurrentView('home')}
             style={{ padding: '0.5rem 1rem' }}
             title="Atualizar Dados e Novo Plano"
           >
             <PlusCircle size={18} /> Novo Plano
           </button>
        )}
        <button 
          className="btn btn-outline" 
          onClick={onLogout}
          title="Sair / Limpar Dados"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </nav>
  );
}
