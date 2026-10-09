import React from 'react';

export default function FloatingDatesBar({
  allDateKeys = ['2026-10-29', '2026-10-30', '2026-10-31'],
  selectedDate,
  onSelectDate,
  visible = false
}) {
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
    <aside
      className={`floating-dates-container ${visible ? 'is-visible' : ''}`}
      role="region"
      aria-label="Floating Sticky Halloween Dates Bar"
      aria-hidden={!visible}
    >
      <div className="floating-dates-pill">
        <div className="floating-dates-buttons-row" role="group" aria-label="Select Event Date">
          {allDateKeys.map((dateStr) => {
            const { month, number, day } = getDateCardData(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`floating-date-card-btn ${isSelected ? 'is-active' : ''}`}
                aria-label={`View events for ${month} ${number}, ${day}`}
                aria-pressed={isSelected}
                tabIndex={visible ? 0 : -1}
              >
                <span className="floating-date-month">{month}</span>
                <span className="floating-date-number">{number}</span>
                <span className="floating-date-day">{day}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
