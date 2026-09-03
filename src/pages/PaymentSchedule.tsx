import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { parsePaymentScheduleText, calculateNextDueDate, type ParsedPaymentInfo } from '../utils/paymentParser';

export interface PaymentScheduleItem {
  id: string;
  title: string;
  accountEmail?: string;
  dueDate: number; // timestamp in ms
  amount?: number;
  currency: 'VND' | 'USD';
  recurrence: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'one-time';
  repeatCount?: number | null; // total iterations to repeat, null = infinite
  completedCount: number; // how many cycles already paid
  status: 'active' | 'paused' | 'completed';
  note?: string;
  category?: string;
  lastPaymentDate?: number;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'tkw_payment_schedules_cache';

const INITIAL_SCHEDULES: PaymentScheduleItem[] = [
  {
    id: 'pay-gemini-khoang4',
    title: 'Gemini Advanced Account',
    accountEmail: 'khoang4@kent.edu',
    dueDate: new Date(2026, 8, 15, 12, 0).getTime(), // Sep 15, 2026
    amount: 500000,
    currency: 'VND',
    recurrence: 'monthly',
    repeatCount: 12,
    completedCount: 1,
    status: 'active',
    note: 'Gói Gemini Ultra cho tài khoản trường Kent',
    category: 'AI Tool',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'pay-claude-pro',
    title: 'Claude Pro Subscription',
    accountEmail: 'dev@mikoi.org',
    dueDate: new Date(2026, 8, 28, 12, 0).getTime(), // Sep 28, 2026
    amount: 20,
    currency: 'USD',
    recurrence: 'monthly',
    repeatCount: 6,
    completedCount: 2,
    status: 'active',
    note: 'Tài khoản Claude Code làm việc dự án BETH',
    category: 'AI Tool',
    createdAt: Date.now() - 60 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'pay-vps-vultr',
    title: 'VPS Vultr Cloud Server',
    accountEmail: 'admin@minkoi.org',
    dueDate: new Date(2026, 8, 5, 12, 0).getTime(), // Sep 5, 2026
    amount: 250000,
    currency: 'VND',
    recurrence: 'monthly',
    repeatCount: null, // infinite
    completedCount: 14,
    status: 'active',
    note: 'Server lưu trữ API coffee_shop_24hxh',
    category: 'Cloud & Hosting',
    createdAt: Date.now() - 400 * 86400000,
    updatedAt: Date.now()
  }
];

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
  // Default credit card / calendar icon
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  );
}

export default function PaymentSchedule() {
  const [schedules, setSchedules] = useState<PaymentScheduleItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Quick Smart Input State
  const [quickInputText, setQuickInputText] = useState('');

  // Modal State
  const [modalItem, setModalItem] = useState<PaymentScheduleItem | null | 'NEW'>(null);
  const [modalForm, setModalForm] = useState<Partial<PaymentScheduleItem>>({});

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED' | 'PAUSED'>('ALL');
  const [recurrenceFilter, setRecurrenceFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'amount' | 'remaining'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load data from LocalStorage + Supabase
  useEffect(() => {
    const loadData = async () => {
      let loaded: PaymentScheduleItem[] = [];

      // 1. Try local cache first
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          loaded = JSON.parse(cached);
        }
      } catch {
        // Safe fallback
      }

      // 2. Try fetching from Supabase table `tkw_payment_schedules`
      try {
        const { data, error } = await supabase.from('tkw_payment_schedules').select('*');
        if (!error && data && data.length > 0) {
          loaded = data.map(item => ({
            id: item.id,
            title: item.title,
            accountEmail: item.account_email || '',
            dueDate: Number(item.due_date),
            amount: item.amount ? Number(item.amount) : undefined,
            currency: item.currency || 'VND',
            recurrence: item.recurrence || 'monthly',
            repeatCount: item.repeat_count !== null && item.repeat_count !== undefined ? Number(item.repeat_count) : null,
            completedCount: Number(item.completed_count || 0),
            status: item.status || 'active',
            note: item.note || '',
            category: item.category || 'Subscription',
            lastPaymentDate: item.last_payment_date ? Number(item.last_payment_date) : undefined,
            createdAt: item.created_at ? Number(item.created_at) : Date.now(),
            updatedAt: item.updated_at ? Number(item.updated_at) : Date.now(),
          }));
        }
      } catch {
        // Ignore Supabase connection error and use fallback cache
      }

      if (loaded.length === 0) {
        loaded = INITIAL_SCHEDULES;
      }

      setSchedules(loaded);
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // Save changes to LocalStorage & Supabase sync
  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {
      // Safe fallback
    }

    const syncSupabase = async () => {
      try {
        if (schedules.length > 0) {
          const payload = schedules.map(s => ({
            id: s.id,
            title: s.title,
            account_email: s.accountEmail || null,
            due_date: s.dueDate,
            amount: s.amount || null,
            currency: s.currency,
            recurrence: s.recurrence,
            repeat_count: s.repeatCount,
            completed_count: s.completedCount,
            status: s.status,
            note: s.note || null,
            category: s.category || null,
            last_payment_date: s.lastPaymentDate || null,
            created_at: s.createdAt,
            updated_at: s.updatedAt,
          }));
          await supabase.from('tkw_payment_schedules').upsert(payload);
        }
      } catch {
        // Gracefully ignore missing table
      }
    };

    syncSupabase();
  }, [schedules, isLoaded]);

  // Live parsed preview of smart quick input
  const parsedPreview: ParsedPaymentInfo = useMemo(() => {
    return parsePaymentScheduleText(quickInputText);
  }, [quickInputText]);

  // Handle Quick Add
  const handleQuickAdd = () => {
    if (!parsedPreview.title.trim()) return;

    const newItem: PaymentScheduleItem = {
      id: `pay-${Date.now()}`,
      title: parsedPreview.title,
      accountEmail: parsedPreview.accountEmail || undefined,
      dueDate: parsedPreview.dueDate || (Date.now() + 30 * 86400000),
      amount: parsedPreview.amount || undefined,
      currency: parsedPreview.currency,
      recurrence: parsedPreview.recurrence,
      repeatCount: parsedPreview.repeatCount,
      completedCount: 0,
      status: 'active',
      note: parsedPreview.accountEmail ? `Tài khoản ${parsedPreview.accountEmail}` : undefined,
      category: 'Subscription',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSchedules(prev => [newItem, ...prev]);
    setQuickInputText('');
  };

  // Quick Action: Mark as Paid for this cycle
  const handleMarkAsPaid = (item: PaymentScheduleItem) => {
    const nextCompleted = item.completedCount + 1;
    const isFinished = item.repeatCount !== null && item.repeatCount !== undefined && nextCompleted >= item.repeatCount;
    const nextDueDate = calculateNextDueDate(item.dueDate, item.recurrence);

    setSchedules(prev => prev.map(s => {
      if (s.id !== item.id) return s;
      return {
        ...s,
        completedCount: nextCompleted,
        dueDate: isFinished ? s.dueDate : nextDueDate,
        status: isFinished ? 'completed' : s.status,
        lastPaymentDate: Date.now(),
        updatedAt: Date.now()
      };
    }));
  };

  // Quick Action: Toggle Pause / Resume
  const handleTogglePause = (item: PaymentScheduleItem) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== item.id) return s;
      const nextStatus = s.status === 'paused' ? 'active' : 'paused';
      return { ...s, status: nextStatus, updatedAt: Date.now() };
    }));
  };

  // Quick Action: Delete
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa lịch thanh toán này không?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (modalItem) setModalItem(null);
    }
  };

  // Open Modal for Editing or Adding
  const handleOpenEditModal = (item?: PaymentScheduleItem) => {
    if (item) {
      setModalItem(item);
      setModalForm({
        ...item,
      });
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
        completedCount: 0,
        status: 'active',
        note: '',
        category: 'Subscription'
      });
    }
  };

  // Save Modal Form
  const handleSaveModal = () => {
    if (!modalForm.title?.trim()) return;

    if (modalItem === 'NEW') {
      const newItem: PaymentScheduleItem = {
        id: `pay-${Date.now()}`,
        title: modalForm.title.trim(),
        accountEmail: modalForm.accountEmail?.trim() || undefined,
        dueDate: modalForm.dueDate || (Date.now() + 30 * 86400000),
        amount: modalForm.amount ? Number(modalForm.amount) : undefined,
        currency: modalForm.currency || 'VND',
        recurrence: modalForm.recurrence || 'monthly',
        repeatCount: modalForm.repeatCount === 0 || modalForm.repeatCount === null || modalForm.repeatCount === undefined ? null : Number(modalForm.repeatCount),
        completedCount: Number(modalForm.completedCount || 0),
        status: modalForm.status || 'active',
        note: modalForm.note?.trim() || undefined,
        category: modalForm.category || 'Subscription',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSchedules(prev => [newItem, ...prev]);
    } else if (modalItem) {
      setSchedules(prev => prev.map(s => {
        if (s.id !== modalItem.id) return s;
        return {
          ...s,
          title: modalForm.title?.trim() || s.title,
          accountEmail: modalForm.accountEmail?.trim() || undefined,
          dueDate: modalForm.dueDate || s.dueDate,
          amount: modalForm.amount ? Number(modalForm.amount) : undefined,
          currency: modalForm.currency || s.currency,
          recurrence: modalForm.recurrence || s.recurrence,
          repeatCount: modalForm.repeatCount === 0 || modalForm.repeatCount === null || modalForm.repeatCount === undefined ? null : Number(modalForm.repeatCount),
          completedCount: Number(modalForm.completedCount || 0),
          status: modalForm.status || s.status,
          note: modalForm.note?.trim() || undefined,
          category: modalForm.category || s.category,
          updatedAt: Date.now()
        };
      }));
    }

    setModalItem(null);
  };

  // Calculate Days Remaining & Urgency
  const getDueStatus = (dueDate: number, status: 'active' | 'paused' | 'completed') => {
    if (status === 'completed') {
      return { type: 'completed', label: 'Đã hoàn tất', daysLeft: 0, badgeClass: 'due-badge due-ok' };
    }
    if (status === 'paused') {
      return { type: 'paused', label: 'Tạm dừng', daysLeft: 0, badgeClass: 'due-badge' };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dueDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000);

    if (diffDays < 0) {
      return {
        type: 'overdue',
        label: `Quá hạn ${Math.abs(diffDays)} ngày`,
        daysLeft: diffDays,
        badgeClass: 'due-badge due-overdue'
      };
    }
    if (diffDays === 0) {
      return {
        type: 'due_today',
        label: 'Đến hạn hôm nay',
        daysLeft: 0,
        badgeClass: 'due-badge due-soon'
      };
    }
    if (diffDays <= 5) {
      return {
        type: 'due_soon',
        label: `Còn ${diffDays} ngày`,
        daysLeft: diffDays,
        badgeClass: 'due-badge due-soon'
      };
    }
    return {
      type: 'normal',
      label: `Còn ${diffDays} ngày`,
      daysLeft: diffDays,
      badgeClass: 'due-badge due-ok'
    };
  };

  // Format Helper for Currency
  const formatMoney = (amount?: number, currency: 'VND' | 'USD' = 'VND') => {
    if (amount === undefined || amount === null) return '—';
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`;
    }
    return `${amount.toLocaleString('vi-VN')} ₫`;
  };

  // Format Date Display: 15/09/2026
  const formatDateDisplay = (ts: number) => {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Recurrence Label
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

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let activeCount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;
    let totalMonthlyVND = 0;
    let totalMonthlyUSD = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    schedules.forEach(s => {
      if (s.status === 'active') {
        activeCount++;

        // Due calculation
        const target = new Date(s.dueDate);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000);

        if (diffDays < 0) overdueCount++;
        else if (diffDays <= 7) dueSoonCount++;

        // Monthly cost normalize
        if (s.amount) {
          let multiplier = 1;
          if (s.recurrence === 'yearly') multiplier = 1 / 12;
          else if (s.recurrence === 'weekly') multiplier = 4.33;
          else if (s.recurrence === 'daily') multiplier = 30;
          else if (s.recurrence === 'one-time') multiplier = 0;

          if (s.currency === 'USD') {
            totalMonthlyUSD += s.amount * multiplier;
          } else {
            totalMonthlyVND += s.amount * multiplier;
          }
        }
      }
    });

    return {
      total: schedules.length,
      activeCount,
      dueSoonCount,
      overdueCount,
      totalMonthlyVND: Math.round(totalMonthlyVND),
      totalMonthlyUSD: Math.round(totalMonthlyUSD * 10) / 10
    };
  }, [schedules]);

  // Filter & Sort
  const filteredSchedules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return schedules
      .filter(item => {
        // Search
        if (q) {
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchEmail = (item.accountEmail || '').toLowerCase().includes(q);
          const matchNote = (item.note || '').toLowerCase().includes(q);
          const matchCategory = (item.category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchEmail && !matchNote && !matchCategory) {
            return false;
          }
        }

        // Status Filter
        const dueInfo = getDueStatus(item.dueDate, item.status);
        if (statusFilter === 'ACTIVE' && item.status !== 'active') return false;
        if (statusFilter === 'PAUSED' && item.status !== 'paused') return false;
        if (statusFilter === 'COMPLETED' && item.status !== 'completed') return false;
        if (statusFilter === 'OVERDUE' && dueInfo.type !== 'overdue') return false;
        if (statusFilter === 'DUE_SOON' && dueInfo.type !== 'due_soon' && dueInfo.type !== 'due_today') return false;

        // Recurrence Filter
        if (recurrenceFilter !== 'ALL' && item.recurrence !== recurrenceFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'dueDate') {
          comp = a.dueDate - b.dueDate;
        } else if (sortBy === 'title') {
          comp = a.title.localeCompare(b.title);
        } else if (sortBy === 'amount') {
          const valA = (a.currency === 'USD' ? (a.amount || 0) * 25400 : (a.amount || 0));
          const valB = (b.currency === 'USD' ? (b.amount || 0) * 25400 : (b.amount || 0));
          comp = valA - valB;
        } else if (sortBy === 'remaining') {
          const remA = a.repeatCount ? (a.repeatCount - a.completedCount) : 9999;
          const remB = b.repeatCount ? (b.repeatCount - b.completedCount) : 9999;
          comp = remA - remB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [schedules, searchQuery, statusFilter, recurrenceFilter, sortBy, sortOrder]);

  return (
    <div className="payment-schedule-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── ALL-IN-ONE UNIFIED HEADER BOX ── */}
      <div className="pay-unified-box">
        {/* Row 1: Global Status & Compact Metrics */}
        <div className="pay-unified-top">
          <div className="pay-unified-stats">
            <div className="pay-pill">
              <span className="pay-pill-dot active" />
              <span className="pay-pill-label">Ước tính:</span>
              <strong className="pay-pill-val" style={{ color: 'var(--color-accent)' }}>
                {summaryMetrics.totalMonthlyVND > 0 && `${summaryMetrics.totalMonthlyVND.toLocaleString('vi-VN')} ₫`}
                {summaryMetrics.totalMonthlyVND > 0 && summaryMetrics.totalMonthlyUSD > 0 && ' + '}
                {summaryMetrics.totalMonthlyUSD > 0 && `$${summaryMetrics.totalMonthlyUSD}`}
                {summaryMetrics.totalMonthlyVND === 0 && summaryMetrics.totalMonthlyUSD === 0 && '0 ₫'}
              </strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>/tháng</span>
            </div>

            <div className="pay-pill">
              <span className="pay-pill-dot" style={{ backgroundColor: summaryMetrics.dueSoonCount > 0 ? '#facc15' : '#64748b' }} />
              <span className="pay-pill-label">Sắp đến hạn:</span>
              <strong style={{ color: summaryMetrics.dueSoonCount > 0 ? '#facc15' : 'inherit' }}>
                {summaryMetrics.dueSoonCount}
              </strong>
            </div>

            <div className="pay-pill">
              <span className="pay-pill-dot" style={{ backgroundColor: summaryMetrics.overdueCount > 0 ? '#f87171' : '#64748b' }} />
              <span className="pay-pill-label">Quá hạn:</span>
              <strong style={{ color: summaryMetrics.overdueCount > 0 ? '#f87171' : 'inherit' }}>
                {summaryMetrics.overdueCount}
              </strong>
            </div>

            <div className="pay-pill">
              <span className="pay-pill-dot active" />
              <span className="pay-pill-label">Theo dõi:</span>
              <strong>{summaryMetrics.activeCount}/{summaryMetrics.total}</strong>
            </div>
          </div>

          <button className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleOpenEditModal()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            + Form chi tiết
          </button>
        </div>

        {/* Row 2: Natural Language Quick Input */}
        <div className="pay-unified-input-row">
          <div className="search-input-wrapper" style={{ flex: 1, minHeight: '42px' }}>
            <span className="search-icon" style={{ color: 'var(--color-accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input-field"
              placeholder="Ví dụ: thanh toán Gemini account cho khoang4@kent.edu vào ngày 15/09/2026, lặp lại hàng tháng, 12 lần, 500k"
              value={quickInputText}
              onChange={(e) => setQuickInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && parsedPreview.title.trim()) {
                  handleQuickAdd();
                }
              }}
            />
            {quickInputText && (
              <button className="search-clear-btn" onClick={() => setQuickInputText('')} title="Xóa">✕</button>
            )}
          </div>
          <button
            className="btn btn-primary"
            style={{ height: '42px', padding: '0 1.25rem', whiteSpace: 'nowrap' }}
            onClick={handleQuickAdd}
            disabled={!parsedPreview.title.trim() && !quickInputText.trim()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Thêm ngay
          </button>
        </div>

        {/* Dynamic Live Chips Breakdown OR Sample Chips */}
        {quickInputText.trim() ? (
          <div className="pay-live-preview-chips" style={{ margin: '0.5rem 0 0', paddingTop: '0.5rem' }}>
            <span className="pay-chip-badge">
              🏷️ Dịch vụ: <strong>{parsedPreview.title || 'Chưa nhận diện'}</strong>
            </span>
            {parsedPreview.accountEmail && (
              <span className="pay-chip-badge pay-chip-email">
                👤 Email: <strong>{parsedPreview.accountEmail}</strong>
              </span>
            )}
            <span className="pay-chip-badge pay-chip-date">
              📅 Đến hạn: <strong>{parsedPreview.dueDate ? formatDateDisplay(parsedPreview.dueDate) : 'Chưa rõ'}</strong>
            </span>
            <span className="pay-chip-badge pay-chip-recurrence">
              🔄 Chu kỳ: <strong>{getRecurrenceLabel(parsedPreview.recurrence)}</strong>
            </span>
            <span className="pay-chip-badge pay-chip-count">
              🔢 Lặp lại: <strong>{parsedPreview.repeatCount ? `${parsedPreview.repeatCount} lần` : 'Vô hạn'}</strong>
            </span>
            {parsedPreview.amount && (
              <span className="pay-chip-badge pay-chip-amount">
                💰 Số tiền: <strong>{formatMoney(parsedPreview.amount, parsedPreview.currency)}</strong>
              </span>
            )}
          </div>
        ) : (
          <div className="pay-quick-samples-row" style={{ margin: '0.45rem 0 0' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mẫu thử:</span>
            <button
              type="button"
              className="pay-sample-chip"
              onClick={() => setQuickInputText('thanh toán Gemini account cho khoang4@kent.edu vào ngày 15/09/2026, lặp lại hàng tháng, 12 lần, 500k')}
            >
              + Gemini khoang4@kent.edu 15/09 12 lần 500k
            </button>
            <button
              type="button"
              className="pay-sample-chip"
              onClick={() => setQuickInputText('Gia hạn Claude Pro cho dev@mikoi.org ngày 28/09, lặp lại hàng tháng, 6 lần, $20')}
            >
              + Claude Pro dev@mikoi.org 28/09 6 lần $20
            </button>
            <button
              type="button"
              className="pay-sample-chip"
              onClick={() => setQuickInputText('Gia hạn VPS Vultr ngày 05 hàng tháng vô hạn 250k')}
            >
              + VPS Vultr ngày 05 hàng tháng 250k
            </button>
          </div>
        )}

        {/* Row 3: Integrated Search & Filters inside the box */}
        <div className="pay-unified-filters">
          <div className="search-input-wrapper" style={{ flex: '1 1 200px' }}>
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input-field"
              style={{ padding: '0.4rem 0.8rem 0.4rem 2.1rem', fontSize: '0.84rem' }}
              placeholder="Lọc nhanh danh sách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <select
            className={`toolbar-select ${statusFilter !== 'ALL' ? 'active-filter' : ''}`}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang theo dõi</option>
            <option value="DUE_SOON">Sắp đến hạn (≤ 7 ngày)</option>
            <option value="OVERDUE">Quá hạn</option>
            <option value="PAUSED">Tạm dừng</option>
            <option value="COMPLETED">Đã hoàn tất</option>
          </select>

          <select
            className={`toolbar-select ${recurrenceFilter !== 'ALL' ? 'active-filter' : ''}`}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
            value={recurrenceFilter}
            onChange={(e) => setRecurrenceFilter(e.target.value)}
          >
            <option value="ALL">Tất cả chu kỳ</option>
            <option value="monthly">Hàng tháng</option>
            <option value="yearly">Hàng năm</option>
            <option value="weekly">Hàng tuần</option>
            <option value="one-time">Một lần</option>
          </select>

          <select
            className="toolbar-select"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="dueDate">Ngày đến hạn</option>
            <option value="title">Tên A-Z</option>
            <option value="amount">Số tiền</option>
            <option value="remaining">Số lần còn</option>
          </select>

          <button
            className="sort-direction-btn"
            style={{ padding: '0.4rem 0.6rem' }}
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Tăng dần. Bấm đổi sang giảm dần' : 'Giảm dần. Bấm đổi sang tăng dần'}
          >
            {sortOrder === 'asc' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7-7-7 7" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7 7 7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── SCHEDULES CARDS GRID ── */}
      {filteredSchedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '1rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', opacity: 0.6 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Không tìm thấy lịch thanh toán nào</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
            Nhập nhanh một câu ở thanh trên hoặc bấm Thêm Lịch Mới để bắt đầu theo dõi.
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenEditModal()}>
            Thêm Lịch Thanh Toán Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="pay-cards-grid">
          {filteredSchedules.map(item => {
            const dueInfo = getDueStatus(item.dueDate, item.status);
            const totalRep = item.repeatCount;
            const remainingRep = totalRep !== null && totalRep !== undefined ? Math.max(0, totalRep - item.completedCount) : null;
            const progressPercent = totalRep ? Math.min(100, Math.round((item.completedCount / totalRep) * 100)) : 100;

            return (
              <div key={item.id} className={`pay-card ${item.status === 'paused' ? 'is-paused' : ''} ${item.status === 'completed' ? 'is-completed' : ''}`}>
                {/* Card Header: Icon, Title & Urgency Badge */}
                <div className="pay-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div className="pay-card-icon-box">
                      {getBrandIcon(item.title, item.category)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h3 className="pay-card-title" title={item.title}>
                        {item.title}
                      </h3>
                      {item.accountEmail && (
                        <div className="pay-card-email" title={item.accountEmail}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <span>{item.accountEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={dueInfo.badgeClass}>
                    {dueInfo.label}
                  </span>
                </div>

                {/* Card Middle: Due Date & Amount */}
                <div className="pay-card-body">
                  <div className="pay-card-meta-row">
                    <div>
                      <span className="pay-meta-label">Ngày đến hạn</span>
                      <div className="pay-meta-val-date">
                        {formatDateDisplay(item.dueDate)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="pay-meta-label">Số tiền</span>
                      <div className="pay-meta-val-amount">
                        {formatMoney(item.amount, item.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Recurrence & Repetitions Progress */}
                  <div className="pay-progress-section">
                    <div className="pay-progress-header">
                      <span>
                        🔄 {getRecurrenceLabel(item.recurrence)}
                      </span>
                      <span>
                        {totalRep !== null && totalRep !== undefined ? (
                          <>Đã đóng: <strong>{item.completedCount}/{totalRep} kỳ</strong> {remainingRep !== null && remainingRep > 0 ? `(Còn ${remainingRep})` : '(Đã xong)'}</>
                        ) : (
                          <>Lặp lại vô hạn • Đã qua <strong>{item.completedCount} kỳ</strong></>
                        )}
                      </span>
                    </div>

                    {totalRep !== null && totalRep !== undefined && (
                      <div className="pay-progress-bar-track">
                        <div
                          className="pay-progress-bar-fill"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: progressPercent === 100 ? '#10b981' : 'var(--color-accent)'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {item.note && (
                    <div className="pay-card-note">
                      📝 {item.note}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pay-card-actions">
                  {item.status !== 'completed' ? (
                    <button
                      className="btn btn-primary pay-action-paid-btn"
                      onClick={() => handleMarkAsPaid(item)}
                      title="Đã thanh toán kỳ này (Tự động dời ngày sang kỳ tiếp theo)"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Đã thanh toán
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      ✓ Đã hoàn tất tất cả các kỳ
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="pay-icon-btn"
                      onClick={() => handleTogglePause(item)}
                      title={item.status === 'paused' ? 'Kích hoạt lại theo dõi' : 'Tạm dừng theo dõi'}
                    >
                      {item.status === 'paused' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      )}
                    </button>

                    <button
                      className="pay-icon-btn"
                      onClick={() => handleOpenEditModal(item)}
                      title="Chỉnh sửa thông tin"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    <button
                      className="pay-icon-btn pay-icon-btn-danger"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Xóa lịch này"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL / EDIT MODAL ── */}
      {modalItem && (
        <div className="modal-overlay" onClick={() => setModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {modalItem === 'NEW' ? 'Thêm Lịch Thanh Toán Mới' : 'Chỉnh Sửa Lịch Thanh Toán'}
              </h3>
              <button className="modal-close" onClick={() => setModalItem(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Service Title */}
              <div className="form-group">
                <label className="form-label">Tên Dịch Vụ / Khoản Thanh Toán *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Gemini Advanced Account, Claude Pro, VPS Vultr..."
                  value={modalForm.title || ''}
                  onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Account Email */}
              <div className="form-group">
                <label className="form-label">Tài Khoản / Email Liên Kết</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Ví dụ: khoang4@kent.edu"
                  value={modalForm.accountEmail || ''}
                  onChange={(e) => setModalForm(prev => ({ ...prev, accountEmail: e.target.value }))}
                />
              </div>

              {/* Due Date & Recurrence Row */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Ngày Đến Hạn Kỳ Này *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={modalForm.dueDate ? new Date(modalForm.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) {
                        setModalForm(prev => ({ ...prev, dueDate: d.getTime() }));
                      }
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chu Kỳ Lặp Lại</label>
                  <select
                    className="form-input"
                    value={modalForm.recurrence || 'monthly'}
                    onChange={(e) => setModalForm(prev => ({ ...prev, recurrence: e.target.value as any }))}
                  >
                    <option value="monthly">Hàng tháng (Monthly)</option>
                    <option value="yearly">Hàng năm (Yearly)</option>
                    <option value="weekly">Hàng tuần (Weekly)</option>
                    <option value="daily">Hàng ngày (Daily)</option>
                    <option value="one-time">Một lần duy nhất (One-time)</option>
                  </select>
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Số Tiền</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ví dụ: 500000 hoặc 20"
                    value={modalForm.amount || ''}
                    onChange={(e) => setModalForm(prev => ({ ...prev, amount: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Loại Tiền Tệ</label>
                  <select
                    className="form-input"
                    value={modalForm.currency || 'VND'}
                    onChange={(e) => setModalForm(prev => ({ ...prev, currency: e.target.value as any }))}
                  >
                    <option value="VND">VNĐ (₫)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Repeat Count & Completed Count */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Tổng Số Lần Lặp (Để trống nếu vô hạn)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ví dụ: 12 (kỳ)"
                    value={modalForm.repeatCount === null || modalForm.repeatCount === undefined ? '' : modalForm.repeatCount}
                    onChange={(e) => setModalForm(prev => ({
                      ...prev,
                      repeatCount: e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10))
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số Kỳ Đã Thanh Toán</label>
                  <input
                    type="number"
                    className="form-input"
                    value={modalForm.completedCount || 0}
                    onChange={(e) => setModalForm(prev => ({
                      ...prev,
                      completedCount: Math.max(0, parseInt(e.target.value || '0', 10))
                    }))}
                  />
                </div>
              </div>

              {/* Status & Category */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Trạng Thái</label>
                  <select
                    className="form-input"
                    value={modalForm.status || 'active'}
                    onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="active">Đang theo dõi (Active)</option>
                    <option value="paused">Tạm dừng (Paused)</option>
                    <option value="completed">Đã hoàn tất (Completed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nhóm Dịch Vụ</label>
                  <select
                    className="form-input"
                    value={modalForm.category || 'AI Tool'}
                    onChange={(e) => setModalForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="AI Tool">AI Tool & API</option>
                    <option value="Cloud & Hosting">Cloud & Hosting</option>
                    <option value="Software & Apps">Phần mềm & Ứng dụng</option>
                    <option value="Entertainment">Giải trí & Streaming</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label">Ghi Chú Bổ Sung</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Ghi chú thẻ thanh toán, cách đăng nhập, ngày gia hạn..."
                  value={modalForm.note || ''}
                  onChange={(e) => setModalForm(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {modalItem !== 'NEW' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteItem((modalItem as PaymentScheduleItem).id)}
                >
                  Xóa Lịch
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" onClick={() => setModalItem(null)}>
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveModal}
                  disabled={!modalForm.title?.trim()}
                >
                  Lưu Thông Tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
