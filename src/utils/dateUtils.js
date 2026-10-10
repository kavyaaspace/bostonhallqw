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

/**
 * Creative 3-day Halloween themes for Boston Halloween weekend.
 * 3 distinct, creative titles that all share the same meaning (the day's Halloween party lineup).
 */
export const CREATIVE_DAY_THEMES = {
  '2026-10-29': {
    title: 'The Opening Haunt: Thursday Kickoff Parties',
    kicker: 'THURSDAY, OCT 29 • KICKOFF NIGHT',
    subtitle: 'Kick off the 3-day weekend with Boston’s earliest costume takeovers and kickoff parties.'
  },
  '2026-10-30': {
    title: "Devil’s Night: Friday Pre-Halloween Bash",
    kicker: "FRIDAY, OCT 30 • DEVIL'S NIGHT",
    subtitle: 'The city-wide celebration heats up with epic Friday pub crawls and club takeovers.'
  },
  '2026-10-31': {
    title: 'All Hallows’ Eve: The Grand Halloween Finale',
    kicker: 'SATURDAY, OCT 31 • HALLOWEEN NIGHT 🎃',
    subtitle: 'Boston’s main event—the official night of costume masquerades, balls, and midnight parties.'
  }
};

/**
 * Returns creative header content based on the selected date.
 */
export function getCreativeDateHeading(dateStr) {
  if (!dateStr) {
    return {
      title: 'Upcoming Halloween Events',
      kicker: 'BOSTON HALLOWEEN NIGHTLIFE',
      subtitle: 'Explore the top Halloween parties, pub crawls, and nightlife across Boston.'
    };
  }

  if (CREATIVE_DAY_THEMES[dateStr]) {
    return CREATIVE_DAY_THEMES[dateStr];
  }

  const details = formatDateDetails(dateStr);
  if (details.weekdayShort === 'Thu' || details.rawDay === 29) {
    return CREATIVE_DAY_THEMES['2026-10-29'];
  }
  if (details.weekdayShort === 'Fri' || details.rawDay === 30) {
    return CREATIVE_DAY_THEMES['2026-10-30'];
  }
  if (details.weekdayShort === 'Sat' || details.rawDay === 31) {
    return CREATIVE_DAY_THEMES['2026-10-31'];
  }

  return {
    title: `${details.fullLabel || dateStr} Halloween Events`,
    kicker: 'BOSTON HALLOWEEN NIGHTLIFE',
    subtitle: 'Explore the top Halloween parties, pub crawls, and nightlife across Boston.'
  };
}
