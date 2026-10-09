import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchEventbriteEventDetails,
  fetchOrganizerEvents,
  extractEventId
} from './eventbrite.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/events.json');
const SUBSCRIBERS_CSV_FILE = path.resolve(__dirname, '../data/subscribers.csv');
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to read events file safely
async function readEvents() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading events file, returning empty array:', err.message);
    return [];
  }
}

// Helper to write events file safely
async function writeEvents(events) {
  await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
}

const ORGANIZER_PASSWORD = process.env.ORGANIZER_PASSWORD || 'halloween2026';

/**
 * Organizer Password Verification Endpoint
 */
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password && password === ORGANIZER_PASSWORD) {
    return res.json({ success: true, message: 'Authentication successful' });
  }
  return res.status(401).json({ success: false, error: 'Invalid password. Access denied.' });
});

/**
 * Middleware: Strictly protect organizer endpoints from unauthorized public access
 */
function requireOrganizerAuth(req, res, next) {
  const providedPassword = req.headers['x-organizer-password'];
  if (!providedPassword || providedPassword !== ORGANIZER_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Private organizer password required'
    });
  }
  next();
}

let lastAutoSyncTime = 0;
const AUTO_SYNC_INTERVAL = 60 * 1000; // 60 seconds throttle

/**
 * Public Events Endpoint
 * Automatically syncs with Eventbrite account in background when visitors browse
 */
app.get('/api/events', async (req, res) => {
  try {
    // If token configured and > 60s since last sync, trigger background refresh
    if (process.env.EVENTBRITE_PRIVATE_TOKEN && Date.now() - lastAutoSyncTime > AUTO_SYNC_INTERVAL) {
      lastAutoSyncTime = Date.now();
      syncAllEvents().catch(err => console.warn('[Auto-Sync] Background sync notice:', err.message));
    }

    const events = await readEvents();
    // Filter to Halloween events only
    const halloweenEvents = events.filter(e => e.isHalloween === true);
    res.json({
      success: true,
      count: halloweenEvents.length,
      events: halloweenEvents
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Public Endpoint: Subscribe email to VIP newsletter
 * Appends email, timestamp, and source to CSV file
 */
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    // Ensure data directory exists
    const dataDir = path.dirname(SUBSCRIBERS_CSV_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    let existingContent = '';
    try {
      existingContent = await fs.readFile(SUBSCRIBERS_CSV_FILE, 'utf-8');
    } catch {
      existingContent = '';
    }

    const now = new Date().toISOString();
    if (!existingContent || existingContent.trim().length === 0) {
      const header = 'Email\n';
      const row = `"${cleanEmail}"\n`;
      await fs.writeFile(SUBSCRIBERS_CSV_FILE, header + row, 'utf-8');

      // Forward to Google Sheets if configured in .env
      const googleSheetUrl = process.env.GOOGLE_SHEETS_URL;
      if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/')) {
        fetch(googleSheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        }).catch((err) => console.warn('[Google Sheets Sync] Forward notice:', err.message));
      }

      return res.json({
        success: true,
        message: "You're on the VIP Halloween guest list! Watch your inbox for secret party drops and discounts."
      });
    }

    // Check if already subscribed
    const lines = existingContent.split('\n');
    const alreadySubscribed = lines.some(line => {
      const trimmed = line.trim().toLowerCase();
      return trimmed.includes(`"${cleanEmail}"`) || trimmed === cleanEmail;
    });

    if (alreadySubscribed) {
      return res.json({
        success: true,
        message: "You're already on the VIP Halloween guest list! We'll keep you updated."
      });
    }

    // Append to CSV
    const row = `"${cleanEmail}"\n`;
    await fs.appendFile(SUBSCRIBERS_CSV_FILE, row, 'utf-8');

    // Forward to Google Sheets if configured in .env
    const googleSheetUrl = process.env.GOOGLE_SHEETS_URL;
    if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/')) {
      fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      }).catch((err) => console.warn('[Google Sheets Sync] Forward notice:', err.message));
    }

    return res.json({
      success: true,
      message: "You're on the VIP Halloween guest list! Watch your inbox for secret party drops and discounts."
    });
  } catch (err) {
    console.error('Error recording subscription:', err);
    return res.status(500).json({ success: false, error: 'Unable to save subscription at this moment. Please try again.' });
  }
});

/**
 * Public Endpoint: oEmbed JSON for Rich Embed Banners
 */
app.get('/api/oembed', (req, res) => {
  res.json({
    version: '1.0',
    type: 'rich',
    title: 'Boston Halloween Events',
    author_name: 'Boston Halloween Events',
    author_url: 'https://bostonhalloweenevents.com',
    provider_name: 'Boston Halloween Events',
    provider_url: 'https://bostonhalloweenevents.com',
    thumbnail_url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791547465/img2896-1.avif',
    thumbnail_width: 1200,
    thumbnail_height: 630,
    html: '<iframe src="https://bostonhalloweenevents.com/embed" width="100%" height="450" frameborder="0" style="border:1px solid rgba(255,107,0,0.3); border-radius:12px; max-width:600px;" allowfullscreen title="Boston Halloween Events"></iframe>',
    width: 600,
    height: 450
  });
});

/**
 * Public Endpoint: Fetch gallery images from Cloudinary
 * Strictly filters out videos, returns only image assets with 3:4 or 4:3 aspect ratio
 */
app.get('/api/gallery', async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dbj0pmqr';
    const apiKey = process.env.CLOUDINARY_API_KEY || '316245249694181';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'mtXpYysRzOG39LGc2k8sDiDGsFI';

    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=100`, {
      headers: { Authorization: authHeader }
    });

    if (!response.ok) {
      throw new Error(`Cloudinary API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const images = (data.resources || [])
      .filter(r => r.resource_type === 'image') // Strictly no videos!
      .map((r, idx) => {
        const isLandscape = r.width > r.height;
        const aspectRatio = isLandscape ? '4:3' : '3:4';
        const transform = isLandscape
          ? 'c_fill,ar_4:3,g_auto,w_1200,q_auto,f_auto'
          : 'c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto';
        const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/v${r.version}/${r.public_id}.${r.format}`;

        return {
          id: r.asset_id || r.public_id || `img-${idx}`,
          publicId: r.public_id,
          url: optimizedUrl,
          rawUrl: r.secure_url,
          width: r.width,
          height: r.height,
          aspectRatio, // '3:4' or '4:3'
          alt: `Boston Halloween Celebration - ${r.public_id}`
        };
      });

    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (err) {
    console.error('Error fetching Cloudinary gallery:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Organizer / Admin Endpoint: Get all tracked events (including non-Halloween)
 * PROTECTED
 */
app.get('/api/all-events', requireOrganizerAuth, async (req, res) => {
  try {
    const events = await readEvents();
    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Status of Eventbrite API credentials & Sync
 * PROTECTED
 */
app.get('/api/status', requireOrganizerAuth, async (req, res) => {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  const organizerId = process.env.EVENTBRITE_ORGANIZER_ID;
  const hasApiToken = Boolean(token && token.trim().length > 0);
  const hasOrganizerId = Boolean(organizerId && organizerId.trim().length > 0);

  const events = await readEvents();
  const halloweenCount = events.filter(e => e.isHalloween === true).length;

  res.json({
    hasApiToken,
    hasOrganizerId,
    organizerId: hasOrganizerId ? `${organizerId.slice(0, 3)}***` : null,
    apiMode: hasApiToken ? 'Official Eventbrite API v3' : 'Manual Fallback Mode',
    diagnostic: hasApiToken
      ? 'Eventbrite API token is detected. The server can pull live event and ticket details directly.'
      : 'No Eventbrite Private Token found in server .env. Manual fallback is active: you can add events with custom details, prices, and direct Eventbrite ticket links.',
    totalEvents: events.length,
    halloweenEvents: halloweenCount,
    lastChecked: new Date().toISOString()
  });
});

/**
 * Add an event by Eventbrite URL or ID
 * PROTECTED
 */
app.post('/api/events', requireOrganizerAuth, async (req, res) => {
  try {
    const {
      inputUrlOrId,
      isHalloween = true,
      manualData = {}
    } = req.body;

    const events = await readEvents();
    const eventId = extractEventId(inputUrlOrId) || manualData.id || String(Date.now());

    // Check if event already exists
    const existingIndex = events.findIndex(e => e.id === eventId || e.eventbriteId === eventId);

    // Try fetching from official Eventbrite API
    const apiResult = await fetchEventbriteEventDetails(inputUrlOrId || eventId);

    let eventToSave = null;
    let source = 'manual_fallback';
    let notice = null;

    if (apiResult.success && apiResult.event) {
      // Successfully pulled from Eventbrite API
      source = 'eventbrite_api';
      eventToSave = {
        ...apiResult.event,
        isHalloween: Boolean(isHalloween),
        // Allow manual overrides if provided
        ...manualData
      };
    } else {
      // API call was blocked or failed
      notice = apiResult.reason;

      // Check if user provided manual details or if we can construct fallback
      if (manualData.title && manualData.title.trim().length > 0) {
        eventToSave = {
          id: eventId,
          eventbriteId: eventId,
          isHalloween: Boolean(isHalloween),
          title: manualData.title.trim(),
          neighborhood: manualData.neighborhood || 'Boston',
          venue: manualData.venue || 'Boston, MA',
          date: manualData.date || '2026-10-31',
          time: manualData.time || '8:00 PM EDT',
          displayDate: manualData.displayDate || manualData.date || 'Saturday, Oct 31',
          shortDescription: manualData.shortDescription || 'Boston Halloween event on Eventbrite.',
          ticketPrice: manualData.ticketPrice || 'See Eventbrite for pricing',
          availability: manualData.availability || 'Tickets Available',
          imageUrl: manualData.imageUrl || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
          eventbriteUrl: manualData.eventbriteUrl || (inputUrlOrId && inputUrlOrId.startsWith('http') ? inputUrlOrId : `https://www.eventbrite.com/e/${eventId}`),
          category: manualData.category || 'Halloween Event',
          lastSynced: new Date().toISOString()
        };
      } else {
        // Return blocked status and request manual fallback inputs
        return res.status(200).json({
          success: false,
          blocked: true,
          reason: apiResult.reason,
          eventId,
          fallbackRequired: true,
          message: 'Could not automatically pull from Eventbrite API. Please enter event details manually using the fallback form.'
        });
      }
    }

    if (existingIndex >= 0) {
      events[existingIndex] = { ...events[existingIndex], ...eventToSave };
    } else {
      events.push(eventToSave);
    }

    await writeEvents(events);

    res.json({
      success: true,
      event: eventToSave,
      source,
      notice,
      message: source === 'eventbrite_api'
        ? 'Event details successfully pulled from Eventbrite!'
        : 'Event saved with manual fallback details.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Update an existing event (e.g., toggle isHalloween, edit details)
 * PROTECTED
 */
app.put('/api/events/:id', requireOrganizerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const events = await readEvents();
    const index = events.findIndex(e => e.id === id || e.eventbriteId === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    events[index] = {
      ...events[index],
      ...updates,
      lastSynced: new Date().toISOString()
    };

    await writeEvents(events);

    res.json({
      success: true,
      event: events[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Remove an event
 * PROTECTED
 */
app.delete('/api/events/:id', requireOrganizerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const events = await readEvents();
    const filtered = events.filter(e => e.id !== id && e.eventbriteId !== id);

    if (filtered.length === events.length) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    await writeEvents(filtered);

    res.json({
      success: true,
      message: 'Event removed successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Refresh / Sync all events with Eventbrite
 * Refreshes dates, prices, availability, and sold-out status regularly
 */
async function syncAllEvents() {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  if (!token) {
    return {
      success: false,
      message: 'API token not configured; existing event data preserved in fallback mode.'
    };
  }

  const events = await readEvents();
  let updatedCount = 0;
  let addedCount = 0;

  // 1. Automatically fetch all events published on the user's Eventbrite account!
  try {
    const orgResult = await fetchOrganizerEvents();
    if (orgResult.success && Array.isArray(orgResult.events)) {
      for (const orgEvent of orgResult.events) {
        const existingIdx = events.findIndex(
          e => String(e.eventbriteId || e.id) === String(orgEvent.eventbriteId || orgEvent.id)
        );

        if (existingIdx >= 0) {
          // Update existing event with latest live data
          events[existingIdx] = {
            ...events[existingIdx],
            ...orgEvent,
            // Preserve manual overrides if already set
            isHalloween: events[existingIdx].isHalloween !== undefined ? events[existingIdx].isHalloween : true,
            lastSynced: new Date().toISOString()
          };
          updatedCount++;
        } else {
          // Newly published event on user's account -> automatically publish to website!
          events.push({
            ...orgEvent,
            isHalloween: true,
            lastSynced: new Date().toISOString()
          });
          addedCount++;
          console.log(`[Auto-Sync] Automatically published new event from account: "${orgEvent.title}" (${orgEvent.id})`);
        }
      }
    }
  } catch (err) {
    console.warn('[Sync Service] Error querying organizer account events:', err.message);
  }

  // 2. Refresh any individually tracked event IDs
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.eventbriteId) {
      try {
        const result = await fetchEventbriteEventDetails(event.eventbriteId);
        if (result.success && result.event) {
          events[i] = {
            ...events[i],
            title: result.event.title || events[i].title,
            shortDescription: result.event.shortDescription || events[i].shortDescription,
            date: result.event.date || events[i].date,
            displayDate: result.event.displayDate || events[i].displayDate,
            time: result.event.time || events[i].time,
            venue: result.event.venue || events[i].venue,
            neighborhood: result.event.neighborhood || events[i].neighborhood,
            ticketPrice: result.event.ticketPrice || events[i].ticketPrice,
            availability: result.event.availability || events[i].availability,
            imageUrl: result.event.imageUrl || events[i].imageUrl,
            eventbriteUrl: result.event.eventbriteUrl || events[i].eventbriteUrl,
            lastSynced: new Date().toISOString()
          };
          updatedCount++;
        }
      } catch (err) {
        console.warn(`Sync error for event ${event.id}:`, err.message);
      }
    }
  }

  if (updatedCount > 0 || addedCount > 0) {
    await writeEvents(events);
  }

  return {
    success: true,
    addedCount,
    updatedCount,
    total: events.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Manual Sync Endpoint
 * PROTECTED
 */
app.post('/api/sync', requireOrganizerAuth, async (req, res) => {
  try {
    const result = await syncAllEvents();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Periodic background auto-sync every 2 minutes (120,000 ms)
setInterval(() => {
  if (process.env.EVENTBRITE_PRIVATE_TOKEN) {
    console.log('[Auto-Sync] Running scheduled Eventbrite account sync...');
    syncAllEvents().catch(err => console.error('[Auto-Sync] Scheduled sync error:', err.message));
  }
}, 2 * 60 * 1000);

// Explicit Google Search Console Crawler Endpoints
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.resolve(__dirname, '../public/robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.resolve(__dirname, '../public/sitemap.xml'));
});

// Static file serving for production
app.use(express.static(DIST_DIR));

// Fallback to index.html for client routing
app.use((req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Landing page build not found. Please run `npm run build` or start Vite dev server.');
    }
  });
});

const PRIMARY_PORT = process.env.PORT || 3000;

app.listen(PRIMARY_PORT, '0.0.0.0', () => {
  console.log(`🎃 Boston Halloween Events Server listening on:`);
  console.log(`   👉 http://localhost:${PRIMARY_PORT}`);
  console.log(`   👉 http://127.0.0.1:${PRIMARY_PORT}`);
  console.log(`Eventbrite API Token: ${process.env.EVENTBRITE_PRIVATE_TOKEN ? 'CONFIGURED' : 'NOT CONFIGURED (Fallback mode active)'}`);
});

// Also listen on fallback port 3001 if primary is 3000
if (Number(PRIMARY_PORT) === 3000) {
  try {
    app.listen(3001, '0.0.0.0', () => {
      console.log(`   👉 http://localhost:3001 (alternate port)`);
    });
  } catch (err) {
    // Port 3001 already in use or optional
  }
}

// Initial account sync from Eventbrite on server startup
if (process.env.EVENTBRITE_PRIVATE_TOKEN) {
  setTimeout(() => {
    console.log('[Auto-Sync] Performing initial Eventbrite account sync...');
    syncAllEvents().catch(err => console.warn('[Auto-Sync] Initial sync notice:', err.message));
  }, 1000);
}

