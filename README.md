# 🎃 Boston Halloween Events — Landing Page & Eventbrite Integration

A polished, mobile-first landing page that features **Halloween events only** with direct ticketing links to official Eventbrite listings.

---

## 🌐 URLs & Access

- **Public Landing Page (Clean & Attendee-Facing)**: [http://localhost:3000](http://localhost:3000)
- **Private Password-Protected Organizer Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin) (or `/organizer`)
- **Default Organizer Password**: `halloween2026` (configurable in `.env`)
- **Public API (Halloween Events Only)**: `http://localhost:3000/api/events`

---

## 🔒 Complete Separation of Public vs. Private

1. **Public Landing Page**:
   - Zero organizer controls, edit buttons, or admin links are visible anywhere in the header, footer, or cards.
   - Strictly attendee-focused: browse Boston Halloween events, view date/venue/price details, and click "Get Tickets" directly to Eventbrite checkout.
2. **Private Organizer Dashboard (`/admin`)**:
   - Requires organizer password to unlock.
   - Backend APIs (`/api/all-events`, `/api/events` [POST/PUT/DELETE], `/api/sync`) are strictly protected by server middleware and reject unauthorized requests with HTTP 401.
   - Full event management: Add by URL or ID, toggle Halloween visibility, edit manual details/fallbacks, and trigger live Eventbrite syncs.

---

## 📋 Features Overview

- **Halloween-Only Filtering**: Only events explicitly marked as Halloween events appear on the public landing page. Non-Halloween events in your organizer account or database are strictly excluded.
- **Eventbrite Direct Ticketing**: Every card features a prominent **“Get Tickets”** button leading directly to the event's official Eventbrite checkout/listing. No payments or sensitive data are ever collected or stored on this site.
- **Official Eventbrite API v3 Integration**: Pulls title, date, time, venue, neighborhood, image, ticket prices, and availability directly from Eventbrite when credentials are configured.
- **Graceful Manual Fallback (No Web Scraping)**: If API access is unavailable or an event field is restricted, a clear diagnostic alert informs you what is blocked and provides an immediate manual entry form to input details and custom Eventbrite ticket links.
- **Automated Regular Refresh**: The backend regularly refreshes event pricing, dates, and sold-out status every 15 minutes, plus on-demand sync from the Organizer modal.
- **Mobile-First Aesthetic**: Deep navy/black background (`#080b12`), warm pumpkin orange accents (`#ff6f00`), cream typography (`#fff9f0`), and responsive touch targets designed for phone browsing.
- **SEO & Social Sharing**: Complete Open Graph, Twitter card, and search engine metadata configured in `index.html`.

---

## 🎟️ How to Access the Private Organizer Dashboard

1. Navigate to: **[http://localhost:3000/admin](http://localhost:3000/admin)**
2. Enter the organizer password:
   ```
   halloween2026
   ```
3. Once unlocked, you can:
   - **Add Events**: Paste an Eventbrite Event URL or numeric ID (e.g. `104928174921`).
   - **Toggle Visibility**: Click **🎃 Halloween (Live)** / **⚪ Excluded (Hidden)** to immediately show or hide any event from the public page.
   - **Test Links**: Click **Test Link** to check each event's Eventbrite checkout page.
   - **Manual Fallback**: Enter or edit custom fields if API credentials are not set or if you want custom pricing notes.
   - **Sign Out**: Click the **Sign Out** button in the dashboard top bar to lock the dashboard again.

---

## 🔐 Changing Your Password & Eventbrite API Credentials

All credentials reside securely on the server in `.env`:

```env
# Eventbrite API Configuration
EVENTBRITE_PRIVATE_TOKEN=your_private_token_here
EVENTBRITE_ORGANIZER_ID=your_optional_organizer_id

# Private Organizer Dashboard Password
ORGANIZER_PASSWORD=your_new_secret_password_here

# Server configuration
PORT=3000
NODE_ENV=development
```

---

## 🧪 Verification & Testing

```bash
# Run unit & filter verification tests
node test/verify.js

# Run live server endpoint & security tests
node test/api-test.js
```
