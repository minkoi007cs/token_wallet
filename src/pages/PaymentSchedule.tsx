import { useState, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { parsePaymentScheduleText, calculateNextDueDate, type ParsedPaymentInfo } from '../utils/paymentParser';
import { useSyncedCollection } from '../data/useSyncedCollection';
import { rowToPaymentSchedule, paymentScheduleToRow, type PaymentScheduleItem } from '../data/mappers';
import { newId } from '../utils/ids';
import { Modal } from '../components/Modal';

export type { PaymentScheduleItem };

function getBrandIcon(title: string, category?: string) {
  const t = title.toLowerCase();
  if (t.includes('gemini') || t.includes('google')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="pay-gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2b66ff" />
            <stop offset="35%" stopColor="#9b51e0" />
            <stop offset="100%" stopColor="#e289f2" />
          </linearGradient>
        </defs>
        <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#pay-gemini-grad)" />
      </svg>
    );
  }
  if (t.includes('claude') || t.includes('anthropic')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" fill="#D97757" />
      </svg>
    );
  }
  if (t.includes('copilot') || t.includes('github') || t.includes('codex')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="pay-copilot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bc8cff" />
            <stop offset="100%" stopColor="#2188ff" />
          </linearGradient>
        </defs>
        <path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z" fill="url(#pay-copilot-grad)" />
      </svg>
    );
  }
  if (t.includes('chatgpt') || t.includes('openai')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Z" />
        <path d="m8 12 3 3 5-5" />
      </svg>
    );
  }
  if (t.includes('vultr') || t.includes('vps') || t.includes('cloud') || t.includes('server') || category === 'Cloud & Hosting') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  );
}

export default function PaymentSchedule() {
  const { items: schedules, setItems: setSchedules, error: dbSyncError } = useSyncedCollection<
    PaymentScheduleItem,
    any
  >({
    table: 'tkw_payment_schedules',
    rowToItem: rowToPaymentSchedule,
    itemToRow: paymentScheduleToRow,
  });

  // Quick Smart Input State
  const [quickInputText, setQuickInputText] = useState('');

  // Modal State
  const [modalItem, setModalItem] = useState<PaymentScheduleItem | null | 'NEW'>(null);
  const [modalForm, setModalForm] = useState<Partial<PaymentScheduleItem>>({});

  // Live parsed preview of smart quick input
  const parsedPreview: ParsedPaymentInfo = useMemo(() => {
    return parsePaymentScheduleText(quickInputText);
  }, [quickInputText]);

  // Handle Quick Add
  const handleQuickAdd = () => {
    if (!parsedPreview.title.trim()) return;

    const newItem: PaymentScheduleItem = {
      id: newId('pay'),
      title: parsedPreview.title,
      accountEmail: parsedPreview.accountEmail || '',
      dueDate: parsedPreview.dueDate || (Date.now() + 30 * 86400000),
      dueDateString: parsedPreview.dueDateString || '',
      amount: parsedPreview.amount,
      currency: parsedPreview.currency,
      recurrence: parsedPreview.recurrence,
      repeatCount: parsedPreview.repeatCount,
      paymentMethod: parsedPreview.paymentMethod,
      isAutoDebit: parsedPreview.isAutoDebit,
      isPaid: false,
      isPaused: false,
      rawInput: parsedPreview.rawInput,
    };

    setSchedules(prev => [newItem, ...prev]);
    setQuickInputText('');
  };

  // Quick Action: Mark as Paid for this cycle
  const handleMarkAsPaid = (item: PaymentScheduleItem) => {
    const nextDueDate = calculateNextDueDate(item.dueDate || Date.now(), item.recurrence);

    setSchedules(prev => prev.map(s => {
      if (s.id !== item.id) return s;
      return {
        ...s,
        dueDate: nextDueDate,
        isPaid: true,
      };
    }));
  };

  // Quick Action: Toggle Pause / Resume
  const handleTogglePause = (item: PaymentScheduleItem) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== item.id) return s;
      return { ...s, isPaused: !s.isPaused };
    }));
  };

  // Quick Action: Explicit Delete
  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa lịch nhắc thanh toán này không?')) {
      try {
        const { error } = await supabase.from('tkw_payment_schedules').delete().eq('id', id);
        if (error) throw error;
        setSchedules(prev => prev.filter(s => s.id !== id));
        if (modalItem) setModalItem(null);
      } catch (err: any) {
        alert('Không thể xóa item: ' + (err?.message || 'Lỗi DB'));
      }
    }
  };

  // Open Modal for Editing or Adding
  const handleOpenEditModal = (item?: PaymentScheduleItem) => {
    if (item) {
      setModalItem(item);
      setModalForm({ ...item });
    } else {
      setModalItem('NEW');
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      setModalForm({
        title: '',
        accountEmail: '',
        dueDate: defaultDate.getTime(),
        amount: undefined,
        currency: 'VND',
        recurrence: 'monthly',
        repeatCount: 12,
        paymentMethod: '',
        isAutoDebit: false,
      });
    }
  };

  // Save Modal Form
  const handleSaveModal = () => {
    if (!modalForm.title?.trim()) return;

    if (modalItem === 'NEW') {
      const newItem: PaymentScheduleItem = {
        id: newId('pay'),
        title: modalForm.title.trim(),
        accountEmail: modalForm.accountEmail?.trim() || '',
        dueDate: modalForm.dueDate || (Date.now() + 30 * 86400000),
        dueDateString: modalForm.dueDateString || '',
        amount: modalForm.amount ? Number(modalForm.amount) : null,
        currency: modalForm.currency || 'VND',
        recurrence: modalForm.recurrence || 'monthly',
        repeatCount: modalForm.repeatCount === 0 || modalForm.repeatCount === null ? null : Number(modalForm.repeatCount),
        paymentMethod: modalForm.paymentMethod?.trim() || undefined,
        isAutoDebit: !!modalForm.isAutoDebit,
        isPaid: false,
        isPaused: false,
        rawInput: modalForm.rawInput || '',
      };
      setSchedules(prev => [newItem, ...prev]);
    } else if (modalItem) {
      setSchedules(prev => prev.map(s => {
        if (s.id !== modalItem.id) return s;
        return {
          ...s,
          title: modalForm.title?.trim() || s.title,
          accountEmail: modalForm.accountEmail?.trim() || '',
          dueDate: modalForm.dueDate || s.dueDate,
          amount: modalForm.amount ? Number(modalForm.amount) : null,
          currency: modalForm.currency || s.currency,
          recurrence: modalForm.recurrence || s.recurrence,
          repeatCount: modalForm.repeatCount === 0 || modalForm.repeatCount === null ? null : Number(modalForm.repeatCount),
          paymentMethod: modalForm.paymentMethod?.trim() || undefined,
          isAutoDebit: !!modalForm.isAutoDebit,
        };
      }));
    }

    setModalItem(null);
  };

  // Format Helper for Currency
  const formatMoney = (amount?: number | null, currency: 'VND' | 'USD' = 'VND') => {
    if (amount === undefined || amount === null) return '—';
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`;
    }
    return `${amount.toLocaleString('vi-VN')} ₫`;
  };

  const formatDateDisplay = (ts: number | null) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getRecurrenceLabel = (rec: string) => {
    switch (rec) {
      case 'monthly': return 'Hàng tháng';
      case 'yearly': return 'Hàng năm';
      case 'weekly': return 'Hàng tuần';
      case 'daily': return 'Hàng ngày';
      case 'one-time': return 'Một lần';
      default: return 'Định kỳ';
    }
  };

  return (
    <div className="payment-schedule-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {dbSyncError && (
        <div className="banner banner-error" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px' }}>
          <strong>Lỗi đồng bộ:</strong> {dbSyncError}
        </div>
      )}

      {/* Header & Quick Input Box */}
      <div className="pay-unified-box">
        <div className="pay-unified-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Hạn thanh toán & Nhắc nhở định kỳ</h3>
          <button className="btn btn-primary" onClick={() => handleOpenEditModal()}>
            + Tạo Nhắc Nhở Mới
          </button>
        </div>

        {/* Quick Input Row */}
        <div className="pay-unified-input-row" style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: 1 }}
            placeholder="Ví dụ: nhắc thanh toán Gemini account cho khoang4@kent.edu từ ngày 15/09/2026, lặp lại hàng tháng, 12 lần, 500k"
            value={quickInputText}
            onChange={(e) => setQuickInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
          />
          <button className="btn btn-primary" onClick={handleQuickAdd} disabled={!parsedPreview.title.trim()}>
            Tạo nhắc nhở
          </button>
        </div>
      </div>

      {/* List Table */}
      <div className="table-container" style={{ marginTop: '1.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dịch vụ</th>
              <th>Email tài khoản</th>
              <th>Ngày đến hạn</th>
              <th>Chu kỳ</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((item) => (
              <tr key={item.id} className={item.isPaused ? 'row-paused' : ''}>
                <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getBrandIcon(item.title)}
                  <strong>{item.title}</strong>
                </td>
                <td>{item.accountEmail || '—'}</td>
                <td>{formatDateDisplay(item.dueDate)}</td>
                <td>{getRecurrenceLabel(item.recurrence)}</td>
                <td>{formatMoney(item.amount, item.currency)}</td>
                <td>{item.paymentMethod || (item.isAutoDebit ? 'Tự động' : 'Thủ công')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-small" onClick={() => handleMarkAsPaid(item)}>
                      ✓ Đã trả
                    </button>
                    <button className="btn btn-small btn-secondary" onClick={() => handleTogglePause(item)}>
                      {item.isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                    </button>
                    <button className="btn btn-small" onClick={() => handleOpenEditModal(item)}>
                      Sửa
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDeleteItem(item.id)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Chưa có lịch nhắc thanh toán nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {modalItem && (
        <Modal
          title={modalItem === 'NEW' ? 'Tạo Nhắc Nhở Mới' : 'Chỉnh Sửa Nhắc Nhở'}
          onClose={() => setModalItem(null)}
        >
          <div className="form-group">
            <label>Tên dịch vụ / Tiêu đề:</label>
            <input
              type="text"
              className="input-field"
              value={modalForm.title || ''}
              onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Email tài khoản:</label>
            <input
              type="email"
              className="input-field"
              value={modalForm.accountEmail || ''}
              onChange={(e) => setModalForm({ ...modalForm, accountEmail: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Số tiền:</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                className="input-field"
                style={{ flex: 1 }}
                value={modalForm.amount || ''}
                onChange={(e) => setModalForm({ ...modalForm, amount: Number(e.target.value) })}
              />
              <select
                className="select-field"
                value={modalForm.currency || 'VND'}
                onChange={(e) => setModalForm({ ...modalForm, currency: e.target.value as any })}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setModalItem(null)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSaveModal}>
              Lưu
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
