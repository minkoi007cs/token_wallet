import { useState } from 'react';
import { Modal } from './Modal';
import { applyTheme } from '../utils/theme';

export { applyTheme };

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <Modal title="Settings" onClose={onClose} maxWidth="420px">
      {/* Dark Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Appearance</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Choose light or dark theme</div>
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

      {/* Supabase Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Database</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Restart paused Supabase project</div>
        </div>
        <a
          href="https://supabase.com/dashboard/projects"
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          Go to Supabase
        </a>
      </div>

      <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
        More settings coming soon...
      </div>
    </Modal>
  );
}
