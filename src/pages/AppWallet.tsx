import { useState, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import CodeExperience from './CodeExperience';
import { supabase } from '../utils/supabaseClient';
import { useSyncedCollection } from '../data/useSyncedCollection';
import {
  rowToAppProject,
  appProjectToRow,
  rowToBacklogItem,
  backlogItemToRow,
  type AppProject,
  type BacklogItem,
  type AppProjectRow,
  type BacklogItemRow,
} from '../data/mappers';
import { newId } from '../utils/ids';
import { interpretHealth } from '../utils/health';
import { Modal } from '../components/Modal';
import { removedIds } from '../data/syncPolicy';
import { useAuth } from '../contexts/AuthContext';
import {
  SearchIcon,
  RefreshIcon,
  PlusIcon,
  EditIcon,
  ExternalLinkIcon,
  AppStoreIcon,
} from '../components/icons';

export type { AppProject, BacklogItem };

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo -> Purple
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', // Emerald -> Cyan
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', // Amber -> Red
  'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // Cyan -> Blue
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Pink -> Violet
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue -> Dark Blue
  'linear-gradient(135deg, #f97316 0%, #eab308 100%)', // Orange -> Yellow
];

function getAppGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getAppInitials(title: string): string {
  if (!title) return 'APP';
  const parts = title.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

function getFaviconUrl(url?: string): string | null {
  if (!url || !url.trim()) return null;
  try {
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(formattedUrl);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || !parsed.hostname.includes('.')) {
      return null;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=128`;
  } catch {
    return null;
  }
}

function AppIcon({ title, frontendUrl, id }: { title: string; frontendUrl?: string; id: string }) {
  const [hasError, setHasError] = useState(false);
  const faviconUrl = useMemo(() => getFaviconUrl(frontendUrl), [frontendUrl]);
  const initials = getAppInitials(title);
  const bgGradient = getAppGradient(title + id);

  return (
    <div className="store-app-icon" style={{ background: bgGradient }}>
      {faviconUrl && !hasError ? (
        <img
          src={faviconUrl}
          alt={title}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '7px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            borderRadius: '14px',
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function AppWallet() {
  const { permissions } = useAuth();
  const canEdit = !!permissions?.can_edit_app_wallet;

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isCodeExpRoute = location.pathname.includes('/code-experience') || location.pathname.includes('/notes');
  const activeTab = isCodeExpRoute || searchParams.get('tab') === 'code-experience' ? 'code-experience' : 'workspace';

  const handleSubTabChange = (tab: 'workspace' | 'code-experience') => {
    if (tab === 'code-experience') {
      setSearchParams({ tab: 'code-experience' });
    } else {
      setSearchParams({});
    }
  };

  const { items: projectItems, setItems: setProjectItems } = useSyncedCollection<
    Omit<AppProject, 'backlog'>,
    AppProjectRow
  >({
    table: 'tkw_app_projects',
    rowToItem: rowToAppProject,
    itemToRow: appProjectToRow,
    seed: (loaded) => loaded,
  });

  const { items: backlogItems, setItems: setBacklogItems } = useSyncedCollection<
    BacklogItem & { projectId: string },
    BacklogItemRow
  >({
    table: 'tkw_app_backlog_items',
    rowToItem: (row) => ({
      ...rowToBacklogItem(row),
      projectId: row.project_id,
    }),
    itemToRow: (item) => backlogItemToRow(item, item.projectId),
    seed: (loaded) => loaded,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModal, setActiveModal] = useState<{
    type: 'edit-app';
    project?: AppProject;
  } | null>(null);

  const [modalForm, setModalForm] = useState<Partial<AppProject>>({});
  const [modalBacklog, setModalBacklog] = useState<BacklogItem[]>([]);
  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthMap, setHealthMap] = useState<Record<string, 'healthy' | 'checking' | 'failed'>>({});

  // Combined Apps view
  const apps: AppProject[] = useMemo(() => {
    return projectItems.map((p) => ({
      ...p,
      healthStatus: healthMap[p.id] || 'unknown',
      backlog: backlogItems.filter((b) => b.projectId === p.id),
    }));
  }, [projectItems, backlogItems, healthMap]);

  // Dynamic Categories list extracted from projects
  const categories = useMemo(() => {
    const set = new Set<string>();
    apps.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [apps]);

  // Statistics
  const healthyCount = useMemo(() => {
    return apps.filter((a) => a.healthStatus === 'healthy').length;
  }, [apps]);

  // Manual Concurrency-Capped Health Checker (Max 5 concurrent)
  const handleCheckHealthAll = async () => {
    setIsCheckingHealth(true);

    const targets = apps.filter((a) => a.frontendUrl);
    const limit = 5;

    for (let i = 0; i < targets.length; i += limit) {
      const batch = targets.slice(i, i + limit);
      await Promise.all(
        batch.map(async (app) => {
          setHealthMap((prev) => ({ ...prev, [app.id]: 'checking' }));
          try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(app.frontendUrl!)}`;
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });
            if (!res.ok) {
              setHealthMap((prev) => ({ ...prev, [app.id]: 'failed' }));
              return;
            }
            const data = await res.json();
            const httpCode = data.status?.http_code;
            const status = interpretHealth(httpCode);
            setHealthMap((prev) => ({ ...prev, [app.id]: status }));
          } catch {
            setHealthMap((prev) => ({ ...prev, [app.id]: 'failed' }));
          }
        })
      );
    }

    setIsCheckingHealth(false);
  };

  const handleOpenEditModal = (project?: AppProject) => {
    if (project) {
      setActiveModal({ type: 'edit-app', project });
      setModalForm({ ...project });
      setModalBacklog([...(project.backlog || [])]);
    } else {
      setActiveModal({ type: 'edit-app' });
      setModalForm({
        title: '',
        frontendUrl: '',
        category: 'Web App',
        status: 'Development',
        priority: 'Medium',
        description: '',
        isDisabled: false,
      });
      setModalBacklog([]);
    }
  };

  const handleSaveApp = async () => {
    if (!modalForm.title?.trim()) return;

    if (activeModal?.project) {
      // Editing existing project
      const projectId = activeModal.project.id;
      const updatedProject: Omit<AppProject, 'backlog'> = {
        id: projectId,
        title: modalForm.title.trim(),
        frontendUrl: modalForm.frontendUrl?.trim() || '',
        category: modalForm.category || 'Web App',
        status: modalForm.status || 'Development',
        priority: modalForm.priority || 'Medium',
        description: modalForm.description || '',
        isDisabled: Boolean(modalForm.isDisabled),
      };

      setProjectItems((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

      // Diff removed backlog items and delete explicitly
      const origBacklog = activeModal.project.backlog || [];
      const deletedIds = removedIds(origBacklog, modalBacklog);

      if (deletedIds.length > 0) {
        await supabase.from('tkw_app_backlog_items').delete().in('id', deletedIds);
      }

      setBacklogItems((prev) => [
        ...prev.filter((b) => b.projectId !== projectId),
        ...modalBacklog.map((b) => ({ ...b, projectId })),
      ]);
    } else {
      // New project
      const projectId = newId('app');
      const newProj: Omit<AppProject, 'backlog'> = {
        id: projectId,
        title: modalForm.title.trim(),
        frontendUrl: modalForm.frontendUrl?.trim() || '',
        category: modalForm.category || 'Web App',
        status: modalForm.status || 'Development',
        priority: modalForm.priority || 'Medium',
        description: modalForm.description || '',
        isDisabled: Boolean(modalForm.isDisabled),
      };

      setProjectItems((prev) => [newProj, ...prev]);
      setBacklogItems((prev) => [
        ...prev,
        ...modalBacklog.map((b) => ({ ...b, projectId })),
      ]);
    }

    setActiveModal(null);
  };

  const handleDeleteApp = async (projectId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa ứng dụng này?')) {
      try {
        await supabase.from('tkw_app_backlog_items').delete().eq('project_id', projectId);
        await supabase.from('tkw_app_projects').delete().eq('id', projectId);
        setProjectItems((prev) => prev.filter((p) => p.id !== projectId));
        setBacklogItems((prev) => prev.filter((b) => b.projectId !== projectId));
        setActiveModal(null);
      } catch (err: any) {
        alert('Lỗi xóa dự án: ' + err?.message);
      }
    }
  };

  const handleAddBacklogItem = () => {
    if (!newBacklogTitle.trim()) return;
    const newItem: BacklogItem = {
      id: newId('bl'),
      title: newBacklogTitle.trim(),
      isCompleted: false,
    };
    setModalBacklog((prev) => [...prev, newItem]);
    setNewBacklogTitle('');
  };

  const filteredApps = useMemo(() => {
    let result = apps;
    const q = searchQuery.toLowerCase().trim();

    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (q) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [apps, searchQuery, selectedCategory]);

  return (
    <div className="app-wallet-container">
      {/* App Wallet Sub-Navigation Bar */}
      <div className="app-wallet-subtabs">
        <button
          className={`app-wallet-subtab ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('workspace')}
        >
          <AppStoreIcon size={18} />
          <span>App Workspace</span>
        </button>
        <button
          className={`app-wallet-subtab ${activeTab === 'code-experience' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('code-experience')}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>💡</span>
          <span>Code Experience</span>
        </button>
      </div>

      {activeTab === 'code-experience' ? (
        <CodeExperience />
      ) : (
        <>
          {/* App Store Header & Controls Card */}
      <div className="store-header-card">
        <div className="store-header-top">
          <div className="store-title-block">
            <h2>
              <AppStoreIcon size={26} />
              App Store Workspace
            </h2>
            <p>Bộ sưu tập các ứng dụng & sản phẩm hệ thống</p>
          </div>

          <div className="store-stats-pills">
            <div className="store-stat-pill">
              Tổng số app: <strong>{apps.length}</strong>
            </div>
            {healthyCount > 0 && (
              <div className="store-stat-pill active-healthy">
                Online: <strong>{healthyCount}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="store-control-bar">
          <div className="store-search-box">
            <div className="store-search-icon">
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              className="store-search-input"
              placeholder="Tìm kiếm ứng dụng, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="store-actions">
            <button
              className="btn btn-secondary"
              onClick={handleCheckHealthAll}
              disabled={isCheckingHealth}
            >
              <RefreshIcon size={15} className={isCheckingHealth ? 'spin-icon' : ''} />
              {isCheckingHealth ? 'Đang check health...' : 'Check Health Tất Cả'}
            </button>

            {canEdit && (
              <button className="btn btn-primary" onClick={() => handleOpenEditModal()}>
                <PlusIcon size={16} />
                Thêm Dự Án
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="store-categories-bar">
          <button
            className={`store-cat-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tất cả
            <span className="store-cat-count">{apps.length}</span>
          </button>

          {categories.map((cat) => {
            const count = apps.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                className={`store-cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
                <span className="store-cat-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 PER ROW APP STORE GRID */}
      <div className="store-grid">
        {filteredApps.map((app, index) => {
          const backlogCount = app.backlog?.length || 0;

          return (
            <div
              key={app.id}
              className={`store-card ${app.isDisabled ? 'disabled' : ''}`}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div>
                {/* Squircle Icon & Title Block */}
                <div className="store-card-header">
                  <AppIcon title={app.title} frontendUrl={app.frontendUrl} id={app.id} />
                  <div className="store-app-meta">
                    <div className="store-app-title" title={app.title}>
                      {app.title}
                    </div>
                    <div className="store-app-category">{app.category || 'Web App'}</div>
                  </div>
                </div>

                {/* Status Bar: Health dot + Status badge */}
                <div className="store-card-status-bar">
                  <div className="store-health-tag">
                    <span
                      className={`store-health-dot ${app.healthStatus || 'unknown'}`}
                      title={`Health status: ${app.healthStatus}`}
                    />
                    <span>
                      {app.healthStatus === 'healthy'
                        ? 'Healthy'
                        : app.healthStatus === 'failed'
                        ? 'Down'
                        : app.healthStatus === 'checking'
                        ? 'Checking...'
                        : 'Chưa check'}
                    </span>
                  </div>

                  <span className="store-status-badge">{app.status}</span>
                </div>

                {/* Description */}
                <p className="store-app-desc" title={app.description}>
                  {app.description || 'Không có mô tả cho ứng dụng này.'}
                </p>
              </div>

              {/* Card Footer: OPEN Button & Edit controls */}
              <div className="store-card-footer">
                {app.frontendUrl ? (
                  <a
                    href={app.frontendUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="store-btn-open"
                    title={`Mở ${app.title}`}
                  >
                    MỞ
                    <ExternalLinkIcon size={12} />
                  </a>
                ) : (
                  <button
                    className="store-btn-open disabled"
                    onClick={() => canEdit && handleOpenEditModal(app)}
                  >
                    Chưa có URL
                  </button>
                )}

                <div className="store-card-actions">
                  {backlogCount > 0 && (
                    <span className="store-backlog-chip" title={`${backlogCount} công việc backlog`}>
                      {backlogCount} task
                    </span>
                  )}

                  {canEdit && (
                    <button
                      className="store-icon-btn"
                      onClick={() => handleOpenEditModal(app)}
                      title="Chỉnh sửa / Quản lý"
                    >
                      <EditIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty placeholder card to add project if editor */}
        {canEdit && (
          <div className="store-card store-card-add" onClick={() => handleOpenEditModal()}>
            <div className="store-card-add-icon">
              <PlusIcon size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thêm Ứng Dụng Mới</span>
          </div>
        )}
      </div>

      {/* Edit App Modal */}
      {activeModal?.type === 'edit-app' && (
        <Modal
          title={activeModal.project ? 'Chỉnh Sửa Dự Án' : 'Thêm Dự Án Mới'}
          onClose={() => setActiveModal(null)}
          maxWidth="600px"
        >
          <div className="form-group">
            <label>Tên dự án:</label>
            <input
              type="text"
              className="input-text"
              value={modalForm.title || ''}
              onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
              placeholder="VD: JohnnyHoang's Wallet, Payment App..."
            />
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Danh mục (Category):</label>
              <input
                type="text"
                className="input-text"
                value={modalForm.category || ''}
                onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                placeholder="VD: Web App, AI Tool..."
              />
            </div>

            <div className="form-group">
              <label>Trạng thái (Status):</label>
              <select
                className="input-select"
                value={modalForm.status || 'Development'}
                onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
              >
                <option value="Production">Production</option>
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Planning">Planning</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>URL Frontend:</label>
            <input
              type="url"
              className="input-text"
              value={modalForm.frontendUrl || ''}
              onChange={(e) => setModalForm({ ...modalForm, frontendUrl: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Mô tả:</label>
            <textarea
              className="input-text"
              rows={3}
              value={modalForm.description || ''}
              onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              placeholder="Mô tả tóm tắt ứng dụng..."
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Backlog Tasks ({modalBacklog.length}):</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="input-text"
                placeholder="Thêm task backlog mới..."
                value={newBacklogTitle}
                onChange={(e) => setNewBacklogTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBacklogItem()}
              />
              <button className="btn btn-secondary" onClick={handleAddBacklogItem}>
                Thêm
              </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '160px', overflowY: 'auto' }}>
              {modalBacklog.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    marginBottom: '0.35rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>{item.title}</span>
                  <button
                    className="btn btn-icon-sm danger"
                    onClick={() => setModalBacklog((prev) => prev.filter((b) => b.id !== item.id))}
                    title="Xóa task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="modal-actions"
            style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}
          >
            {activeModal.project ? (
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteApp(activeModal.project!.id)}
              >
                Xóa dự án
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSaveApp}>
                Lưu
              </button>
            </div>
          </div>
        </Modal>
      )}
        </>
      )}
    </div>
  );
}
