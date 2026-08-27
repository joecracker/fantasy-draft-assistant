// yahoo.ts — Yahoo Fantasy integration for FIRE (READ-ONLY).
//
// Plain-English overview:
//   This file lets FIRE talk to Yahoo to find out who has been drafted in your
//   live Yahoo draft. It NEVER drafts, clicks, or changes anything on Yahoo —
//   it only asks "who's been picked so far?" and hands that list back to FIRE.
//
//   Because Yahoo requires a login, there are two secret codes stored safely on
//   Netlify's servers (never in your browser): YAHOO_CLIENT_ID and
//   YAHOO_CLIENT_SECRET. You create these once on Yahoo's developer site.
//
// The flow, in order:
//   1. You click "Connect Yahoo" in FIRE  ->  we send you to Yahoo to log in.
//   2. Yahoo sends you back with a one-time code  ->  we swap it for an
//      access token (a temporary key that lets us read your leagues).
//   3. FIRE asks "what leagues do I have?"  ->  you pick the right one.
//   4. During the draft, FIRE asks "who's been picked?" every few seconds.
//
// Yahoo's data is XML by default and deeply nested; we always request JSON
// (?format=json) and dig through the nesting carefully.

import type { Request, Response } from 'express';

const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';
const YAHOO_API_BASE = 'https://fantasysports.yahooapis.com/fantasy/v2';

function getCreds() {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  // Where Yahoo sends the user back after they approve. Must EXACTLY match the
  // "Redirect URI" you enter on Yahoo's developer site.
  const appUrl = process.env.APP_URL || '';
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/yahoo/callback`;
  return { clientId, clientSecret, redirectUri };
}

// ---------------------------------------------------------------------------
// STEP 1: Send the user to Yahoo's login/approval screen.
// ---------------------------------------------------------------------------
export function yahooLogin(_req: Request, res: Response) {
  const { clientId, redirectUri } = getCreds();
  if (!clientId) {
    return res.status(500).json({ error: 'YAHOO_CLIENT_ID is not set on the server.' });
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    // fspt-r = Fantasy Sports, READ ONLY. This is the permission scope.
    scope: 'fspt-r',
    language: 'en-us',
  });
  res.redirect(`${YAHOO_AUTH_URL}?${params.toString()}`);
}

// ---------------------------------------------------------------------------
// STEP 2: Yahoo sends the user back here with a one-time ?code=...
// We trade that code for an access token + refresh token.
// ---------------------------------------------------------------------------
export async function yahooCallback(req: Request, res: Response) {
  const { clientId, clientSecret, redirectUri } = getCreds();
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.status(400).send('Missing authorization code from Yahoo.');
  }
  if (!clientId || !clientSecret) {
    return res.status(500).send('Yahoo credentials are not set on the server.');
  }

  try {
    const tokenResp = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Yahoo wants the client id+secret as HTTP Basic auth on token calls.
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      console.error('Yahoo token exchange failed:', text);
      return res.status(502).send('Yahoo login failed. Please try connecting again.');
    }

    const tokens = await tokenResp.json();
    // tokens = { access_token, refresh_token, expires_in, ... }

    // We hand the tokens back to the browser via the redirect URL's hash so
    // FIRE can store them in the browser and send them with future requests.
    // (Tokens only grant READ access to fantasy data, nothing else.)
    const payload = encodeURIComponent(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    }));

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    res.redirect(`${appUrl}/#yahoo=${payload}`);
  } catch (err: any) {
    console.error('Yahoo callback error:', err);
    res.status(500).send('Something went wrong connecting to Yahoo.');
  }
}

// ---------------------------------------------------------------------------
// Refresh an expired access token using the refresh token.
// Access tokens last ~1 hour; the refresh token gets us a fresh one silently.
// ---------------------------------------------------------------------------
export async function yahooRefresh(req: Request, res: Response) {
  const { clientId, clientSecret, redirectUri } = getCreds();
  const refresh_token = req.body?.refresh_token;

  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token.' });
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Yahoo credentials are not set on the server.' });
  }

  try {
    const resp = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        redirect_uri: redirectUri,
        refresh_token,
      }).toString(),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Yahoo refresh failed:', text);
      return res.status(502).json({ error: 'Could not refresh Yahoo session.' });
    }

    const tokens = await resp.json();
    res.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? refresh_token,
      expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    });
  } catch (err: any) {
    console.error('Yahoo refresh error:', err);
    res.status(500).json({ error: 'Failed to refresh Yahoo session.' });
  }
}

// Small helper: call a Yahoo API path with the user's access token, as JSON.
async function yahooGet(path: string, accessToken: string) {
  const url = `${YAHOO_API_BASE}${path}${path.includes('?') ? '&' : '?'}format=json`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Yahoo API ${resp.status}: ${text.slice(0, 300)}`);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// STEP 3: List the user's NFL leagues so they can pick the right one.
// Returns a simple [{ league_key, name, num_teams, draft_status }] list.
// ---------------------------------------------------------------------------
export async function yahooLeagues(req: Request, res: Response) {
  const accessToken = (req.headers['x-yahoo-token'] as string) || '';
  if (!accessToken) return res.status(401).json({ error: 'Not connected to Yahoo.' });

  try {
    // "use_login=1" = the logged-in user; "game_keys=nfl" = football only.
    const data = await yahooGet('/users;use_login=1/games;game_keys=nfl/leagues', accessToken);
    const leagues = parseLeaguesList(data);
    res.json({ leagues });
  } catch (err: any) {
    console.error('Yahoo leagues error:', err);
    res.status(502).json({ error: err.message || 'Failed to load Yahoo leagues.' });
  }
}

// ---------------------------------------------------------------------------
// STEP 4 (the heartbeat): Get draft results WITH player names+positions.
// The magic is the "/draft_results/players" path — Yahoo attaches each picked
// player's details, so we don't have to look up 200 numeric IDs separately.
// Returns [{ pick, round, name, position, team }] for everyone picked so far.
// ---------------------------------------------------------------------------
export async function yahooDraftResults(req: Request, res: Response) {
  const accessToken = (req.headers['x-yahoo-token'] as string) || '';
  const leagueKey = req.params.leagueKey;

  if (!accessToken) return res.status(401).json({ error: 'Not connected to Yahoo.' });
  if (!leagueKey) return res.status(400).json({ error: 'Missing league key.' });

  try {
    const data = await yahooGet(`/league/${leagueKey}/draftresults/players`, accessToken);
    const picks = parseDraftResults(data);
    res.json({ picks });
  } catch (err: any) {
    console.error('Yahoo draft results error:', err);
    res.status(502).json({ error: err.message || 'Failed to load Yahoo draft results.' });
  }
}

// ===========================================================================
// PARSERS — Yahoo's JSON is famously weird: objects keyed by numbers ("0",
// "1", ...) with a "count" field, and arrays that mix metadata with content.
// These helpers dig through that mess defensively so a shape surprise doesn't
// crash the draft. If Yahoo changes shape, these return [] rather than throw.
// ===========================================================================

function parseLeaguesList(data: any): Array<{ league_key: string; name: string; num_teams: number; draft_status: string }> {
  const out: Array<{ league_key: string; name: string; num_teams: number; draft_status: string }> = [];
  try {
    const games = data?.fantasy_content?.users?.[0]?.user?.[1]?.games;
    if (!games) return out;

    // games is a numbered-key object: { "0": {...}, count: N }
    for (const key of Object.keys(games)) {
      if (key === 'count') continue;
      const game = games[key]?.game;
      if (!game) continue;
      // game is an array; leagues live in the element that has a "leagues" key
      const leaguesNode = Array.isArray(game)
        ? game.find((g: any) => g && g.leagues)?.leagues
        : game?.leagues;
      if (!leaguesNode) continue;

      for (const lk of Object.keys(leaguesNode)) {
        if (lk === 'count') continue;
        const leagueArr = leaguesNode[lk]?.league;
        const league = Array.isArray(leagueArr) ? leagueArr[0] : leagueArr;
        if (league?.league_key) {
          out.push({
            league_key: league.league_key,
            name: league.name ?? 'Unnamed League',
            num_teams: Number(league.num_teams) || 0,
            draft_status: league.draft_status ?? 'unknown',
          });
        }
      }
    }
  } catch (e) {
    console.error('parseLeaguesList failed:', e);
  }
  return out;
}

function parseDraftResults(data: any): Array<{ pick: number; round: number; name: string; position: string; team: string }> {
  const out: Array<{ pick: number; round: number; name: string; position: string; team: string }> = [];
  try {
    const league = data?.fantasy_content?.league;
    // league is an array: [ {league meta}, { draft_results: {...} } ]
    const drNode = Array.isArray(league)
      ? league.find((x: any) => x && x.draft_results)?.draft_results
      : league?.draft_results;
    if (!drNode) return out;

    for (const key of Object.keys(drNode)) {
      if (key === 'count') continue;
      const dr = drNode[key]?.draft_result;
      if (!dr) continue;

      // dr can be an array: [ {pick,round,team_key,player_key}, { player: [...] } ]
      const meta = Array.isArray(dr) ? dr.find((x: any) => x && x.pick != null) : dr;
      const playerNode = Array.isArray(dr) ? dr.find((x: any) => x && x.player)?.player : undefined;

      const pick = Number(meta?.pick) || 0;
      const round = Number(meta?.round) || 0;
      const { name, position, team } = extractPlayer(playerNode);

      if (name) out.push({ pick, round, name, position, team });
    }
  } catch (e) {
    console.error('parseDraftResults failed:', e);
  }
  return out;
}

// A Yahoo "player" is an array of little objects; name lives in one of them,
// position + team in others. We scan all fragments and pull what we find.
function extractPlayer(player: any): { name: string; position: string; team: string } {
  let name = '';
  let position = '';
  let team = '';
  if (!player) return { name, position, team };

  const fragments = Array.isArray(player) ? player.flat() : [player];
  for (const frag of fragments) {
    if (!frag || typeof frag !== 'object') continue;
    if (frag.name?.full) name = frag.name.full;
    if (frag.display_position) position = frag.display_position;
    if (frag.editorial_team_abbr) team = frag.editorial_team_abbr;
  }

  // Yahoo defenses come back as position "DEF"; FIRE calls them "DST".
  if (position === 'DEF') position = 'DST';
  // For defenses, Yahoo's "name.full" is like "San Francisco" — that's fine,
  // matching is handled on the FIRE side against its own DST naming.

  return { name, position, team };
}
