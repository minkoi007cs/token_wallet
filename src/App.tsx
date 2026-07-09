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
      // GitHub Copilot / Codex exact official icon with brand gradient
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.4rem' }}>
          <defs>
            <linearGradient id="copilot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bc8cff" />
              <stop offset="100%" stopColor="#2188ff" />
            </linearGradient>
          </defs>
          <path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z" fill="url(#copilot-grad)" />
        </svg>
      );
    case 'claudecode':
      // Anthropic Claude exact official icon with brand terracotta color
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.4rem' }}>
          <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" fill="#D97757" />
        </svg>
      );
    case 'antigravity':
      // Google Gemini exact official icon with brand gradient
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.4rem' }}>
          <defs>
            <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2b66ff" />
              <stop offset="35%" stopColor="#9b51e0" />
              <stop offset="100%" stopColor="#e289f2" />
            </linearGradient>
          </defs>
          <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#gemini-grad)" />
        </svg>
      );
    default:
      // Default layered package icon
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color, marginRight: '0.4rem' }}>
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      );
  }
}

function getSegmentedBarSlots(targetTime: number, now: number = Date.now()) {
  const slots = Array(8).fill(null).map(() => ({ fill: 0, type: 'empty' }));
  
  const diff = targetTime - now;
  if (diff <= 0) {
    return slots;
  }

  const totalHours = diff / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hoursDecimal = totalHours % 24;

  const activeDays = Math.min(days, 3);
  const activeHours = Math.min(hoursDecimal, 5);

  let slotIdx = 0;

  // 1. Fill Hour slots first (from right to left)
  let remainingHours = activeHours;
  while (remainingHours > 0 && slotIdx < 8) {
    const fillVal = Math.min(remainingHours, 1);
    slots[slotIdx] = { fill: fillVal, type: 'hours' };
    remainingHours -= fillVal;
    slotIdx++;
  }

  // 2. Fill Day slots next (from right to left)
  let remainingDays = activeDays;
  while (remainingDays > 0 && slotIdx < 8) {
    const fillVal = Math.min(remainingDays, 1);
    slots[slotIdx] = { fill: fillVal, type: 'days' };
    remainingDays -= fillVal;
    slotIdx++;
  }

  return slots;
}

export default function App() {
  const [tools, setTools] = useState<AITool[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: AITool) => ({
          ...t,
          accounts: t.accounts.map(a => ({
            ...a,
            resetTime: a.resetTime || (Date.now() + 5 * 60 * 60 * 1000)
          }))
        }));
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    return DEFAULT_DATA.map(t => ({
      ...t,
      accounts: t.accounts.map(a => ({
        ...a,
        resetTime: Date.now() + 5 * 60 * 60 * 1000
      }))
    }));
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
          if (acc.resetTime && acc.resetTime <= now) {
            updated = true;
            let nextReset = acc.resetTime;
            const fiveHours = 5 * 60 * 60 * 1000;
            while (nextReset <= now) {
              nextReset += fiveHours;
            }
            return {
              ...acc,
              status: 'active' as const,
              resetTime: nextReset,
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
          accounts: [
            ...t.accounts,
            {
              id: newId,
              name: newAccountName.trim(),
              status: 'active',
              resetTime: Date.now() + 5 * 60 * 60 * 1000
            }
          ]
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
              {[...tool.accounts]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(acc => {
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

                      {acc.resetTime && (() => {
                        const slots = getSegmentedBarSlots(acc.resetTime, currentTime);
                        return (
                          <div className="reset-bar-container" title={`Remaining: ${Math.floor((acc.resetTime - currentTime) / (1000 * 60 * 60))}h`}>
                            {/* Render slots from left to right (reversing so index 0 is on the far right) */}
                            {slots.slice().reverse().map((slot, idx) => (
                              <div className="reset-bar-slot" key={idx}>
                                {slot.fill > 0 && (
                                  <div
                                    className={`reset-bar-slot-fill ${slot.type === 'days' ? 'days-fill' : 'hours-fill'}`}
                                    style={{ width: `${slot.fill * 100}%` }}
                                  ></div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
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
