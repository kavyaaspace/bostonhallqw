import http from 'http';

async function testServer() {
  console.log('Testing live server endpoints and password security...\n');

  // 1. GET /api/events (Public - No password required)
  const eventsRes = await fetch('http://127.0.0.1:3000/api/events');
  const eventsData = await eventsRes.json();
  console.log(`GET /api/events (Public) -> Status ${eventsRes.status}, Received ${eventsData.events?.length} Halloween events`);
  if (!eventsData.success || !eventsData.events) {
    throw new Error('GET /api/events failed');
  }

  // Ensure non-Halloween event is NOT present in public events
  const hasTechBreakfast = eventsData.events.some(e => e.title.includes('Boston Tech Founders'));
  if (hasTechBreakfast) {
    throw new Error('FAILURE: Non-Halloween event leaked into /api/events!');
  }
  console.log('✅ PASS: Public events are strictly filtered to Halloween only.');

  // 2. Test Unauthorized access to private /api/all-events (Should be blocked with 401)
  const unauthRes = await fetch('http://127.0.0.1:3000/api/all-events');
  console.log(`GET /api/all-events without password -> Status ${unauthRes.status}`);
  if (unauthRes.status !== 401) {
    throw new Error(`Security Failure: /api/all-events did not return 401 without password! Received ${unauthRes.status}`);
  }
  console.log('✅ PASS: Private organizer endpoint blocked without password (HTTP 401).');

  // 3. Test wrong password
  const wrongPwdRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrongpassword' })
  });
  console.log(`POST /api/auth/login with wrong password -> Status ${wrongPwdRes.status}`);
  if (wrongPwdRes.status !== 401) {
    throw new Error(`Security Failure: Login succeeded with wrong password!`);
  }
  console.log('✅ PASS: Wrong password rejected.');

  // 4. Test correct password login
  const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'halloween2026' })
  });
  const loginData = await loginRes.json();
  console.log(`POST /api/auth/login with correct password -> Status ${loginRes.status}, Success: ${loginData.success}`);
  if (!loginData.success) {
    throw new Error('Login failed with correct password');
  }
  console.log('✅ PASS: Organizer login authenticated.');

  // 5. Test authorized access to /api/all-events with header
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-organizer-password': 'halloween2026'
  };
  const authAllRes = await fetch('http://127.0.0.1:3000/api/all-events', { headers: authHeaders });
  const authAllData = await authAllRes.json();
  console.log(`GET /api/all-events with auth header -> Status ${authAllRes.status}, Total tracked: ${authAllData.events?.length}`);
  if (!authAllData.success) {
    throw new Error('Failed to fetch /api/all-events with valid password');
  }
  console.log('✅ PASS: Private dashboard successfully unlocked with password.');

  // 6. Test authorized POST /api/events with manual fallback
  const addRes = await fetch('http://127.0.0.1:3000/api/events', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      inputUrlOrId: 'https://www.eventbrite.com/e/boston-vampires-ball-tickets-104928174999',
      isHalloween: true,
      manualData: {
        title: 'Boston Vampires Ball 2026',
        neighborhood: 'Theater District',
        venue: 'Royale Boston, 279 Tremont St, Boston, MA',
        date: '2026-10-31',
        time: '9:00 PM – 2:00 AM EDT',
        ticketPrice: '$30.00 – $55.00',
        availability: 'Tickets Available',
        eventbriteUrl: 'https://www.eventbrite.com/e/boston-vampires-ball-tickets-104928174999',
        category: 'Costume Party',
        shortDescription: 'Gothic masquerade and vampire ball featuring immersive fog, dark wave DJ sets, and theatrical lighting.'
      }
    })
  });
  const addData = await addRes.json();
  console.log(`POST /api/events -> Status ${addRes.status}, Success: ${addData.success}, Source: ${addData.source}`);
  if (!addData.success) {
    throw new Error('POST /api/events failed');
  }

  // 7. Clean up test event
  const delRes = await fetch('http://127.0.0.1:3000/api/events/104928174999', {
    method: 'DELETE',
    headers: authHeaders
  });
  const delData = await delRes.json();
  console.log(`DELETE /api/events/104928174999 -> Status ${delRes.status}, Success: ${delData.success}`);

  console.log('\n🎉 ALL SECURITY & ENDPOINT TESTS PASSED SUCCESSFULLY!\n');
}

testServer().catch(err => {
  console.error('Server test error:', err);
  process.exit(1);
});
