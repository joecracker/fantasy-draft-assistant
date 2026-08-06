# NFL Fantasy Hype Filter

> A clinical, anti-hype fantasy football draft assistant — an AI analyst that strips out media narrative, coach speak, and training-camp puff pieces to give you the numbers that actually predict performance.

**[Live demo →](https://fantasy-draft.crackerbox.app)**

![App screenshot](./docs-screenshot.png)

## What it does

This is a live draft board synced to real Sleeper league data, paired with an AI-powered "Anti-Hype Filter" that runs a clinical, stats-first breakdown on any player — regression risk, system fit, floor/ceiling range, and a narrative-bias callout — instead of the usual hype-driven takes.

- **Live Sleeper sync** — pulls real draft, league, and public-ADP data straight from the Sleeper API
- **Snake draft board** with round/pick tracking, timer, and tiered player pool
- **AI Anti-Hype analysis** on demand for any player: objective metrics, regression flags, system impact, and a clinical 1–10 stability score
- **Custom scoring support** — standard, PPR, and half-PPR aware
- Draft log, squad tracking, and advanced filtering tools

## How the AI analysis works

Player breakdowns are generated server-side via a Netlify Function that calls the Gemini API — the API key never touches the browser. Each request returns a structured JSON report (objective metrics, regression risk, system analysis, variance assessment) rendered directly in the "Narrative Deflator" panel.

## Tech stack

- React + TypeScript, Vite
- Netlify Functions (Express + `serverless-http`) for the AI proxy layer
- Sleeper API for live league/draft data
- Google Gemini API for player analysis
- Deployed on Netlify

## Project structure

```
src/                  React app source
netlify/functions/    Serverless API (Sleeper proxy + Gemini analysis endpoint)
netlify.toml          Netlify build & functions configuration
```

## Local development

```bash
npm install
npm run dev
```

Requires a `GEMINI_API_KEY` environment variable for AI analysis to function (set as a Netlify environment variable in production — never committed to the repo).

## Deployment

Auto-deploys to Netlify on every push to `main`:

```
build command: npm run build
publish dir:   dist
functions dir: netlify/functions
```

---

Built by [Tim Graham](https://github.com/joecracker) — part of the [crackerbox.app](https://crackerbox.app) project family.
