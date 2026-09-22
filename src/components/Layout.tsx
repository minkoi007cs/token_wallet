import { Outlet, NavLink } from 'react-router-dom';
import SettingsModal, { applyTheme } from './SettingsModal';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, isAdmin, permissions, signInWithGoogle, signOut, isAuthLoading } = useAuth();

  // Apply saved theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    applyTheme(savedTheme);
  }, []);

  const avatarLetter = user?.email?.charAt(0).toUpperCase() ?? '';
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? '';

  return (
    <div className="app-wrapper">
      <header>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              App Wallet
            </NavLink>
            {permissions?.can_read_token_wallet && (
              <NavLink
                to="/token-wallet"
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
              >
                Token Wallet
              </NavLink>
            )}
            {permissions?.can_read_payments && (
              <NavLink
                to="/payments"
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
              >
                Hạn thanh toán
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/users"
                className={({ isActive }) => `tab-btn tab-admin ${isActive ? 'active' : ''}`}
              >
                Users
              </NavLink>
            )}
            <NavLink
              to="/notes"
              className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
              Ghi Chú
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

          {!isAuthLoading && (
            user ? (
              <div className="auth-user-chip">
                <div className="auth-avatar" title={displayName}>
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt={avatarLetter} className="auth-avatar-img" />
                  ) : (
                    <span>{avatarLetter}</span>
                  )}
                  {isAdmin && <span className="auth-crown" title="Admin">👑</span>}
                </div>
                <span className="auth-name">{displayName}</span>
                <button className="btn btn-signout" onClick={signOut} title="Đăng xuất">
                  ↩
                </button>
              </div>
            ) : (
              <button className="btn btn-google-small" onClick={signInWithGoogle}>
                <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Đăng nhập
              </button>
            )
          )}
        </div>
      </header>

      <Outlet />

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
