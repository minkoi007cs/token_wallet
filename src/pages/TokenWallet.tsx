import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  parseResetTime,
  formatResetTime,
  formatVerboseCountdown,
  formatVerboseResetTime,
  getRemainingDurationString,
  rollForward,
} from '../utils/timeParser';
import { supabase } from '../utils/supabaseClient';
import {
  type Account,
  type AITool,
  type AccountRow,
  type ToolRow,
  rowToAccount,
  accountToRow,
  toolToRow,
} from '../data/mappers';
import { AccountCard } from '../components/AccountCard';
import { Toolbar, type FilterOption, type ActiveFilterChip } from '../components/Toolbar';
import { Modal } from '../components/Modal';
import {
  CopilotIcon,
  ClaudeIcon,
  GeminiIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
} from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { newId } from '../utils/ids';

export type { Account, AITool };

const DEFAULT_DATA: AITool[] = [
  {
    id: 'claudecode',
    name: 'Claude Code',
    accounts: [
      { id: 'claudecode-1', name: 'Claude Work', loginHint: 'work@company.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
      { id: 'claudecode-2', name: 'Claude Personal', loginHint: 'personal@gmail.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
    ],
  },
  {
    id: 'antigravity',
    name: 'AntiGravity',
    accounts: [
      { id: 'antigravity-1', name: 'AG Main', loginHint: 'lead@deepmind.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
      { id: 'antigravity-2', name: 'AG Backup', loginHint: 'backup@gmail.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
    ],
  },
  {
    id: 'codex',
    name: 'Codex / Copilot',
    accounts: [
      { id: 'codex-1', name: 'Copilot Dev', loginHint: 'dev@github.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
    ],
  },
];

function getToolBrandIcon(toolId: string, toolName: string) {
  const lower = (toolId + ' ' + toolName).toLowerCase();
  if (lower.includes('copilot') || lower.includes('codex') || lower.includes('github')) {
    return <CopilotIcon size={22} />;
  }
  if (lower.includes('claude')) {
    return <ClaudeIcon size={22} />;
  }
  if (lower.includes('antigravity') || lower.includes('gemini') || lower.includes('deepmind')) {
    return <GeminiIcon size={22} />;
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
  );
}

// Due date input format helpers
function formatDueDateInput(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function parseDueDateInput(input: string): number | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function formatAmountInput(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const numericString = String(value).replace(/\D/g, '');
  if (!numericString) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(numericString, 10));
}

function parseAmountInput(input: string): number | undefined {
  const numericString = input.replace(/\D/g, '');
  if (!numericString) return undefined;
  return parseInt(numericString, 10);
}

const LOCAL_STORAGE_KEY = 'ai_token_manager_tools';

export default function TokenWallet() {
  const { permissions, isGuestMode } = useAuth();
  const canEdit = isGuestMode || Boolean(permissions?.can_edit_token_wallet);

  const [tools, setTools] = useState<AITool[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSupabasePaused, setIsSupabasePaused] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Prevent initial load from writing back to remote DB
  const isInitialLoadRef = useRef(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    const fetchToolsAndAccounts = async () => {
      try {
        const { data: toolsData, error: toolsError } = await supabase.from('tkw_ai_tools').select('*');
        const { data: accountsData, error: accountsError } = await supabase.from('tkw_ai_accounts').select('*');

        if (toolsError || accountsError) {
          console.warn('Supabase fetch failed, checking local backup:', toolsError || accountsError);
          setIsSupabasePaused(true);
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            try {
              setTools(JSON.parse(cached));
            } catch {
              setTools(DEFAULT_DATA);
            }
          } else {
            setTools(DEFAULT_DATA);
          }
        } else if (toolsData && accountsData) {
          setIsSupabasePaused(false);
          const loadedTools: AITool[] = (toolsData as ToolRow[]).map(t => {
            const toolAccounts = (accountsData as AccountRow[])
              .filter(a => a.tool_id === t.id)
              .map(rowToAccount);

            return {
              id: t.id,
              name: t.name,
              resetCycleHours: t.reset_cycle_hours || 5,
              displayOrder: t.display_order,
              accounts: toolAccounts,
            };
          });

          if (loadedTools.length > 0) {
            setTools(loadedTools);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadedTools));
          } else {
            const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (cached) {
              try {
                setTools(JSON.parse(cached));
              } catch {
                setTools(DEFAULT_DATA);
              }
            } else {
              setTools(DEFAULT_DATA);
            }
          }
        }
      } catch (err) {
        console.error('Initial load exception:', err);
        setIsSupabasePaused(true);
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        setTools(cached ? JSON.parse(cached) : DEFAULT_DATA);
      } finally {
        setIsLoaded(true);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 1000);
      }
    };

    fetchToolsAndAccounts();
  }, []);

  // Safe Debounced Sync to Supabase & LocalStorage
  useEffect(() => {
    if (!isLoaded || isInitialLoadRef.current) return;

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tools));

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (isSupabasePaused) return;

      try {
        setIsSyncing(true);

        if (tools.length > 0) {
          const toolsRows = tools.map(t => toolToRow(t));
          await supabase.from('tkw_ai_tools').upsert(toolsRows);
        }

        const accountsRows = tools.flatMap(t =>
          t.accounts.map(a => accountToRow(a, t.id))
        );
        if (accountsRows.length > 0) {
          await supabase.from('tkw_ai_accounts').upsert(accountsRows);
        }
      } catch (err) {
        console.error('Debounced sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 600);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [tools, isLoaded, isSupabasePaused]);

  // 1Hz Display Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rollover Scanner: checks every 10s if any account has reached 0
  useEffect(() => {
    const scanner = setInterval(() => {
      const now = Date.now();
      let hasRollover = false;

      const nextTools = tools.map(tool => {
        const nextAccounts = tool.accounts.map(acc => {
          if (acc.disabled) return acc;
          if (acc.resetTime && acc.resetTime <= now) {
            hasRollover = true;
            const nextReset = rollForward(acc.resetTime, now);
            return {
              ...acc,
              status: 'active' as const,
              resetTime: nextReset,
              exhaustedType: undefined,
            };
          }
          return acc;
        });
        return { ...tool, accounts: nextAccounts };
      });

      if (hasRollover) {
        setTools(nextTools);
      }
    }, 10000);

    return () => clearInterval(scanner);
  }, [tools]);

  // Modal State
  const [activeModal, setActiveModal] = useState<
    | null
    | { type: 'manage-account'; toolId: string; accountId: string }
    | { type: 'add-account'; toolId: string }
    | { type: 'add-tool' }
    | { type: 'rename-tool'; toolId: string }
  >(null);

  // Modal Input Fields
  const [customResetInput, setCustomResetInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<number | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [dueAmountInput, setDueAmountInput] = useState('');
  const [dueNoteInput, setDueNoteInput] = useState('');
  const [noDue, setNoDue] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newLoginHint, setNewLoginHint] = useState('');
  const [toolRenameText, setToolRenameText] = useState('');
  const [accountRenameText, setAccountRenameText] = useState('');
  const [loginHintInput, setLoginHintInput] = useState('');
  const [accountGroupSelect, setAccountGroupSelect] = useState('');

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'exhausted'>('ALL');
  const [toolFilter, setToolFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState<'ALL' | 'DUE_SOON' | 'OVERDUE' | 'HAS_DUE' | 'NO_DUE'>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [sortBy, setSortBy] = useState<'resetTime' | 'name' | 'dueDate' | 'status'>('resetTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Live preview parser inside manage-account modal
  useEffect(() => {
    if (activeModal?.type === 'manage-account') {
      const trimmed = customResetInput.trim();
      if (!trimmed) {
        setParsedPreview(null);
        setInputError(null);
        return;
      }
      const parsed = parseResetTime(trimmed);
      if (parsed === null) {
        setParsedPreview(null);
        setInputError('Không nhận diện được định dạng này. Thử: 5h, 2 days, 16:30, Jul 12 2:36PM');
      } else if (parsed <= Date.now()) {
        setParsedPreview(null);
        setInputError('Thời điểm này đã ở trong quá khứ. Vui lòng nhập thời gian tương lai.');
      } else {
        setParsedPreview(parsed);
        setInputError(null);
      }
    } else {
      setCustomResetInput('');
      setParsedPreview(null);
      setInputError(null);
    }
  }, [customResetInput, activeModal]);

  const handleCloseModal = () => {
    setActiveModal(null);
    setNewToolName('');
    setNewAccountName('');
    setNewLoginHint('');
    setToolRenameText('');
    setAccountRenameText('');
    setLoginHintInput('');
    setDueDateInput('');
    setDueAmountInput('');
    setDueNoteInput('');
    setNoDue(false);
  };

  let selectedTool: AITool | undefined;
  let selectedAccount: Account | undefined;
  if (activeModal?.type === 'manage-account') {
    selectedTool = tools.find(t => t.id === activeModal.toolId);
    selectedAccount = selectedTool?.accounts.find(a => a.id === activeModal.accountId);
  }

  // Quick Action: 1-Click Toggle Active <-> Exhausted directly from AccountCard
  const handleQuickToggleStatus = useCallback((account: Account, toolId: string) => {
    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: t.accounts.map(a => {
            if (a.id !== account.id) return a;
            if (a.status === 'active') {
              return {
                ...a,
                status: 'exhausted',
                exhaustedType: '5h',
                resetTime: a.resetTime && a.resetTime > Date.now() ? a.resetTime : Date.now() + 5 * 3600 * 1000,
              };
            } else {
              return {
                ...a,
                status: 'active',
                exhaustedType: undefined,
              };
            }
          }),
        };
      })
    );
  }, []);

  const handleMarkExhausted = (toolId: string, accountId: string, resetTime: number) => {
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
              exhaustedType: 'custom',
              resetTime,
            };
          }),
        };
      })
    );
    handleCloseModal();
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
              exhaustedType: undefined,
            };
          }),
        };
      })
    );
    handleCloseModal();
  };

  const handleRemoveAccount = async (toolId: string, accountId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) return;

    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: t.accounts.filter(a => a.id !== accountId),
        };
      })
    );

    try {
      await supabase.from('tkw_ai_accounts').delete().eq('id', accountId);
    } catch (err) {
      console.warn('Error deleting account on Supabase:', err);
    }

    handleCloseModal();
  };

  const handleRemoveTool = async (toolId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm công cụ này cùng tất cả tài khoản bên trong?')) return;

    setTools(prev => prev.filter(t => t.id !== toolId));

    try {
      await supabase.from('tkw_ai_accounts').delete().eq('tool_id', toolId);
      await supabase.from('tkw_ai_tools').delete().eq('id', toolId);
    } catch (err) {
      console.warn('Error deleting tool on Supabase:', err);
    }
  };

  const handleAddAccount = (toolId: string) => {
    if (!newAccountName.trim()) return;
    const generatedId = newId(`${toolId}`);

    setTools(prev =>
      prev.map(t => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          accounts: [
            ...t.accounts,
            {
              id: generatedId,
              name: newAccountName.trim(),
              loginHint: newLoginHint.trim() || undefined,
              status: 'active',
              resetTime: Date.now() + 5 * 3600 * 1000,
            },
          ],
        };
      })
    );
    handleCloseModal();
  };

  const handleAddTool = () => {
    if (!newToolName.trim()) return;
    const newToolId = newToolName.toLowerCase().replace(/\s+/g, '-');
    if (tools.some(t => t.id === newToolId)) {
      alert('Nhóm công cụ này đã tồn tại!');
      return;
    }

    setTools(prev => [
      ...prev,
      {
        id: newToolId,
        name: newToolName.trim(),
        accounts: [],
      },
    ]);
    handleCloseModal();
  };

  const handleRenameTool = (toolId: string) => {
    if (!toolRenameText.trim()) return;
    setTools(prev =>
      prev.map(t => (t.id === toolId ? { ...t, name: toolRenameText.trim() } : t))
    );
    handleCloseModal();
  };

  const handleUpdateAccountDetails = () => {
    if (!selectedAccount || !selectedTool) return;
    const oldToolId = selectedTool.id;
    const newToolId = accountGroupSelect || oldToolId;
    const parsedDue = parseDueDateInput(dueDateInput);
    const amount = parseAmountInput(dueAmountInput);

    setTools(prev => {
      const next = [...prev];
      if (oldToolId !== newToolId) {
        const oldIndex = next.findIndex(t => t.id === oldToolId);
        const newIndex = next.findIndex(t => t.id === newToolId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const acc = next[oldIndex].accounts.find(a => a.id === selectedAccount!.id);
          if (acc) {
            next[oldIndex] = {
              ...next[oldIndex],
              accounts: next[oldIndex].accounts.filter(a => a.id !== selectedAccount!.id),
            };
            next[newIndex] = {
              ...next[newIndex],
              accounts: [
                ...next[newIndex].accounts,
                {
                  ...acc,
                  name: accountRenameText.trim() || acc.name,
                  loginHint: loginHintInput.trim() || undefined,
                  dueDate: parsedDue ?? undefined,
                  dueAmount: amount,
                  dueNote: dueNoteInput.trim() || undefined,
                  noDue,
                },
              ],
            };
          }
        }
      } else {
        const tIndex = next.findIndex(t => t.id === oldToolId);
        if (tIndex !== -1) {
          next[tIndex] = {
            ...next[tIndex],
            accounts: next[tIndex].accounts.map(a =>
              a.id !== selectedAccount!.id
                ? a
                : {
                    ...a,
                    name: accountRenameText.trim() || a.name,
                    loginHint: loginHintInput.trim() || undefined,
                    dueDate: parsedDue ?? undefined,
                    dueAmount: amount,
                    dueNote: dueNoteInput.trim() || undefined,
                    noDue,
                  }
            ),
          };
        }
      }
      return next;
    });

    handleCloseModal();
  };

  const handleToggleDisabled = () => {
    if (!selectedAccount || !selectedTool) return;
    setTools(prev =>
      prev.map(t => {
        if (t.id !== selectedTool!.id) return t;
        return {
          ...t,
          accounts: t.accounts.map(a =>
            a.id !== selectedAccount!.id ? a : { ...a, disabled: !a.disabled }
          ),
        };
      })
    );
    handleCloseModal();
  };

  const applyDurationPreset = (hours: number) => {
    const target = Date.now() + hours * 3600 * 1000;
    setCustomResetInput(`${hours}h`);
    setParsedPreview(target);
    setInputError(null);
  };

  const filteredAndSortedTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return tools
      .filter(tool => {
        if (toolFilter !== 'ALL' && tool.id !== toolFilter) return false;
        return true;
      })
      .map(tool => {
        const matchingAccounts = tool.accounts.filter(acc => {
          if (q) {
            const matchesName = (acc.name || '').toLowerCase().includes(q);
            const matchesTool = (tool.name || '').toLowerCase().includes(q);
            const matchesHint = (acc.loginHint || '').toLowerCase().includes(q);
            const matchesNote = (acc.dueNote || '').toLowerCase().includes(q);
            if (!matchesName && !matchesTool && !matchesHint && !matchesNote) {
              return false;
            }
          }

          if (statusFilter !== 'ALL' && acc.status !== statusFilter) return false;
          if (visibilityFilter === 'ACTIVE' && acc.disabled) return false;
          if (visibilityFilter === 'DISABLED' && !acc.disabled) return false;
          if (dueFilter === 'HAS_DUE' && (!acc.dueDate || acc.noDue)) return false;
          if (dueFilter === 'NO_DUE' && acc.dueDate && !acc.noDue) return false;
          if (dueFilter === 'DUE_SOON') {
            if (!acc.dueDate || acc.noDue) return false;
            const daysUntil = (acc.dueDate - currentTime) / (1000 * 60 * 60 * 24);
            if (daysUntil < 0 || daysUntil > 5) return false;
          }
          if (dueFilter === 'OVERDUE') {
            if (!acc.dueDate || acc.noDue) return false;
            const daysUntil = (acc.dueDate - currentTime) / (1000 * 60 * 60 * 24);
            if (daysUntil >= 0) return false;
          }

          return true;
        });

        const sorted = [...matchingAccounts].sort((a, b) => {
          if (a.disabled && !b.disabled) return 1;
          if (!a.disabled && b.disabled) return -1;

          let comp = 0;
          if (sortBy === 'name') {
            comp = (a.name || '').localeCompare(b.name || '');
          } else if (sortBy === 'resetTime') {
            const timeA = a.resetTime || Infinity;
            const timeB = b.resetTime || Infinity;
            comp = timeA - timeB;
          } else if (sortBy === 'dueDate') {
            const dueA = a.dueDate || Infinity;
            const dueB = b.dueDate || Infinity;
            comp = dueA - dueB;
          } else if (sortBy === 'status') {
            if (a.status === 'active' && b.status !== 'active') comp = -1;
            else if (a.status !== 'active' && b.status === 'active') comp = 1;
            else comp = 0;
          }

          return sortOrder === 'asc' ? comp : -comp;
        });

        return { ...tool, accounts: sorted };
      })
      .filter(t => t.accounts.length > 0 || (toolFilter === t.id && !searchQuery.trim()));
  }, [tools, searchQuery, statusFilter, toolFilter, dueFilter, visibilityFilter, sortBy, sortOrder, currentTime]);

  const totalFilteredAccounts = useMemo(() => {
    return filteredAndSortedTools.reduce((sum, t) => sum + t.accounts.length, 0);
  }, [filteredAndSortedTools]);

  const totalAllAccounts = useMemo(() => {
    return tools.reduce((sum, t) => sum + t.accounts.length, 0);
  }, [tools]);

  const activeAccountsCount = useMemo(() => {
    return tools.reduce(
      (sum, t) => sum + t.accounts.filter(a => a.status === 'active' && !a.disabled).length,
      0
    );
  }, [tools]);

  const totalNonDisabledCount = useMemo(() => {
    return tools.reduce(
      (sum, t) => sum + t.accounts.filter(a => !a.disabled).length,
      0
    );
  }, [tools]);

  const allExhausted = totalNonDisabledCount > 0 && activeAccountsCount === 0;

  const soonestResetTime = useMemo(() => {
    if (!allExhausted) return 0;
    let minTime = Infinity;
    tools.forEach(t => {
      t.accounts.forEach(a => {
        if (!a.disabled && a.status === 'exhausted' && a.resetTime) {
          if (a.resetTime < minTime) minTime = a.resetTime;
        }
      });
    });
    return minTime === Infinity ? 0 : minTime;
  }, [allExhausted, tools]);

  const toolbarFilters: FilterOption[] = useMemo(() => [
    {
      key: 'tool',
      label: 'Nhóm AI Tool',
      value: toolFilter,
      onChange: setToolFilter,
      options: [
        { label: 'Tất cả Tools', value: 'ALL' },
        ...tools.map(t => ({ label: t.name, value: t.id })),
      ],
    },
    {
      key: 'status',
      label: 'Trạng thái',
      value: statusFilter,
      onChange: (val) => setStatusFilter(val as any),
      options: [
        { label: 'Tất cả trạng thái', value: 'ALL' },
        { label: 'Chỉ Hoạt động (Active)', value: 'active' },
        { label: 'Chỉ Hết lượt (Exhausted)', value: 'exhausted' },
      ],
    },
    {
      key: 'due',
      label: 'Hạn thanh toán',
      value: dueFilter,
      onChange: (val) => setDueFilter(val as any),
      options: [
        { label: 'Tất cả hạn TT', value: 'ALL' },
        { label: 'Sắp đến hạn (≤ 5 ngày)', value: 'DUE_SOON' },
        { label: 'Quá hạn', value: 'OVERDUE' },
        { label: 'Có thông tin tiền/hạn', value: 'HAS_DUE' },
        { label: 'Không có hạn', value: 'NO_DUE' },
      ],
    },
    {
      key: 'visibility',
      label: 'Hiển thị',
      value: visibilityFilter,
      onChange: (val) => setVisibilityFilter(val as any),
      options: [
        { label: 'Tất cả tài khoản', value: 'ALL' },
        { label: 'Đang bật', value: 'ACTIVE' },
        { label: 'Đang tạm dừng', value: 'DISABLED' },
      ],
    },
  ], [tools, toolFilter, statusFilter, dueFilter, visibilityFilter]);

  const activeChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    if (searchQuery.trim()) {
      chips.push({
        key: 'search',
        label: `Tìm: "${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(''),
      });
    }
    if (toolFilter !== 'ALL') {
      const toolName = tools.find(t => t.id === toolFilter)?.name || toolFilter;
      chips.push({
        key: 'tool',
        label: `Tool: ${toolName}`,
        onRemove: () => setToolFilter('ALL'),
      });
    }
    if (statusFilter !== 'ALL') {
      chips.push({
        key: 'status',
        label: statusFilter === 'active' ? 'Hoạt động' : 'Hết lượt',
        onRemove: () => setStatusFilter('ALL'),
      });
    }
    if (dueFilter !== 'ALL') {
      const map: Record<string, string> = {
        DUE_SOON: 'Sắp đến hạn (≤ 5d)',
        OVERDUE: 'Quá hạn',
        HAS_DUE: 'Có tiền/hạn',
        NO_DUE: 'Không có hạn',
      };
      chips.push({
        key: 'due',
        label: map[dueFilter] || dueFilter,
        onRemove: () => setDueFilter('ALL'),
      });
    }
    if (visibilityFilter !== 'ALL') {
      chips.push({
        key: 'visibility',
        label: visibilityFilter === 'ACTIVE' ? 'Đang bật' : 'Tạm dừng',
        onRemove: () => setVisibilityFilter('ALL'),
      });
    }
    return chips;
  }, [searchQuery, toolFilter, statusFilter, dueFilter, visibilityFilter, tools]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setToolFilter('ALL');
    setStatusFilter('ALL');
    setDueFilter('ALL');
    setVisibilityFilter('ALL');
    setSortBy('resetTime');
    setSortOrder('asc');
  }, []);

  const openManageModal = useCallback((account: Account, tool: AITool) => {
    setAccountRenameText(account.name);
    setLoginHintInput(account.loginHint || '');
    setDueDateInput(account.dueDate ? formatDueDateInput(account.dueDate) : '');
    setDueAmountInput(account.dueAmount != null ? formatAmountInput(account.dueAmount) : '');
    setDueNoteInput(account.dueNote || '');
    setNoDue(Boolean(account.noDue ?? !account.dueDate));
    if (!account.disabled && account.resetTime && account.resetTime > Date.now()) {
      setCustomResetInput(getRemainingDurationString(account.resetTime));
    } else {
      setCustomResetInput('5h');
    }
    setAccountGroupSelect(tool.id);
    setActiveModal({ type: 'manage-account', toolId: tool.id, accountId: account.id });
  }, []);

  return (
    <div className="token-wallet-page">
      {/* SUPABASE PAUSED / OFFLINE WARNING BANNER */}
      {isSupabasePaused && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <h4 style={{ margin: '0 0 0.15rem 0', color: '#f59e0b', fontSize: '0.95rem' }}>
                Đang chạy chế độ Bộ Nhớ Cục Bộ (Local Storage Mode)
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Dữ liệu được lưu an toàn tại máy của bạn. Khi Supabase hoạt động trở lại, dữ liệu sẽ tự động đồng bộ.
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => window.location.reload()}
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshIcon size={14} /> Thử kết nối lại
          </button>
        </div>
      )}

      {/* STICKY HEADER & MISSION CONTROL BANNER */}
      <div className="token-wallet-sticky-section">
        {totalNonDisabledCount > 0 && (
          <div className={`global-status-banner ${allExhausted ? 'all-exhausted' : 'has-active'}`}>
            <div className="status-info" style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`status-indicator-dot ${allExhausted ? 'exhausted' : 'active'}`} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {allExhausted ? (
                    `⚡ Sẵn sàng sớm nhất sau ${formatVerboseCountdown(soonestResetTime, currentTime)} (${formatVerboseResetTime(soonestResetTime)})`
                  ) : (
                    `Hiện tại bạn có ${activeAccountsCount} trên ${totalNonDisabledCount} tài khoản sẵn sàng làm việc.`
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isSyncing && <span>🔄 Đang lưu...</span>}
              </div>
            </div>
          </div>
        )}

        {/* TOOLBAR */}
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tìm tài khoản, công cụ, hint đăng nhập, ghi chú..."
          filters={toolbarFilters}
          sortBy={sortBy}
          onSortByChange={(val) => setSortBy(val as any)}
          sortOptions={[
            { label: 'Sắp xếp: Thời gian Reset', value: 'resetTime' },
            { label: 'Sắp xếp: Tên tài khoản', value: 'name' },
            { label: 'Sắp xếp: Hạn thanh toán', value: 'dueDate' },
            { label: 'Sắp xếp: Trạng thái', value: 'status' },
          ]}
          sortOrder={sortOrder}
          onSortOrderToggle={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          activeChips={activeChips}
          summaryText={
            <span>
              Hiển thị <strong style={{ color: 'var(--text-main)' }}>{totalFilteredAccounts}</strong> / {totalAllAccounts} tài khoản
            </span>
          }
          onClearFilters={handleResetFilters}
          actions={
            canEdit && (
              <button
                className="btn btn-primary"
                onClick={() => setActiveModal({ type: 'add-tool' })}
                style={{ height: '38px', padding: '0 0.85rem' }}
              >
                <PlusIcon size={16} /> Thêm Tool
              </button>
            )
          }
        />
      </div>

      {/* EMPTY STATE: NO TOOLS */}
      {tools.length === 0 && (
        <div className="empty-state">
          <p>Chưa có nhóm công cụ AI nào. Bấm bên dưới để thêm nhóm công cụ đầu tiên.</p>
          {canEdit && (
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setActiveModal({ type: 'add-tool' })}
            >
              <PlusIcon size={16} /> Thêm Nhóm AI Tool
            </button>
          )}
        </div>
      )}

      {/* EMPTY STATE: NO FILTER MATCHES */}
      {tools.length > 0 && totalFilteredAccounts === 0 && (
        <div className="empty-state">
          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Không tìm thấy tài khoản phù hợp
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Hãy thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các bộ lọc đang chọn.
          </p>
          <button className="btn btn-primary btn-sm" onClick={handleResetFilters}>
            Xóa Tất Cả Bộ Lọc
          </button>
        </div>
      )}

      {/* TOOLS & ACCOUNTS LIST */}
      {filteredAndSortedTools.map(tool => {
        const activeCount = tool.accounts.filter(a => a.status === 'active' && !a.disabled).length;

        return (
          <div className="tool-group" key={tool.id}>
            <div className="tool-header">
              <h2 className="tool-title">
                {getToolBrandIcon(tool.id, tool.name)}
                <span>{tool.name}</span>
                {canEdit && (
                  <button
                    className="btn-icon-sm"
                    style={{ marginLeft: '0.35rem', color: 'var(--color-accent)' }}
                    title="Thêm tài khoản vào nhóm này"
                    onClick={() => {
                      setNewAccountName('');
                      setNewLoginHint('');
                      setActiveModal({ type: 'add-account', toolId: tool.id });
                    }}
                  >
                    <PlusIcon size={15} />
                  </button>
                )}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span className="tool-meta">
                  {activeCount} sẵn sàng / {tool.accounts.length} tài khoản
                </span>
                {canEdit && (
                  <div className="tool-actions">
                    <button
                      className="btn-icon-sm"
                      title="Đổi tên nhóm tool"
                      onClick={() => {
                        setToolRenameText(tool.name);
                        setActiveModal({ type: 'rename-tool', toolId: tool.id });
                      }}
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      className="btn-icon-sm danger"
                      title="Xóa nhóm tool này"
                      onClick={() => handleRemoveTool(tool.id)}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="accounts-grid">
              {tool.accounts.map(acc => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  tool={tool}
                  currentTime={currentTime}
                  onOpenManageModal={openManageModal}
                  onQuickToggleStatus={canEdit ? handleQuickToggleStatus : undefined}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* MODAL: ADD TOOL */}
      {activeModal?.type === 'add-tool' && (
        <Modal title="Thêm Nhóm AI Tool Mới" onClose={handleCloseModal}>
          <div className="form-group">
            <label htmlFor="tool-name-input">Tên Công Cụ (Tool Name)</label>
            <input
              id="tool-name-input"
              className="input-text"
              placeholder="VD: DeepSeek, Perplexity, Cursor..."
              value={newToolName}
              onChange={e => setNewToolName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn" onClick={handleCloseModal}>Hủy</button>
            <button className="btn btn-primary" onClick={handleAddTool} disabled={!newToolName.trim()}>
              Tạo Tool
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: RENAME TOOL */}
      {activeModal?.type === 'rename-tool' && (
        <Modal title="Đổi Tên Nhóm AI Tool" onClose={handleCloseModal}>
          <div className="form-group">
            <label htmlFor="tool-rename-input">Tên Mới</label>
            <input
              id="tool-rename-input"
              className="input-text"
              value={toolRenameText}
              onChange={e => setToolRenameText(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn" onClick={handleCloseModal}>Hủy</button>
            <button className="btn btn-primary" onClick={() => handleRenameTool(activeModal.toolId)} disabled={!toolRenameText.trim()}>
              Lưu Tên
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {activeModal?.type === 'add-account' && (
        <Modal title="Thêm Tài Khoản Mới" onClose={handleCloseModal}>
          <div className="form-group">
            <label htmlFor="acc-name-input">Tên Gợi Nhớ / Định Danh</label>
            <input
              id="acc-name-input"
              className="input-text"
              placeholder="VD: Account Work, Nick 1, Personal..."
              value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="acc-login-hint-input">Gợi ý Đăng nhập (Email, Username, Note...)</label>
            <input
              id="acc-login-hint-input"
              className="input-text"
              placeholder="VD: developer@gmail.com, pass profile 2..."
              value={newLoginHint}
              onChange={e => setNewLoginHint(e.target.value)}
            />
          </div>
          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn" onClick={handleCloseModal}>Hủy</button>
            <button className="btn btn-primary" onClick={() => handleAddAccount(activeModal.toolId)} disabled={!newAccountName.trim()}>
              Tạo Tài Khoản
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: MANAGE ACCOUNT */}
      {activeModal?.type === 'manage-account' && selectedAccount && selectedTool && (
        <Modal title={`${selectedTool.name} — Quản lý Tài Khoản`} onClose={handleCloseModal} maxWidth="540px">
          {/* 1. Time to Reset Input with Presets */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="custom-reset-input" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
              Thời Gian Đến Lần Reset Tiếp Theo
            </label>
            <input
              id="custom-reset-input"
              className="input-text"
              placeholder="VD: 5h, 2 days, 16:30, Jul 12 2:36PM..."
              value={customResetInput}
              onChange={e => setCustomResetInput(e.target.value)}
              autoFocus
              style={inputError ? { borderColor: 'var(--color-exhausted)' } : {}}
            />

            {/* Quick Duration Preset Chips */}
            <div className="preset-chips-row">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Gợi ý:</span>
              <button type="button" className="preset-chip" onClick={() => applyDurationPreset(5)}>+5 Giờ (Chu kỳ chuẩn)</button>
              <button type="button" className="preset-chip" onClick={() => applyDurationPreset(12)}>+12 Giờ</button>
              <button type="button" className="preset-chip" onClick={() => applyDurationPreset(24)}>+24 Giờ (1 Ngày)</button>
              <button type="button" className="preset-chip" onClick={() => applyDurationPreset(168)}>+7 Ngày (1 Tuần)</button>
            </div>

            {/* Dynamic preview */}
            {customResetInput && parsedPreview && !inputError && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-active)', marginTop: '0.45rem', fontWeight: 500 }}>
                ✓ Đã hiểu: Reset vào {formatResetTime(parsedPreview)}
              </div>
            )}
            {inputError && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-exhausted)', marginTop: '0.45rem' }}>
                ✗ {inputError}
              </div>
            )}
          </div>

          {/* 2. Status Buttons: Remain (Xanh) & Run Out (Đỏ cam) */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
            <button
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                borderColor: 'var(--color-active)',
                backgroundColor: 'var(--color-active)',
                color: '#ffffff',
                padding: '0.65rem',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
              disabled={Boolean(inputError)}
              onClick={() => handleRestoreAccount(activeModal.toolId, selectedAccount!.id, parsedPreview || undefined)}
            >
              ✓ Remain (Khôi phục)
            </button>
            <button
              className="btn btn-danger"
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '0.65rem',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
              disabled={!parsedPreview || Boolean(inputError)}
              onClick={() => {
                if (parsedPreview) {
                  handleMarkExhausted(activeModal.toolId, selectedAccount!.id, parsedPreview);
                }
              }}
            >
              ⚡ Run Out (Đánh dấu hết)
            </button>
          </div>

          {/* 3. Account Name, Login Hint & Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Tên Tài Khoản</label>
              <input
                className="input-text"
                placeholder="Tên tài khoản..."
                value={accountRenameText}
                onChange={e => setAccountRenameText(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Gợi Ý Đăng Nhập (Email, Username...)</label>
              <input
                className="input-text"
                placeholder="Email, username, note..."
                value={loginHintInput}
                onChange={e => setLoginHintInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Thuộc Nhóm Tool:</span>
              <select
                className="toolbar-select"
                value={accountGroupSelect}
                onChange={e => setAccountGroupSelect(e.target.value)}
                style={{ flex: 1 }}
              >
                {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* 4. Payment Due Date & Amount */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thông Tin Hạn Thanh Toán</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noDue}
                  onChange={e => setNoDue(e.target.checked)}
                />
                Không có hạn thanh toán
              </label>
            </div>

            {!noDue && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="input-text"
                    type="date"
                    value={dueDateInput}
                    onChange={e => setDueDateInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>₫</span>
                    <input
                      className="input-text"
                      placeholder="Số tiền"
                      type="text"
                      value={dueAmountInput}
                      onChange={e => setDueAmountInput(formatAmountInput(e.target.value))}
                      style={{ width: '100%', paddingLeft: '1.5rem' }}
                    />
                  </div>
                </div>
                <input
                  className="input-text"
                  placeholder="Ghi chú thanh toán (VD: Thẻ Visa 8899, Gói Team...)"
                  value={dueNoteInput}
                  onChange={e => setDueNoteInput(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 5. Footer Actions: Save Changes, Toggle Disabled, Delete */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: 'center' }}
              onClick={handleUpdateAccountDetails}
            >
              Lưu Thông Tin
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleToggleDisabled}
            >
              {selectedAccount.disabled ? '▶ Bật lại' : '⏸ Tạm dừng'}
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => handleRemoveAccount(activeModal.toolId, selectedAccount!.id)}
            >
              <TrashIcon size={14} /> Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
