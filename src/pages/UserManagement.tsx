import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { UserPermissions } from '../contexts/AuthContext';

interface ManagedUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  can_read_token_wallet: boolean;
  can_edit_token_wallet: boolean;
  can_read_payments: boolean;
  can_edit_payments: boolean;
  can_read_app_wallet: boolean;
  can_edit_app_wallet: boolean;
  created_at: string;
}

const PERMISSION_COLS: { key: keyof UserPermissions; label: string }[] = [
  { key: 'can_read_token_wallet', label: 'Đọc Token Wallet' },
  { key: 'can_edit_token_wallet', label: 'Sửa Token Wallet' },
  { key: 'can_read_payments', label: 'Đọc Hạn TT' },
  { key: 'can_edit_payments', label: 'Sửa Hạn TT' },
  { key: 'can_read_app_wallet', label: 'Đọc App Wallet' },
  { key: 'can_edit_app_wallet', label: 'Sửa App Wallet' },
];

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  async function loadUsers() {
    setIsLoading(true);
    const { data } = await supabase
      .from('tkw_user_permissions')
      .select('*')
      .order('created_at', { ascending: true });
    setUsers((data as ManagedUser[]) ?? []);
    setIsLoading(false);
  }

  async function togglePermission(
    user: ManagedUser,
    key: keyof UserPermissions,
    value: boolean
  ) {
    setSavingId(user.user_id);
    const updated = { ...user, [key]: value, updated_at: new Date().toISOString() };
    await supabase
      .from('tkw_user_permissions')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user.user_id);
    setUsers(prev => prev.map(u => u.user_id === user.user_id ? updated : u));
    setSavingId(null);
  }

  async function toggleRole(user: ManagedUser) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setSavingId(user.user_id);
    await supabase
      .from('tkw_user_permissions')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', user.user_id);
    setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, role: newRole } : u));
    setSavingId(null);
  }

  if (!isAdmin) {
    return (
      <div className="protected-wall">
        <div className="protected-wall-icon">🚫</div>
        <h2>Không có quyền truy cập</h2>
      </div>
    );
  }

  return (
    <div className="page-container user-mgmt-page">
      <div className="user-mgmt-header">
        <h2>👥 Quản lý người dùng</h2>
        <button className="btn" onClick={loadUsers}>🔄 Làm mới</button>
      </div>

      {isLoading ? (
        <div className="protected-loading"><div className="protected-spinner" /><p>Đang tải...</p></div>
      ) : (
        <div className="user-mgmt-table-wrap">
          <table className="user-mgmt-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                {PERMISSION_COLS.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} className={savingId === u.user_id ? 'saving' : ''}>
                  <td className="user-email-cell">
                    <span className="user-avatar-mini">
                      {u.email.charAt(0).toUpperCase()}
                    </span>
                    {u.email}
                  </td>
                  <td>
                    <button
                      className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}
                      onClick={() => toggleRole(u)}
                      title="Nhấn để đổi role"
                    >
                      {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </button>
                  </td>
                  {PERMISSION_COLS.map(c => (
                    <td key={c.key} className="perm-cell">
                      <input
                        type="checkbox"
                        className="perm-checkbox"
                        checked={!!u[c.key as keyof ManagedUser]}
                        onChange={e => togglePermission(u, c.key, e.target.checked)}
                        disabled={savingId === u.user_id}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={2 + PERMISSION_COLS.length} style={{ textAlign: 'center', opacity: 0.5 }}>
                  Chưa có người dùng nào đăng nhập.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
