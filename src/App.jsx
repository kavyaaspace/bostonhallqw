import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import thrillerAudio from './assets/thriller.mp3';
import Hero from './components/Hero';
import FloatingDatesBar from './components/FloatingDatesBar';
import EventCard from './components/EventCard';
import EmptyState from './components/EmptyState';
import GallerySection from './components/GallerySection';
import SubscribeSection from './components/SubscribeSection';
import SubscribePopup from './components/SubscribePopup';
import Footer from './components/Footer';
import OrganizerDashboard from './components/OrganizerDashboard';
import { formatDateDetails, getCreativeDateHeading } from './utils/dateUtils';
import fallbackEventsData from '../data/events.json';

const HALLOWEEN_FALLBACK_EVENTS = fallbackEventsData.filter((e) => e.isHalloween !== false);

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [events, setEvents] = useState(HALLOWEEN_FALLBACK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFloatingDates, setShowFloatingDates] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const userManuallyMutedRef = useRef(false);

  // Audio setup: sync playback state, attempt immediate play, and unlock on first user gesture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.8;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // 1. Attempt unmuted autoplay immediately upon mount
    audio.muted = false;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Autoplay blocked by browser policy until first gesture
          setIsPlaying(false);
        });
    }

    // 2. Unlock on first user gesture anywhere on the window
    const unlockOnGesture = () => {
      if (audio.paused && !userManuallyMutedRef.current) {
        audio.muted = false;
        audio.volume = 0.8;
        audio.play().catch(() => {});
      }
    };

    const gestureEvents = ['click', 'touchstart', 'pointerdown', 'keydown'];
    gestureEvents.forEach((evt) => {
      window.addEventListener(evt, unlockOnGesture, { capture: true, passive: true });
    });

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      gestureEvents.forEach((evt) => {
        window.removeEventListener(evt, unlockOnGesture, { capture: true });
      });
    };
  }, []);

  // Single-click Toggle: If audio is paused or blocked, start playing immediately!
  const toggleSound = (e) => {
    e?.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused || !isPlaying) {
      // Start unmuted playback immediately on this click
      userManuallyMutedRef.current = false;
      audio.muted = false;
      audio.volume = 0.8;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    } else {
      // User explicitly paused / muted
      userManuallyMutedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    }
  };

  // Filter events by selected date if set
  const displayedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : events;

  const dateDetails = selectedDate ? formatDateDetails(selectedDate) : null;
  const dateHeading = getCreativeDateHeading(selectedDate);

  // Track scroll position: show dates bar ONLY while inside the events section,
  // and hide it when above the events section or once the events section has ended.
  useEffect(() => {
    const handleScroll = () => {
      const eventsSection = document.getElementById('events-section');
      if (eventsSection) {
        const rect = eventsSection.getBoundingClientRect();
        // Visible only while viewing events:
        // - Appears when events section reaches top (rect.top <= 120)
        // - Hides as soon as events section ends (rect.bottom < 150)
        const isPastHero = rect.top <= 120;
        const isBeforeEventsEnd = rect.bottom >= 150;
        setShowFloatingDates(isPastHero && isBeforeEventsEnd);
      } else {
        const scrollThreshold = window.innerHeight * 0.4;
        setShowFloatingDates(window.scrollY > scrollThreshold);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    const target = document.getElementById('events-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Fetch only public Halloween events with graceful fallback
  const fetchHalloweenEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
          setError(null);
        }
      }
    } catch (err) {
      console.warn('API sync notice, continuing with verified local events:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPath !== '/admin' && currentPath !== '/organizer') {
      fetchHalloweenEvents();
    }
  }, [currentPath]);

  // If visiting private route, show password-protected Organizer Dashboard
  if (currentPath === '/admin' || currentPath === '/organizer') {
    return <OrganizerDashboard />;
  }



  return (
    <div className="page-wrapper">
      {/* Background Thriller Audio Element */}
      <audio
        ref={audioRef}
        src={thrillerAudio}
        loop
        preload="auto"
        playsInline
      />

      <div className="ambient-fog" aria-hidden="true" />

      {/* Floating Sticky Dates Bar: Sticks to top only while inside events section */}
      <FloatingDatesBar
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        visible={showFloatingDates}
      />

      {/* Full-Bleed End-to-End Viewport Hero with Given Boston Video */}
      <div className="hero-viewport-wrapper">
        <div className="hero-bg-media" aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://res.cloudinary.com/dbj0pmqr/image/upload/v1791547465/img2896-1.avif"
            className="hero-bg-video"
          >
            <source src="https://res.cloudinary.com/dbj0pmqr/video/upload/v1791548052/41760-360.mp4" type="video/mp4" />
          </video>
          <div className="hero-bg-overlay" />
        </div>

        {/* Top-Right Audio Control */}
        <div className="hero-audio-controls-top-right">
          <button
            type="button"
            onClick={toggleSound}
            className={`btn-hero-audio ${isPlaying ? 'is-playing' : ''}`}
            aria-label={isPlaying ? "Mute audio" : "Play audio"}
            title={isPlaying ? "Click to mute" : "Click to play"}
          >
            {isPlaying ? (
              <>
                <Volume2 size={16} className="audio-pulse-icon" />
                <span className="audio-btn-label">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX size={16} />
                <span className="audio-btn-label">Sound Off</span>
              </>
            )}
          </button>
        </div>

        <Hero
          events={events}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </div>

      <div className="page-container">
        <main>
          <section id="events-section" className="events-section-container" style={{ scrollMarginTop: '80px' }}>
            <div className="events-section-header">
              <div className="events-kicker-badge">
                <span className="kicker-sparkle">✦</span>
                <span>{dateHeading.kicker}</span>
                <span className="kicker-sparkle">✦</span>
              </div>
              <h2 className="events-section-title">
                {dateHeading.title}
              </h2>
              <p className="events-section-subtitle">
                {dateHeading.subtitle}
              </p>
              {selectedDate && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="btn-view-all-dates"
                    style={{
                      background: 'rgba(255, 107, 0, 0.1)',
                      border: '1px solid rgba(255, 107, 0, 0.35)',
                      color: 'var(--halloween-orange, #ff6b00)',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    aria-label="View all Halloween weekend events"
                  >
                    <span>← View All 3 Days</span>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--cream-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎃</div>
                <p>Summoning Boston Halloween events...</p>
              </div>
            ) : error && events.length === 0 ? (
              <div className="alert-box alert-warning" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
                <p>Unable to load Halloween events at this moment.</p>
                <button
                  onClick={fetchHalloweenEvents}
                  className="btn-tickets"
                  style={{ marginTop: '12px', display: 'inline-flex' }}
                >
                  Try Again
                </button>
              </div>
            ) : displayedEvents.length === 0 ? (
              <EmptyState
                selectedDate={selectedDate}
                events={events}
                onClearDate={() => setSelectedDate(null)}
                onSelectDate={handleSelectDate}
              />
            ) : (
              <div className="events-grid" role="region" aria-label="Halloween Events List">
                {displayedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Expanded Wide Gallery Section */}
      <div className="gallery-wide-container">
        <GallerySection />
      </div>

      {/* VIP Halloween Email Subscription Section */}
      <SubscribeSection />

      {/* 5-Second Timed Subscribe Popup */}
      <SubscribePopup />

      <Footer />
    </div>
  );
}
