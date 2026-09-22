import { useState, useEffect, useMemo, useCallback } from 'react';
import { parseResetTime } from '../utils/timeParser';
import { supabase } from '../utils/supabaseClient';
import { useSyncedCollection } from '../data/useSyncedCollection';
import {
  rowToTool,
  toolToRow,
  rowToAccount,
  accountToRow,
  type Account,
  type AITool,
  type ToolRow,
  type AccountRow,
} from '../data/mappers';
import { newId, slugifyId } from '../utils/ids';
import { rollForward } from '../utils/timeParser';
import { AccountCard } from '../components/AccountCard';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

export type { Account, AITool };

const DEFAULT_TOOLS: AITool[] = [
  {
    id: 'codex',
    name: 'Codex',
    resetCycleHours: 5,
    accounts: [
      { id: 'codex-1', email: 'codex.work@gmail.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
      { id: 'codex-2', email: 'codex.personal@gmail.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
    ],
  },
  {
    id: 'claudecode',
    name: 'ClaudeCode',
    resetCycleHours: 5,
    accounts: [
      { id: 'claude-1', email: 'claude.work@gmail.com', status: 'active', resetTime: Date.now() + 5 * 3600 * 1000 },
    ],
  },
];

export default function TokenWallet() {
  const { permissions } = useAuth();
  const canEdit = !!permissions?.can_edit_token_wallet;

  const { items: toolItems, setItems: setToolItems } = useSyncedCollection<
    Omit<AITool, 'accounts'>,
    ToolRow
  >({
    table: 'tkw_ai_tools',
    rowToItem: rowToTool,
    itemToRow: (t) => toolToRow({ ...t, accounts: [] }),
    seed: DEFAULT_TOOLS.map(({ accounts, ...t }) => t),
  });

  const { items: accountItems, setItems: setAccountItems } = useSyncedCollection<
    Account,
    AccountRow
  >({
    table: 'tkw_ai_accounts',
    rowToItem: rowToAccount,
    itemToRow: (acc) => {
      const tool = toolItems.find((t) => t.id === acc.id.split('-')[0]) || toolItems[0];
      return accountToRow(acc, tool ? tool.id : 'codex');
    },
    seed: DEFAULT_TOOLS.flatMap((t) => t.accounts),
  });

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<{
    type: 'add-tool' | 'add-account' | 'manage-account';
    tool?: AITool;
    account?: Account;
  } | null>(null);

  const [newToolName, setNewToolName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [customResetInput, setCustomResetInput] = useState('');

  // Combine toolItems and accountItems into nested tools structure
  const tools: AITool[] = useMemo(() => {
    return toolItems.map((t) => ({
      ...t,
      accounts: accountItems.filter((a) => {
        return a.id.startsWith(`${t.id}-`);
      }),
    }));
  }, [toolItems, accountItems]);

  // Display 1Hz timer for countdown UI
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rollover scanner every 60s
  useEffect(() => {
    const checkRollover = () => {
      const now = Date.now();
      setAccountItems((prev) =>
        prev.map((acc) => {
          if (acc.isDisabled) return acc;
          if (acc.resetTime && acc.resetTime <= now) {
            const nextReset = rollForward(acc.resetTime, now);
            return {
              ...acc,
              status: 'active',
              resetTime: nextReset,
            };
          }
          return acc;
        })
      );
    };

    checkRollover();
    const interval = setInterval(checkRollover, 60000);
    return () => clearInterval(interval);
  }, [setAccountItems]);

  const handleAddTool = () => {
    const slug = slugifyId(newToolName);
    if (!slug) {
      alert('Vui lòng nhập tên công cụ hợp lệ');
      return;
    }
    const newTool = {
      id: slug,
      name: newToolName.trim(),
      resetCycleHours: 5,
    };
    setToolItems((prev) => [...prev, newTool]);
    setNewToolName('');
    setActiveModal(null);
  };

  const handleAddAccount = () => {
    if (!activeModal?.tool || !newAccountEmail.trim()) return;
    const toolId = activeModal.tool.id;
    const newAcc: Account = {
      id: newId(toolId),
      email: newAccountEmail.trim(),
      status: 'active',
      resetTime: Date.now() + 5 * 3600 * 1000,
    };
    setAccountItems((prev) => [...prev, newAcc]);
    setNewAccountEmail('');
    setActiveModal(null);
  };

  const handleRemoveAccount = async (account: Account) => {
    if (window.confirm(`Xóa tài khoản ${account.email}?`)) {
      try {
        await supabase.from('tkw_ai_accounts').delete().eq('id', account.id);
        setAccountItems((prev) => prev.filter((a) => a.id !== account.id));
        setActiveModal(null);
      } catch (err: any) {
        alert('Lỗi xóa tài khoản: ' + err?.message);
      }
    }
  };

  const handleRemoveTool = async (tool: AITool) => {
    if (window.confirm(`Xóa công cụ ${tool.name} và tất cả tài khoản?`)) {
      try {
        const accountIds = tool.accounts.map((a) => a.id);
        if (accountIds.length > 0) {
          await supabase.from('tkw_ai_accounts').delete().in('id', accountIds);
        }
        await supabase.from('tkw_ai_tools').delete().eq('id', tool.id);
        setToolItems((prev) => prev.filter((t) => t.id !== tool.id));
        setAccountItems((prev) => prev.filter((a) => !accountIds.includes(a.id)));
      } catch (err: any) {
        alert('Lỗi xóa công cụ: ' + err?.message);
      }
    }
  };

  const handleOpenManageModal = useCallback((account: Account, tool: AITool) => {
    setActiveModal({ type: 'manage-account', account, tool });
    setCustomResetInput('');
  }, []);

  const handleSaveResetTime = () => {
    if (!activeModal?.account || !customResetInput) return;
    const parsed = parseResetTime(customResetInput);
    if (!parsed) {
      alert('Không thể nhận diện thời gian reset');
      return;
    }
    setAccountItems((prev) =>
      prev.map((a) => (a.id === activeModal.account?.id ? { ...a, resetTime: parsed } : a))
    );
    setActiveModal(null);
  };

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tools;
    return tools.map((tool) => ({
      ...tool,
      accounts: tool.accounts.filter(
        (a) => a.email.toLowerCase().includes(q) || tool.name.toLowerCase().includes(q)
      ),
    })).filter((t) => t.accounts.length > 0 || t.name.toLowerCase().includes(q));
  }, [tools, searchQuery]);

  return (
    <div className="token-wallet-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="toolbar-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="input-field"
          style={{ maxWidth: '350px' }}
          placeholder="Tìm theo tên công cụ hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setActiveModal({ type: 'add-tool' })}>
            + Thêm Công Cụ
          </button>
        )}
      </div>

      <div className="tools-grid" style={{ display: 'grid', gap: '2rem' }}>
        {filteredTools.map((tool) => (
          <div key={tool.id} className="tool-section" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem' }}>
            <div className="tool-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>{tool.name}</h2>
              {canEdit && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-small" onClick={() => setActiveModal({ type: 'add-account', tool })}>
                    + Thêm TK
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => handleRemoveTool(tool)}>
                    Xóa Tool
                  </button>
                </div>
              )}
            </div>

            <div className="accounts-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {tool.accounts.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  tool={tool}
                  currentTime={currentTime}
                  onOpenManageModal={handleOpenManageModal}
                  canEdit={canEdit}
                />
              ))}
              {tool.accounts.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có tài khoản nào.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {activeModal?.type === 'add-tool' && (
        <Modal title="Thêm Công Cụ Mới" onClose={() => setActiveModal(null)}>
          <div className="form-group">
            <label>Tên công cụ (ví dụ: Gemini, ClaudeCode, Copilot):</label>
            <input
              type="text"
              className="input-field"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
            />
          </div>
          <div className="modal-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleAddTool}>Tạo Tool</button>
          </div>
        </Modal>
      )}

      {activeModal?.type === 'add-account' && (
        <Modal title={`Thêm Tài Khoản cho ${activeModal.tool?.name}`} onClose={() => setActiveModal(null)}>
          <div className="form-group">
            <label>Email / Tên tài khoản:</label>
            <input
              type="email"
              className="input-field"
              value={newAccountEmail}
              onChange={(e) => setNewAccountEmail(e.target.value)}
            />
          </div>
          <div className="modal-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleAddAccount}>Tạo TK</button>
          </div>
        </Modal>
      )}

      {activeModal?.type === 'manage-account' && activeModal.account && (
        <Modal title={`Quản lý ${activeModal.account.email}`} onClose={() => setActiveModal(null)}>
          <div className="form-group">
            <label>Đặt lại thời gian reset (ví dụ: "5h", "at 4:30pm", "Jun 12 14:30"):</label>
            <input
              type="text"
              className="input-field"
              value={customResetInput}
              onChange={(e) => setCustomResetInput(e.target.value)}
            />
          </div>
          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-danger" onClick={() => handleRemoveAccount(activeModal.account!)}>
              Xóa tài khoản
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveResetTime}>Lưu Reset</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
