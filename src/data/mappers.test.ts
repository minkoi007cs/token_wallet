import { describe, it, expect } from 'vitest';
import {
  rowToAccount,
  accountToRow,
  rowToTool,
  toolToRow,
  rowToAppProject,
  appProjectToRow,
  rowToBacklogItem,
  backlogItemToRow,
  rowToPaymentSchedule,
  paymentScheduleToRow,
  seedIfEmpty,
  type Account,
  type AITool,
  type AppProject,
  type BacklogItem,
  type PaymentScheduleItem,
} from './mappers';

describe('mappers round-trips', () => {
  it('round-trips Account fully populated', () => {
    const account: Account = {
      id: 'acc-1',
      name: 'hoa.hoang@cbtw.tech',
      status: 'exhausted',
      exhaustedType: 'custom',
      resetTime: 1790001026688,
      dueDate: 1790035200000,
      dueAmount: 135556,
      dueNote: 'Team quota',
      noDue: false,
      disabled: false,
      loginHint: 'check mail hoang.hoa@gmail.com',
    };
    const row = accountToRow(account, 'tool-1');
    const restored = rowToAccount(row);
    expect(restored).toEqual(account);
  });

  it('round-trips Tool fully populated', () => {
    const tool: AITool = {
      id: 'tool-1',
      name: 'Gemini',
      resetCycleHours: 5,
      displayOrder: 1,
      accounts: [],
    };
    const row = toolToRow(tool);
    const restored = rowToTool(row);
    expect(restored).toEqual({
      id: tool.id,
      name: tool.name,
      resetCycleHours: tool.resetCycleHours,
      displayOrder: tool.displayOrder,
    });
  });

  it('round-trips AppProject fully populated (including isDisabled)', () => {
    const project: AppProject = {
      id: 'app-1',
      title: "JohnnyHoang's Wallet",
      frontendUrl: 'https://example.com',
      category: 'Web',
      status: 'Production',
      priority: 'High',
      description: 'Crypto wallet',
      isDisabled: true,
    };
    const row = appProjectToRow(project);
    const restored = rowToAppProject(row);
    expect(restored).toEqual(project);
  });

  it('round-trips BacklogItem fully populated', () => {
    const item: BacklogItem = {
      id: 'bl-1',
      title: 'Fix issue',
      isCompleted: true,
    };
    const row = backlogItemToRow(item, 'app-1');
    const restored = rowToBacklogItem(row);
    expect(restored).toEqual(item);
  });

  it('round-trips PaymentScheduleItem fully populated', () => {
    const schedule: PaymentScheduleItem = {
      id: 'pay-1',
      title: 'Netflix',
      accountEmail: 'user@mail.com',
      dueDate: 1700000000000,
      dueDateString: '2026-09-15',
      recurrence: 'monthly',
      repeatCount: 12,
      amount: 200000,
      currency: 'VND',
      paymentMethod: 'Visa 8899',
      isAutoDebit: true,
      isPaid: false,
      isPaused: false,
      rawInput: 'raw text',
    };
    const row = paymentScheduleToRow(schedule);
    const restored = rowToPaymentSchedule(row);
    expect(restored).toEqual(schedule);
  });

  describe('seedIfEmpty', () => {
    it('returns seed when loaded is empty', () => {
      const seed = [{ id: '1' }];
      expect(seedIfEmpty([], seed)).toBe(seed);
    });

    it('returns loaded when loaded is non-empty', () => {
      const loaded = [{ id: 'loaded-1' }];
      const seed = [{ id: 'seed-1' }];
      expect(seedIfEmpty(loaded, seed)).toEqual(loaded);
    });
  });
});
