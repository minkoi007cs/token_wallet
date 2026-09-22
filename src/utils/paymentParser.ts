/**
 * Utility to parse natural language payment schedule inputs
 * Example: "thanh toán Gemini account cho khoang4@kent.edu vào ngày 15/09/2026, lặp lại hàng tháng, 12 lần, 500k"
 */

export interface ParsedPaymentInfo {
  title: string;
  accountEmail: string;
  dueDate: number | null; // Timestamp ms
  dueDateString: string; // YYYY-MM-DD
  recurrence: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'one-time';
  repeatCount: number | null; // null means infinite
  amount: number | null;
  currency: 'VND' | 'USD';
  paymentMethod?: string;
  isAutoDebit: boolean;
  rawInput: string;
}

// Module-level pre-compiled regexes for maximum performance
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
const CARD_REGEX = /\b(visa|mastercard|timo|momo|zalopay|vcb|tcb|mbbank|vpbank)\s*([a-zA-Z0-9._-]+)?/i;
const CARD_TAIL_REGEX = /\bthẻ\s+([a-zA-Z0-9._-]+)/i;
const AUTO_DEBIT_REGEX = /tự động|auto|tự trừ|tự gia hạn/i;
const MANUAL_DEBIT_REGEX = /thủ công|manual|tự đóng|tự chuyển/i;

const USD_REGEX = /\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:\$|usd)/i;
const K_VND_REGEX = /(\d+(?:[.,]\d+)?)\s*k\b/i;
const VND_REGEX = /(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:đ|vnd|vnđ|đồng)?/i;

const INFINITE_REPEAT_REGEX = /vô hạn|không giới hạn|vĩnh viễn|forever|infinite/i;
const COUNT_REPEAT_REGEX = /(\d+)\s*(?:lần|tháng|kỳ|times|cycles|chu kỳ)/i;

const FULL_DATE_REGEX = /(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})[/-](\d{4})/i;
const ISO_DATE_REGEX = /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/i;
const SHORT_DATE_REGEX = /(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?!\d)/i;
const DAY_ONLY_REGEX = /(?:ngày|mùng|vào ngày)\s+(\d{1,2})\b/i;

// Static noise patterns pre-compiled for performance
const NOISE_PATTERNS = [
  /^thanh\s*toán\s+/i,
  /^gia\s*hạn\s+/i,
  /^nhắc\s*hạn\s+/i,
  /^nhắc\s*thanh\s*toán\s+/i,
  /^nhắc\s+/i,
  /^mua\s+/i,
  /^tiền\s+/i,
  /\bcho\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
  /\bcho\s+[^\s,]+/i,
  /\bvào\s+ngày\s+[^,]+/i,
  /\btừ\s+ngày\s+[^,]+/i,
  /\bngày\s+[^,]+/i,
  /\blặp\s*lại\s+[^,]+/i,
  /\bhàng\s*tháng/i,
  /\bhàng\s*năm/i,
  /\bhàng\s*tuần/i,
  /\b\d+\s*lần/i,
  /\b\d+\s*kỳ/i,
  /\b\d+k\b/i,
  /\$\s*\d+/i,
  /\d+\s*\$/i,
  /\d{1,3}(?:[.,]\d{3})+\s*(?:đ|vnd|vnđ)?/i,
  /\btự\s*động\b/i,
  /\bthủ\s*công\b/i,
  /\bqua\s+(?:timo|momo|zalopay|vcb|tcb|visa|mastercard)\b/i,
  /\bbằng\s+(?:timo|momo|zalopay|vcb|tcb|visa|mastercard)\b/i,
  /\bthẻ\s+[a-zA-Z0-9._-]+\b/i
];

export function parsePaymentScheduleText(input: string): ParsedPaymentInfo {
  const text = input.trim();
  if (!text) {
    return {
      title: '',
      accountEmail: '',
      dueDate: null,
      dueDateString: '',
      recurrence: 'monthly',
      repeatCount: null,
      amount: null,
      currency: 'VND',
      paymentMethod: '',
      isAutoDebit: false,
      rawInput: text
    };
  }

  // 1. Extract Email
  const emailMatch = text.match(EMAIL_REGEX);
  const accountEmail = emailMatch ? emailMatch[1] : '';

  // 2. Extract Payment Method
  let paymentMethod = '';
  const cardMatch = text.match(CARD_REGEX);
  const cardTailMatch = text.match(CARD_TAIL_REGEX);
  if (cardMatch) {
    paymentMethod = cardMatch[0].trim();
  } else if (cardTailMatch) {
    paymentMethod = `Thẻ ${cardTailMatch[1]}`;
  }

  // 3. Extract Auto-debit
  let isAutoDebit = false;
  if (AUTO_DEBIT_REGEX.test(text)) {
    isAutoDebit = true;
  } else if (MANUAL_DEBIT_REGEX.test(text)) {
    isAutoDebit = false;
  }

  // 4. Extract Amount & Currency
  let amount: number | null = null;
  let currency: 'VND' | 'USD' = 'VND';

  const usdMatch = text.match(USD_REGEX);
  if (usdMatch) {
    const val = parseFloat((usdMatch[1] || usdMatch[2]).replace(',', '.'));
    if (!isNaN(val)) {
      amount = val;
      currency = 'USD';
    }
  } else {
    const kMatch = text.match(K_VND_REGEX);
    if (kMatch) {
      const val = parseFloat(kMatch[1].replace(',', '.'));
      if (!isNaN(val)) {
        amount = Math.round(val * 1000);
        currency = 'VND';
      }
    } else {
      const vndMatch = text.match(VND_REGEX);
      if (vndMatch) {
        const rawDigits = vndMatch[1].replace(/[.,]/g, '');
        const num = parseInt(rawDigits, 10);
        if (!isNaN(num) && num > 999) {
          amount = num;
          currency = 'VND';
        }
      }
    }
  }

  // 5. Extract Repeat Count
  let repeatCount: number | null = null;
  if (!INFINITE_REPEAT_REGEX.test(text)) {
    const countMatch = text.match(COUNT_REPEAT_REGEX);
    if (countMatch) {
      repeatCount = parseInt(countMatch[1], 10);
    }
  }

  // 6. Extract Recurrence
  let recurrence: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'one-time' = 'monthly';
  if (/hàng năm|mỗi năm|yearly|annually|năm/i.test(text)) {
    recurrence = 'yearly';
  } else if (/hàng tuần|mỗi tuần|weekly|tuần/i.test(text)) {
    recurrence = 'weekly';
  } else if (/hàng ngày|mỗi ngày|daily|ngày/i.test(text) && !/ngày \d+/i.test(text)) {
    recurrence = 'daily';
  } else if (/một lần|1 lần duy nhất|one-off|one time/i.test(text)) {
    recurrence = 'one-time';
  } else if (/hàng tháng|mỗi tháng|monthly|tháng/i.test(text)) {
    recurrence = 'monthly';
  }

  // 7. Extract Due Date
  let dueDate: number | null = null;
  let dueDateString = '';
  const now = new Date();
  const currentYear = now.getFullYear();

  const fullDateMatch = text.match(FULL_DATE_REGEX);
  const isoDateMatch = text.match(ISO_DATE_REGEX);
  const shortDateMatch = text.match(SHORT_DATE_REGEX);
  const dayOnlyMatch = text.match(DAY_ONLY_REGEX);

  if (fullDateMatch) {
    const day = parseInt(fullDateMatch[1], 10);
    const month = parseInt(fullDateMatch[2], 10) - 1;
    const year = parseInt(fullDateMatch[3], 10);
    const d = new Date(year, month, day, 12, 0, 0);
    if (!isNaN(d.getTime())) {
      dueDate = d.getTime();
      dueDateString = formatDateToYMD(d);
    }
  } else if (isoDateMatch) {
    const year = parseInt(isoDateMatch[1], 10);
    const month = parseInt(isoDateMatch[2], 10) - 1;
    const day = parseInt(isoDateMatch[3], 10);
    const d = new Date(year, month, day, 12, 0, 0);
    if (!isNaN(d.getTime())) {
      dueDate = d.getTime();
      dueDateString = formatDateToYMD(d);
    }
  } else if (shortDateMatch) {
    const day = parseInt(shortDateMatch[1], 10);
    const month = parseInt(shortDateMatch[2], 10) - 1;
    let d = new Date(currentYear, month, day, 12, 0, 0);
    if (d.getTime() < now.getTime() - 90 * 86400000) {
      d = new Date(currentYear + 1, month, day, 12, 0, 0);
    }
    if (!isNaN(d.getTime())) {
      dueDate = d.getTime();
      dueDateString = formatDateToYMD(d);
    }
  } else if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1], 10);
    if (day >= 1 && day <= 31) {
      let d = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
      if (d.getTime() < now.getTime()) {
        d = new Date(now.getFullYear(), now.getMonth() + 1, day, 12, 0, 0);
      }
      dueDate = d.getTime();
      dueDateString = formatDateToYMD(d);
    }
  }

  // Default to 1 month from today if unspecified
  if (!dueDate) {
    const defaultDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0);
    dueDate = defaultDate.getTime();
    dueDateString = formatDateToYMD(defaultDate);
  }

  // 8. Clean title & fallback logic
  let title = text;
  for (const pattern of NOISE_PATTERNS) {
    title = title.replace(pattern, ' ');
  }
  title = title.replace(/[,;:\-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!title) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('gemini')) title = 'Gemini Advanced';
    else if (lowerText.includes('claude')) title = 'Claude Pro';
    else if (lowerText.includes('copilot')) title = 'GitHub Copilot';
    else if (lowerText.includes('chatgpt') || lowerText.includes('openai')) title = 'ChatGPT Plus';
    else if (lowerText.includes('cursor')) title = 'Cursor Pro';
    else if (lowerText.includes('netflix')) title = 'Netflix';
    else if (lowerText.includes('spotify')) title = 'Spotify Premium';
    else if (lowerText.includes('vultr') || lowerText.includes('vps')) title = 'VPS Hosting';
    else if (accountEmail) title = `Dịch vụ (${accountEmail.split('@')[0]})`;
    else title = 'Thanh toán định kỳ';
  }

  return {
    title: capitalizeFirst(title),
    accountEmail,
    dueDate,
    dueDateString,
    recurrence,
    repeatCount,
    amount,
    currency,
    paymentMethod: paymentMethod ? capitalizeFirst(paymentMethod) : undefined,
    isAutoDebit,
    rawInput: text
  };
}

function formatDateToYMD(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calculate the next due date based on current due date and recurrence
 */
export function calculateNextDueDate(currentDueDate: number, recurrence: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'one-time'): number {
  const d = new Date(currentDueDate);
  switch (recurrence) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'one-time':
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.getTime();
}
