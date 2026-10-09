/**
 * Date formatting utilities for Boston Halloween Events
 */

export function formatDateDetails(dateStr) {
  if (!dateStr) {
    return {
      shortLabel: '',
      fullLabel: '',
      weekday: '',
      month: '',
      day: '',
      year: ''
    };
  }

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);

      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const weekdayLong = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const monthLong = d.toLocaleDateString('en-US', { month: 'long' });
      const isHalloween = (month === 9 && day === 31);

      return {
        shortLabel: `${weekdayShort}, ${monthShort} ${day}`,
        fullLabel: `${weekdayLong}, ${monthLong} ${day}${isHalloween ? ' (Halloween Night 🎃)' : ''}`,
        weekday: weekdayLong,
        weekdayShort,
        month: monthShort.toUpperCase(),
        monthLong,
        day: String(day).padStart(2, '0'),
        rawDay: day,
        year
      };
    }
  } catch (err) {
    console.warn('Date parsing error for:', dateStr, err);
  }

  return {
    shortLabel: dateStr,
    fullLabel: dateStr,
    weekday: '',
    weekdayShort: '',
    month: '',
    monthLong: '',
    day: '',
    rawDay: '',
    year: ''
  };
}
