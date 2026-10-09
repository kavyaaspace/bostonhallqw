import React from 'react';

export default function Hero({ events = [], selectedDate = null, onSelectDate }) {
  // Define prime 3 Halloween weekend dates side-by-side (Oct 29 Thu, Oct 30 Fri, Oct 31 Sat)
  const allDateKeys = ['2026-10-29', '2026-10-30', '2026-10-31'];

  // Helper to extract month, number, and day
  const getDateCardData = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const dayNum = parseInt(parts[2], 10);
        const d = new Date(year, monthIdx, dayNum);

        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const number = String(dayNum).padStart(2, '0');
        const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

        return { month, number, day };
      }
    } catch {
      // fallback
    }
    return { month: 'OCT', number: '31', day: 'SAT' };
  };

  return (
    <section className="hero-section" aria-label="Welcome">
      <h1 className="hero-title-svg-wrapper">
        <img
          src="/43cfeb90-0a63-40ea-8af0-c536574e4a05.png"
          alt="Boston Halloween Events"
          className="hero-vector-title"
        />
        <span className="sr-only">Boston Halloween Events</span>
      </h1>

      <div className="hero-dates-wrapper">
        <div className="hero-dates-container" role="group" aria-label="Halloween Event Dates">
          {allDateKeys.map((dateStr) => {
            const { month, number, day } = getDateCardData(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => onSelectDate && onSelectDate(dateStr)}
                className={`hero-date-card-btn ${isSelected ? 'is-active' : ''}`}
                aria-label={`View events for ${month} ${number}, ${day}`}
                aria-pressed={isSelected}
              >
                <span className="hero-date-month">{month}</span>
                <span className="hero-date-number">{number}</span>
                <span className="hero-date-day">{day}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
