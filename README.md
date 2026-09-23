# isaacau.com

Personal portfolio for Isaac Au. A single-page, scroll-scrubbed canvas ride down a ski run
(`/`) where each project surfaces as a constellation, plus a star-catalog reference page (`/work`)
and a shared night sky visitors can add their own constellation to.

## Stack

- Vite 8 + React 19, plain JS, inline styles — the whole run lives in `src/SlopeBackground.jsx`
- Cloudflare Worker (`worker/index.js`) serves `dist/` and routes `/api/*` to the constellation
  signature pipeline in `functions/api/` (Claude generation + vision moderation, KV persistence)
- Tests: vitest (`src/constellation/*.test.js`, `functions/api/_lib/pipeline.test.js`)

## Commands

```
npm run dev       # Vite dev server
npm run build     # production build → dist/
npm run preview   # serve the built bundle
npm run lint      # oxlint
npm test          # vitest
```

## Deploy

The repo is a git-linked Cloudflare Worker (see `wrangler.jsonc`): pushing `main` builds and
deploys. Secrets (`ANTHROPIC_API_KEY`, optional `TURNSTILE_SECRET`) are set with `wrangler secret put`.

See `CLAUDE.md` for the architecture walkthrough and `notes/` for design docs.
