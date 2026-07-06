# CLAUDE.md

Personal portfolio site for **Isaac Au** (Software / AI-ML engineer, CMU). A single-page,
scroll-driven canvas experience: the visitor "rides" a ski/snowboard run down a slope, and each
project beat is revealed as an animated constellation drawn on canvas as they scroll.

Live intent: `https://isaacau.com`. Built with Claude Code + Claude Design (designs originate from
the claude.ai/design "Carving slope animation" project, pulled in via DesignSync).

## Stack & commands

- **Vite 8 + React 19**, plain JS (no TypeScript), ESM. Linting via **oxlint** (`.oxlintrc.json`).
- `npm run dev` — Vite dev server (HMR)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built bundle
- `npm run lint` — oxlint
- Font: **Archivo Black** (Google Fonts, loaded in `index.html`); body copy uses a UI monospace stack
  (the `mono` constant in `SlopeBackground.jsx`).

## Architecture — read this before editing

**Effectively the entire site is one file: `src/SlopeBackground.jsx` (~1730 lines).**
`App.jsx` renders only `<SlopeBackground />`; `main.jsx` is the standard React root; `index.css` is
tiny (body reset, `scroll-behavior: smooth`, the `cueDrop` scroll-cue keyframe). There is no router,
no component library, no CSS framework — all styling is inline style objects.

`SlopeBackground` is a **class component** (uses `requestAnimationFrame` + refs; not hooks by design).
It renders:
1. Two full-viewport `position: fixed` canvases at `zIndex: 0`:
   - `canvasRef` — the **slope/sky/ski-run scene** (drawn in `loop`)
   - `graphCanvasRef` (`gctx`) — the **project constellations / motifs** overlay
2. A stack of scrollable `<section>`s at `zIndex: 1` holding the real DOM text (the copy). These are
   tall (`100vh`–`500vh`) with `position: sticky` inner copy, so scrolling **scrubs** each animation.
3. A fixed `<nav>` and a fixed HUD (`SPD` / `LIP·LZ·AIRBORNE` readout, bottom-left).

### The scroll narrative (section order = the "run")

Sections are identified by `data-screen-label`; JS finds them via `querySelector` in
`componentDidMount` and reads their scroll position each frame. Copy elements carry `data-reveal`
and are faded/translated by scroll proximity in `loop`. Order:

| Label          | Beat | Content |
|----------------|------|---------|
| `Drop in`      | hero | "ISAAC AU" title, scroll cue |
| `The approach` | 01   | **TDK** ML Intern — SensorFlow / evolutionary TinyML → *lineage-tree* graph |
| `The lip`      | 02   | **OVIS** Medical — Florence AI nurse → *patient-constellation* + wellness dial |
| `LLM research` | 03   | GUI-grounding code repair + LLM-judge data curation → *grounded-repair* reticle |
| `DropIn`       | 04   | Real-time IMU mocap → *low-poly plexus rider* ollie |
| `Takeoff`      | 05   | "Send it" — deceleration hits, launch |
| `Airborne`     | —    | "35% Lighter" crash-detection result → *sky constellation* |
| `The landing`  | —    | spacer that triggers the hockey-stop / whiteout impact |
| `Landing page` | 06   | "Let's talk" contact block (email / GitHub / LinkedIn / resume) |

Section heights are load-bearing — they set how long each animation phase lasts. Changing a height
retimes the scrub. Don't reorder sections without re-checking the `progEl`/`scrubTall` gating in `loop`.

### The `loop` (rAF) — how the scene is timed

`loop(t)` runs every frame and is the heart of the file (~lines 421–698):
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
- **`drawGraph` / `renderGraph` / `buildGraph`** — deterministic aesthetic graphs. TDK = ordered
  *lineage tree* (`graphA`, dark-on-snow, right of "The approach"). Airborne = wide *sky constellation*
  (`graphSky`, light-on-sky). Config: seed, generations `G`, per-gen `counts`, `extra` cross-links,
  `jitter`. A "winner path" is highlighted toward center.
- **`drawOvis`** (+ `OV_*` consts) — a body-shaped *patient constellation*: nodes/edges of a skeleton,
  care-category satellites, an AI "check-in conversation" animation (`this.ovisEng`) emitting outcome
  readings, and a 270° wellness dial. Every 4th reading escalates (`OV_ALERT`).
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

`dist/`, `node_modules/`, `.gstack/`, and `contact-preview/` are git-ignored (see `.gitignore`).

## In active development — the signature constellation ending

The site's closing beat: visitors describe anything and a genAI backend returns a constellation in the
site's JSON grammar (`{ name, stars:[{x,y,size}], edges:[[i,j]] }`), joining a shared night sky —
retroactively justifying the whole constellation motif. Design/plan lives in
`notes/constellation-signature-ending.md`; **read it before working on this feature**.

Status: **active dev, no feature code has landed yet** (nothing in `src/`, no backend). Build order per
the note: (1) prompt experiment — verify generated layouts render well in the existing star/edge canvas
vocabulary *before* writing infra; (2) Cloudflare Worker + Turnstile + per-IP rate limit + hard spend
cap; (3) KV/D1 persistence + a `safe` moderation flag from the same LLM call; (4) wire the form and
render into `SlopeBackground`'s night-sky section. A zero-server procedural fallback (hash desc → seed)
is the degraded mode when the budget cap or rate limit trips. Can't ship an API key in a static Vite
site — the backend is the one hard requirement.
