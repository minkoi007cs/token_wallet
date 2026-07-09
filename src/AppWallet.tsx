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

export default function AppWallet() {
  const [apps, setApps] = useState<AppProject[]>(() => {
    const saved = localStorage.getItem(APP_WALLET_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse app wallet local storage', e);
      }
    }
    return [];
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
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* APP INFO SECTION */}
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>App Name <span style={{color: 'red'}}>*</span></label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="My Awesome App" />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input type="text" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Developer / Assignee</label>
                  <input type="text" value={formData.developer || ''} onChange={e => setFormData({...formData, developer: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>GitHub Repo</label>
                  <input type="text" value={formData.github || ''} onChange={e => setFormData({...formData, github: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option>Web App</option>
                    <option>Android App</option>
                    <option>iOS App</option>
                    <option>Desktop App</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option>Development</option>
                    <option>Production</option>
                    <option>Maintenance</option>
                    <option>Deprecated</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Hosting Provider</label>
                  <input type="text" value={formData.hosting || ''} onChange={e => setFormData({...formData, hosting: e.target.value})} placeholder="Vercel, Render, AWS..." />
                </div>
                <div className="form-group">
                  <label>Database</label>
                  <input type="text" value={formData.database || ''} onChange={e => setFormData({...formData, database: e.target.value})} placeholder="PostgreSQL, MongoDB..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Tech Stack</label>
                  <textarea value={formData.techStack || ''} onChange={e => setFormData({...formData, techStack: e.target.value})} rows={2} placeholder="React, Node.js, Tailwind..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Technical Notes</label>
                  <textarea value={formData.techNotes || ''} onChange={e => setFormData({...formData, techNotes: e.target.value})} rows={3} />
                </div>
              </div>

              <hr style={{ borderColor: 'var(--color-border)', margin: '1rem 0' }} />

              {/* BACKLOG SECTION */}
              <div className="backlog-section">
                <h4 style={{ marginBottom: '1rem' }}>Backlog & Tasks</h4>
                
                <div className="backlog-add" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 2 }}>
                    <input type="text" placeholder="Task title..." value={newBacklogTitle} onChange={e => setNewBacklogTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddBacklogItem()} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="text" placeholder="Assignee..." value={newBacklogAssignee} onChange={e => setNewBacklogAssignee(e.target.value)} />
                  </div>
                  <div>
                    <select value={newBacklogPriority} onChange={e => setNewBacklogPriority(e.target.value as any)} style={{ height: '40px' }}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleAddBacklogItem} style={{ height: '40px', padding: '0 1rem' }}>Add</button>
                </div>

                <div className="backlog-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {backlogItems.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No tasks in backlog.</p>
                  ) : (
                    backlogItems.map(item => (
                      <div key={item.id} className={`backlog-item ${item.isCompleted ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', borderLeft: `3px solid ${item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}` }}>
                        <input type="checkbox" checked={item.isCompleted} onChange={() => handleToggleBacklogItem(item.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <div style={{ flex: 1, textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--text-muted)' : 'inherit' }}>
                          <div style={{ fontWeight: '500' }}>{item.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '1rem' }}>
                            {item.assignee && <span>👤 {item.assignee}</span>}
                            <span>🕒 {formatDate(item.updatedAt)}</span>
                            {item.closedAt && <span>✓ Closed: {formatDate(item.closedAt)}</span>}
                          </div>
                        </div>
                        <button className="btn btn-sm" onClick={() => handleDeleteBacklogItem(item.id)} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none' }}>
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
