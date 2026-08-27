# Yahoo Live Draft Sync — Progress Notes

Read-only sync so FIRE auto-marks players drafted in your live Yahoo draft.
No auto-clicking, no writing to Yahoo — FIRE only *reads* "who's been picked."

## Done (this session)
- `netlify/functions/yahoo.ts` — new back-end module:
  - Yahoo login flow (read-only scope `fspt-r`)
  - Token exchange + silent refresh
  - List your NFL leagues
  - **Live draft-results fetch WITH player names/positions** (the heartbeat)
  - Defensive parsers for Yahoo's weird JSON; convert Yahoo `DEF` -> FIRE `DST`
- `netlify/functions/api.ts` — wired in 5 new routes under `/api/yahoo/*`
- Typechecks clean.

## Not done yet (next session)
1. **Front-end**: a "Connect Yahoo" button + league picker in the app, and the
   polling loop that calls the heartbeat every few seconds and feeds each new
   pick into the EXISTING `handleDraftPlayer(playerId, 'opponent')` in App.tsx.
   (Name+position match reuses the existing `normalizeSleeperName` logic.)
2. **Tim's Yahoo chore**: create a Yahoo developer app to get the two secret
   codes (`YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET`) -> paste into Netlify env vars.
   Redirect URI to enter on Yahoo = `<APP_URL>/api/yahoo/callback`.
3. **Test** against a Yahoo mock draft before Saturday 4:30pm.

## Key facts learned
- Yahoo draft results DURING a live draft return everyone picked so far. ✅
- Raw picks give only numeric `player_key`; adding `/players` attaches
  name+position in one call. That's what we use.
- Yahoo requires login; access tokens last ~1hr, refresh token renews silently.
