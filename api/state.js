// Simple key-value sync endpoint backed by Upstash Redis (installed via the Vercel
// Marketplace — see README). Stores one JSON blob under one key, since this app is
// single-user. Protected by an optional shared passcode (APP_PASSCODE env var) so the
// URL alone isn't enough for a stranger to read or overwrite your data.

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const STATE_KEY = 'al-planner-state';

async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Redis GET failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisSet(key, value) {
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'text/plain' },
    body: value,
  });
  if (!res.ok) throw new Error(`Redis SET failed: ${res.status}`);
}

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(500).json({ error: 'Sync storage is not set up on the server yet — see README for the one-time setup.' });
    return;
  }

  const required = process.env.APP_PASSCODE;
  if (required) {
    const given = req.headers['x-app-passcode'];
    if (given !== required) {
      res.status(401).json({ error: 'Wrong or missing passcode' });
      return;
    }
  }

  try {
    if (req.method === 'GET') {
      const raw = await redisGet(STATE_KEY);
      res.status(200).json({ state: raw ? JSON.parse(raw) : null });
      return;
    }
    if (req.method === 'POST') {
      const { state } = req.body || {};
      if (!state) {
        res.status(400).json({ error: 'Missing "state" in request body' });
        return;
      }
      await redisSet(STATE_KEY, JSON.stringify(state));
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Sync storage request failed', detail: String(err) });
  }
}
