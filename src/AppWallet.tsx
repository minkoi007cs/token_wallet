import { useState, useEffect } from 'react';

export interface BacklogItem {
  id: string;
  title: string;
  isCompleted: boolean;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export interface AppProject {
  id: string;
  name: string;
  developer: string;
  github: string;
  frontendUrl: string;
  backendUrl: string;
  hosting: string;
  database: string;
  type: string;
  description: string;
  techStack: string;
  techNotes: string;
  backlog: BacklogItem[];
  status: 'Development' | 'Production' | 'Maintenance' | 'Deprecated' | string;
  priority: 'High' | 'Medium' | 'Low' | string;
  lastUpdated: number;
  isDisabled?: boolean;
}

const APP_WALLET_STORAGE_KEY = 'app_wallet_data';

const INITIAL_APP_DATA: AppProject[] = [
  {
    id: 'app-github-tokenwallet',
    name: 'Token Wallet',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/TokenWallet',
    frontendUrl: 'https://token-wallet-chi.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: 'LocalStorage',
    type: 'Web App',
    description: 'A web application to manage AI tool quotas, tokens, and monitor personal portfolio of applications.',
    techStack: 'TypeScript, React, Vite',
    techNotes: 'Clean UI with glassmorphism touches and smooth transitions.',
    backlog: [],
    status: 'Production',
    priority: 'High',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-ade',
    name: 'AdmissionDecisionEngine',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/AdmissionDecisionEngine',
    frontendUrl: '',
    backendUrl: 'https://ade-backend.vercel.app',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'Admission Decision Engine backend system.',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-coffee',
    name: 'coffee_shop_24hxh',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/coffee_shop_24hxh',
    frontendUrl: '',
    backendUrl: 'https://coffee24hxh-api.vercel.app',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'Coffee shop management system / API.',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-devbrain',
    name: 'dev-brain',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/dev-brain',
    frontendUrl: '',
    backendUrl: '',
    hosting: '',
    database: '',
    type: 'Other',
    description: 'dev-brain',
    techStack: '',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-family',
    name: 'family-management',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/family-management',
    frontendUrl: 'https://family-management-eight.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'family-management application.',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-game',
    name: 'gameEngG10',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/gameEngG10',
    frontendUrl: '',
    backendUrl: 'https://game-eng-g10-backend.vercel.app',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'Game Engine G10 backend.',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-photo',
    name: 'photo-clear-1',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/photo-clear-1',
    frontendUrl: '',
    backendUrl: '',
    hosting: '',
    database: '',
    type: 'Other',
    description: 'Photo clearing or enhancement tool.',
    techStack: 'Python',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-qlhs',
    name: 'qlhs_dtnt',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/qlhs_dtnt',
    frontendUrl: 'https://qlhs-dtnt.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'Website quan ly hoc sinh dan toc noi tru.',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-vercel-game10',
    name: 'game10',
    developer: 'Hoa Hoang',
    github: '',
    frontendUrl: 'https://game10-iota.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'game10 Frontend on Vercel',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-vercel-ade',
    name: 'ade',
    developer: 'Hoa Hoang',
    github: '',
    frontendUrl: 'https://ade-flame.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'ADE Frontend on Vercel',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-vercel-coffee24',
    name: 'coffee24hxh',
    developer: 'Hoa Hoang',
    github: '',
    frontendUrl: 'https://minkoi.org',
    backendUrl: '',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'Coffee 24h Frontend on Vercel (minkoi.org)',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-vercel-mikoifamilyapi',
    name: 'mikoi-family-api',
    developer: 'Hoa Hoang',
    github: '',
    frontendUrl: 'https://mikoi-family-api.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: '',
    type: 'Web App',
    description: 'Mikoi Family API on Vercel',
    techStack: 'TypeScript',
    techNotes: '',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  }
];

export default function AppWallet() {
  const [apps, setApps] = useState<AppProject[]>(() => {
    const saved = localStorage.getItem(APP_WALLET_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          // Migrate legacy single `url` field into `frontendUrl` for existing users
          const migrated = parsed.map((p: AppProject & { url?: string }) =>
            p.frontendUrl === undefined ? { ...p, frontendUrl: p.url || '', backendUrl: p.backendUrl || '' } : p
          );
          // Merge any missing initial apps by name to auto-populate existing users
          const missingApps = INITIAL_APP_DATA.filter(initApp =>
            !migrated.some((p: AppProject) => p.name === initApp.name)
          );
          if (missingApps.length > 0) {
            return [...migrated, ...missingApps];
          }
          return migrated;
        }
      } catch (e) {
        console.error('Failed to parse app wallet local storage', e);
      }
    }
    return INITIAL_APP_DATA;
  });

  const [activeModal, setActiveModal] = useState<
    | null
    | { type: 'edit-app'; app: AppProject | null } // if null, it's "Add App"
  >(null);

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<AppProject>>({});
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [newBacklogAssignee, setNewBacklogAssignee] = useState('');
  const [newBacklogPriority, setNewBacklogPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  useEffect(() => {
    localStorage.setItem(APP_WALLET_STORAGE_KEY, JSON.stringify(apps));
  }, [apps]);

  const handleOpenModal = (app?: AppProject) => {
    if (app) {
      setFormData(app);
      setBacklogItems(app.backlog || []);
      setActiveModal({ type: 'edit-app', app });
    } else {
      setFormData({
        name: '', developer: '', github: '', frontendUrl: '', backendUrl: '', hosting: 'Vercel',
        database: '', type: 'Web App', description: '', techStack: '',
        techNotes: '', status: 'Development', priority: 'Medium'
      });
      setBacklogItems([]);
      setActiveModal({ type: 'edit-app', app: null });
    }
  };

  const handleSaveApp = () => {
    if (!formData.name) return; // Basic validation
    const appToSave: AppProject = {
      id: activeModal?.app?.id || `app-${Date.now()}`,
      name: formData.name || '',
      developer: formData.developer || '',
      github: formData.github || '',
      frontendUrl: formData.frontendUrl || '',
      backendUrl: formData.backendUrl || '',
      hosting: formData.hosting || '',
      database: formData.database || '',
      type: formData.type || '',
      description: formData.description || '',
      techStack: formData.techStack || '',
      techNotes: formData.techNotes || '',
      status: formData.status || 'Development',
      priority: formData.priority || 'Medium',
      backlog: backlogItems,
      lastUpdated: Date.now()
    };

    if (activeModal?.app) {
      setApps(prev => prev.map(a => a.id === appToSave.id ? appToSave : a));
    } else {
      setApps(prev => [...prev, appToSave]);
    }
    setActiveModal(null);
  };

  const handleToggleDisable = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isDisabled: !a.isDisabled } : a));
    setOpenActionMenuId(null);
  };

  const handleRestartData = () => {
    window.open('https://supabase.com/dashboard/projects', '_blank');
    setOpenActionMenuId(null);
  };

  const handleDeleteApp = (id: string) => {
    if (confirm('Are you sure you want to delete this app?')) {
      setApps(prev => prev.filter(a => a.id !== id));
      setActiveModal(null);
    }
  };

  // Backlog handlers
  const handleAddBacklogItem = () => {
    if (!newBacklogTitle.trim()) return;
    const newItem: BacklogItem = {
      id: `task-${Date.now()}`,
      title: newBacklogTitle.trim(),
      isCompleted: false,
      assignee: newBacklogAssignee.trim(),
      priority: newBacklogPriority,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setBacklogItems(prev => [...prev, newItem]);
    setNewBacklogTitle('');
    setNewBacklogAssignee('');
    setNewBacklogPriority('Medium');
  };

  const handleToggleBacklogItem = (id: string) => {
    setBacklogItems(prev => prev.map(item => {
      if (item.id === id) {
        const isCompleted = !item.isCompleted;
        return {
          ...item,
          isCompleted,
          updatedAt: Date.now(),
          closedAt: isCompleted ? Date.now() : undefined
        };
      }
      return item;
    }));
  };

  const handleDeleteBacklogItem = (id: string) => {
    setBacklogItems(prev => prev.filter(item => item.id !== id));
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  return (
    <div className="app-wallet-container" style={{ padding: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2>My Apps Portfolio</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New App
        </button>
      </div>

      <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {apps.map(app => (
          <div key={app.id} className={`tool-card ${app.isDisabled ? 'disabled' : ''}`} style={{ position: 'relative', opacity: app.isDisabled ? 0.6 : 1, transition: 'all 0.2s' }}>
            <div className="tool-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h2
                  onClick={() => app.frontendUrl ? window.open(app.frontendUrl, '_blank') : null}
                  style={{ cursor: app.frontendUrl ? 'pointer' : 'default', textDecoration: app.frontendUrl ? 'underline' : 'none' }}
                  title={app.frontendUrl ? `Open ${app.frontendUrl}` : ''}
                >
                  {app.name}
                </h2>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={`status-badge ${app.status.toLowerCase()}`}>{app.status}</span>
                  {app.isDisabled && <span className="status-badge" style={{ marginLeft: '0.5rem', backgroundColor: 'var(--color-border)', color: 'var(--text-muted)' }}>DISABLED</span>}
                </div>
              </div>
              
              {/* Action Menu */}
              <div style={{ position: 'relative' }} onMouseLeave={() => setOpenActionMenuId(null)}>
                <button 
                  className="btn btn-sm" 
                  style={{ background: 'transparent', border: 'none', padding: '0.2rem 0.5rem', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenActionMenuId(openActionMenuId === app.id ? null : app.id);
                  }}
                >
                  ⋮
                </button>
                {openActionMenuId === app.id && (
                  <div className="action-dropdown" style={{
                    position: 'absolute', top: '100%', right: '0', backgroundColor: 'var(--bg-elevated)', 
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: '160px', zIndex: 10, padding: '0.5rem 0'
                  }}>
                    <div className="dropdown-item" onClick={() => { handleOpenModal(app); setOpenActionMenuId(null); }}>
                      Edit App
                    </div>
                    <div className="dropdown-item" onClick={() => { handleOpenModal(app); setOpenActionMenuId(null); }}>
                      Add Backlog Story
                    </div>
                    {app.database?.toLowerCase().includes('supabase') && (
                      <div className="dropdown-item" onClick={handleRestartData}>
                        Restart Data (Supabase)
                      </div>
                    )}
                    <div className="dropdown-item" style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.25rem', paddingTop: '0.25rem', color: app.isDisabled ? '#10b981' : '#ef4444' }} onClick={() => handleToggleDisable(app.id)}>
                      {app.isDisabled ? 'Enable App' : 'Disable App'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="accounts-list" style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Frontend:</strong> <a href={app.frontendUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-active)', fontWeight: 'bold' }} onClick={e => e.stopPropagation()}>{app.frontendUrl || 'N/A'}</a>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Backend:</strong> <a href={app.backendUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-active)', fontWeight: 'bold' }} onClick={e => e.stopPropagation()}>{app.backendUrl || 'N/A'}</a>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Type:</strong> {app.type} | <strong>Host:</strong> {app.hosting}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Stack:</strong> {app.techStack}</p>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Backlog: {app.backlog.filter(b => b.isCompleted).length}/{app.backlog.length}</span>
                <span>Updated: {formatDate(app.lastUpdated)}</span>
              </div>
            </div>
          </div>
        ))}
        {apps.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <p>No apps yet. Click "Add New App" to start building your portfolio.</p>
          </div>
        )}
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ padding: '2rem 0' }}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeModal.app ? 'Edit App Details' : 'Add New App'}</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              
              {/* APP INFO SECTION */}
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
                <h4 style={{ marginBottom: '1.25rem', color: 'var(--text-main)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Project Details</h4>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>App Name <span style={{color: '#ef4444'}}>*</span></label>
                    <input className="input-text" type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="My Awesome App" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Frontend URL</label>
                    <input className="input-text" type="text" value={formData.frontendUrl || ''} onChange={e => setFormData({...formData, frontendUrl: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Backend URL</label>
                    <input className="input-text" type="text" value={formData.backendUrl || ''} onChange={e => setFormData({...formData, backendUrl: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Developer / Assignee</label>
                    <input className="input-text" type="text" value={formData.developer || ''} onChange={e => setFormData({...formData, developer: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>GitHub Repo</label>
                    <input className="input-text" type="text" value={formData.github || ''} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Type</label>
                    <select className="input-select" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option>Web App</option>
                      <option>Android App</option>
                      <option>iOS App</option>
                      <option>Desktop App</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Status</label>
                    <select className="input-select" value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option>Development</option>
                      <option>Production</option>
                      <option>Maintenance</option>
                      <option>Deprecated</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Hosting Provider</label>
                    <input className="input-text" type="text" value={formData.hosting || ''} onChange={e => setFormData({...formData, hosting: e.target.value})} placeholder="Vercel, Render, AWS..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Database</label>
                    <input className="input-text" type="text" value={formData.database || ''} onChange={e => setFormData({...formData, database: e.target.value})} placeholder="PostgreSQL, MongoDB..." />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                    <label>Description</label>
                    <textarea className="input-text" style={{ resize: 'vertical', minHeight: '60px' }} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} placeholder="Briefly describe what this project does..." />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                    <label>Tech Stack</label>
                    <textarea className="input-text" style={{ resize: 'vertical', minHeight: '60px' }} value={formData.techStack || ''} onChange={e => setFormData({...formData, techStack: e.target.value})} rows={2} placeholder="React, Node.js, Tailwind..." />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                    <label>Technical Notes</label>
                    <textarea className="input-text" style={{ resize: 'vertical', minHeight: '80px' }} value={formData.techNotes || ''} onChange={e => setFormData({...formData, techNotes: e.target.value})} rows={3} placeholder="Important architecture decisions, credentials info, etc." />
                  </div>
                </div>
              </div>

              {/* BACKLOG SECTION */}
              <div className="backlog-section" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
                <h4 style={{ marginBottom: '1.25rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Backlog & Tasks
                  <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-active)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                    {backlogItems.filter(b => b.isCompleted).length} / {backlogItems.length} Done
                  </span>
                </h4>
                
                <div className="backlog-add" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-start', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Task Title</label>
                    <input className="input-text" type="text" placeholder="e.g. Implement OAuth login" value={newBacklogTitle} onChange={e => setNewBacklogTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddBacklogItem()} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Assignee</label>
                    <input className="input-text" type="text" placeholder="@someone" value={newBacklogAssignee} onChange={e => setNewBacklogAssignee(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Priority</label>
                    <select className="input-select" value={newBacklogPriority} onChange={e => setNewBacklogPriority(e.target.value as any)}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                    <button className="btn btn-primary" onClick={handleAddBacklogItem} style={{ marginTop: '1.4rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  </div>
                </div>

                <div className="backlog-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {backlogItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                      <p>No tasks yet. Add a task above to get started.</p>
                    </div>
                  ) : (
                    backlogItems.map(item => (
                      <div key={item.id} className={`backlog-item ${item.isCompleted ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <input type="checkbox" checked={item.isCompleted} onChange={() => handleToggleBacklogItem(item.id)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-active)' }} />
                        <div style={{ flex: 1, textDecoration: item.isCompleted ? 'line-through' : 'none', opacity: item.isCompleted ? 0.6 : 1 }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{item.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', gap: '1.25rem' }}>
                            {item.assignee && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> {item.assignee}</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {formatDate(item.updatedAt)}</span>
                            {item.closedAt && <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> {formatDate(item.closedAt)}</span>}
                          </div>
                        </div>
                        <button className="btn" onClick={() => handleDeleteBacklogItem(item.id)} style={{ padding: '0.4rem', color: '#ef4444', borderColor: 'transparent', backgroundColor: 'rgba(239, 68, 68, 0.1)' }} title="Delete Task">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
            
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              {activeModal.app ? (
                <button className="btn" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDeleteApp(activeModal.app!.id)}>Delete App</button>
              ) : (
                <div></div>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveApp} disabled={!formData.name}>Save App</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
