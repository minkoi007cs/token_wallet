import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface BacklogItem {
  id: string;
  title: string;
  isCompleted: boolean;
  progress?: number;
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



const INITIAL_APP_DATA: AppProject[] = [
  {
    id: 'app-github-tokenwallet',
    name: 'Token Wallet',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/TokenWallet',
    frontendUrl: 'https://token-wallet-chi.vercel.app',
    backendUrl: '',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Quản lý hạn mức (quota), thời gian đếm ngược hồi phục tài khoản AI và danh mục ứng dụng portfolio.',
    techStack: 'React, TypeScript, Vite, Vanilla CSS, Supabase',
    techNotes: 'Minimalist developer dashboard với hiệu ứng glassmorphism và đồng bộ real-time Supabase.',
    backlog: [],
    status: 'Production',
    priority: 'High',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-beth',
    name: 'BETH',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/BETH',
    frontendUrl: 'https://beth-theta.vercel.app',
    backendUrl: 'https://beth-theta.vercel.app',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Nền tảng bot giao dịch định lượng tiền điện tử tự động trên sàn Binance Testnet.',
    techStack: 'Next.js, TypeScript, React, TailwindCSS, Supabase, Binance Testnet',
    techNotes: 'Hệ thống AI Trading Hub, Decision Engine, Canary mode & kiểm soát rủi ro tự động.',
    backlog: [],
    status: 'Production',
    priority: 'High',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-game',
    name: 'gameEngG10',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/gameEngG10',
    frontendUrl: 'https://game10-iota.vercel.app',
    backendUrl: 'https://game10-backend.vercel.app',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Nền tảng trò chơi học tập tương tác tiếng Anh lớp 10 tích hợp Supabase Auth.',
    techStack: 'TypeScript, React, Vite, Node.js Backend',
    techNotes: 'Frontend deploy tại game10-iota.vercel.app, Backend API tại game10-backend.vercel.app.',
    backlog: [],
    status: 'Development',
    priority: 'High',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-ade',
    name: 'AdmissionDecisionEngine',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/AdmissionDecisionEngine',
    frontendUrl: 'https://ade-flame.vercel.app',
    backendUrl: 'https://ade-backend.vercel.app',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Hệ thống hỗ trợ ra quyết định tuyển sinh vào lớp 10 tại TP.HCM kèm dữ liệu tọa độ trường học.',
    techStack: 'TypeScript, NestJS, Vite, React, PostgreSQL',
    techNotes: 'Frontend deploy tại ade-flame.vercel.app, Backend NestJS API tại ade-backend.vercel.app.',
    backlog: [],
    status: 'Development',
    priority: 'High',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-coffee',
    name: 'coffee_shop_24hxh',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/coffee_shop_24hxh',
    frontendUrl: 'https://minkoi.org',
    backendUrl: 'https://coffee24hxh-api.vercel.app',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Hệ thống website và API quản lý quán cà phê 24h Minkoi.',
    techStack: 'TypeScript, NestJS, Vite, React, PostgreSQL',
    techNotes: 'Custom domain minkoi.org kết nối Vercel, API backend chạy trên coffee24hxh-api.vercel.app.',
    backlog: [],
    status: 'Production',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-family',
    name: 'family-management',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/family-management',
    frontendUrl: 'https://mikoi-family.vercel.app',
    backendUrl: 'https://mikoi-family-api.vercel.app',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Ứng dụng quản lý sinh hoạt, tài chính và công việc gia đình.',
    techStack: 'TypeScript, Vite, Express, PostgreSQL',
    techNotes: 'Frontend Mikoi Family tại mikoi-family.vercel.app, Backend API tại mikoi-family-api.vercel.app.',
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
    frontendUrl: 'https://qlhs-dtnt-qqib-johnnyhoang-2372s-projects.vercel.app',
    backendUrl: 'https://qlhs-dtnt.vercel.app',
    hosting: 'Vercel',
    database: 'Supabase (PostgreSQL)',
    type: 'Web App',
    description: 'Hệ thống quản lý thông tin học sinh dân tộc nội trú.',
    techStack: 'TypeScript, Express, Vite, React',
    techNotes: 'Frontend giao diện học sinh/giáo viên, backend API quản trị.',
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
    hosting: 'GitHub',
    database: '',
    type: 'Other',
    description: 'Kho lưu trữ ghi chú kỹ thuật, tài liệu và kịch bản tự động hóa nhà phát triển.',
    techStack: 'TypeScript, Python, Markdown',
    techNotes: 'Developer knowledge base và scripts indexing.',
    backlog: [],
    status: 'Development',
    priority: 'Low',
    lastUpdated: Date.now()
  },
  {
    id: 'app-github-photo',
    name: 'photo-clear-1',
    developer: 'Hoa Hoang',
    github: 'https://github.com/johnnyhoang/photo-clear-1',
    frontendUrl: '',
    backendUrl: '',
    hosting: 'Local',
    database: '',
    type: 'Desktop App',
    description: 'Công cụ tìm kiếm ảnh trùng lặp, dọn dẹp và nâng cao chất lượng ảnh.',
    techStack: 'Python, OpenCV, PyQt',
    techNotes: 'Xử lý ảnh local và lọc ảnh trùng lặp thông minh.',
    backlog: [],
    status: 'Development',
    priority: 'Low',
    lastUpdated: Date.now()
  },
  {
    id: 'app-supabase-canvas',
    name: 'Canvas',
    developer: 'Hoa Hoang',
    github: '',
    frontendUrl: 'https://supabase.com/dashboard/project/xzmqeibqvgrthuisghvu',
    backendUrl: '',
    hosting: 'Supabase',
    database: 'Supabase (PostgreSQL)',
    type: 'Other',
    description: 'Dự án cơ sở dữ liệu Canvas trên Supabase.',
    techStack: 'Supabase, PostgreSQL',
    techNotes: 'Bảng dữ liệu và schema cho ứng dụng Canvas.',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  },
  {
    id: 'app-supabase-houserenting',
    name: 'house_renting',
    developer: 'Hoa Hoang',
    github: '',
    frontendUrl: 'https://supabase.com/dashboard/project/lnuijfoohwvunatwuqjx',
    backendUrl: '',
    hosting: 'Supabase',
    database: 'Supabase (PostgreSQL)',
    type: 'Other',
    description: 'Dự án cơ sở dữ liệu quản lý thuê nhà trên Supabase.',
    techStack: 'Supabase, PostgreSQL',
    techNotes: 'Bảng dữ liệu và schema quản lý bất động sản cho thuê.',
    backlog: [],
    status: 'Development',
    priority: 'Medium',
    lastUpdated: Date.now()
  }
];

export default function AppWallet() {
  const [apps, setApps] = useState<AppProject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      const { data: appsData, error: appsError } = await supabase.from('tkw_app_projects').select('*');
      const { data: backlogData, error: backlogError } = await supabase.from('tkw_app_backlog_items').select('*');

      if (!appsError && !backlogError && appsData && backlogData) {
        const loadedApps: AppProject[] = appsData.map(p => ({
          id: p.id,
          name: p.name,
          developer: p.developer || '',
          github: p.github || '',
          frontendUrl: p.url || '', // database column is `url`
          backendUrl: p.backend_url || '',
          hosting: p.hosting || '',
          database: p.database || '',
          type: p.type || '',
          description: p.description || '',
          techStack: p.tech_stack || '',
          techNotes: p.tech_notes || '',
          status: p.status || 'Development',
          priority: p.priority || 'Medium',
          lastUpdated: p.last_updated ? Number(p.last_updated) : Date.now(),
          isDisabled: false, // DB doesn't have disabled for app projects
          backlog: backlogData
            .filter(b => b.project_id === p.id)
            .map(b => ({
              id: b.id,
              title: b.title,
              isCompleted: !!b.is_completed,
              progress: b.progress ? Number(b.progress) : 0,
              assignee: b.assignee || '',
              priority: b.priority as any,
              createdAt: b.created_at ? Number(b.created_at) : Date.now(),
              updatedAt: b.updated_at ? Number(b.updated_at) : Date.now(),
              closedAt: b.closed_at ? Number(b.closed_at) : undefined
            }))
        }));

        if (loadedApps.length > 0) {
          const missingApps = INITIAL_APP_DATA.filter(initApp =>
            !loadedApps.some((p: AppProject) => p.name === initApp.name)
          );
          setApps([...loadedApps, ...missingApps]);
        } else {
          setApps(INITIAL_APP_DATA);
        }
      } else {
         setApps(INITIAL_APP_DATA);
      }
      setIsLoaded(true);
    };
    fetchApps();
  }, []);

  const [activeModal, setActiveModal] = useState<
    | null
    | { type: 'edit-app'; app: AppProject | null } // if null, it's "Add App"
    | { type: 'project-detail'; app: AppProject }
    | { type: 'edit-backlog'; app: AppProject; backlogId?: string }
  >(null);

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [sortBy, setSortBy] = useState<'lastUpdated' | 'name' | 'priority' | 'backlog'>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [formData, setFormData] = useState<Partial<AppProject>>({});
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [newBacklogAssignee, setNewBacklogAssignee] = useState('');
  const [newBacklogPriority, setNewBacklogPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Available unique types from apps
  const availableTypes = useMemo(() => {
    const defaultTypes = ['Web App', 'Android App', 'iOS App', 'Desktop App', 'Other'];
    const customTypes = apps.map(a => a.type).filter(Boolean);
    return Array.from(new Set([...defaultTypes, ...customTypes]));
  }, [apps]);

  // Check if any filter or search is active
  const isFilterActive = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      statusFilter !== 'ALL' ||
      typeFilter !== 'ALL' ||
      priorityFilter !== 'ALL' ||
      visibilityFilter !== 'ALL'
    );
  }, [searchQuery, statusFilter, typeFilter, priorityFilter, visibilityFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setPriorityFilter('ALL');
    setVisibilityFilter('ALL');
    setSortBy('lastUpdated');
    setSortOrder('desc');
  };

  // Filtered & Sorted Apps
  const filteredAndSortedApps = useMemo(() => {
    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

    return apps
      .filter(app => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (app.name || '').toLowerCase().includes(q);
          const matchesDev = (app.developer || '').toLowerCase().includes(q);
          const matchesTech = (app.techStack || '').toLowerCase().includes(q);
          const matchesDesc = (app.description || '').toLowerCase().includes(q);
          const matchesType = (app.type || '').toLowerCase().includes(q);
          const matchesHost = (app.hosting || '').toLowerCase().includes(q);
          if (!matchesName && !matchesDev && !matchesTech && !matchesDesc && !matchesType && !matchesHost) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL' && (app.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        // 3. Type Filter
        if (typeFilter !== 'ALL' && (app.type || '').toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }

        // 4. Priority Filter
        if (priorityFilter !== 'ALL' && (app.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) {
          return false;
        }

        // 5. Visibility Filter
        if (visibilityFilter === 'ACTIVE' && app.isDisabled) {
          return false;
        }
        if (visibilityFilter === 'DISABLED' && !app.isDisabled) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = (a.name || '').localeCompare(b.name || '');
        } else if (sortBy === 'lastUpdated') {
          comparison = (a.lastUpdated || 0) - (b.lastUpdated || 0);
        } else if (sortBy === 'priority') {
          const weightA = priorityWeight[a.priority] || 0;
          const weightB = priorityWeight[b.priority] || 0;
          comparison = weightA - weightB;
        } else if (sortBy === 'backlog') {
          comparison = (a.backlog?.length || 0) - (b.backlog?.length || 0);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [apps, searchQuery, statusFilter, typeFilter, priorityFilter, visibilityFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!isLoaded) return;
    const syncToSupabase = async () => {
      // 1. Upsert apps
      if (apps.length > 0) {
        const appsData = apps.map(p => ({
          id: p.id,
          name: p.name,
          developer: p.developer,
          github: p.github,
          url: p.frontendUrl,
          backend_url: p.backendUrl,
          hosting: p.hosting,
          database: p.database,
          type: p.type,
          description: p.description,
          tech_stack: p.techStack,
          tech_notes: p.techNotes,
          status: p.status,
          priority: p.priority,
          last_updated: p.lastUpdated
        }));
        await supabase.from('tkw_app_projects').upsert(appsData);
      }

      // 2. Upsert backlog
      const backlogData = apps.flatMap(p => p.backlog.map(b => ({
        id: b.id,
        project_id: p.id,
        title: b.title,
        is_completed: b.isCompleted,
        progress: b.progress || 0,
        assignee: b.assignee,
        priority: b.priority,
        created_at: b.createdAt,
        updated_at: b.updatedAt,
        closed_at: b.closedAt || null
      })));
      if (backlogData.length > 0) {
        await supabase.from('tkw_app_backlog_items').upsert(backlogData);
      }

      // 3. Cleanup deleted backlog items
      const backlogIds = apps.flatMap(p => p.backlog.map(b => b.id));
      if (backlogIds.length > 0) {
        await supabase.from('tkw_app_backlog_items').delete().not('id', 'in', `(${backlogIds.map(id => `"${id}"`).join(',')})`);
      } else {
        await supabase.from('tkw_app_backlog_items').delete().neq('id', 'non_existent');
      }

      // 4. Cleanup deleted apps
      const appIds = apps.map(p => p.id);
      if (appIds.length > 0) {
        await supabase.from('tkw_app_projects').delete().not('id', 'in', `(${appIds.map(id => `"${id}"`).join(',')})`);
      } else {
        await supabase.from('tkw_app_projects').delete().neq('id', 'non_existent');
      }
    };
    syncToSupabase();
  }, [apps, isLoaded]);

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

  const handleUpdateBacklogProgress = (appId: string, backlogId: string, progress: number) => {
    setApps(prev => prev.map(a => {
      if (a.id !== appId) return a;
      return {
        ...a,
        backlog: a.backlog.map(b => {
          if (b.id !== backlogId) return b;
          const isCompleted = progress === 100;
          return {
            ...b,
            progress,
            isCompleted,
            closedAt: isCompleted && !b.isCompleted ? Date.now() : (isCompleted ? b.closedAt : undefined)
          };
        })
      };
    }));
    
    // Also update activeModal if we are currently viewing it
    setActiveModal(current => {
      if (current?.type === 'project-detail' && current.app.id === appId) {
        const updatedApp = apps.find(a => a.id === appId);
        // The state isn't updated yet in this closure, so we manually apply it to the modal
        if (updatedApp) {
          const newBacklogs = updatedApp.backlog.map(b => {
            if (b.id !== backlogId) return b;
            const isCompleted = progress === 100;
            return {
              ...b,
              progress,
              isCompleted,
              closedAt: isCompleted && !b.isCompleted ? Date.now() : (isCompleted ? b.closedAt : undefined)
            };
          });
          return { ...current, app: { ...updatedApp, backlog: newBacklogs } };
        }
      }
      return current;
    });
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
    <div className="app-wallet-container" style={{ padding: '0', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      {/* STICKY HEADER & FILTER TOOLBAR */}
      <div className="app-wallet-sticky-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Apps Portfolio</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New App
          </button>
        </div>

        {/* FILTER, SEARCH & SORT TOOLBAR */}
        <div className="app-filter-toolbar">
        <div className="filter-main-row">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <span className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="search-input-field"
              placeholder="Search apps by name, tech, developer, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="filter-selects-group">
            {/* Status Filter */}
            <select
              className={`toolbar-select ${statusFilter !== 'ALL' ? 'active-filter' : ''}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by Status"
            >
              <option value="ALL">All Status</option>
              <option value="Production">Production</option>
              <option value="Development">Development</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Deprecated">Deprecated</option>
            </select>

            {/* Type Filter */}
            <select
              className={`toolbar-select ${typeFilter !== 'ALL' ? 'active-filter' : ''}`}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              title="Filter by Type"
            >
              <option value="ALL">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className={`toolbar-select ${priorityFilter !== 'ALL' ? 'active-filter' : ''}`}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              title="Filter by Priority"
            >
              <option value="ALL">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Visibility / Active Filter */}
            <select
              className={`toolbar-select ${visibilityFilter !== 'ALL' ? 'active-filter' : ''}`}
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              title="Filter by Visibility"
            >
              <option value="ALL">All Visibility</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DISABLED">Disabled Only</option>
            </select>

            {/* Sort Criteria */}
            <select
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort By"
            >
              <option value="lastUpdated">Sort by: Updated</option>
              <option value="name">Sort by: Name</option>
              <option value="priority">Sort by: Priority</option>
              <option value="backlog">Sort by: Backlog Tasks</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              className="sort-direction-btn"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascending (A-Z, Low-High, Oldest-Newest). Click to switch to Descending' : 'Descending (Z-A, High-Low, Newest-Oldest). Click to switch to Ascending'}
            >
              {sortOrder === 'asc' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7-7-7 7" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7 7 7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Filter Summary & Active Chips Row */}
        <div className="filter-sub-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>
              Showing <strong style={{ color: 'var(--text-main)' }}>{filteredAndSortedApps.length}</strong> of {apps.length} apps
            </span>

            {/* Active Chips */}
            {isFilterActive && (
              <div className="filter-chips-list">
                {searchQuery.trim() && (
                  <span className="filter-chip">
                    Search: "{searchQuery.trim()}"
                    <span className="filter-chip-remove" onClick={() => setSearchQuery('')}>✕</span>
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="filter-chip">
                    Status: {statusFilter}
                    <span className="filter-chip-remove" onClick={() => setStatusFilter('ALL')}>✕</span>
                  </span>
                )}
                {typeFilter !== 'ALL' && (
                  <span className="filter-chip">
                    Type: {typeFilter}
                    <span className="filter-chip-remove" onClick={() => setTypeFilter('ALL')}>✕</span>
                  </span>
                )}
                {priorityFilter !== 'ALL' && (
                  <span className="filter-chip">
                    Priority: {priorityFilter}
                    <span className="filter-chip-remove" onClick={() => setPriorityFilter('ALL')}>✕</span>
                  </span>
                )}
                {visibilityFilter !== 'ALL' && (
                  <span className="filter-chip">
                    {visibilityFilter === 'ACTIVE' ? 'Active only' : 'Disabled only'}
                    <span className="filter-chip-remove" onClick={() => setVisibilityFilter('ALL')}>✕</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {isFilterActive && (
            <button className="btn-reset-filters" onClick={handleResetFilters}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset Filters
            </button>
          )}
        </div>
      </div>
      </div>

      {/* APPS LIST GRID */}
      <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {filteredAndSortedApps.map(app => (
          <div key={app.id} className={`tool-card ${app.isDisabled ? 'disabled' : ''}`} style={{ position: 'relative', opacity: app.isDisabled ? 0.6 : 1, transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => setActiveModal({ type: 'project-detail', app })}>
            <div className="tool-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h2
                  onClick={() => app.frontendUrl ? window.open(app.frontendUrl, '_blank') : null}
                  style={{ cursor: app.frontendUrl ? 'pointer' : 'default', textDecoration: app.frontendUrl ? 'underline' : 'none' }}
                  title={app.frontendUrl ? `Open ${app.frontendUrl}` : ''}
                >
                  {app.name}
                </h2>
                <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`status-badge ${app.status?.toLowerCase()}`}>{app.status}</span>
                  {app.priority && (
                    <span className={`priority-badge ${app.priority.toLowerCase()}`}>
                      {app.priority}
                    </span>
                  )}
                  {app.isDisabled && <span className="status-badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--text-muted)' }}>DISABLED</span>}
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

        {/* Empty States */}
        {apps.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <p>No apps yet. Click "Add New App" to start building your portfolio.</p>
          </div>
        )}

        {apps.length > 0 && filteredAndSortedApps.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              No matching apps found
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Try adjusting your search keywords or clearing some filters.
            </p>
            <button className="btn btn-primary btn-sm" onClick={handleResetFilters}>
              Clear All Filters
            </button>
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
      {/* PROJECT DETAIL MODAL */}
      {activeModal && activeModal.type === 'project-detail' && activeModal.app && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {activeModal.app.name}
                  <span className={`status-badge ${activeModal.app.status.toLowerCase()}`}>{activeModal.app.status}</span>
                </h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Developer: {activeModal.app.developer || 'N/A'} | Updated: {formatDate(activeModal.app.lastUpdated)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn" onClick={() => handleOpenModal(activeModal.app)}>
                  Edit Project
                </button>
                <button className="btn" onClick={() => setActiveModal(null)}>Close</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Info */}
              <div style={{ flex: '1', padding: '2rem', overflowY: 'auto', borderRight: '1px solid var(--color-border)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Project Details</h3>
                
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{activeModal.app.description || 'No description provided.'}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Frontend URL</label>
                      {activeModal.app.frontendUrl ? <a href={activeModal.app.frontendUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-active)' }}>{activeModal.app.frontendUrl}</a> : 'N/A'}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Backend URL</label>
                      {activeModal.app.backendUrl ? <a href={activeModal.app.backendUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-active)' }}>{activeModal.app.backendUrl}</a> : 'N/A'}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Hosting</label>
                      <div>{activeModal.app.hosting || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Database</label>
                      <div>{activeModal.app.database || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Type</label>
                      <div>{activeModal.app.type || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>GitHub Repo</label>
                      {activeModal.app.github ? <a href={activeModal.app.github} target="_blank" rel="noreferrer" style={{ color: 'var(--color-active)' }}>Repository Link</a> : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tech Stack</label>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      {activeModal.app.techStack || 'None specified'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Technical Notes</label>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', whiteSpace: 'pre-wrap' }}>
                      {activeModal.app.techNotes || 'None specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Backlog */}
              <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)' }}>
                <div style={{ padding: '2rem 2rem 1rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Backlog & Tasks
                      <span className="badge" style={{ marginLeft: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-active)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                        {activeModal.app.backlog.filter(b => b.isCompleted).length} / {activeModal.app.backlog.length} Done
                      </span>
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveModal({ type: 'edit-backlog', app: activeModal.app! })}>
                      + Add Task
                    </button>
                  </h3>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
                  {activeModal.app.backlog.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No tasks yet. Click "+ Add Task" to get started.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {activeModal.app.backlog.map(item => (
                        <div key={item.id} style={{ 
                          padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', 
                          border: `1px solid var(--color-border)`, borderLeft: `4px solid ${item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}`,
                          opacity: item.isCompleted ? 0.6 : 1, position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setActiveModal({ type: 'edit-backlog', app: activeModal.app!, backlogId: item.id })}>
                            <div style={{ fontWeight: '600', fontSize: '1rem', textDecoration: item.isCompleted ? 'line-through' : 'none' }}>
                              {item.title}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {item.assignee && (
                                <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                                  @{item.assignee}
                                </span>
                              )}
                              <button className="btn btn-sm" style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setActiveModal({ type: 'edit-backlog', app: activeModal.app!, backlogId: item.id }); }}>
                                Edit
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '40px' }}>{item.progress || 0}%</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={item.progress || 0}
                              onChange={(e) => handleUpdateBacklogProgress(activeModal.app!.id, item.id, parseInt(e.target.value))}
                              style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--color-active)' }}
                            />
                            {item.isCompleted && (
                              <span style={{ color: '#10b981' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EDIT BACKLOG MODAL */}
      {activeModal && activeModal.type === 'edit-backlog' && activeModal.app && (
        <div className="modal-overlay" onClick={() => setActiveModal({ type: 'project-detail', app: activeModal.app! })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              {activeModal.backlogId ? 'Edit Task' : 'Add New Task'}
            </h3>
            
            <div className="form-group">
              <label>Task Title</label>
              <input 
                className="input-text" 
                type="text" 
                placeholder="What needs to be done?" 
                defaultValue={activeModal.backlogId ? activeModal.app.backlog.find(b => b.id === activeModal.backlogId)?.title : ''}
                id="backlog-title-input"
              />
            </div>
            
            <div className="form-group">
              <label>Assignee</label>
              <input 
                className="input-text" 
                type="text" 
                placeholder="@username" 
                defaultValue={activeModal.backlogId ? activeModal.app.backlog.find(b => b.id === activeModal.backlogId)?.assignee : ''}
                id="backlog-assignee-input"
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select 
                className="input-select" 
                defaultValue={activeModal.backlogId ? activeModal.app.backlog.find(b => b.id === activeModal.backlogId)?.priority : 'Medium'}
                id="backlog-priority-input"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              {activeModal.backlogId ? (
                <button 
                  className="btn" 
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  onClick={() => {
                    const appId = activeModal.app!.id;
                    const bId = activeModal.backlogId!;
                    setApps(prev => prev.map(a => a.id !== appId ? a : { ...a, backlog: a.backlog.filter(b => b.id !== bId) }));
                    setActiveModal(curr => {
                      if (curr?.type === 'edit-backlog') {
                        const updApp = apps.find(a => a.id === appId);
                        return { type: 'project-detail', app: { ...updApp!, backlog: updApp!.backlog.filter(b => b.id !== bId) } };
                      }
                      return null;
                    });
                  }}
                >
                  Delete Task
                </button>
              ) : <div></div>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setActiveModal({ type: 'project-detail', app: activeModal.app! })}>Cancel</button>
                <button className="btn btn-primary" onClick={() => {
                  const title = (document.getElementById('backlog-title-input') as HTMLInputElement).value;
                  const assignee = (document.getElementById('backlog-assignee-input') as HTMLInputElement).value;
                  const priority = (document.getElementById('backlog-priority-input') as HTMLSelectElement).value as any;
                  if (!title.trim()) return;

                  const appId = activeModal.app!.id;
                  let newBacklogs = [];
                  
                  if (activeModal.backlogId) {
                    newBacklogs = activeModal.app!.backlog.map(b => b.id === activeModal.backlogId ? { ...b, title, assignee, priority, updatedAt: Date.now() } : b);
                  } else {
                    const newTask: BacklogItem = { id: `bl-${Date.now()}`, title, assignee, priority, isCompleted: false, progress: 0, createdAt: Date.now(), updatedAt: Date.now() };
                    newBacklogs = [...activeModal.app!.backlog, newTask];
                  }

                  setApps(prev => prev.map(a => a.id !== appId ? a : { ...a, backlog: newBacklogs }));
                  
                  // Navigate back to project-detail with the updated app
                  const updApp = apps.find(a => a.id === appId);
                  setActiveModal({ type: 'project-detail', app: { ...updApp!, backlog: newBacklogs } });
                }}>
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
