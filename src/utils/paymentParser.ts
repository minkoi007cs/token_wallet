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
  rawInput: string;
}

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
      rawInput: text
    };
  }

  let cleaned = text;

  // 1. Extract Email if present
  let accountEmail = '';
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = cleaned.match(emailRegex);
  if (emailMatch) {
    accountEmail = emailMatch[1];
  }

  // 2. Extract Amount & Currency
  let amount: number | null = null;
  let currency: 'VND' | 'USD' = 'VND';

  // Check USD: $20, 20$, 20 usd
  const usdMatch = cleaned.match(/\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:\$|usd)/i);
  if (usdMatch) {
    const val = parseFloat((usdMatch[1] || usdMatch[2]).replace(',', '.'));
    if (!isNaN(val)) {
      amount = val;
      currency = 'USD';
    }
  } else {
    // Check VND: 500k, 500.000, 500000d, 500000 vnd
    const kMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
    if (kMatch) {
      const val = parseFloat(kMatch[1].replace(',', '.'));
      if (!isNaN(val)) {
        amount = Math.round(val * 1000);
        currency = 'VND';
      }
    } else {
      const vndMatch = cleaned.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:đ|vnd|vnđ|đồng)?/i);
      if (vndMatch) {
        const rawDigits = vndMatch[1].replace(/[.,]/g, '');
        const num = parseInt(rawDigits, 10);
        // Avoid picking up year numbers like 2026 or small days like 15 as amount if standalone
        if (!isNaN(num) && num > 999) {
          amount = num;
          currency = 'VND';
        }
      }
    }
  }

  // 3. Extract Repeat Count (e.g., "12 lần", "6 lần", "3 kỳ", "vô hạn", "không giới hạn")
  let repeatCount: number | null = null;
  if (/vô hạn|không giới hạn|vĩnh viễn|forever|infinite/i.test(cleaned)) {
    repeatCount = null;
  } else {
    const countMatch = cleaned.match(/(\d+)\s*(?:lần|tháng|kỳ|times|cycles|chu kỳ)/i);
    if (countMatch) {
      repeatCount = parseInt(countMatch[1], 10);
    }
  }

  // 4. Extract Recurrence (hàng tháng, hàng năm, hàng tuần, hàng ngày, một lần)
  let recurrence: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'one-time' = 'monthly';
  if (/hàng năm|mỗi năm|yearly|annually|năm/i.test(cleaned)) {
    recurrence = 'yearly';
  } else if (/hàng tuần|mỗi tuần|weekly|tuần/i.test(cleaned)) {
    recurrence = 'weekly';
  } else if (/hàng ngày|mỗi ngày|daily|ngày/i.test(cleaned) && !/ngày \d+/i.test(cleaned)) {
    recurrence = 'daily';
  } else if (/một lần|1 lần duy nhất|one-off|one time/i.test(cleaned)) {
    recurrence = 'one-time';
  } else if (/hàng tháng|mỗi tháng|monthly|tháng/i.test(cleaned)) {
    recurrence = 'monthly';
  }

  // 5. Extract Due Date (e.g., "ngày 15/09/2026", "15/09", "2026-09-15", "ngày 15", "15th")
  let dueDate: number | null = null;
  let dueDateString = '';

  const now = new Date();
  const currentYear = now.getFullYear();

  // Full date: DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  const fullDateMatch = cleaned.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})[/-](\d{4})/i);
  const isoDateMatch = cleaned.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/i);
  const shortDateMatch = cleaned.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?!\d)/i);
  const dayOnlyMatch = cleaned.match(/(?:ngày|mùng|vào ngày)\s+(\d{1,2})\b/i);

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
    let year = currentYear;
    let d = new Date(year, month, day, 12, 0, 0);
    if (d.getTime() < now.getTime() - 90 * 86400000) {
      d = new Date(year + 1, month, day, 12, 0, 0);
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

  // If no specific date found, default to 1 month from today
  if (!dueDate) {
    const defaultDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0);
    dueDate = defaultDate.getTime();
    dueDateString = formatDateToYMD(defaultDate);
  }

  // 6. Extract Service Name / Title
  let title = cleaned;

  // Remove boilerplate phrases
  const noisePatterns = [
    /^thanh\s*toán\s+/i,
    /^gia\s*hạn\s+/i,
    /^nhắc\s*hạn\s+/i,
    /^mua\s+/i,
    /^tiền\s+/i,
    /\bcho\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
    /\bcho\s+[^\s,]+/i,
    /\bvào\s+ngày\s+[^,]+/i,
    /\bngày\s+[^,]+/i,
    /\blặp\s*lại\s+[^,]+/i,
    /\bhàng\s*tháng/i,
    /\bhàng\s*năm/i,
    /\bhàng\s*tuần/i,
    /\b\d+\s*lần/i,
    /\b\d+k\b/i,
    /\$\s*\d+/i,
    /\d+\s*\$/i,
    /\d{1,3}(?:[.,]\d{3})+\s*(?:đ|vnd|vnđ)?/i
  ];

  noisePatterns.forEach(pattern => {
    title = title.replace(pattern, ' ');
  });

  // Clean trailing punctuation and spaces
  title = title.replace(/[,;:\-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  // If title is empty, deduce sensible fallback
  if (!title) {
    if (cleaned.toLowerCase().includes('gemini')) title = 'Gemini Advanced';
    else if (cleaned.toLowerCase().includes('claude')) title = 'Claude Pro';
    else if (cleaned.toLowerCase().includes('copilot')) title = 'GitHub Copilot';
    else if (cleaned.toLowerCase().includes('chatgpt') || cleaned.toLowerCase().includes('openai')) title = 'ChatGPT Plus';
    else if (cleaned.toLowerCase().includes('cursor')) title = 'Cursor Pro';
    else if (cleaned.toLowerCase().includes('netflix')) title = 'Netflix';
    else if (cleaned.toLowerCase().includes('spotify')) title = 'Spotify Premium';
    else if (cleaned.toLowerCase().includes('vultr') || cleaned.toLowerCase().includes('vps')) title = 'VPS Hosting';
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
