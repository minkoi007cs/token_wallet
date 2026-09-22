import { useState } from 'react';
import { Modal } from './Modal';
import { applyTheme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from '../pages/UserManagement';

export { applyTheme };

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { isAdmin } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <Modal
      title="Settings"
      onClose={onClose}
      maxWidth={activeTab === 'users' ? '760px' : '460px'}
    >
      {/* Settings Tabs for Admin */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <button
            className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('general')}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
          >
            ⚙️ Cấu Hình Chung
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
          >
            👥 Quản Lý Người Dùng
          </button>
        </div>
      )}

      {activeTab === 'general' ? (
        <div>
          {/* Dark / Light Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Giao diện (Appearance)</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Chọn chế độ sáng hoặc tối</div>
            </div>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      ) : (
        <UserManagement />
      )}
    </Modal>
  );
}
