import { describe, it, expect } from 'vitest';
import {
  parseResetTime,
  formatCountdown,
  formatResetTime,
  formatVerboseCountdown,
  formatVerboseResetTime,
  getRemainingDurationString,
} from './timeParser';

describe('timeParser', () => {
  describe('parseResetTime', () => {
    it('returns null for empty input', () => {
      expect(parseResetTime('')).toBeNull();
      expect(parseResetTime('   ')).toBeNull();
    });

    it('parses relative durations correctly', () => {
      const now = Date.now();
      const res5h = parseResetTime('5h');
      expect(res5h).not.toBeNull();
      expect(Math.round((res5h! - now) / (1000 * 60 * 60))).toBe(5);

      const resCombined = parseResetTime('2 days 3 hours');
      expect(resCombined).not.toBeNull();
      const diffHours = Math.round((resCombined! - now) / (1000 * 60 * 60));
      expect(diffHours).toBe(51); // 48 + 3 = 51
    });

    it('parses bare number as hours', () => {
      const now = Date.now();
      const res = parseResetTime('3');
      expect(res).not.toBeNull();
      expect(Math.round((res! - now) / (1000 * 60 * 60))).toBe(3);
    });

    it('parses explicit month and day date strings', () => {
      const res = parseResetTime('Jun 12 2026 14:30');
      expect(res).not.toBeNull();
      const d = new Date(res!);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(5); // June is 5
      expect(d.getDate()).toBe(12);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
    });

    it('parses time-only string and sets future time', () => {
      const res = parseResetTime('16:30');
      expect(res).not.toBeNull();
      const d = new Date(res!);
      expect(d.getHours()).toBe(16);
      expect(d.getMinutes()).toBe(30);
    });
  });

  describe('formatting functions', () => {
    const baseNow = new Date('2026-09-22T10:00:00.000Z').getTime();

    it('formatCountdown returns expected format', () => {
      const target = baseNow + (2 * 3600 + 15 * 60 + 30) * 1000;
      expect(formatCountdown(target, baseNow)).toBe('02h 15m 30s');
      expect(formatCountdown(baseNow - 1000, baseNow)).toBe('00m 00s');
    });

    it('formatResetTime formats today and future times', () => {
      const todayTarget = new Date();
      todayTarget.setHours(15, 30, 0, 0);
      const str = formatResetTime(todayTarget.getTime());
      expect(str).toContain('Today at');
    });

    it('formatVerboseCountdown returns human readable parts', () => {
      const target = baseNow + (1 * 86400 + 2 * 3600 + 30 * 60) * 1000;
      expect(formatVerboseCountdown(target, baseNow)).toBe('1 day 2 hours 30 minutes');
    });

    it('formatVerboseResetTime formats strict date', () => {
      const target = new Date('2026-07-25T04:24:00').getTime();
      expect(formatVerboseResetTime(target)).toBe('25 July 2026 4:24');
    });

    it('getRemainingDurationString breaks down days/hours/min', () => {
      const target = baseNow + (49 * 3600 + 59 * 60) * 1000;
      expect(getRemainingDurationString(target, baseNow)).toBe('2 days 1 hour 59 min');
    });
  });
});
