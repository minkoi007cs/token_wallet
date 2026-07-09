import { useState, useEffect } from 'react';
import { parseResetTime, formatResetTime, formatVerboseCountdown, formatVerboseResetTime, getRemainingDurationString } from './utils/timeParser';

// --- DATA STRUCTURES ---
export interface Account {
  id: string;
  name: string;
  status: 'active' | 'exhausted';
  exhaustedType?: '5h' | 'weekly' | 'custom';
  resetTime?: number; // Epoch timestamp in ms
}

export interface AITool {
  id: string;
  name: string;
  accounts: Account[];
}

const STORAGE_KEY = 'token_wallet_data';

const DEFAULT_DATA: AITool[] = [
  {
    id: 'codex',
    name: 'Codex',
    accounts: [
      { id: 'codex-1', name: 'Codex Work', status: 'active' },
      { id: 'codex-2', name: 'Codex Personal', status: 'active' },
    ]
  },
  {
    id: 'claudecode',
    name: 'ClaudeCode',
    accounts: [
      { id: 'claudecode-1', name: 'Claude Work', status: 'active' },
      { id: 'claudecode-2', name: 'Claude Personal', status: 'active' },
    ]
  },
  {
    id: 'antigravity',
    name: 'AntiGravity',
    accounts: [
      { id: 'antigravity-1', name: 'AG Main', status: 'active' },
      { id: 'antigravity-2', name: 'AG Backup', status: 'active' },
    ]
  }
];

function getToolIcon(toolId: string, activeCount: number) {
  const color = activeCount > 0 ? 'var(--color-active)' : 'var(--color-exhausted)';
  switch (toolId.toLowerCase()) {
    case 'codex':
      // GitHub Copilot / Codex AI helper face icon
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color, marginRight: '0.4rem' }}>
          <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
          <path d="M19 11v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1" />
          <circle cx="9.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M9 13.5c1.5 1 4.5 1 6 0" />
        </svg>
      );
    case 'claudecode':
      // Anthropic Claude stylized swirl/footprint monogram
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color, marginRight: '0.4rem' }}>
          <path d="M12 3a9 9 0 0 0-9 9c0 2 .7 3.9 1.8 5.4L6.4 16A7 7 0 0 1 5 12a7 7 0 0 1 7-7 7 7 0 0 1 7 7c0 1.5-.5 2.9-1.4 4l1.6 1.4A9 9 0 0 0 21 12a9 9 0 0 0-9-9z" />
          <path d="M12 7a5 5 0 0 0-5 5c0 1.2.4 2.3 1.1 3.2l1.6-1.2A3 3 0 0 1 9 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3c0 .7-.2 1.3-.6 1.8l1.6 1.2c.7-.9 1-2 .1-3.2a5 5 0 0 0-5-5z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'antigravity':
      // Google Gemini double sparkles (DeepMind tool style)
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color, marginRight: '0.4rem' }}>
          <path d="M12 2c.1 3.8 3.1 6.9 7 7-3.9.1-6.9 3.2-7 7-.1-3.8-3.1-6.9-7-7 3.9-.1 6.9-3.2 7-7z" fill="currentColor" stroke="none" />
          <path d="M19 14c.05 1.5 1.15 2.45 2.65 2.5-1.5.05-2.6 1-2.65 2.5-.05-1.5-1.15-2.45-2.65-2.5 1.5-.05 2.6-1 2.65-2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      // Default layered package icon
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color, marginRight: '0.4rem' }}>
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      );
  }
}

export default function App() {
  const [tools, setTools] = useState<AITool[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    return DEFAULT_DATA;
  });

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [activeModal, setActiveModal] = useState<
    | null
    | { type: 'manage-account'; toolId: string; accountId: string }
    | { type: 'add-account'; toolId: string }
    | { type: 'add-tool' }
    | { type: 'rename-tool'; toolId: string }
    | { type: 'settings' }
  >(null);

  // Mark exhausted custom parser states
  const [customResetInput, setCustomResetInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<number | null>(null);

  // New item text states
  const [newToolName, setNewToolName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [toolRenameText, setToolRenameText] = useState('');
  const [accountRenameText, setAccountRenameText] = useState('');

  // Settings backup/restore states
  const [backupText, setBackupText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Keep local storage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  }, [tools]);

  // Background interval: updates countdowns and auto-restores active status
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      let updated = false;
      const nextTools = tools.map(tool => {
        const nextAccounts = tool.accounts.map(acc => {
          if (acc.status === 'exhausted' && acc.resetTime && acc.resetTime <= now) {
            updated = true;
            return {
              ...acc,
              status: 'active' as const,
              exhaustedType: undefined
            };
          }
          return acc;
        });
        return { ...tool, accounts: nextAccounts };
      });

      if (updated) {
        setTools(nextTools);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tools]);

  // Live preview parser inside manage-account modal
  useEffect(() => {
    if (activeModal?.type === 'manage-account') {
      const parsed = parseResetTime(customResetInput);
      setParsedPreview(parsed);
    } else {
      setCustomResetInput('');
      setParsedPreview(null);
    }
  }, [customResetInput, activeModal]);

  // Find active account details
  let selectedTool: AITool | undefined;
  let selectedAccount: Account | undefined;
  if (activeModal?.type === 'manage-account') {
    selectedTool = tools.find(t => t.id === activeModal.toolId);
    selectedAccount = selectedTool?.accounts.find(a => a.id === (activeModal as any).accountId);
  }

  // Calculate status summary
  const totalAccounts = tools.reduce((acc, t) => acc + t.accounts.length, 0);
  const exhaustedAccounts = tools.reduce(
    (acc, t) => acc + t.accounts.filter(a => a.status === 'exhausted').length,
    0
  );
  const allExhausted = totalAccounts > 0 && exhaustedAccounts === totalAccounts;

  // Find latest reset time when all are exhausted
  let latestResetTime = 0;
  if (allExhausted) {
    tools.forEach(tool => {
      tool.accounts.forEach(acc => {
        if (acc.status === 'exhausted' && acc.resetTime) {
          if (acc.resetTime > latestResetTime) {
            latestResetTime = acc.resetTime;
          }
        }
      });
    });
  }

  // Action handlers
  const handleMarkExhausted = (toolId: string, accountId: string, resetTime: number, type: '5h' | 'weekly' | 'custom') => {
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: t.accounts.map(a => {
            if (a.id !== accountId) return a;
            return {
              ...a,
              status: 'exhausted',
              exhaustedType: type,
              resetTime
            };
          })
        };
      })
    );
    setActiveModal(null);
  };

  const handleRestoreAccount = (toolId: string, accountId: string, resetTime?: number) => {
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: t.accounts.map(a => {
            if (a.id !== accountId) return a;
            return {
              ...a,
              status: 'active',
              resetTime: resetTime !== undefined ? resetTime : a.resetTime,
              exhaustedType: undefined
            };
          })
        };
      })
    );
    setActiveModal(null);
  };

  const handleRenameAccount = (toolId: string, accountId: string) => {
    if (!accountRenameText.trim()) return;
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: t.accounts.map(a => {
            if (a.id !== accountId) return a;
            return { ...a, name: accountRenameText.trim() };
          })
        };
      })
    );
    setActiveModal(null);
  };

  const handleRemoveAccount = (toolId: string, accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: t.accounts.filter(a => a.id !== accountId)
        };
      })
    );
    setActiveModal(null);
  };

  const handleAddAccount = (toolId: string) => {
    if (!newAccountName.trim()) return;
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        const newId = `${toolId}-${Date.now()}`;
        return {
          ...t,
          accounts: [...t.accounts, { id: newId, name: newAccountName.trim(), status: 'active' }]
        };
      })
    );
    setNewAccountName('');
    setActiveModal(null);
  };

  const handleAddTool = () => {
    if (!newToolName.trim()) return;
    const newId = newToolName.toLowerCase().replace(/\s+/g, '-');
    if (tools.some(t => t.id === newId)) return alert('This tool already exists!');

    setTools(prev => [
      ...prev,
      {
        id: newId,
        name: newToolName.trim(),
        accounts: []
      }
    ]);
    setNewToolName('');
    setActiveModal(null);
  };

  const handleRenameTool = (toolId: string) => {
    if (!toolRenameText.trim()) return;
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return { ...t, name: toolRenameText.trim() };
      })
    );
    setActiveModal(null);
  };

  const handleRemoveTool = (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool and all its accounts?')) return;
    setTools(prev => prev.filter(t => t.id !== toolId));
  };

  const handleOpenSettings = () => {
    setBackupText(JSON.stringify(tools, null, 2));
    setImportError('');
    setImportSuccess(false);
    setActiveModal({ type: 'settings' });
  };

  const handleRestoreBackup = () => {
    try {
      const parsed = JSON.parse(backupText);
      if (!Array.isArray(parsed)) throw new Error('Data must be an array of tools.');
      
      for (const tool of parsed) {
        if (!tool.id || !tool.name || !Array.isArray(tool.accounts)) {
          throw new Error('Invalid structure. Tools require id, name, and accounts.');
        }
      }

      setTools(parsed);
      setImportSuccess(true);
      setImportError('');
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON.');
    }
  };

  return (
    <div className="app-wrapper">
      {/* HEADER */}
      <header>
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          Token Wallet
        </h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setActiveModal({ type: 'add-tool' })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add AI Tool
          </button>
          <button className="btn" onClick={handleOpenSettings}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            JSON Backup
          </button>
        </div>
      </header>

      {/* GLOBAL STATUS BANNER */}
      {totalAccounts > 0 && (
        <div className={`global-status-banner ${allExhausted ? 'all-exhausted' : 'has-active'}`} style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
          <div className="status-info" style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`status-indicator-dot ${allExhausted ? 'exhausted' : 'active'}`}></span>
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                {allExhausted ? (
                  `ready for work at latest ${formatVerboseCountdown(latestResetTime, currentTime)} (${formatVerboseResetTime(latestResetTime)})`
                ) : (
                  `Currently, you have ${totalAccounts - exhaustedAccounts} of ${totalAccounts} accounts ready for work.`
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {tools.length === 0 && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>No tools configured yet. Click below to add your first AI Tool.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveModal({ type: 'add-tool' })}>
            Add AI Tool
          </button>
        </div>
      )}

      {/* TOOLS & ACCOUNTS DISPLAY */}
      {tools.map(tool => {
        const activeCount = tool.accounts.filter(a => a.status === 'active').length;

        return (
          <div className="tool-group" key={tool.id}>
            <div className="tool-header">
              <h2 className="tool-title">
                {getToolIcon(tool.id, activeCount)}
                {tool.name}
                <button
                  className="btn-icon-sm"
                  style={{ marginLeft: '0.4rem', color: 'var(--color-accent)', padding: '0.15rem' }}
                  title="Add Account"
                  onClick={() => {
                    setNewAccountName('');
                    setActiveModal({ type: 'add-account', toolId: tool.id });
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="tool-meta">
                  {activeCount} active / {tool.accounts.length} total
                </span>
                <div className="tool-actions">
                  <button
                    className="btn-icon-sm"
                    title="Rename Tool"
                    onClick={() => {
                      setToolRenameText(tool.name);
                      setActiveModal({ type: 'rename-tool', toolId: tool.id });
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>
                  <button
                    className="btn-icon-sm danger"
                    title="Delete Tool"
                    onClick={() => handleRemoveTool(tool.id)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="accounts-grid">
              {tool.accounts.map(acc => {
                const isActive = acc.status === 'active';
                return (
                  <div
                    key={acc.id}
                    className={`account-card ${isActive ? 'active' : 'exhausted'}`}
                    onClick={() => {
                      setAccountRenameText(acc.name);
                      if (acc.resetTime && acc.resetTime > Date.now()) {
                        setCustomResetInput(getRemainingDurationString(acc.resetTime));
                      } else {
                        setCustomResetInput('5h');
                      }
                      setActiveModal({ type: 'manage-account', toolId: tool.id, accountId: acc.id });
                    }}
                  >
                    <div className="account-info-side">
                      <span className={`status-indicator-dot ${isActive ? 'active' : 'exhausted'}`}></span>
                      <span className="account-name">{acc.name}</span>
                      {acc.resetTime && (
                        <span className="reset-time-inline">
                          - Resets {formatResetTime(acc.resetTime)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}


            </div>
          </div>
        );
      })}

      {/* MODAL: ADD TOOL */}
      {activeModal?.type === 'add-tool' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New AI Tool</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="tool-name-input">Tool Name</label>
                <input
                  id="tool-name-input"
                  className="input-text"
                  placeholder="e.g. Gemini, ChatGPT, DeepSeek"
                  value={newToolName}
                  onChange={e => setNewToolName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddTool} disabled={!newToolName.trim()}>
                Add Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RENAME TOOL */}
      {activeModal?.type === 'rename-tool' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename AI Tool</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="tool-rename-input">New Name</label>
                <input
                  id="tool-rename-input"
                  className="input-text"
                  value={toolRenameText}
                  onChange={e => setToolRenameText(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleRenameTool(activeModal.toolId)} disabled={!toolRenameText.trim()}>
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {activeModal?.type === 'add-account' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Account</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="acc-name-input">Account Identifier / Name</label>
                <input
                  id="acc-name-input"
                  className="input-text"
                  placeholder="e.g. Account 1, Personal, Work"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleAddAccount(activeModal.toolId)} disabled={!newAccountName.trim()}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE ACCOUNT (EXHAUSTED & CRUD DETAILS COMBINED) */}
      {activeModal?.type === 'manage-account' && selectedAccount && selectedTool && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTool.name}</h3>
            </div>

            <div className="modal-body">
              {/* 1. TIME TO RESET INPUT (MOVED TO TOP) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="custom-reset-input" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', fontWeight: '500' }}>
                  Time to reset
                </label>
                <input
                  id="custom-reset-input"
                  className="input-text"
                  placeholder="e.g. 5h, 3h 20m, at 16:30, Monday 9am"
                  value={customResetInput}
                  onChange={e => setCustomResetInput(e.target.value)}
                  autoFocus
                />
                
                {customResetInput && parsedPreview && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-active)', marginTop: '0.35rem' }}>
                    ✓ Understood: Resets {formatResetTime(parsedPreview)}
                  </div>
                )}
              </div>

              {/* 2. 2 TOGGLE STATUS BUTTONS: Remain (xanh) & Run out (đỏ cam) */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                <button
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    borderColor: 'var(--color-active)',
                    backgroundColor: 'var(--color-active)',
                    color: '#ffffff',
                    padding: '0.6rem'
                  }}
                  onClick={() => handleRestoreAccount(activeModal.toolId, selectedAccount!.id, parsedPreview || undefined)}
                >
                  Remain
                </button>
                <button
                  className="btn btn-danger"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '0.6rem'
                  }}
                  disabled={!parsedPreview}
                  onClick={() => {
                    if (parsedPreview) {
                      handleMarkExhausted(activeModal.toolId, selectedAccount!.id, parsedPreview, 'custom');
                    }
                  }}
                >
                  Run Out
                </button>
              </div>

              {/* 3. RENAME CONTAINER (Rename label removed, Update button used) */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  className="input-text"
                  placeholder="Account name..."
                  value={accountRenameText}
                  onChange={e => setAccountRenameText(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  disabled={!accountRenameText.trim() || accountRenameText.trim() === selectedAccount.name}
                  onClick={() => handleRenameAccount(activeModal.toolId, selectedAccount!.id)}
                >
                  Update
                </button>
              </div>

              {/* 4. DELETE BUTTON (At the very bottom of the modal body) */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'center', backgroundColor: '#374151', borderColor: '#4b5563', color: '#e5e7eb' }}
                  onClick={() => handleRemoveAccount(activeModal.toolId, selectedAccount!.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTINGS (BACKUP / RESTORE ONLY) */}
      {activeModal?.type === 'settings' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>JSON Backup & Restore</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="backup-section">
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Copy this configuration string to save a backup, or paste a backup string to restore it.
                </p>

                <textarea
                  className="textarea-backup"
                  value={backupText}
                  onChange={e => setBackupText(e.target.value)}
                />

                {importError && <span className="error-text">❌ {importError}</span>}
                {importSuccess && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-active)' }}>
                    ✓ Configuration imported successfully!
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRestoreBackup}>
                    Import/Restore
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (confirm('Reset all to default?')) {
                        setTools(DEFAULT_DATA);
                        setBackupText(JSON.stringify(DEFAULT_DATA, null, 2));
                      }
                    }}
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
