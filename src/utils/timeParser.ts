/**
 * Parses a natural language reset time input and returns a timestamp in milliseconds.
 * Returns null if the input is invalid.
 *
 * Supported formats:
 *  - Relative:   "5h", "2 days 3 hours", "1h 30m"
 *  - Time only:  "4:27pm", "16:30", "at 4:27pm"
 *  - Date only:  "Jun 12", "12 Jun", "Jun 12 2026", "12 Jun 2026"
 *  - Date+Time:  "Jun 12 2:36PM", "12 Jun 2:36PM", "Jun 12 2026 14:30"
 */
export function parseResetTime(input: string): number | null {
  const cleanInput = input.trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
  if (!cleanInput) return null;

  const now = new Date();
  const currentTimestamp = now.getTime();

  // --- Month name lookup ---
  const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  // --- Helper: parse a "H:MM am/pm" or "H:MM" time token ---
  function parseTimeToken(token: string): { hour: number; minute: number } | null {
    const m = token.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    const ampm = m[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute };
  }

  // 1a. Named-month date parsing: "Jun 12", "12 Jun", "Jun 12 2026", "Jun 12 2:36PM", etc.
  // Build a pattern: (month name) or (day + month name) or (month name + day), optional year, optional time
  const monthNames = Object.keys(MONTHS).filter(k => k.length >= 3).join('|');
  const datePattern = new RegExp(
    `^(?:(\\d{1,2})\\s+)?(${monthNames})(?:\\s+(\\d{1,2}))?(?:\\s+(\\d{4}))?(?:\\s+(\\d{1,2}:\\d{2}(?:\\s*(?:am|pm))?))?$`,
    'i'
  );
  const dateMatch = cleanInput.match(datePattern);

  if (dateMatch) {
    const prefixDay  = dateMatch[1]; // day before month: "12 Jun"
    const monthStr   = dateMatch[2]; // month name
    const suffixDay  = dateMatch[3]; // day after month: "Jun 12"
    const yearStr    = dateMatch[4]; // optional year
    const timeStr    = dateMatch[5]; // optional time

    const monthIdx = MONTHS[monthStr.toLowerCase()];
    const day = parseInt(prefixDay || suffixDay || '1', 10);
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    const parsed = timeStr ? parseTimeToken(timeStr.trim()) : null;
    const hour = parsed?.hour ?? 0;
    const minute = parsed?.minute ?? 0;

    const target = new Date(year, monthIdx, day, hour, minute, 0, 0);

    // If the date is in the past, advance to next year (only when no year was explicitly given)
    if (!yearStr && target.getTime() <= currentTimestamp) {
      target.setFullYear(target.getFullYear() + 1);
    }

    return target.getTime();
  }

  // 1b. Time-only patterns like "at 4:27pm", "4:27pm", "16:30"
  const timeOnlyRegex = /^(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm)?)$/i;
  const timeOnlyMatch = cleanInput.match(timeOnlyRegex);
  if (timeOnlyMatch) {
    const parsed = parseTimeToken(timeOnlyMatch[1].trim());
    if (parsed) {
      const target = new Date(now);
      target.setHours(parsed.hour, parsed.minute, 0, 0);
      if (target.getTime() <= currentTimestamp) {
        target.setDate(target.getDate() + 1);
      }
      return target.getTime();
    }
  }

  // 2. Relative duration: "5h", "2 days 3 hours", "1 week", "in 3h 20m"
  let totalMs = 0;
  let parsedAny = false;
  const relativeRegex = /(\d+(?:\.\d+)?)\s*(d|day|days|w|week|weeks|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/g;
  let match;
  while ((match = relativeRegex.exec(cleanInput)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    parsedAny = true;
    if (unit.startsWith('w'))      totalMs += value * 7 * 24 * 60 * 60 * 1000;
    else if (unit.startsWith('d')) totalMs += value * 24 * 60 * 60 * 1000;
    else if (unit.startsWith('h')) totalMs += value * 60 * 60 * 1000;
    else if (unit.startsWith('m')) totalMs += value * 60 * 1000;
    else if (unit.startsWith('s')) totalMs += value * 1000;
  }
  if (parsedAny && totalMs > 0) return currentTimestamp + totalMs;

  // 3. Bare number → assume hours
  if (/^\d+(\.\d+)?$/.test(cleanInput)) {
    return currentTimestamp + parseFloat(cleanInput) * 60 * 60 * 1000;
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

/**
 * Formats a timestamp into a verbose countdown string (e.g. "1 day 2 hours 32 minutes")
 */
export function formatVerboseCountdown(targetTime: number, now: number = Date.now()): string {
  const diff = targetTime - now;
  if (diff <= 0) return '0 minutes';

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0 || (days === 0 && hours === 0)) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (days === 0 && hours === 0 && minutes === 0 && seconds > 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ');
}

/**
 * Formats a timestamp into a strict date format like "25 July 2026 4:24"
 */
export function formatVerboseResetTime(targetTime: number): string {
  const target = new Date(targetTime);
  const day = target.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[target.getMonth()];
  const year = target.getFullYear();
  const hours = target.getHours();
  const minutes = String(target.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

/**
 * Returns a duration string always split as "X days Y hours Z min"
 * e.g. 49h 59m → "2 days 1 hours 59 min", 3h 20m → "0 days 3 hours 20 min"
 */
export function getRemainingDurationString(targetTime: number, now: number = Date.now()): string {
  const diff = targetTime - now;
  if (diff <= 0) return '0 days 5 hours 0 min';

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (mins > 0) parts.push(`${mins} min`);

  return parts.length > 0 ? parts.join(' ') : '0 min';
}
