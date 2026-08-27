# Yahoo Live Draft Sync — Progress Notes

Read-only sync so FIRE auto-marks players drafted in your live Yahoo draft.
No auto-clicking, no writing to Yahoo — FIRE only *reads* "who's been picked."

## DONE — both halves built & production build passes
### Back-end (netlify/functions/)
- `yahoo.ts` — Yahoo login (read-only scope fspt-r), token exchange + refresh,
  list leagues, and the live draft-results fetch WITH player names/positions.
  Defensive parsers for Yahoo's nested JSON. Converts Yahoo DEF -> FIRE DST.
- `api.ts` — wired in 5 routes under /api/yahoo/*

### Front-end (src/)
- `lib/yahooSync.ts` — browser helper: stores tokens (this browser only),
  captures the login redirect, refreshes tokens, fetches leagues + draft picks.
- `App.tsx`:
  - Yahoo state block (near Sleeper state)
  - `markPlayersTakenFromYahoo()` — matches picks by normalizeSleeperName +
    position and marks them isDrafted/'opponent'. Does NOT touch your pick
    counter or selection (deliberately lighter than handleDraftPlayer).
  - Connect/disconnect/load-leagues handlers + a 5-second polling useEffect.
  - Redirect capture on mount.
  - "Yahoo Live Draft Sync" UI card (purple) in the settings panel, near Sleeper.
- `.env.example` — documents YAHOO_CLIENT_ID / YAHOO_CLIENT_SECRET.

## TODO (with Tim, morning)
1. Tim creates Yahoo developer app -> see YAHOO_SETUP_WALKTHROUGH.md
2. Paste YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, APP_URL into Netlify env vars.
3. Push to GitHub (Tim + Claude together) -> Netlify auto-deploys.
4. Test against a Yahoo MOCK draft before Sat 4:30pm.

## Watch-outs for testing
- Redirect URI on Yahoo must EXACTLY equal <APP_URL>/api/yahoo/callback.
- If a pick shows "not matched (name mismatch?)" in the status line, that's a
  name-spelling gap between Yahoo and FIRE's board — note which player, we can
  add an alias. Defenses are the most likely mismatch to check first.
- The mock-draft SIMULATOR also marks players 'opponent'. Don't run the
  simulator AND Yahoo sync at the same time — they'd both be filling the pool.
  (For a real draft you won't use the simulator anyway.)

## Key facts
- Yahoo draft results during a live draft return everyone picked so far. ✅
- /draftresults/players attaches name+position in one call (no ID lookups). ✅
- Access tokens ~1hr; refresh token renews silently.
