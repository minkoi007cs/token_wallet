import React, { useMemo } from 'react';
import { formatVerboseCountdown, formatResetTime } from '../utils/timeParser';

interface ResetBarProps {
  targetTime?: number;
  currentTime: number;
}

function calculateBarPercentages(targetTime: number, now: number = Date.now()) {
  const diff = targetTime - now;
  if (diff <= 0) {
    return { daysPercent: 0, hoursPercent: 0, totalHours: 0 };
  }

  const totalHours = diff / (1000 * 60 * 60);

  let hoursPercent = 0;
  let daysPercent = 0;

  if (totalHours <= 5) {
    // 5 slots for hours -> 12.5% each (up to 62.5%)
    hoursPercent = Math.min(62.5, totalHours * 12.5);
  } else {
    hoursPercent = 5 * 12.5; // 62.5% (all 5 hour slots)
    const remainingHours = totalHours - 5;
    const remainingDays = remainingHours / 24;
    // 3 slots for days -> 12.5% each (up to 37.5%)
    const dayUnits = Math.min(3, remainingDays);
    daysPercent = dayUnits * 12.5;
  }

  return { daysPercent, hoursPercent, totalHours };
}

export const ResetBar = React.memo(function ResetBar({
  targetTime,
  currentTime,
}: ResetBarProps) {
  const { daysPercent, hoursPercent } = useMemo(() => {
    if (!targetTime) return { daysPercent: 0, hoursPercent: 0 };
    return calculateBarPercentages(targetTime, currentTime);
  }, [targetTime, currentTime]);

  if (!targetTime) return null;

  const title = `Còn: ${formatVerboseCountdown(targetTime, currentTime)} (Reset ${formatResetTime(targetTime)})`;

  return (
    <div className="reset-bar-container" title={title}>
      <div
        className="reset-bar-fill days-fill"
        style={{ right: `${hoursPercent}%`, width: `${daysPercent}%` }}
      />
      <div
        className="reset-bar-fill hours-fill"
        style={{ right: 0, width: `${hoursPercent}%` }}
      />
      <div className="reset-bar-grid-line" style={{ left: '12.5%' }} />
      <div className="reset-bar-grid-line" style={{ left: '25%' }} />
      <div className="reset-bar-grid-line" style={{ left: '37.5%' }} />
      <div className="reset-bar-grid-line" style={{ left: '50%' }} />
      <div className="reset-bar-grid-line" style={{ left: '62.5%' }} />
      <div className="reset-bar-grid-line" style={{ left: '75%' }} />
      <div className="reset-bar-grid-line" style={{ left: '87.5%' }} />
    </div>
  );
});
