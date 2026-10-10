import React from 'react';
import { Ticket, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-content">
        <div className="footer-trust-badges">
          <div className="footer-badge-pill">
            <Ticket size={14} className="footer-badge-icon" />
            <span>Official Eventbrite Partner Listings</span>
          </div>
          <div className="footer-badge-pill">
            <ShieldCheck size={14} className="footer-badge-icon" />
            <span>100% Guaranteed Entry</span>
          </div>
        </div>

        <p className="footer-disclaimer-text">
          This portal connects attendees directly to verified Eventbrite event listings for secure ticketing.
          All checkout transactions, barcode issuance, and customer support are handled directly by Eventbrite.
        </p>

        <div className="footer-divider-line" />

        <p className="footer-copyright-text">
          © {new Date().getFullYear()} Boston Halloween Events • Built for Boston Spooky Season
        </p>
      </div>
    </footer>
  );
}

