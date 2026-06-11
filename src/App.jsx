import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MatchList from './components/MatchList';
import AdminPanel from './components/AdminPanel';
import Profile from './components/Profile';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [menuOpen, setMenuOpen] = useState(false);

  // Load session from localStorage on start
  useEffect(() => {
    const savedUser = localStorage.getItem('prode_conquer_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error reading saved session:", e);
        localStorage.removeItem('prode_conquer_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('prode_conquer_user', JSON.stringify(user));
    setActiveTab('dashboard');
    showToast(`¡Bienvenido/a, ${user.display_name}! ⚽`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('prode_conquer_user');
    setMenuOpen(false);
    showToast('Sesión cerrada correctamente.', 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
      case 'matches':
        return <MatchList currentUser={currentUser} showToast={showToast} />;
      case 'admin':
        return currentUser?.is_admin ? (
          <AdminPanel currentUser={currentUser} showToast={showToast} />
        ) : (
          <Dashboard currentUser={currentUser} />
        );
      case 'profile':
        return <Profile currentUser={currentUser} showToast={showToast} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast.visible && (
        <div className={`toast-banner ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {currentUser ? (
        <>
          {/* Header Navigation */}
          <header className="navbar">
            <a href="#" className="brand" onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}>
              Prode Conquer 🏆 <span>Mundial 2026</span>
            </a>

            {/* Hamburger Menu Toggle Button */}
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? '✕' : '☰'}
            </button>

            <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
              <button
                className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
              >
                Tabla de Posiciones
              </button>
              
              <button
                className={`nav-btn ${activeTab === 'matches' ? 'active' : ''}`}
                onClick={() => { setActiveTab('matches'); setMenuOpen(false); }}
              >
                Votar Partidos
              </button>

              {currentUser.is_admin && (
                <button
                  className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('admin'); setMenuOpen(false); }}
                >
                  Administración 🔧
                </button>
              )}

              <button
                className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}
              >
                Mi Perfil
              </button>
              
              {/* Logout inside menu for mobile layout */}
              <button className="logout-btn-mobile" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </nav>

            <div className="user-info-section">
              <span className="username-display">
                👤 {currentUser.display_name} {currentUser.is_admin && '⭐'}
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                Salir
              </button>
            </div>
          </header>

          {/* Main Content Pane */}
          <main className="main-content">
            {renderActiveComponent()}
          </main>
        </>
      ) : (
        /* Login Mode */
        <main className="main-content">
          <Login onLoginSuccess={handleLoginSuccess} />
        </main>
      )}
    </div>
  );
}
