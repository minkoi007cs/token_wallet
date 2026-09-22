/**
 * Pure row mappers between database schemas (snake_case) and frontend models (camelCase).
 */

export interface AccountRow {
  id: string;
  tool_id: string;
  name: string;
  status: string;
  exhausted_type?: string | null;
  reset_time?: number | string | null;
  due_date?: number | string | null;
  due_amount?: number | string | null;
  due_note?: string | null;
  no_due?: boolean | null;
  disabled?: boolean | null;
  login_hint?: string | null;
  created_at?: string | null;
}

export interface Account {
  id: string;
  name: string;
  status: 'active' | 'exhausted';
  exhaustedType?: '5h' | 'weekly' | 'custom';
  resetTime?: number;
  dueDate?: number;
  dueAmount?: number;
  dueNote?: string;
  noDue?: boolean;
  disabled?: boolean;
  loginHint?: string;
}

export interface ToolRow {
  id: string;
  name: string;
  reset_cycle_hours?: number;
  display_order?: number;
  created_at?: string | null;
}

export interface AITool {
  id: string;
  name: string;
  resetCycleHours?: number;
  displayOrder?: number;
  accounts: Account[];
}

export interface AppProjectRow {
  id: string;
  title?: string;
  name?: string;
  url?: string;
  category?: string;
  type?: string;
  status?: string;
  priority?: string;
  description?: string;
  is_disabled?: boolean;
}

export interface AppProject {
  id: string;
  title: string;
  frontendUrl?: string;
  category: string;
  status: string;
  priority: string;
  description?: string;
  isDisabled?: boolean;
  healthStatus?: 'healthy' | 'checking' | 'failed' | 'unknown';
  backlog?: BacklogItem[];
}

export interface BacklogItemRow {
  id: string;
  project_id: string;
  title: string;
  is_completed?: boolean;
}

export interface BacklogItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface PaymentScheduleRow {
  id: string;
  title: string;
  account_email?: string;
  due_date?: number | null;
  due_date_string?: string;
  recurrence: string;
  repeat_count?: number | null;
  amount?: number | null;
  currency?: string;
  payment_method?: string;
  is_auto_debit?: boolean;
  is_paid?: boolean;
  is_paused?: boolean;
  raw_input?: string;
}

export interface PaymentScheduleItem {
  id: string;
  title: string;
  accountEmail: string;
  dueDate: number | null;
  dueDateString: string;
  recurrence: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'one-time';
  repeatCount: number | null;
  amount: number | null;
  currency: 'VND' | 'USD';
  paymentMethod?: string;
  isAutoDebit: boolean;
  isPaid?: boolean;
  isPaused?: boolean;
  rawInput: string;
}

// Mappers: Account
export function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name || 'Unnamed Account',
    status: row.status === 'exhausted' ? 'exhausted' : 'active',
    exhaustedType: (row.exhausted_type as Account['exhaustedType']) || undefined,
    resetTime: row.reset_time != null ? Number(row.reset_time) : undefined,
    dueDate: row.due_date != null ? Number(row.due_date) : undefined,
    dueAmount: row.due_amount != null ? Number(row.due_amount) : undefined,
    dueNote: row.due_note || undefined,
    noDue: Boolean(row.no_due),
    disabled: Boolean(row.disabled),
    loginHint: row.login_hint || undefined,
  };
}

export function accountToRow(account: Account, toolId: string): AccountRow {
  return {
    id: account.id,
    tool_id: toolId,
    name: account.name,
    status: account.status,
    exhausted_type: account.exhaustedType || null,
    reset_time: account.resetTime != null ? account.resetTime : null,
    due_date: account.dueDate != null ? account.dueDate : null,
    due_amount: account.dueAmount != null ? account.dueAmount : null,
    due_note: account.dueNote || null,
    no_due: Boolean(account.noDue),
    disabled: Boolean(account.disabled),
    login_hint: account.loginHint || null,
  };
}

// Mappers: Tool
export function rowToTool(row: ToolRow): Omit<AITool, 'accounts'> {
  return {
    id: row.id,
    name: row.name,
    resetCycleHours: Number(row.reset_cycle_hours || 5),
    displayOrder: row.display_order !== undefined ? Number(row.display_order) : undefined,
  };
}

export function toolToRow(tool: AITool): ToolRow {
  return {
    id: tool.id,
    name: tool.name,
    reset_cycle_hours: tool.resetCycleHours || 5,
    display_order: tool.displayOrder || 0,
  };
}

// Mappers: AppProject
export function rowToAppProject(row: AppProjectRow): AppProject {
  return {
    id: row.id,
    title: row.name || row.title || 'Untitled App',
    frontendUrl: row.url || undefined,
    category: row.type || row.category || 'Web App',
    status: row.status || 'Development',
    priority: row.priority || 'Medium',
    description: row.description || undefined,
    isDisabled: Boolean(row.is_disabled),
  };
}

export function appProjectToRow(project: AppProject): AppProjectRow {
  return {
    id: project.id,
    name: project.title,
    title: project.title,
    url: project.frontendUrl || '',
    type: project.category,
    category: project.category,
    status: project.status,
    priority: project.priority,
    description: project.description || '',
    is_disabled: Boolean(project.isDisabled),
  };
}

// Mappers: BacklogItem
export function rowToBacklogItem(row: BacklogItemRow): BacklogItem {
  return {
    id: row.id,
    title: row.title,
    isCompleted: Boolean(row.is_completed),
  };
}

export function backlogItemToRow(item: BacklogItem, projectId: string): BacklogItemRow {
  return {
    id: item.id,
    project_id: projectId,
    title: item.title,
    is_completed: Boolean(item.isCompleted),
  };
}

// Mappers: PaymentSchedule
export function rowToPaymentSchedule(row: PaymentScheduleRow): PaymentScheduleItem {
  return {
    id: row.id,
    title: row.title,
    accountEmail: row.account_email || '',
    dueDate: row.due_date ? Number(row.due_date) : null,
    dueDateString: row.due_date_string || '',
    recurrence: (row.recurrence as PaymentScheduleItem['recurrence']) || 'monthly',
    repeatCount: row.repeat_count !== undefined ? row.repeat_count : null,
    amount: row.amount !== undefined ? Number(row.amount) : null,
    currency: row.currency === 'USD' ? 'USD' : 'VND',
    paymentMethod: row.payment_method || undefined,
    isAutoDebit: Boolean(row.is_auto_debit),
    isPaid: Boolean(row.is_paid),
    isPaused: Boolean(row.is_paused),
    rawInput: row.raw_input || '',
  };
}

export function paymentScheduleToRow(item: PaymentScheduleItem): PaymentScheduleRow {
  return {
    id: item.id,
    title: item.title,
    account_email: item.accountEmail || '',
    due_date: item.dueDate,
    due_date_string: item.dueDateString || '',
    recurrence: item.recurrence,
    repeat_count: item.repeatCount,
    amount: item.amount,
    currency: item.currency,
    payment_method: item.paymentMethod || '',
    is_auto_debit: Boolean(item.isAutoDebit),
    is_paid: Boolean(item.isPaid),
    is_paused: Boolean(item.isPaused),
    raw_input: item.rawInput || '',
  };
}

/**
 * Applies seed data only if the loaded collection is completely empty.
 */
export function seedIfEmpty<T>(loaded: T[], seed: T[]): T[] {
  return loaded.length > 0 ? loaded : seed;
}
