import React from 'react';
import { formatCountdown } from '../utils/timeParser';

interface ResetBarProps {
  targetTime: number;
  currentTime: number;
  resetCycleHours?: number;
}

const GRID_MARKERS = Array.from({ length: 8 }, (_, i) => i);

export const ResetBar = React.memo(function ResetBar({
  targetTime,
  currentTime,
  resetCycleHours = 5,
}: ResetBarProps) {
  const totalMs = resetCycleHours * 60 * 60 * 1000;
  const diff = targetTime - currentTime;
  const percentage = Math.max(0, Math.min(100, (diff / totalMs) * 100));
  const countdownText = formatCountdown(targetTime, currentTime);

  return (
    <div className="reset-bar-container" title={`Cycle: ${resetCycleHours}h`}>
      <div className="reset-bar-background">
        <div
          className="reset-bar-fill"
          style={{ width: `${percentage}%` }}
        />
        <div className="reset-bar-grid">
          {GRID_MARKERS.map((i) => (
            <div key={i} className="reset-bar-marker" />
          ))}
        </div>
      </div>
      <span className="reset-bar-text">{countdownText}</span>
    </div>
  );
});
