import React from 'react';
import { Calendar, Clock, MapPin, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function EventCard({ event }) {
  const {
    title,
    imageUrl,
    date,
    time,
    venue,
    shortDescription,
    ticketPrice,
    availability,
    eventbriteUrl,
    category
  } = event;

  // Format date day display (e.g. "SAT, OCT 31")
  let dateDayDisplay = 'SAT, OCT 31';

  if (date && date.includes('-')) {
    const parts = date.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      const d = new Date(year, monthIdx, dayNum);

      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthShort = monthNames[monthIdx] || 'OCT';
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      dateDayDisplay = `${weekdayShort}, ${monthShort} ${dayNum}`;
    }
  }

  // Split venue into main spot title and address for strong hierarchy
  let venueTitle = venue || '';
  let venueAddress = '';
  if (venue && venue.includes(',')) {
    const commaIndex = venue.indexOf(',');
    venueTitle = venue.substring(0, commaIndex).trim();
    venueAddress = venue.substring(commaIndex + 1).trim();
  }

  const isSoldOut = availability === 'Sold Out';
  const fallbackImage = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80';

  return (
    <article className="card-container" aria-label={title}>
      {/* Top Image Media Box */}
      <div className="card-media-box">
        <img
          src={imageUrl || fallbackImage}
          alt={title}
          className="card-media-photo"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
        <div className="card-media-fade" />

        {/* Status / Category Badge (Top Right) */}
        <div className="card-status-badge">
          {isSoldOut ? (
            <span className="card-badge-soldout">Sold Out</span>
          ) : (
            <span className="card-badge-live">
              <span className="live-pulse-dot" aria-hidden="true" />
              <span>Tickets Live</span>
            </span>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="card-body-content">
        {/* Date Day & Time Meta Line */}
        <div className="card-meta-line">
          <div className="card-date-tag" title={dateDayDisplay}>
            <Calendar size={13} strokeWidth={2.4} className="meta-icon" />
            <span>{dateDayDisplay}</span>
          </div>

          {time && (
            <div className="card-time-tag">
              <Clock size={12} strokeWidth={2.2} className="meta-icon" />
              <span>{time}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="card-title-heading" title={title}>
          {title}
        </h3>

        {/* Highlighted Venue Location Box */}
        {venue && (
          <div className="card-venue-box" title={venue}>
            <MapPin size={14} strokeWidth={2.5} className="card-venue-pin" />
            <div className="card-venue-text">
              <strong className="venue-spot-name">{venueTitle}</strong>
              {venueAddress && <span className="venue-address-sub"> • {venueAddress}</span>}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="card-desc-paragraph">
          {shortDescription}
        </p>

        {/* Authentic Ticket Stub Perforation Divider */}
        <div className="card-notch-separator" aria-hidden="true">
          <div className="notch-cutout notch-cutout-left" />
          <div className="notch-dashed-line" />
          <div className="notch-cutout notch-cutout-right" />
        </div>

        {/* Footer / CTA Action */}
        <div className="card-footer-cta">
          <div className="card-price-block">
            <span className="card-price-micro">STARTING AT</span>
            <span className="card-price-digits">{ticketPrice || 'On Sale'}</span>
          </div>

          <a
            href={eventbriteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-get-tickets-cta ${isSoldOut ? 'is-soldout' : ''}`}
            aria-label={`Get tickets for ${title} on Eventbrite`}
          >
            <span>{isSoldOut ? 'Sold Out' : 'Get Tickets'}</span>
            {!isSoldOut && <ArrowUpRight size={17} strokeWidth={2.6} className="btn-cta-arrow" />}
          </a>
        </div>

        {/* Trust Guarantee Note */}
        <div className="card-trust-row">
          <ShieldCheck size={13} strokeWidth={2.2} className="trust-icon" />
          <span>Official Eventbrite Checkout • Guaranteed Entry</span>
        </div>
      </div>
    </article>
  );
}

