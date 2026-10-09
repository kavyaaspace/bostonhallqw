import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Tag
} from 'lucide-react';

export default function OrganizerModal({ isOpen, onClose, onEventMutated }) {
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'manage' | 'status'
  const [inputUrlOrId, setInputUrlOrId] = useState('');
  const [isHalloween, setIsHalloween] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'warning' | 'error', message }

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

  // Fetch status and all events when opened
  const loadData = async () => {
    try {
      const [resStatus, resAll] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/all-events').then(r => r.json())
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

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || 'Event saved successfully!'
        });
        // Reset form
        setInputUrlOrId('');
        setManualTitle('');
        setManualDescription('');
        setManualTicketUrl('');
        setManualImageUrl('');
        await loadData();
        if (onEventMutated) onEventMutated();
      } else if (data.fallbackRequired) {
        setShowManualFields(true);
        setFeedback({
          type: 'warning',
          message: `${data.reason} Enter the details manually below to save this event.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.reason || data.error || 'Failed to add event.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Network error: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHalloween = async (event) => {
    try {
      const updatedStatus = !event.isHalloween;
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHalloween: updatedStatus })
      });
      if (res.ok) {
        await loadData();
        if (onEventMutated) onEventMutated();
      }
    } catch (err) {
      console.error('Failed to toggle Halloween status:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this event from the listing?')) {
      return;
    }
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        if (onEventMutated) onEventMutated();
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
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
      await loadData();
      if (onEventMutated) onEventMutated();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Sync failed: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Organizer Event Manager</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Add, sync, and filter official Eventbrite listings for Halloween
            </p>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('add')}
            className={`chip ${activeTab === 'add' ? 'active' : ''}`}
          >
            Add Event
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`chip ${activeTab === 'manage' ? 'active' : ''}`}
          >
            All Tracked ({allEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`chip ${activeTab === 'status' ? 'active' : ''}`}
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

        {/* Tab 1: Add Event */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddEvent}>
            {statusData && !statusData.hasApiToken && (
              <div className="alert-box alert-warning">
                <strong>Eventbrite API Token Not Configured:</strong> The server will use manual fallback mode.
                You can enter your event details, ticket price, and direct Eventbrite link below.
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
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Paste the full Eventbrite event link or numeric ID.
              </span>
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isHalloween}
                onChange={(e) => setIsHalloween(e.target.checked)}
              />
              <span>
                <strong>Mark as Halloween event</strong> (Only Halloween events appear on the public landing page)
              </span>
            </label>

            {/* Toggle manual fallback fields */}
            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setShowManualFields(!showManualFields)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--orange-bright)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {showManualFields ? 'Hide manual details form' : '+ Customize / Enter manual details (Fallback)'}
              </button>
            </div>

            {showManualFields && (
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--cream-pure)', marginBottom: '12px' }}>
                  Event Details (Fallback / Custom Fields)
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
                  <label className="form-label">Direct Eventbrite Ticket URL</label>
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
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
              <span>{loading ? 'Saving...' : 'Save & Publish Event'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Manage All Tracked Events */}
        {activeTab === 'manage' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--cream-muted)' }}>
                Filtering Rule: Only events with a green "Halloween" tag appear on the public page.
              </span>
              <button
                onClick={handleSyncNow}
                disabled={loading}
                className="btn-organizer"
                style={{ fontSize: '0.78rem' }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Sync All</span>
              </button>
            </div>

            {allEvents.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 0' }}>
                No events tracked yet.
              </p>
            ) : (
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {allEvents.map((evt) => (
                  <div key={evt.id} className="admin-event-row">
                    <div className="admin-event-info">
                      <div className="admin-event-title">{evt.title}</div>
                      <div className="admin-event-meta">
                        {evt.displayDate || evt.date} • {evt.neighborhood || 'Boston'} • {evt.ticketPrice}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Toggle Halloween badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleHalloween(evt)}
                        title={evt.isHalloween ? "Marked as Halloween event (Visible on landing page). Click to hide." : "Not marked as Halloween (Hidden from landing page). Click to show."}
                        style={{
                          background: evt.isHalloween ? 'var(--badge-green-bg)' : 'rgba(255,255,255,0.06)',
                          color: evt.isHalloween ? 'var(--badge-green-text)' : 'var(--text-dim)',
                          border: `1px solid ${evt.isHalloween ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        {evt.isHalloween ? '🎃 Halloween' : '⚪ Excluded'}
                      </button>

                      {/* Direct Test Link */}
                      <a
                        href={evt.eventbriteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-organizer"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Test direct Eventbrite ticket link"
                      >
                        <ExternalLink size={12} />
                        <span>Link</span>
                      </a>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="btn-danger"
                        title="Remove event"
                      >
                        <Trash2 size={13} />
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
          <div>
            <div className="alert-box alert-info" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
              <div>
                <strong>Secure Credential Architecture:</strong>
                <p style={{ marginTop: '4px', fontSize: '0.8rem', lineHeight: '1.45' }}>
                  Eventbrite API credentials are kept strictly on the Node.js server inside <code>.env</code>.
                  No tokens or secret keys are ever exposed in client browser code or network bundles.
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>API Integration Mode:</span>
                <strong style={{ color: statusData?.hasApiToken ? 'var(--badge-green-text)' : 'var(--badge-orange-text)' }}>
                  {statusData?.apiMode || 'Checking...'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>EVENTBRITE_PRIVATE_TOKEN:</span>
                <span style={{ color: statusData?.hasApiToken ? 'var(--badge-green-text)' : 'var(--text-dim)' }}>
                  {statusData?.hasApiToken ? 'Active & Configured on Server' : 'Not Set in .env'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Public Halloween Events:</span>
                <span style={{ color: 'var(--orange-bright)', fontWeight: 500 }}>
                  {statusData?.halloweenEvents} of {statusData?.totalEvents}
                </span>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: 'var(--cream-muted)' }}>
                {statusData?.diagnostic}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSyncNow}
                disabled={loading}
                className="btn-tickets"
                style={{ fontSize: '0.85rem', padding: '10px 16px' }}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>Trigger Manual Sync</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
