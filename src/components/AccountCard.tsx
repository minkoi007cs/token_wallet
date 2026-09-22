import React, { useState } from 'react';
import type { Account, AITool } from '../data/mappers';
import { ResetBar } from './ResetBar';
import { formatResetTime, formatVerboseCountdown } from '../utils/timeParser';
import { CopyIcon, CheckIcon } from './icons';

interface AccountCardProps {
  account: Account;
  tool: AITool;
  currentTime: number;
  onOpenManageModal: (account: Account, tool: AITool) => void;
  onQuickToggleStatus?: (account: Account, toolId: string) => void;
  canEdit?: boolean;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDueDateDisplay(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = MONTH_NAMES[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
}

function formatAmountDisplay(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
}

export const AccountCard = React.memo(function AccountCard({
  account,
  tool,
  currentTime,
  onOpenManageModal,
  onQuickToggleStatus,
  canEdit = true,
}: AccountCardProps) {
  const [copied, setCopied] = useState(false);
  const isActive = account.status === 'active';
  const isDisabled = Boolean(account.disabled);

  // Due date badge status
  let dueBadgeClass = '';
  if (account.dueDate && !account.noDue) {
    const daysUntilDue = (account.dueDate - currentTime) / (1000 * 60 * 60 * 24);
    if (daysUntilDue < 0) dueBadgeClass = 'due-overdue';
    else if (daysUntilDue <= 5) dueBadgeClass = 'due-soon';
    else dueBadgeClass = 'due-ok';
  }

  const handleCopyHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!account.loginHint) return;
    navigator.clipboard.writeText(account.loginHint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickToggleStatus) {
      onQuickToggleStatus(account, tool.id);
    }
  };

  return (
    <div
      className={`account-card ${isDisabled ? 'disabled' : isActive ? 'active' : 'exhausted'}`}
      onClick={() => onOpenManageModal(account, tool)}
    >
      <div className="account-info-side">
        <span
          className={`status-indicator-dot ${isDisabled ? 'disabled' : isActive ? 'active' : 'exhausted'}`}
          title={isDisabled ? 'Tài khoản đang tạm dừng' : isActive ? 'Sẵn sàng sử dụng' : 'Đã hết lượt / Chờ reset'}
        />

        <span className="account-name">{account.name}</span>

        {/* 1-Click Copy Login Hint */}
        {account.loginHint && (
          <button
            className={`account-hint-pill ${copied ? 'copied' : ''}`}
            onClick={handleCopyHint}
            title={`Click để sao chép thông tin đăng nhập: ${account.loginHint}`}
          >
            {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            <span className="hint-text">{account.loginHint}</span>
            {copied && <span className="copied-badge">Copied!</span>}
          </button>
        )}

        {/* Inline Absolute Reset Target & Countdown */}
        {!isDisabled && account.resetTime && (
          <span className="reset-time-inline">
            - Resets {formatResetTime(account.resetTime)} ({formatVerboseCountdown(account.resetTime, currentTime)})
          </span>
        )}

        {/* Payment Due Badge */}
        {account.dueDate && !account.noDue && (
          <span className={`due-badge ${dueBadgeClass}`}>
            {formatDueDateDisplay(account.dueDate)}
            {account.dueAmount != null ? ` · ₫${formatAmountDisplay(account.dueAmount)}` : ''}
            {account.dueNote ? ` · ${account.dueNote}` : ''}
          </span>
        )}
      </div>

      <div className="account-card-right">
        {/* 8-slot Visual Progress Bar per CORE_SPECS */}
        {!isDisabled && account.resetTime && (
          <ResetBar targetTime={account.resetTime} currentTime={currentTime} />
        )}

        {/* Quick Actions */}
        {canEdit && (
          <div className="account-quick-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className={`btn-quick-toggle ${isActive ? 'to-exhaust' : 'to-active'}`}
              onClick={handleQuickToggle}
              title={isActive ? 'Đánh dấu hết token (Run Out)' : 'Khôi phục sẵn sàng (Remain)'}
            >
              {isActive ? '⚡ Run Out' : '✓ Remain'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
