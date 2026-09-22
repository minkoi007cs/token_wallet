import { describe, it, expect } from 'vitest';
import { parsePaymentScheduleText, calculateNextDueDate } from './paymentParser';

describe('paymentParser', () => {
  describe('parsePaymentScheduleText', () => {
    it('returns empty defaults for blank input', () => {
      const res = parsePaymentScheduleText('  ');
      expect(res.title).toBe('');
      expect(res.accountEmail).toBe('');
      expect(res.dueDate).toBeNull();
      expect(res.dueDateString).toBe('');
      expect(res.amount).toBeNull();
      expect(res.isAutoDebit).toBe(false);
    });

    it('parses full natural language input correctly', () => {
      const input = 'thanh toán Gemini account cho khoang4@kent.edu vào ngày 15/09/2026, lặp lại hàng tháng, 12 lần, 500k qua Visa 8899 tự động';
      const res = parsePaymentScheduleText(input);

      expect(res.accountEmail).toBe('khoang4@kent.edu');
      expect(res.amount).toBe(500000);
      expect(res.currency).toBe('VND');
      expect(res.recurrence).toBe('monthly');
      expect(res.repeatCount).toBe(12);
      expect(res.dueDateString).toBe('2026-09-15');
      expect(res.paymentMethod).toBe('Visa 8899');
      expect(res.isAutoDebit).toBe(true);
      expect(res.title).toContain('Gemini');
    });

    it('parses USD amounts correctly', () => {
      const res = parsePaymentScheduleText('Claude Pro $20 hàng tháng');
      expect(res.amount).toBe(20);
      expect(res.currency).toBe('USD');
      expect(res.title).toBe('Claude Pro');
    });

    it('parses infinite recurrence repeat count', () => {
      const res = parsePaymentScheduleText('ChatGPT Plus 500k vô hạn');
      expect(res.repeatCount).toBeNull();
    });

    it('handles auto-debit vs manual flag', () => {
      const auto = parsePaymentScheduleText('Gia hạn Spotify tự trừ');
      expect(auto.isAutoDebit).toBe(true);

      const manual = parsePaymentScheduleText('Gia hạn Netflix thủ công');
      expect(manual.isAutoDebit).toBe(false);
    });

    it('parses card tail matches like "thẻ 1234"', () => {
      const res = parsePaymentScheduleText('Vultr VPS 10$ bằng thẻ 1234');
      expect(res.paymentMethod).toBe('Thẻ 1234');
      expect(res.amount).toBe(10);
      expect(res.currency).toBe('USD');
    });

    it('provides title fallbacks based on keywords when title is stripped out by noise regex', () => {
      const netflix = parsePaymentScheduleText('thanh toán netflix cho user@mail.com 200k');
      expect(netflix.title).toBe('Netflix');

      const genericEmail = parsePaymentScheduleText('thanh toán cho testuser@gmail.com 100k');
      expect(genericEmail.title).toBe('Dịch vụ (testuser)');
    });
  });

  describe('calculateNextDueDate', () => {
    it('calculates weekly next due date', () => {
      const base = new Date('2026-09-01T12:00:00Z').getTime();
      const next = calculateNextDueDate(base, 'weekly');
      const expected = new Date('2026-09-08T12:00:00Z').getTime();
      expect(next).toBe(expected);
    });

    it('calculates monthly next due date', () => {
      const base = new Date('2026-09-15T12:00:00Z').getTime();
      const next = calculateNextDueDate(base, 'monthly');
      const expected = new Date('2026-10-15T12:00:00Z').getTime();
      expect(next).toBe(expected);
    });

    it('calculates yearly next due date', () => {
      const base = new Date('2026-09-15T12:00:00Z').getTime();
      const next = calculateNextDueDate(base, 'yearly');
      const expected = new Date('2027-09-15T12:00:00Z').getTime();
      expect(next).toBe(expected);
    });

    it('calculates daily next due date', () => {
      const base = new Date('2026-09-15T12:00:00Z').getTime();
      const next = calculateNextDueDate(base, 'daily');
      const expected = new Date('2026-09-16T12:00:00Z').getTime();
      expect(next).toBe(expected);
    });

    it('returns same date for one-time recurrence', () => {
      const base = new Date('2026-09-15T12:00:00Z').getTime();
      const next = calculateNextDueDate(base, 'one-time');
      expect(next).toBe(base);
    });
  });
});
