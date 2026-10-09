import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      // Sync to Google Sheets if configured in environment
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
      if (sheetUrl && sheetUrl.startsWith('https://script.google.com/')) {
        fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, timestamp: new Date().toISOString(), source: 'subscribe_section' })
        }).catch(() => {});
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('success');
        setEmail('');
      } else {
        // Fallback save to localStorage
        saveToLocalStorage(cleanEmail);
        setStatus('success');
        setEmail('');
      }
    } catch {
      // Sync to Google Sheets if configured in environment even if /api is offline
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
      if (sheetUrl && sheetUrl.startsWith('https://script.google.com/')) {
        fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, timestamp: new Date().toISOString(), source: 'subscribe_section' })
        }).catch(() => {});
      }

      saveToLocalStorage(cleanEmail);
      setStatus('success');
      setEmail('');
    }
  };

  const saveToLocalStorage = (emailToSave) => {
    try {
      const stored = JSON.parse(localStorage.getItem('halloween_subscribers') || '[]');
      if (!stored.includes(emailToSave)) {
        stored.push({ email: emailToSave, subscribedAt: new Date().toISOString() });
        localStorage.setItem('halloween_subscribers', JSON.stringify(stored));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <section className="subscribe-section" aria-label="Subscribe to Boston Halloween Events Newsletter">
      <div className="subscribe-card">
        {/* Full Section Overlay upon successful submission */}
        {status === 'success' && (
          <div className="subscribe-overlay-confirmation" role="status" aria-live="polite">
            <div className="subscribe-overlay-content">
              <CheckCircle2 size={46} className="subscribe-overlay-icon" />
              <h2 className="subscribe-overlay-title">Thanks for subscribing!</h2>
              <p className="subscribe-overlay-subtitle">
                You're on the list. Watch your inbox for secret party drops and exclusive ticket discounts.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="btn-subscribe-again"
              >
                Done
              </button>
            </div>
          </div>
        )}

        <div className="subscribe-content">
          <div className="subscribe-badge">
            Subscribe
          </div>

          <h2 className="subscribe-title">
            Never Miss a Boston Halloween Event
          </h2>

          <p className="subscribe-subtitle">
            Get first access to secret costume warehouse parties, flash ticket drops, VIP guest lists, and exclusive Boston nightlife discounts sent directly to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="subscribe-form" noValidate>
            <div className="subscribe-input-wrapper">
              <Mail size={18} className="subscribe-input-icon" aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Enter your email..."
                className="subscribe-input"
                aria-label="Email address for Halloween newsletter"
                required
                disabled={status === 'loading'}
              />
            </div>

            <button
              type="submit"
              className="subscribe-btn"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {status === 'error' && (
            <div className="subscribe-alert subscribe-error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
