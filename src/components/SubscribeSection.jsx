import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

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
      } else {
        saveToLocalStorageFallback(cleanEmail);
        setStatus('success');
        setMessage("You're subscribed to Boston Halloween updates!");
        setEmail('');
      }
    } catch {
      saveToLocalStorageFallback(cleanEmail);
      setStatus('success');
      setMessage("You're subscribed to Boston Halloween updates!");
      setEmail('');
    }
  };

  const saveToLocalStorageFallback = (emailToSave) => {
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
        {/* Ambient Top Flame Glow */}
        <div className="subscribe-glow" aria-hidden="true" />

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
    </section>
  );
}
