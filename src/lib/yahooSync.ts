// yahooSync.ts — front-end helper for FIRE's Yahoo live-draft sync (READ-ONLY).
//
// Plain-English: this file is the browser-side half of the Yahoo feature.
// It stores your Yahoo login (in this browser only), asks the back-end for
// your leagues, and — during the draft — repeatedly asks "who's been picked?"
// It does NOT draft or change anything on Yahoo. It only reads.
//
// The actual "mark this player as taken" happens back in App.tsx using the
// app's existing draft function; this file just delivers the fresh pick list.

export interface YahooTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms when the access token expires
}

export interface YahooLeague {
  league_key: string;
  name: string;
  num_teams: number;
  draft_status: string; // 'predraft' | 'drafting' | 'postdraft'
}

export interface YahooPick {
  pick: number;
  round: number;
  name: string;
  position: string; // already normalized to FIRE's DST on the server
  team: string;
}

const STORAGE_KEY = 'fire_yahoo_tokens';
const LEAGUE_KEY = 'fire_yahoo_league_key';

// ---- token storage (this browser only) ----
export function saveYahooTokens(t: YahooTokens) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}
export function loadYahooTokens(): YahooTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearYahoo() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEAGUE_KEY);
  } catch { /* ignore */ }
}
export function saveYahooLeagueKey(key: string) {
  try { localStorage.setItem(LEAGUE_KEY, key); } catch { /* ignore */ }
}
export function loadYahooLeagueKey(): string | null {
  try { return localStorage.getItem(LEAGUE_KEY); } catch { return null; }
}

// On app load, if Yahoo redirected back with tokens in the URL hash
// (#yahoo=...), capture them, save them, and clean the URL bar.
export function captureYahooRedirect(): boolean {
  try {
    const hash = window.location.hash;
    const marker = '#yahoo=';
    if (hash.startsWith(marker)) {
      const json = decodeURIComponent(hash.slice(marker.length));
      const tokens = JSON.parse(json) as YahooTokens;
      if (tokens.access_token) {
        saveYahooTokens(tokens);
        // wipe the tokens out of the address bar
        history.replaceState(null, '', window.location.pathname + window.location.search);
        return true;
      }
    }
  } catch (e) {
    console.error('captureYahooRedirect failed:', e);
  }
  return false;
}

// Make sure we have a non-expired access token, refreshing if needed.
async function ensureFreshToken(): Promise<string | null> {
  const t = loadYahooTokens();
  if (!t) return null;

  // 60s safety margin before actual expiry
  if (Date.now() < t.expires_at - 60_000) return t.access_token;

  // expired -> refresh
  try {
    const resp = await fetch('/api/yahoo/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: t.refresh_token }),
    });
    if (!resp.ok) return null;
    const fresh = await resp.json() as YahooTokens;
    saveYahooTokens(fresh);
    return fresh.access_token;
  } catch {
    return null;
  }
}

export function isYahooConnected(): boolean {
  return !!loadYahooTokens();
}

// Kick off the login: just send the browser to the back-end login route,
// which forwards to Yahoo's approval screen.
export function startYahooLogin() {
  window.location.href = '/api/yahoo/login';
}

// Fetch the user's NFL leagues so they can pick which one to sync.
export async function fetchYahooLeagues(): Promise<YahooLeague[]> {
  const token = await ensureFreshToken();
  if (!token) throw new Error('Not connected to Yahoo.');
  const resp = await fetch('/api/yahoo/leagues', {
    headers: { 'x-yahoo-token': token },
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to load Yahoo leagues.');
  }
  const data = await resp.json();
  return data.leagues || [];
}

// The heartbeat: fetch everyone picked so far in the given league.
export async function fetchYahooDraftPicks(leagueKey: string): Promise<YahooPick[]> {
  const token = await ensureFreshToken();
  if (!token) throw new Error('Not connected to Yahoo.');
  const resp = await fetch(`/api/yahoo/draft/${encodeURIComponent(leagueKey)}`, {
    headers: { 'x-yahoo-token': token },
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to load Yahoo draft picks.');
  }
  const data = await resp.json();
  return data.picks || [];
}
