import React from 'react';
import { CalendarX2, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { formatDateDetails } from '../utils/dateUtils';

export default function EmptyState({
  selectedDate = null,
  events = [],
  onClearDate,
  onSelectDate
}) {
  const dateInfo = selectedDate ? formatDateDetails(selectedDate) : null;

  // Identify other dates with active events
  const otherDatesWithEvents = Array.from(
    new Set(events.filter((e) => e.date && e.date !== selectedDate).map((e) => e.date))
  );

  return (
    <div className="empty-state-card" role="status" aria-live="polite">
      {/* Top subtle orange accent highlight */}
      <div className="empty-state-top-glow" />

      {/* Atmospheric Glowing Icon Container */}
      <div className="empty-state-icon-box">
        <div className="empty-state-icon-pulse" />
        <CalendarX2 size={32} className="empty-state-icon-svg" />
      </div>

      {/* Heading */}
      <h3 className="empty-state-heading">
        {selectedDate
          ? `No Events Listed for ${dateInfo?.shortLabel || selectedDate} Yet`
          : 'Boston Halloween Lineup Coming Soon'}
      </h3>

      {/* Message Description */}
      <p className="empty-state-text">
        {selectedDate
          ? `We haven't added events for ${dateInfo?.fullLabel || selectedDate} yet, but tickets are live for other Halloween celebrations across Boston!`
          : "We're currently conjuring up Boston's premier Halloween lineup. Check back shortly as new events and ticket links are added!"}
      </p>

      {/* Action Suggestions */}
      <div className="empty-state-actions">

        {/* Suggest other dates that actually have live events */}
        {otherDatesWithEvents.length > 0 && onSelectDate && (
          <div className="empty-state-suggestions">
            <span className="empty-state-suggestions-label">Happening on other dates:</span>
            <div className="empty-state-suggestions-pills">
              {otherDatesWithEvents.map((dStr) => {
                const otherInfo = formatDateDetails(dStr);
                const count = events.filter((e) => e.date === dStr).length;
                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => onSelectDate(dStr)}
                    className="empty-state-btn-suggestion"
                    aria-label={`Switch to events on ${otherInfo.shortLabel}`}
                  >
                    <Calendar size={13} />
                    <span>{otherInfo.shortLabel}</span>
                    <span className="suggestion-count-tag">
                      {count} {count === 1 ? 'event' : 'events'}
                    </span>
                    <ArrowRight size={13} className="suggestion-arrow" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
