import { useState, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useSyncedCollection } from '../data/useSyncedCollection';
import {
  rowToAppProject,
  appProjectToRow,
  rowToBacklogItem,
  backlogItemToRow,
  seedIfEmpty,
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

export type { AppProject, BacklogItem };

const INITIAL_APP_DATA: AppProject[] = [
  {
    id: 'app-github-tokenwallet',
    title: 'Token Wallet',
    frontendUrl: 'https://token-wallet-chi.vercel.app',
    category: 'Web App',
    status: 'Production',
    priority: 'High',
    description: 'Quản lý hạn mức quota và danh mục ứng dụng portfolio.',
    isDisabled: false,
    backlog: [],
  },
  {
    id: 'app-github-beth',
    title: 'BETH',
    frontendUrl: 'https://beth-theta.vercel.app',
    category: 'Web App',
    status: 'Production',
    priority: 'High',
    description: 'Nền tảng bot giao dịch định lượng tiền điện tử.',
    isDisabled: false,
    backlog: [],
  },
];

export default function AppWallet() {
  const { permissions } = useAuth();
  const canEdit = !!permissions?.can_edit_app_wallet;

  const { items: projectItems, setItems: setProjectItems } = useSyncedCollection<
    Omit<AppProject, 'backlog'>,
    AppProjectRow
  >({
    table: 'tkw_app_projects',
    rowToItem: rowToAppProject,
    itemToRow: appProjectToRow,
    seed: seedIfEmpty([], INITIAL_APP_DATA),
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
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<{
    type: 'edit-app' | 'project-detail';
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
    if (window.confirm('Xóa dự án này?')) {
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
    const q = searchQuery.toLowerCase().trim();
    if (!q) return apps;
    return apps.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  return (
    <div className="app-wallet-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="toolbar-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            style={{ maxWidth: '350px' }}
            placeholder="Tìm ứng dụng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={handleCheckHealthAll} disabled={isCheckingHealth}>
            {isCheckingHealth ? 'Đang kiểm tra...' : 'Check Health Tất Cả'}
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            * Kiểm tra gửi URL tới dịch vụ bên thứ ba (allorigins.win)
          </span>
        </div>

        {canEdit && (
          <button className="btn btn-primary" onClick={() => handleOpenEditModal()}>
            + Thêm Dự Án
          </button>
        )}
      </div>

      <div className="apps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredApps.map((app) => (
          <div key={app.id} className={`app-card ${app.isDisabled ? 'disabled' : ''}`} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3>{app.title}</h3>
              <span className={`badge ${app.healthStatus === 'healthy' ? 'badge-success' : app.healthStatus === 'failed' ? 'badge-danger' : 'badge-secondary'}`}>
                {app.healthStatus === 'healthy' ? 'Healthy' : app.healthStatus === 'failed' ? 'Down' : 'Unknown'}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
              {app.description || 'Không có mô tả'}
            </p>

            {app.frontendUrl && (
              <a href={app.frontendUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>
                {app.frontendUrl}
              </a>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge">{app.status}</span>
              {canEdit && (
                <button className="btn btn-small" onClick={() => handleOpenEditModal(app)}>
                  Quản lý / Sửa
                </button>
              )}
            </div>
          </div>
        ))}
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
              className="input-field"
              value={modalForm.title || ''}
              onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>URL Frontend:</label>
            <input
              type="url"
              className="input-field"
              value={modalForm.frontendUrl || ''}
              onChange={(e) => setModalForm({ ...modalForm, frontendUrl: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Mô tả:</label>
            <textarea
              className="input-field"
              rows={3}
              value={modalForm.description || ''}
              onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Backlog Tasks:</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Thêm task backlog..."
                value={newBacklogTitle}
                onChange={(e) => setNewBacklogTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBacklogItem()}
              />
              <button className="btn btn-secondary" onClick={handleAddBacklogItem}>
                Thêm
              </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {modalBacklog.map((item) => (
                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>{item.title}</span>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => setModalBacklog((prev) => prev.filter((b) => b.id !== item.id))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            {activeModal.project && (
              <button className="btn btn-danger" onClick={() => handleDeleteApp(activeModal.project!.id)}>
                Xóa dự án
              </button>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveApp}>Lưu</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
