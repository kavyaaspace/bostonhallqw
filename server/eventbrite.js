/**
 * Server-side Eventbrite API Integration Module
 * Securely handles communication with official Eventbrite API v3 using server environment variables.
 * Credentials are never exposed to browser client.
 * Strictly adheres to official API guidelines (no web scraping).
 */

const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';

/**
 * Extracts a numeric Eventbrite Event ID from an ID string or full URL.
 * Examples:
 *  - "104928174921" -> "104928174921"
 *  - "https://www.eventbrite.com/e/boston-halloween-pub-crawl-tickets-104928174921" -> "104928174921"
 *  - "https://www.eventbrite.com/e/104928174921?aff=oddtdtcreator" -> "104928174921"
 */
export function extractEventId(input) {
  if (!input || typeof input !== 'string') return null;
  const cleanInput = input.trim();

  // If pure digits
  if (/^\d{8,16}$/.test(cleanInput)) {
    return cleanInput;
  }

  // If URL containing -tickets-<id> or /e/<id>
  const urlMatch = cleanInput.match(/(?:tickets-|\/e\/)(\d{8,16})/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Any sequence of 9-16 digits in the string
  const generalMatch = cleanInput.match(/(\d{9,16})/);
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1];
  }

  return null;
}

/**
 * Formats a date string into user-friendly display date and time.
 */
function formatEventDateTime(startLocal, endLocal) {
  try {
    const startDate = new Date(startLocal);
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const displayDate = startDate.toLocaleDateString('en-US', dateOptions);

    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);

    let timeStr = startTimeStr;
    if (endLocal) {
      const endDate = new Date(endLocal);
      const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);
      timeStr = `${startTimeStr} – ${endTimeStr}`;
    }

    return { displayDate, time: timeStr, date: startLocal.split('T')[0] };
  } catch (err) {
    return { displayDate: 'Upcoming Date', time: 'TBA', date: '' };
  }
}

/**
 * Summarizes ticket classes into price string and availability badge.
 */
function parseTicketClasses(ticketClasses) {
  if (!ticketClasses || !Array.isArray(ticketClasses) || ticketClasses.length === 0) {
    return {
      ticketPrice: 'See Eventbrite for pricing',
      availability: 'Tickets Available'
    };
  }

  let isFree = true;
  let prices = [];
  let allSoldOut = true;
  let anySellingFast = false;

  for (const tc of ticketClasses) {
    if (tc.cost && tc.cost.value > 0) {
      isFree = false;
      prices.push(tc.cost.value / 100);
    } else if (tc.free) {
      prices.push(0);
    }

    const onSaleStatus = tc.on_sale_status;
    if (onSaleStatus !== 'SOLD_OUT' && tc.quantity_sold !== tc.quantity_total) {
      allSoldOut = false;
    }

    if (tc.quantity_total && tc.quantity_sold) {
      const remaining = tc.quantity_total - tc.quantity_sold;
      if (remaining > 0 && remaining <= 20) {
        anySellingFast = true;
      }
    }
  }

  let ticketPrice = 'Free';
  if (!isFree && prices.length > 0) {
    const minPrice = Math.min(...prices.filter(p => p > 0));
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      ticketPrice = `$${minPrice.toFixed(2)}`;
    } else {
      ticketPrice = `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`;
    }
  } else if (isFree) {
    ticketPrice = 'Free';
  }

  let availability = 'Tickets Available';
  if (allSoldOut) {
    availability = 'Sold Out';
  } else if (anySellingFast) {
    availability = 'Selling Fast';
  }

  return { ticketPrice, availability };
}

/**
 * Fetch details for a single Eventbrite event using official Eventbrite API v3.
 * Returns { success: true, event } or { success: false, reason, blocked }
 */
export async function fetchEventbriteEventDetails(eventIdOrUrl) {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  const eventId = extractEventId(eventIdOrUrl);

  if (!eventId) {
    return {
      success: false,
      blocked: true,
      reason: 'Invalid Eventbrite URL or Event ID provided. Please provide a valid Eventbrite URL or numeric ID.'
    };
  }

  if (!token || token.trim() === '') {
    return {
      success: false,
      blocked: true,
      reason: 'EVENTBRITE_PRIVATE_TOKEN is not configured on the server. The server cannot query the live Eventbrite API automatically without this token. Manual fallback mode is ready for you to input event details.',
      eventId
    };
  }

  try {
    const url = `${EVENTBRITE_API_BASE}/events/${eventId}/?expand=venue,ticket_classes,logo,format`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        blocked: true,
        reason: 'Eventbrite API authorization failed (HTTP 401/403). Your EVENTBRITE_PRIVATE_TOKEN may be invalid or expired. Check your token at https://www.eventbrite.com/account-settings/apps.',
        eventId
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        blocked: true,
        reason: `Eventbrite event ID "${eventId}" was not found (HTTP 404). Ensure the event is published and live on Eventbrite.`,
        eventId
      };
    }

    if (!response.ok) {
      return {
        success: false,
        blocked: true,
        reason: `Eventbrite API returned HTTP status ${response.status}: ${response.statusText}`,
        eventId
      };
    }

    const data = await response.json();
    const { displayDate, time, date } = formatEventDateTime(data.start?.local, data.end?.local);
    const { ticketPrice, availability } = parseTicketClasses(data.ticket_classes);

    // Neighborhood detection from venue
    let neighborhood = 'Boston';
    if (data.venue?.address) {
      neighborhood = data.venue.address.neighborhood || data.venue.address.city || 'Boston';
    }

    const fullVenue = data.venue?.name
      ? `${data.venue.name}${data.venue.address?.localized_address_display ? ', ' + data.venue.address.localized_address_display : ''}`
      : 'Boston, MA';

    const shortDescription = data.summary
      || (data.description?.text ? data.description.text.slice(0, 180) + '...' : 'Join us for this exciting Boston Halloween event on Eventbrite.');

    const eventObj = {
      id: String(data.id),
      eventbriteId: String(data.id),
      title: data.name?.text || 'Halloween Event',
      shortDescription,
      date,
      displayDate,
      time,
      venue: fullVenue,
      neighborhood,
      ticketPrice,
      availability,
      imageUrl: data.logo?.original?.url || data.logo?.url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
      eventbriteUrl: data.url || `https://www.eventbrite.com/e/${data.id}`,
      lastSynced: new Date().toISOString()
    };

    return {
      success: true,
      event: eventObj
    };
  } catch (error) {
    return {
      success: false,
      blocked: true,
      reason: `Network or server error while contacting Eventbrite API: ${error.message}. Please use manual entry fallback.`,
      eventId
    };
  }
}

/**
 * Fetch events directly from an Eventbrite Organizer account.
 * Automatically queries user's organizations and owned events.
 */
export async function fetchOrganizerEvents() {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  const organizerId = process.env.EVENTBRITE_ORGANIZER_ID;

  if (!token || token.trim() === '') {
    return {
      success: false,
      blocked: true,
      reason: 'EVENTBRITE_PRIVATE_TOKEN is not configured on the server. Connect your token in .env to sync organizer events.'
    };
  }

  const headers = {
    'Authorization': `Bearer ${token.trim()}`
  };

  const rawEvents = [];

  try {
    // 1. Fetch from user's organizations
    try {
      const orgsRes = await fetch(`${EVENTBRITE_API_BASE}/users/me/organizations/`, { headers });
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        const orgs = orgsData.organizations || [];
        for (const org of orgs) {
          try {
            const orgEventsRes = await fetch(`${EVENTBRITE_API_BASE}/organizations/${org.id}/events/?expand=venue,ticket_classes,logo&order_by=start_desc&page_size=50`, { headers });
            if (orgEventsRes.ok) {
              const orgEventsData = await orgEventsRes.json();
              if (Array.isArray(orgEventsData.events)) {
                rawEvents.push(...orgEventsData.events);
              }
            }
          } catch (err) {
            console.warn(`[Eventbrite API] Error querying organization ${org.id}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.warn('[Eventbrite API] Error querying organizations:', err.message);
    }

    // Deduplicate by event id
    const uniqueMap = new Map();
    for (const ev of rawEvents) {
      if (ev && ev.id && !uniqueMap.has(String(ev.id))) {
        uniqueMap.set(String(ev.id), ev);
      }
    }

    const events = Array.from(uniqueMap.values())
      .filter(event => {
        // Only active live events
        if (event.status !== 'live' && event.status !== 'started') {
          return false;
        }

        const title = (event.name?.text || '').toLowerCase();
        const summary = (event.summary || '').toLowerCase();
        const desc = (event.description?.text || '').toLowerCase();
        const text = `${title} ${summary} ${desc}`;

        const keywords = [
          'halloween', 'crawl-o-ween', 'haunted', 'dead at night', 'fright night',
          'the shining', 'purge', 'masquerade', 'costume', 'nightmare', 'alibi',
          'thriller'
        ];

        const hasKeyword = keywords.some(k => text.includes(k));
        const startDate = event.start?.local || '';
        const isHalloweenDates = (
          startDate.startsWith('2026-10-29') ||
          startDate.startsWith('2026-10-30') ||
          startDate.startsWith('2026-10-31') ||
          startDate.startsWith('2026-11-01')
        );

        return hasKeyword || isHalloweenDates;
      })
      .map(event => {
        const { displayDate, time, date } = formatEventDateTime(event.start?.local, event.end?.local);
        const { ticketPrice, availability } = parseTicketClasses(event.ticket_classes);
        const neighborhood = event.venue?.address?.neighborhood || event.venue?.address?.city || 'Boston';
        const venue = event.venue?.name
          ? `${event.venue.name}${event.venue.address?.localized_address_display ? ', ' + event.venue.address.localized_address_display : ''}`
          : 'Boston, MA';

        const title = event.name?.text || 'Untitled Event';
        const shortDescription = event.summary || (event.description?.text ? event.description.text.slice(0, 180) + '...' : '');

        return {
          id: String(event.id),
          eventbriteId: String(event.id),
          title,
          shortDescription,
          date,
          displayDate,
          time,
          venue,
          neighborhood,
          ticketPrice,
          availability,
          imageUrl: event.logo?.original?.url || event.logo?.url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
          eventbriteUrl: event.url || `https://www.eventbrite.com/e/${event.id}`,
          isHalloween: true, // Auto-published from organizer account
          lastSynced: new Date().toISOString()
        };
      });

    return {
      success: true,
      events
    };
  } catch (error) {
    return {
      success: false,
      blocked: true,
      reason: `Error connecting to Eventbrite API: ${error.message}`
    };
  }
}
