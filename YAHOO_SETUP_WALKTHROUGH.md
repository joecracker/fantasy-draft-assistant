# Yahoo Developer App — Morning Walkthrough (for Tim)

Goal: get two secret codes so FIRE can READ your live Yahoo draft. ~10 minutes.
You'll do this on Yahoo's site; then paste 3 values into Netlify. No coding.

We'll go ONE step at a time in chat. This file is just the map.

## What you'll end up with
- YAHOO_CLIENT_ID   (Yahoo calls it "Client ID" / "Consumer Key")
- YAHOO_CLIENT_SECRET  (Yahoo calls it "Client Secret" / "Consumer Secret")
- Both pasted into Netlify as environment variables (safe, hidden server-side)

## The Yahoo form — exact answers to give
Go to: https://developer.yahoo.com/apps/create/  (log in with your Yahoo account first)

- **Application Name**: FIRE Draft Sync   (anything is fine)
- **Description**: (optional, leave blank or "personal draft tool")
- **Home Page URL**: https://fantasy-draft.crackerbox.app   (optional)
- **Redirect URI(s)**: https://fantasy-draft.crackerbox.app/api/yahoo/callback
      ^^^ THIS MUST BE EXACT. Copy-paste it, don't type it.
- **API Permissions**: check the **Fantasy Sports** box.
      Under it, an accordion opens — leave **Read** selected. (Read only!)
- Click **Create App**.

Yahoo then shows you a **Client ID** and **Client Secret**. Copy both.

## Then, in Netlify (I'll walk you through this too)
Netlify → your FIRE site → Site settings → Environment variables → Add:
- YAHOO_CLIENT_ID      = (the Client ID)
- YAHOO_CLIENT_SECRET  = (the Client Secret)
- APP_URL              = https://fantasy-draft.crackerbox.app
      (APP_URL may already exist — if so just confirm it's this value)

After that: one Netlify redeploy, then we test on a Yahoo mock draft.

## Note
If the real live domain isn't exactly fantasy-draft.crackerbox.app, tell me the
real one FIRST — the Redirect URI must match it precisely or Yahoo login fails.
