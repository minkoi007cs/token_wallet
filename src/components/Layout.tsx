import { Outlet, NavLink } from 'react-router-dom';
import SettingsModal, { applyTheme } from './SettingsModal';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply saved theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    applyTheme(savedTheme);
  }, []);

  return (
    <div className="app-wrapper">
      <header>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            My Workspace
          </h1>
          <div className="tabs">
            <NavLink
              to="/"
              className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
              end
            >
              Token Wallet
            </NavLink>
            <NavLink
              to="/app-wallet"
              className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
              App Wallet
            </NavLink>
          </div>
        </div>
        <div className="header-actions">
          <button
            id="settings-btn"
            className="btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
        </div>
      </header>

      <Outlet />

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
