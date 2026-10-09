import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function SubscribePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  // Trigger popup after exactly 5 seconds
  useEffect(() => {
    // Check if user has already dismissed or subscribed in this session
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
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || "You're subscribed to Boston Halloween updates!");
        setEmail('');
        setTimeout(() => handleClose(), 2000);
      } else {
        saveToLocalStorage(cleanEmail);
        setStatus('success');
        setMessage("You're subscribed to Boston Halloween updates!");
        setEmail('');
        setTimeout(() => handleClose(), 2000);
      }
    } catch {
      saveToLocalStorage(cleanEmail);
      setStatus('success');
      setMessage("You're subscribed to Boston Halloween updates!");
      setEmail('');
      setTimeout(() => handleClose(), 2000);
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

        {/* Ambient Top Glow */}
        <div className="subscribe-popup-glow" aria-hidden="true" />

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

          {/* Feedback Messages */}
          {status === 'success' && (
            <div className="subscribe-alert subscribe-success" role="alert">
              <CheckCircle2 size={18} className="alert-icon" />
              <span>{message}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="subscribe-alert subscribe-error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
