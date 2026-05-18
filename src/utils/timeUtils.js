/**
 * Converts a 24-hour time string (HH:MM) to a 12-hour AM/PM format.
 * Examples:
 *   "08:30" → "8:30 AM"
 *   "14:10" → "2:10 PM"
 *   "00:10" → "12:10 AM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr || '00';
  const period = hour >= 12 ? 'م' : 'ص';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${min} ${period}`;
}

/**
 * Format a time range from two 24h strings.
 * Example: "08:30", "10:10" → "8:30 AM – 10:10 AM"
 */
export function formatTimeRange(from, to) {
  return `${formatTime(from)} – ${formatTime(to)}`;
}
