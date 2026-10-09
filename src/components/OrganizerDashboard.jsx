import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  ArrowLeft,
  LogOut
} from 'lucide-react';

export default function OrganizerDashboard() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('organizer_pwd') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'manage' | 'status'
  const [inputUrlOrId, setInputUrlOrId] = useState('');
  const [isHalloween, setIsHalloween] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Manual fallback fields
  const [showManualFields, setShowManualFields] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualNeighborhood, setManualNeighborhood] = useState('Faneuil Hall');
  const [manualVenue, setManualVenue] = useState('Boston, MA');
  const [manualDate, setManualDate] = useState('2026-10-31');
  const [manualTime, setManualTime] = useState('8:00 PM – 2:00 AM EDT');
  const [manualPrice, setManualPrice] = useState('$25.00 – $40.00');
  const [manualAvailability, setManualAvailability] = useState('Tickets Available');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualTicketUrl, setManualTicketUrl] = useState('');
  const [manualCategory, setManualCategory] = useState('Costume Party');
  const [manualDescription, setManualDescription] = useState('');

  // Headers helper with auth password
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-organizer-password': password
  });

  // Verify stored password on mount
  useEffect(() => {
    if (password) {
      verifyPassword(password);
    }
  }, []);

  const verifyPassword = async (pwdToTest) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdToTest })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPassword(pwdToTest);
        sessionStorage.setItem('organizer_pwd', pwdToTest);
        loadDashboardData(pwdToTest);
      } else {
        setIsAuthenticated(false);
        setAuthError(data.error || 'Incorrect organizer password. Access denied.');
        sessionStorage.removeItem('organizer_pwd');
      }
    } catch (err) {
      setAuthError(`Connection error: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setAuthError('Please enter the organizer password.');
      return;
    }
    verifyPassword(passwordInput.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('organizer_pwd');
    setPassword('');
    setPasswordInput('');
    setIsAuthenticated(false);
  };

  const loadDashboardData = async (currentPwd = password) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-organizer-password': currentPwd
      };
      const [resStatus, resAll] = await Promise.all([
        fetch('/api/status', { headers }).then(r => r.json()),
        fetch('/api/all-events', { headers }).then(r => r.json())
      ]);
      setStatusData(resStatus);
      if (resAll.events) setAllEvents(resAll.events);
      if (!resStatus.hasApiToken) {
        setShowManualFields(true);
      }
    } catch (err) {
      console.error('Failed to load organizer data:', err);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const payload = {
      inputUrlOrId: inputUrlOrId.trim(),
      isHalloween,
      manualData: {
        title: manualTitle.trim(),
        neighborhood: manualNeighborhood.trim(),
        venue: manualVenue.trim(),
        date: manualDate.trim(),
        time: manualTime.trim(),
        ticketPrice: manualPrice.trim(),
        availability: manualAvailability,
        imageUrl: manualImageUrl.trim(),
        eventbriteUrl: manualTicketUrl.trim() || inputUrlOrId.trim(),
        category: manualCategory,
        shortDescription: manualDescription.trim()
      }
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || 'Event saved successfully!'
        });
        setInputUrlOrId('');
        setManualTitle('');
        setManualDescription('');
        setManualTicketUrl('');
        setManualImageUrl('');
        await loadDashboardData();
      } else if (data.fallbackRequired) {
        setShowManualFields(true);
        setFeedback({
          type: 'warning',
          message: `${data.reason} Enter details in the fallback form below to publish.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.reason || data.error || 'Failed to save event.'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Network error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHalloween = async (event) => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isHalloween: !event.isHalloween })
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to toggle Halloween status:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this event from tracked listings?')) {
      return;
    }
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Sync complete! Refreshed ${data.updatedCount} of ${data.total} events from Eventbrite.`
        });
      } else {
        setFeedback({
          type: 'warning',
          message: data.message || 'Sync not available without Eventbrite API Token.'
        });
      }
      await loadDashboardData();
    } catch (err) {
      setFeedback({ type: 'error', message: `Sync failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // If NOT authenticated, render the Password Login View
  if (!isAuthenticated) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-surface)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '36px 30px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.95)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-sm)',
              background: '#161616',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '14px'
            }}>
              <Lock size={22} strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 500, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Organizer Portal
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 400 }}>
              Private & Password Protected Management Dashboard
            </p>
          </div>

          {authError && (
            <div className="alert-box alert-warning" style={{ marginBottom: '18px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Organizer Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn-tickets"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {authLoading ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
              <span>{authLoading ? 'Verifying...' : 'Unlock Dashboard'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                textDecoration: 'none',
                fontWeight: 400
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Public Landing Page</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Organizer Dashboard View
  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '24px 16px 60px' }}>
      <div className="ambient-fog" aria-hidden="true" />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Dashboard Top Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--bg-surface)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '18px 22px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>💀</span>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 500, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                Organizer Dashboard
              </h1>
              <span style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                fontSize: '0.7rem',
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Private
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 400 }}>
              Add, sync, and filter official Eventbrite listings for Halloween
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-organizer"
              style={{ fontSize: '0.82rem' }}
            >
              <ExternalLink size={14} />
              <span>View Public Page</span>
            </a>
            <button
              onClick={handleLogout}
              className="btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}>
          <div style={{ background: 'var(--bg-card)', border: 'none', padding: '18px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Public Halloween Events</span>
            <div style={{ fontSize: '2rem', fontWeight: 500, color: '#ffffff', marginTop: '6px', lineHeight: 1 }}>
              {statusData?.halloweenEvents || 0}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Visible on landing page</span>
          </div>

          <div style={{ background: 'var(--bg-card)', border: 'none', padding: '18px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Total Tracked in System</span>
            <div style={{ fontSize: '2rem', fontWeight: 500, color: '#ffffff', marginTop: '6px', lineHeight: 1 }}>
              {statusData?.totalEvents || allEvents.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Halloween & excluded</span>
          </div>

          <div style={{ background: 'var(--bg-card)', border: 'none', padding: '18px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>API Integration Mode</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 500, color: '#ffffff', marginTop: '10px' }}>
              {statusData?.apiMode || 'Checking...'}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>
              {statusData?.hasApiToken ? 'Live Eventbrite API v3' : 'Manual Fallback Ready'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('add')}
            className={`chip ${activeTab === 'add' ? 'active' : ''}`}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            + Add Event
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`chip ${activeTab === 'manage' ? 'active' : ''}`}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            Tracked Events ({allEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`chip ${activeTab === 'status' ? 'active' : ''}`}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            API & Security Status
          </button>
        </div>

        {/* Alerts / Feedback */}
        {feedback && (
          <div className={`alert-box alert-${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {/* Tab 1: Add Event Form */}
        {activeTab === 'add' && (
          <div style={{ background: 'var(--bg-surface)', border: 'none', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: '#ffffff', marginBottom: '6px' }}>
              Add an Eventbrite Event
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 400 }}>
              Enter an official Eventbrite event URL or numeric ID to import or link.
            </p>

            <form onSubmit={handleAddEvent}>
              {statusData && !statusData.hasApiToken && (
                <div className="alert-box alert-warning">
                  <span>Notice: Server is in Manual Fallback Mode (EVENTBRITE_PRIVATE_TOKEN not set on server). You can specify the details, dates, ticket price, and direct Eventbrite link below.</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Eventbrite Event URL or ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., https://www.eventbrite.com/e/boston-halloween-pub-crawl-tickets-104928174921 or 104928174921"
                  value={inputUrlOrId}
                  onChange={(e) => {
                    setInputUrlOrId(e.target.value);
                    if (!manualTicketUrl && e.target.value.startsWith('http')) {
                      setManualTicketUrl(e.target.value);
                    }
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block', fontWeight: 400 }}>
                  Paste the full event listing URL or numeric ID.
                </span>
              </div>

              <label className="checkbox-label" style={{ margin: '16px 0' }}>
                <input
                  type="checkbox"
                  checked={isHalloween}
                  onChange={(e) => setIsHalloween(e.target.checked)}
                />
                <span>
                  Mark as Halloween event (Only events with this checked will be displayed on the public landing page)
                </span>
              </label>

              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualFields(!showManualFields)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: 500
                  }}
                >
                  {showManualFields ? 'Hide manual details form' : '+ Customize / Enter manual details (Fallback Form)'}
                </button>
              </div>

              {showManualFields && (
                <div style={{ background: '#050505', padding: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: 'none' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#ffffff', marginBottom: '14px' }}>
                    Event Details & Fallback Fields
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Event Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Boston Halloween Masquerade"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Neighborhood / Area</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Faneuil Hall, Seaport, Back Bay"
                        value={manualNeighborhood}
                        onChange={(e) => setManualNeighborhood(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                      >
                        <option value="Costume Party">Costume Party</option>
                        <option value="Pub Crawl">Pub Crawl</option>
                        <option value="Haunted Cruise">Haunted Cruise</option>
                        <option value="Ghost Tour">Ghost Tour</option>
                        <option value="Nightlife">Nightlife</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Venue & Full Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 206 Washington St, Boston, MA"
                      value={manualVenue}
                      onChange={(e) => setManualVenue(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date (YYYY-MM-DD)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time Display</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., 8:00 PM – 2:00 AM EDT"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ticket Price</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., $25.00 – $40.00 or Free"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Availability Status</label>
                      <select
                        className="form-select"
                        value={manualAvailability}
                        onChange={(e) => setManualAvailability(e.target.value)}
                      >
                        <option value="Tickets Available">Tickets Available</option>
                        <option value="Selling Fast">Selling Fast</option>
                        <option value="Limited Tickets">Limited Tickets</option>
                        <option value="Sold Out">Sold Out</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direct Eventbrite Ticket Link</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.eventbrite.com/e/your-event-tickets-12345"
                      value={manualTicketUrl}
                      onChange={(e) => setManualTicketUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Image URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://images.unsplash.com/..."
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Description</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Inviting description of the Halloween party or event..."
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-tickets"
                style={{ width: '100%', cursor: loading ? 'wait' : 'pointer' }}
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                <span>{loading ? 'Saving...' : 'Save & Publish Event'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Manage All Tracked Events */}
        {activeTab === 'manage' && (
          <div style={{ background: 'var(--bg-surface)', border: 'none', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                Rule: Only items tagged with <strong>Live on Site</strong> appear on the public landing page.
              </span>
              <button
                onClick={handleSyncNow}
                disabled={loading}
                className="btn-organizer"
                style={{ fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Sync All</span>
              </button>
            </div>

            {allEvents.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '36px 0', fontWeight: 400 }}>
                No events tracked yet.
              </p>
            ) : (
              <div>
                {allEvents.map((evt) => (
                  <div key={evt.id} className="admin-event-row" style={{ padding: '14px' }}>
                    <div className="admin-event-info">
                      <div className="admin-event-title">{evt.title}</div>
                      <div className="admin-event-meta" style={{ marginTop: '4px' }}>
                        {evt.displayDate || evt.date} • {evt.neighborhood || 'Boston'} • {evt.ticketPrice}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleHalloween(evt)}
                        title={evt.isHalloween ? "Marked as Halloween event (Visible on landing page). Click to hide." : "Excluded from landing page. Click to make visible."}
                        style={{
                          background: evt.isHalloween ? '#ffffff' : 'var(--bg-surface-elevated)',
                          color: evt.isHalloween ? '#000000' : 'var(--text-muted)',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        {evt.isHalloween ? 'Live on Site' : 'Excluded'}
                      </button>

                      <a
                        href={evt.eventbriteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-organizer"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="Test direct Eventbrite ticket link"
                      >
                        <ExternalLink size={13} />
                        <span>Test Link</span>
                      </a>

                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="btn-danger"
                        style={{ padding: '6px 10px' }}
                        title="Remove event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: API & Security Status */}
        {activeTab === 'status' && (
          <div style={{ background: 'var(--bg-surface)', border: 'none', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <div className="alert-box alert-info" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <ShieldCheck size={24} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: '2px', color: '#ffffff' }} />
              <div>
                <div style={{ fontWeight: 500 }}>Secure Credential Architecture:</div>
                <p style={{ marginTop: '4px', fontSize: '0.84rem', lineHeight: '1.5', color: 'var(--text-secondary)', fontWeight: 400 }}>
                  All Eventbrite API credentials and organizer passwords are saved exclusively on the server in <code>.env</code>.
                  No tokens or secret keys are ever exposed in client browser code or network bundles.
                </p>
              </div>
            </div>

            <div style={{ background: '#050505', padding: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>API Integration Mode:</span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>
                  {statusData?.apiMode || 'Checking...'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>EVENTBRITE_PRIVATE_TOKEN:</span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>
                  {statusData?.hasApiToken ? 'Configured on Server' : 'Not Set in .env'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Password Protection:</span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>Active (Protected by ORGANIZER_PASSWORD)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Public Halloween Events:</span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>
                  {statusData?.halloweenEvents} of {statusData?.totalEvents}
                </span>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                {statusData?.diagnostic}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSyncNow}
                disabled={loading}
                className="btn-tickets"
                style={{ fontSize: '0.92rem', padding: '12px 22px' }}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>Trigger Live Sync</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
