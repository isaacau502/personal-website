# CLAUDE.md

Personal portfolio site for **Isaac Au** (Software / AI-ML engineer, CMU). Two routes:
- `/` — **the run**: a single-page, scroll-driven canvas experience. The visitor "rides" a ski/snowboard
  run down a slope, each project beat is revealed as an animated motif as they scroll, and the run ends
  in a **shared night sky** where visitors add their own constellation.
- `/work` — **the star catalog**: a plain, scannable reference page listing every project as a
  constellation plate (`src/Work.jsx`). Theme-aware, respects reduced motion.

Live intent: `https://isaacau.com`. Built with Claude Code + Claude Design (designs originate from
the claude.ai/design "Carving slope animation" project, pulled in via DesignSync).

## Stack & commands

- **Vite 8 + React 19**, plain JS (no TypeScript), ESM. Linting via **oxlint** (`.oxlintrc.json`).
- `npm run dev` — Vite dev server (HMR)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built bundle
- `npm run lint` — oxlint
- `npm test` — vitest (`src/constellation/*.test.js`, `functions/api/_lib/pipeline.test.js`)
- Deploy: this repo is a git-linked **Cloudflare Worker** (`wrangler.jsonc`). Pushing `main` builds and
  deploys the live site, so never push without an explicit go-ahead.
- Font: **Archivo Black** (Google Fonts, loaded in `index.html`); body copy uses a UI monospace stack
  (the `mono` constant in `SlopeBackground.jsx`).

## Architecture — read this before editing

**The run is effectively one file: `src/SlopeBackground.jsx` (~2600 lines).**
`App.jsx` does a path split (`/work` → `<Work />`, everything else → `<SlopeBackground />`); links
between the two are plain `<a href>` full-page loads, and the Worker's SPA fallback serves
`index.html` for `/work`. `main.jsx` is the standard React root; `index.css` is tiny (body reset,
`scroll-behavior: smooth`, the `cueDrop` scroll-cue keyframe). No router library, no component
library, no CSS framework — the run uses inline style objects, `/work` uses one scoped `<style>` block.

Shared constellation code lives in `src/constellation/` (all pure, all tested):
- `draw.js` — `drawConstellation()`, the one star/edge/glow renderer (night sky, `/work` plates)
- `projects.js` — the four hand-laid project figures (TDK, Ovis, LLM, DropIn) + their sky placement
- `sky.js` — sky-space coordinates, blue-noise placement, planisphere lean, parting around the form
- `validate.js` — normalizes/rejects LLM-generated constellations (used by the Worker too)

Note that `window.scrollTo` inherits `scroll-behavior: smooth` from `index.css`; pass
`behavior: 'instant'` when you mean a jump.

`SlopeBackground` is a **class component** (uses `requestAnimationFrame` + refs; not hooks by design).
It renders:
1. Two full-viewport `position: fixed` canvases at `zIndex: 0`:
   - `canvasRef` — the **slope/sky/ski-run scene** (drawn in `loop`)
   - `graphCanvasRef` (`gctx`) — the **project constellations / motifs** overlay
2. A stack of scrollable `<section>`s at `zIndex: 1` holding the real DOM text (the copy). These are
   tall (`100vh`–`640vh`) with `position: sticky` inner copy, so scrolling **scrubs** each animation.
3. A fixed `<nav>` (desktop: run-line wayfinding dots + WORK + resume chip; mobile: WORK/SKY/CONTACT
   plus a descent gauge), a fixed HUD (`SPD` / `LIP·LZ·AIRBORNE` readout, bottom-left), and the
   fixed signature form for the night sky.

### The scroll narrative (section order = the "run")

Sections are identified by `data-screen-label`; JS finds them via `querySelector` in
`componentDidMount` and reads their scroll position each frame. Copy elements carry `data-reveal`
and are faded/translated by scroll proximity in `loop`. Order:

| Label          | Beat | Content |
|----------------|------|---------|
| `Drop in`      | hero | "ISAAC AU" title, scroll cue |
| `The approach` | 01   | **TDK** ML Intern — SensorFlow / evolutionary TinyML → *lineage-tree* graph |
| `The lip`      | 02   | **OVIS** Medical — Florence AI nurse → *plexus Dall-sheep companion* fetching Florence's orb |
| (60vh spacer)  | —    | lets the Ovis motif clear before the LLM copy arrives |
| `LLM research` | 03   | GUI-grounding code repair + LLM-judge data curation → *grounded-repair* reticle |
| `DropIn`       | 04   | Real-time IMU mocap → *low-poly plexus rider* ollie |
| `Takeoff`      | 05   | "All in" — deceleration hits, launch |
| `Airborne`     | —    | "Software that touches the physical world" → dusk turns to **night**, the four project constellations form, then the signature invite appears |
| `The landing`  | —    | spacer that triggers the hockey-stop / whiteout impact |
| `Landing page` | 06   | "Let's talk" contact block (email / GitHub / LinkedIn / resume) |

Section heights are load-bearing — they set how long each animation phase lasts. Changing a height
retimes the scrub. Don't reorder sections without re-checking the `progEl`/`scrubTall` gating in `loop`.

### The `loop` (rAF) — how the scene is timed

`loop(t)` runs every frame and is the heart of the file (search for `loop = (t) =>`):
- Smooths `window.scrollY / maxScroll` into `this.p`; tracks scroll velocity `this.scrollV`.
- `progEl(el)` → 0..1 progress of an element through viewport center; `this.sm.*` are smoothed copies.
- Derives phase weights with `smooth(a,b,x)` (smoothstep, defined at bottom of file): `lipT`,
  `straight`, `lift`, `stop`, `impact`, `fullWhite`, `descent`, `airSlow`, etc. These gate every draw.
- Integrates `this.dist` (a virtual downhill distance) from a `speed` term — the grooves, sparks,
  spray, and carve sway are all functions of `dist`, not wall-clock, so they respond to scroll.
- Draws (in order): sky gradient → ridges → slope → corduroy grooves → cross ripples → speed sparks
  → lip/kicker → side shading → spray → airborne flash → landing impact → vignette → text reveal →
  HUD → then calls the motif drawers: `drawGraph`, `drawOvis`, `drawLLM`, `drawDropIn`.

### Motifs (the "constellation grammar")

Each project has its own self-contained draw method + a block of module-level constants above the class:
- **`drawGraph` / `renderGraph` / `buildGraph`** — TDK's ordered *lineage tree* (`graphA`, dark-on-snow,
  right of "The approach"; config: seed, generations `G`, per-gen `counts`, `extra`, `jitter`; a
  "winner path" is highlighted toward center). `drawGraph` also draws the **night sky**: every record in
  `this.skyRecords` (project seeds + visitor constellations) through `drawConstellation`, plus the
  signature forming / gather-star animations.
- **`drawOvis`** (+ `OV_*` palette, `SH_*` consts, `shPoseSheep`/`shBuildMesh`/`shCam` helpers) — a
  plexus **Dall sheep** (`Ovis` is Latin for sheep) built in DropIn's wireframe-tube grammar. It carves
  one circular arc on the snow, lifts its head to fetch Florence's orb, and shows a check-in exchange
  as speech bubbles with care-category halos on its body. Structure is a pure function of scroll `u`;
  wall-clock drives only ambient life (breathing, ear flick, twinkle).
- **`drawLLM`** (+ `LG_*` consts) — a reticle walks a crooked GUI wireframe; each landing grounds an
  axis-aligned labeled detection bbox and the element snaps into it (the "grounded repair" story).
- **`drawDropIn`** (+ `DI_*` consts + `diBuildRider`/`diTransform`/`diMakeCam`) — a **from-scratch 3D
  engine**: a low-poly plexus snowboarder built from jittered wireframe tubes over a mocap skeleton,
  carves in, ollies center-frame, lands, exits. Keyframed pose curves (`DI_CROUCH`/`DI_PITCH`/`DI_ARMS`),
  perspective camera, edge-lean roll. This is the most complex block — the `di*` helpers are a tiny
  vec3 math lib.

### Layout helpers / gotchas

- **Two-line headlines are width-matched at runtime**: `syncTwoLineHeadline` measures a short line
  (e.g. "TDK") and a long line ("ML Intern") and scales the short one's font-size so they align. Runs
  on resize via `syncHeadlineWidth`. If you add a project headline, wire up matching refs.
- **DPR-aware canvases**, capped at 2× (`resize`). Both canvases resize together.
- **Mobile (`< MB_BP` = 768px)** runs every beat *concurrently*: copy pins in the top ~45% while the
  motif forms in the bottom band (`cGrow`, `exitFade`, `MB_CONCURRENT`). Section heights differ per
  breakpoint, so check both when retiming.
- **Determinism everywhere**: no `Math.random()` at runtime — seeded LCG tables (`this.rand`, and
  per-graph seeds) so the scene is stable across reloads. Keep it that way.
- Copy text (project blurbs, contact links, stats) lives inline in `render()`. Real content — e.g.
  Ovis link `app.ovismedical.com`, email `ayhisaac@gmail.com`, GitHub `@isaacau502`,
  LinkedIn `/in/isaacayh`, `/resume.pdf`.

## Conventions

- Match the existing style: module-level `UPPER_SNAKE` constant blocks per motif, terse single-letter
  math helpers within a motif's namespace prefix (`ov*`, `lg*`/`LG`, `di*`), inline React styles.
- New animated phases should be driven by a `smooth()`-gated weight off a section's `progEl`/`scrubTall`,
  not by wall-clock time, so they scrub with scroll.
- When adding/resizing sections, re-verify the phase transitions still line up (the trickiest coupling
  in the codebase).

## Not tracked / ignored

`dist/`, `node_modules/`, `.gstack/`, `contact-preview/`, and `coverage/` are git-ignored, as are the
parked 3D-world experiment's generated assets (`marble/`, `nightrun/`) and local tool caches
(`.agents/`, `.impeccable/`, `skills-lock.json`). See `.gitignore`.

The scroll-scrubbed video backdrop experiment (`VideoBackdrop.js`, blockout scripts,
`notes/world-art-direction.md`) is **parked** on branch `experiment/video-background` and is not on `main`.

## The shared sky — signature constellation ending (shipped)

The run's closing beat: visitors describe anything, and a genAI backend returns a constellation in the
site's JSON grammar (`{ name, stars:[{x,y,size}], edges:[[i,j]] }`) that joins a shared night sky.
Design rationale lives in `notes/constellation-signature-ending.md`; deferred ideas are in `TODOS.md`.

- **Worker** (`worker/index.js`) serves `dist/` and routes `/api/sign` (POST) and `/api/sky` (GET) to the
  Pages-style handlers in `functions/api/`.
- **`/api/sign` pipeline** (`functions/api/_lib/pipeline.js`, dependency-injected and fully tested). Order
  is load-bearing — every free check precedes the paid calls, all moderation precedes persistence:
  Turnstile → per-IP rate limit (KV window) → length/charset → keyword denylist (`denylist.js` +
  vendored `profanity-words.js`) → KV blocklist → monthly spend cap → LLM generate with a `safe` flag
  (`prompt.js`, one retry) → `validate.js` → resvg PNG render → vision moderation → KV persist.
- **Providers**: Anthropic (`anthropic.js`, Haiku by default) is live via `PROVIDER=anthropic`;
  Workers AI (`workersai.js`) is the free fallback. Secrets: `ANTHROPIC_API_KEY`, optional
  `TURNSTILE_SECRET` (set via `wrangler secret put`).
- **`/api/sky`** lists `constellation:*` records, edge-cached 5 min. The client merges the visitor's own
  signatures from `localStorage` until the server list catches up.
- **Degraded mode**: infra failures (spend cap, generation or moderation outage) fall back to a
  hash-seeded procedural figure client-side, shown but not persisted.
- **Known gap**: the form never sends a Turnstile token, so setting `TURNSTILE_SECRET` would reject
  every submission until the widget is wired in.
- `scripts/kill-constellation.sh` is the admin panel: it deletes a record, blocklists its description
  hash so identical resubmissions bounce, and purges the `/api/sky` edge cache.

## Design Context

Strategic design context lives in `PRODUCT.md` (read it before design work). In short:

- **Register:** brand — this is a portfolio; the design *is* the product. **Platform:** web.
- **Audience:** anyone evaluating Isaac as an engineer (recruiters, founders, peers). Craft is the universal hook.
- **Primary CTA:** email Isaac. **Secondary:** add a constellation to the shared sky.
- **Personality:** kinetic (the snowboard) + curious (the stars), on a base of exacting craft. Target feeling: exhilaration + technical awe.
- **Design principles:** show don't tell · the medium is the message · motion is meaning · determinism & precision · one constellation grammar.
- **Anti-references:** generic dev-portfolio template; corporate SaaS landing.
