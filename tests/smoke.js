// Simple smoke script to validate auth and booking flows
// Requires Node 18+ (global fetch available)

const KC_TOKEN_URL = 'http://localhost:8180/realms/gym-booking/protocol/openid-connect/token';
const API = 'http://localhost:8080/api';

async function getToken(username, password) {
  const body = new URLSearchParams({
    client_id: 'gym-booking-client',
    grant_type: 'password',
    username,
    password,
  });
  const res = await fetch(KC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

async function getAuthMe(token) {
  const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`auth/me failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getClasses() {
  const res = await fetch(`${API}/classes`);
  if (!res.ok) throw new Error(`classes failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function book(token, classId) {
  const res = await fetch(`${API}/bookings?classInstanceId=${classId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`booking failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function adminGetAthletes(token) {
  const res = await fetch(`${API}/admin/athletes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`admin athletes failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function adminCreateClass(token) {
  // Create a class 2 hours from now, 60 minutes duration
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 3600 * 1000);
  const end = new Date(start.getTime() + 60 * 60000);
  const pad = (n) => n.toString().padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  const payload = {
    name: 'SmokeTest',
    description: 'Smoke created class',
    capacity: 5,
    durationMinutes: 60,
    instructorId: 2,
    classTypeId: 3,
    startTime: fmt(start),
    endTime: fmt(end),
    location: 'Test Room'
  };
  const res = await fetch(`${API}/classes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`admin create class failed: ${res.status} ${await res.text()}`);
  return res.json();
}

(async () => {
  try {
    console.log('Fetching token for member...');
    const token = await getToken('member', 'member');
    console.log('Token acquired.');

    const me = await getAuthMe(token);
    console.log('auth/me:', me);

    const classes = await getClasses();
    console.log(`Got ${classes.length} classes`);
    const firstFuture = classes[0]?.id;
    if (!firstFuture) throw new Error('No classes available to book');

    console.log('Booking class id:', firstFuture);
    try {
      const booking = await book(token, firstFuture);
      console.log('Booked:', booking);
    } catch (e) {
      console.warn('Booking skipped:', e.message);
    }

  // Trainer/Admin checks (admin may require password update; use trainer to create class)
  console.log('Fetching token for trainer...');
  const trainerToken = await getToken('trainer', 'trainer');
  const created = await adminCreateClass(trainerToken);
  console.log('Created class id (trainer):', created.id);

    console.log('SMOKE OK');
  } catch (e) {
    console.error('SMOKE FAIL:', e.message);
    if (e.stack) console.error(e.stack);
    if (e.cause) console.error('Cause:', e.cause);
    process.exit(1);
  }
})();
