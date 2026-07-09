/**
 * Parses a natural language reset time input and returns a timestamp in milliseconds.
 * Returns null if the input is invalid.
 */
export function parseResetTime(input: string): number | null {
  const cleanInput = input.trim().toLowerCase();
  if (!cleanInput) return null;

  const now = new Date();
  const currentTimestamp = now.getTime();

  // 1. Check for absolute time patterns like "at 4:27pm", "4:27pm", "16:30", "at 16:30"
  // Regex to match: optional "at", then hour (1-2 digits), then colon, then minutes (2 digits), then optional am/pm
  const timeRegex = /(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?/;
  const timeMatch = cleanInput.match(timeRegex);

  if (timeMatch && !cleanInput.includes('day') && !cleanInput.includes('d') && !cleanInput.includes('week') && !cleanInput.includes('w')) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3];

    if (ampm) {
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
    }

    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      const targetDate = new Date(now);
      targetDate.setHours(hour, minute, 0, 0);

      // If the time has already passed today, assume it's tomorrow
      if (targetDate.getTime() <= currentTimestamp) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      // Check if "tomorrow" is explicitly mentioned
      if (cleanInput.includes('tomorrow')) {
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        tomorrowDate.setHours(hour, minute, 0, 0);
        return tomorrowDate.getTime();
      }

      return targetDate.getTime();
    }
  }

  // 2. Parse relative duration, e.g., "in 3h 20m", "5h", "3 days", "1 week", "reset in 5 hours"
  // We look for patterns of numbers followed by unit specifiers: d/day/days, w/week/weeks, h/hour/hours, m/min/mins/minutes, s/sec/secs/seconds
  let totalMs = 0;
  let parsedAny = false;

  // Pattern to find numbers and their associated text units
  const relativeRegex = /(\d+(?:\.\d+)?)\s*(d|day|days|w|week|weeks|h|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/g;
  let match;
  
  while ((match = relativeRegex.exec(cleanInput)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    parsedAny = true;

    if (unit.startsWith('w')) {
      totalMs += value * 7 * 24 * 60 * 60 * 1000;
    } else if (unit.startsWith('d')) {
      totalMs += value * 24 * 60 * 60 * 1000;
    } else if (unit.startsWith('h')) {
      totalMs += value * 60 * 60 * 1000;
    } else if (unit.startsWith('m')) {
      totalMs += value * 60 * 1000;
    } else if (unit.startsWith('s')) {
      totalMs += value * 1000;
    }
  }

  if (parsedAny && totalMs > 0) {
    return currentTimestamp + totalMs;
  }

  // Fallback for simple numbers: if they just type a number, assume it's hours
  if (/^\d+(\.\d+)?$/.test(cleanInput)) {
    const hours = parseFloat(cleanInput);
    return currentTimestamp + hours * 60 * 60 * 1000;
  }

  return null;
}

/**
 * Formats a timestamp into a human-readable countdown string (e.g. "03h 20m 15s")
 */
export function formatCountdown(targetTime: number, now: number = Date.now()): string {
  const diff = targetTime - now;

  if (diff <= 0) return '00m 00s';

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const pad = (num: number) => String(num).padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  }
  if (hours > 0) {
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Formats a timestamp into a short display string (e.g., "Today at 4:27 PM", "Monday 9:00 AM")
 */
export function formatResetTime(targetTime: number): string {
  const target = new Date(targetTime);
  const now = new Date();
  
  const isToday = target.toDateString() === now.toDateString();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = target.toDateString() === tomorrow.toDateString();

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const timeString = target.toLocaleTimeString([], options);

  if (isToday) {
    return `Today at ${timeString}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeString}`;
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[target.getDay()];
  
  // If it's within the next 7 days, just show the day name, else show date
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return `${dayName} at ${timeString}`;
  }

  const dateString = target.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateString} at ${timeString}`;
}
