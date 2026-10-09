import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { submitSubscriberEmail } from '../services/subscriberService';

export default function SubscribePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Trigger popup after exactly 5 seconds
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismissed_halloween_subscribe_popup');
    if (isDismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('dismissed_halloween_subscribe_popup', 'true');
  };

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
      await submitSubscriberEmail(cleanEmail);
      setStatus('success');
      setEmail('');
      setTimeout(() => handleClose(), 2800);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Unable to subscribe right now. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="subscribe-popup-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div
        className="subscribe-popup-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Icon Button */}
        <button
          type="button"
          onClick={handleClose}
          className="subscribe-popup-close-btn"
          aria-label="Close subscribe popup"
        >
          <X size={20} />
        </button>

        {/* Full Popup Overlay upon successful submission */}
        {status === 'success' && (
          <div className="subscribe-overlay-confirmation" role="status" aria-live="polite">
            <div className="subscribe-overlay-content">
              <CheckCircle2 size={42} className="subscribe-overlay-icon" />
              <h3 className="subscribe-overlay-title" style={{ fontSize: '1.6rem' }}>
                Thanks for subscribing!
              </h3>
              <p className="subscribe-overlay-subtitle" style={{ fontSize: '0.92rem' }}>
                You're on the list. Watch your inbox for secret party drops and discounts.
              </p>
            </div>
          </div>
        )}

        <div className="subscribe-popup-content">
          <div className="subscribe-badge">
            Subscribe
          </div>

          <h3 id="popup-title" className="subscribe-popup-title">
            Never Miss a Boston Halloween Event
          </h3>

          <p className="subscribe-popup-subtitle">
            Get early access to costume parties, haunted pub crawls, secret warehouse events, and ticket discounts.
          </p>

          <form onSubmit={handleSubmit} className="subscribe-popup-form" noValidate>
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
                autoFocus
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
    </div>
  );
}
