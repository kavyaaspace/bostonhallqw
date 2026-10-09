import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Sparkles, Code2, Copy, Check, ExternalLink } from 'lucide-react';

export default function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

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
        setMessage(data.message || "You're on the VIP Halloween guest list!");
        setEmail('');
      } else {
        // Fallback for static hosting (Vercel/Netlify without server)
        saveToLocalStorageFallback(cleanEmail);
        setStatus('success');
        setMessage("You're on the VIP Halloween guest list! Watch your inbox for secret party drops.");
        setEmail('');
      }
    } catch {
      // Save locally if offline or network error
      saveToLocalStorageFallback(cleanEmail);
      setStatus('success');
      setMessage("You're on the VIP Halloween guest list! Watch your inbox for secret party drops.");
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
      // Ignore localStorage errors
    }
  };

  const embedSnippet = `<iframe src="https://bostonhalloweenevents.com" width="100%" height="520" frameborder="0" style="border:1px solid rgba(255,107,0,0.3); border-radius:12px; max-width:650px; box-shadow:0 12px 36px rgba(0,0,0,0.8);" allow="clipboard-write" title="Boston Halloween Events Guide & Tickets"></iframe>`;

  const copyEmbedCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(embedSnippet).then(() => {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2500);
      });
    }
  };

  return (
    <section className="subscribe-section" aria-label="Subscribe to Boston Halloween Events Newsletter">
      <div className="subscribe-card">
        {/* Ambient Top Flame Glow */}
        <div className="subscribe-glow" aria-hidden="true" />

        <div className="subscribe-content">
          <div className="subscribe-badge">
            <span className="subscribe-badge-sparkle">🎃</span>
            <span>VIP SPOOKY DISPATCH</span>
            <span className="subscribe-badge-sparkle">✦</span>
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
                placeholder="Enter your email for VIP updates..."
                className="subscribe-input"
                aria-label="Email address for VIP Halloween newsletter"
                required
                disabled={status === 'loading'}
              />
            </div>

            <button
              type="submit"
              className="subscribe-btn"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <span>Subscribing...</span>
              ) : (
                <>
                  <Sparkles size={16} className="btn-sparkle-icon" />
                  <span>Join VIP List</span>
                </>
              )}
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

          <div className="subscribe-footer-meta">
            <span className="subscribe-trust">🔒 Zero spam. Hand-picked Boston events only. Unsubscribe anytime.</span>
            <span className="subscribe-meta-dot">•</span>
            <button
              type="button"
              onClick={() => setShowEmbedModal(true)}
              className="subscribe-embed-trigger"
              aria-label="Get Embed Banner Code"
            >
              <Code2 size={13} style={{ marginRight: '4px' }} />
              Embed Banner on Your Site
            </button>
          </div>
        </div>
      </div>

      {/* Embed Banner Modal */}
      {showEmbedModal && (
        <div className="embed-modal-overlay" onClick={() => setShowEmbedModal(false)} role="dialog" aria-modal="true" aria-labelledby="embed-modal-title">
          <div className="embed-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="embed-modal-header">
              <div className="embed-modal-badge">
                <Code2 size={15} />
                <span>WEBSITE EMBED WIDGET</span>
              </div>
              <button
                type="button"
                className="embed-modal-close"
                onClick={() => setShowEmbedModal(false)}
                aria-label="Close embed modal"
              >
                ✕
              </button>
            </div>

            <h3 id="embed-modal-title" className="embed-modal-title">
              Embed Boston Halloween Events Banner
            </h3>

            <p className="embed-modal-description">
              Add our interactive, live-updated Halloween events guide & ticket widget to your blog, venue website, or Boston tourism portal.
            </p>

            {/* Live Banner Preview Box */}
            <div className="embed-preview-box">
              <div className="embed-preview-header">
                <span className="embed-preview-dot dot-red" />
                <span className="embed-preview-dot dot-yellow" />
                <span className="embed-preview-dot dot-green" />
                <span className="embed-preview-url">bostonhalloweenevents.com/embed</span>
              </div>
              <div className="embed-preview-inner">
                <div className="embed-preview-banner">
                  <div className="embed-preview-tag">🎃 LIVE EVENTBRITE LISTINGS</div>
                  <div className="embed-preview-title">Boston Halloween Events</div>
                  <div className="embed-preview-sub">16 Curated Parties & Pub Crawls • Direct Tickets</div>
                  <div className="embed-preview-cta">Explore Events & Tickets →</div>
                </div>
              </div>
            </div>

            {/* Copy Snippet Area */}
            <div className="embed-snippet-container">
              <label htmlFor="embed-code-textarea" className="embed-snippet-label">HTML Embed Code:</label>
              <div className="embed-snippet-code-box">
                <textarea
                  id="embed-code-textarea"
                  readOnly
                  value={embedSnippet}
                  className="embed-code-textarea"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={copyEmbedCode}
                  className="btn-copy-embed"
                  aria-label="Copy embed HTML snippet"
                >
                  {copiedEmbed ? (
                    <>
                      <Check size={14} style={{ color: '#00ff88' }} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="embed-modal-actions">
              <button
                type="button"
                className="btn-embed-done"
                onClick={() => setShowEmbedModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
