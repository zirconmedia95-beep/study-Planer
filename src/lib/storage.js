// Local storage is always written to immediately (instant load, works offline).
// If a sync passcode is set, every load/save also talks to /api/state (Redis-backed),
// so the same data shows up on any device using the same passcode. If that request
// fails (offline, not configured yet, wrong passcode), we silently fall back to the
// local copy — the app never breaks because sync isn't set up.

const LOCAL_KEY = 'al-planner-state-v1';
const PASSCODE_KEY = 'al-planner-passcode';

export function getPasscode() {
  return localStorage.getItem(PASSCODE_KEY) || '';
}

export function setPasscode(value) {
  if (value) localStorage.setItem(PASSCODE_KEY, value);
  else localStorage.removeItem(PASSCODE_KEY);
}

function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function localSave(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Local save failed', e);
  }
}

// Returns { state, synced } — synced tells the UI whether this actually came from
// (or successfully reached) the shared store, or just the local device copy.
export async function loadState() {
  const local = localLoad();
  try {
    const res = await fetch('/api/state', { headers: { 'x-app-passcode': getPasscode() } });
    if (!res.ok) return { state: local, synced: false };
    const data = await res.json();
    if (data.state) {
      localSave(data.state);
      return { state: data.state, synced: true };
    }
    return { state: local, synced: true };
  } catch (e) {
    return { state: local, synced: false };
  }
}

export async function saveState(state) {
  localSave(state);
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-passcode': getPasscode() },
      body: JSON.stringify({ state }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
