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
  url: string;
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
}

const APP_WALLET_STORAGE_KEY = 'app_wallet_data';

const INITIAL_APP_DATA: AppProject[] = [
  {
    id: 'app-initial-1',
    name: 'Token Wallet',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/TokenWallet',
    url: '', // User can update this once deployed
    hosting: 'Vercel',
    database: 'LocalStorage',
    type: 'Web App',
    description: 'A web application to manage AI tool quotas, tokens, and monitor personal portfolio of applications.',
    techStack: 'React, TypeScript, Vite, Vanilla CSS',
    techNotes: 'Clean UI with glassmorphism touches and smooth transitions.',
    backlog: [],
    status: 'Production',
    priority: 'High',
    lastUpdated: Date.now()
  }
];

export default function AppWallet() {
  const [apps, setApps] = useState<AppProject[]>(() => {
    const saved = localStorage.getItem(APP_WALLET_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
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
        name: '', developer: '', github: '', url: '', hosting: 'Vercel',
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
      url: formData.url || '',
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

      <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {apps.map(app => (
          <div key={app.id} className="tool-card" onClick={() => handleOpenModal(app)} style={{ cursor: 'pointer' }}>
            <div className="tool-header">
              <h2>{app.name}</h2>
              <span className={`status-badge ${app.status.toLowerCase()}`}>{app.status}</span>
            </div>
            <div className="accounts-list" style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>URL:</strong> <a href={app.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-active)', fontWeight: 'bold' }} onClick={e => e.stopPropagation()}>{app.url || 'N/A'}</a>
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
                    <label>URL</label>
                    <input className="input-text" type="text" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
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
