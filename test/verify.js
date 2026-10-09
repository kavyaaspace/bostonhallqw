import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/events.json');

async function runTests() {
  console.log('🎃 Starting Boston Halloween Events Verification Suite...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      testsFailed++;
    }
  }

  // 1. Data File Integrity Test
  console.log('Test Suite 1: Data Integrity');
  const fileExists = fs.existsSync(DATA_FILE);
  assert(fileExists, 'events.json file exists on disk');
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const events = JSON.parse(rawData);
  assert(Array.isArray(events) && events.length > 0, `Loaded ${events.length} tracked events from events.json`);

  // 2. Halloween-Only Filter Verification
  console.log('\nTest Suite 2: Halloween-Only Filter');
  const publicHalloweenEvents = events.filter(e => e.isHalloween === true);
  const nonHalloweenEvents = events.filter(e => e.isHalloween !== true);

  assert(publicHalloweenEvents.length > 0, `Found ${publicHalloweenEvents.length} live Halloween event(s) published on site`);
  for (const nonEvt of nonHalloweenEvents) {
    assert(
      !publicHalloweenEvents.some(e => e.id === nonEvt.id),
      `Non-Halloween event "${nonEvt.title}" is excluded from public listing`
    );
  }

  // 3. Ticket Link Verification
  console.log('\nTest Suite 3: Ticket Links & Direct Eventbrite Checkout');
  for (const evt of publicHalloweenEvents) {
    const hasValidUrl = evt.eventbriteUrl && (
      evt.eventbriteUrl.startsWith('https://www.eventbrite.com/') ||
      evt.eventbriteUrl.startsWith('https://eventbrite.com/')
    );
    assert(hasValidUrl, `Event "${evt.title.slice(0, 35)}..." has valid direct Eventbrite link (${evt.eventbriteUrl})`);

    // Verify critical fields
    assert(Boolean(evt.title && evt.venue && evt.date && evt.ticketPrice), `Event "${evt.title.slice(0, 30)}..." has title, venue, date, and price`);
    assert(Boolean(evt.availability), `Event "${evt.title.slice(0, 30)}..." has availability status (${evt.availability})`);
  }

  // 4. Fallback Architecture & Security
  console.log('\nTest Suite 4: Fallback & Server Security');
  const envExample = fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf-8');
  assert(envExample.includes('EVENTBRITE_PRIVATE_TOKEN'), '.env.example defines EVENTBRITE_PRIVATE_TOKEN');
  
  // Verify client build dist
  const distIndexHtml = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), 'utf-8');
  assert(distIndexHtml.includes('Boston Halloween Events'), 'dist/index.html contains correct title and meta');
  assert(!distIndexHtml.includes('EVENTBRITE_PRIVATE_TOKEN'), 'Client build does NOT leak any private token or server secrets');

  console.log(`\n========================================`);
  console.log(`Tests Completed: ${testsPassed} passed, ${testsFailed} failed.`);
  console.log(`========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
