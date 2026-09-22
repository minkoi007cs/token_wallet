/**
 * Pure row mappers between database schemas (snake_case) and frontend models (camelCase).
 */

export interface AccountRow {
  id: string;
  tool_id: string;
  email: string;
  status?: string;
  reset_time: number | string;
  run_out_time?: number | string | null;
  next_due_date?: number | string | null;
  is_disabled?: boolean;
  note?: string;
}

export interface Account {
  id: string;
  email: string;
  status: 'active' | 'run-out';
  resetTime: number;
  runOutTime?: number;
  nextDueDate?: number;
  isDisabled?: boolean;
  note?: string;
}

export interface ToolRow {
  id: string;
  name: string;
  reset_cycle_hours?: number;
  display_order?: number;
}

export interface AITool {
  id: string;
  name: string;
  resetCycleHours: number;
  displayOrder?: number;
  accounts: Account[];
}

export interface AppProjectRow {
  id: string;
  title: string;
  url?: string;
  category?: string;
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
    email: row.email,
    status: row.status === 'run-out' ? 'run-out' : 'active',
    resetTime: Number(row.reset_time),
    runOutTime: row.run_out_time ? Number(row.run_out_time) : undefined,
    nextDueDate: row.next_due_date ? Number(row.next_due_date) : undefined,
    isDisabled: Boolean(row.is_disabled),
    note: row.note || undefined,
  };
}

export function accountToRow(account: Account, toolId: string): AccountRow {
  return {
    id: account.id,
    tool_id: toolId,
    email: account.email,
    status: account.status,
    reset_time: account.resetTime,
    run_out_time: account.runOutTime || null,
    next_due_date: account.nextDueDate || null,
    is_disabled: Boolean(account.isDisabled),
    note: account.note || '',
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
    reset_cycle_hours: tool.resetCycleHours,
    display_order: tool.displayOrder || 0,
  };
}

// Mappers: AppProject
export function rowToAppProject(row: AppProjectRow): AppProject {
  return {
    id: row.id,
    title: row.title,
    frontendUrl: row.url || undefined,
    category: row.category || 'General',
    status: row.status || 'Development',
    priority: row.priority || 'Medium',
    description: row.description || undefined,
    isDisabled: Boolean(row.is_disabled),
  };
}

export function appProjectToRow(project: AppProject): AppProjectRow {
  return {
    id: project.id,
    title: project.title,
    url: project.frontendUrl || '',
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
