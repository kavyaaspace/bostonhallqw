/**
 * Subscriber Service
 * Directly submits subscriber emails to Google Sheets.
 * CSV storage is removed per configuration.
 */

export const GOOGLE_SHEETS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_SHEETS_URL) ||
  'https://script.google.com/macros/s/AKfycbxICym8qazY2Ddo5x3q_owHDGbmmWqCwL16jon8vdb91yUKk23LYgXYhgXdE76mW8GG/exec';

/**
 * Submits an email address directly to the Google Sheets webhook.
 * Uses CORS-safelisted 'text/plain;charset=utf-8' with raw JSON payload
 * to allow direct browser submission under mode: 'no-cors' without preflight blocks.
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export async function submitSubscriberEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('A valid email address is required.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const payload = JSON.stringify({ email: cleanEmail });

  // 1. Direct Browser Submission to Google Sheets
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payload
    });
  } catch (err) {
    console.warn('[SubscriberService] fetch with content-type failed, trying body-only:', err);
    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        body: payload
      });
    } catch (fallbackErr) {
      console.warn('[SubscriberService] body-only fetch notice:', fallbackErr);
    }
  }

  // 2. Extra reliability: sendBeacon if available
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
      navigator.sendBeacon(GOOGLE_SHEETS_URL, blob);
    } catch {
      // Ignore beacon notice
    }
  }

  // 3. Fallback sync to local Express server if present (ignores failures on static hosting)
  try {
    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).catch(() => {});
  } catch {
    // Ignore
  }

  // Cache locally
  try {
    const stored = JSON.parse(localStorage.getItem('halloween_subscribers') || '[]');
    if (!stored.includes(cleanEmail)) {
      stored.push(cleanEmail);
      localStorage.setItem('halloween_subscribers', JSON.stringify(stored));
    }
  } catch {
    // Ignore storage issues
  }

  return { success: true, message: 'Thanks for subscribing!' };
}
