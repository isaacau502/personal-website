---
name: Isaac Au — Portfolio
description: A scroll-driven alpine night run where every project surfaces as a constellation.
colors:
  ink: "#17222f"
  carve-blue: "#28569e"
  muted-ink: "#4a5c72"
  slate-edge: "#33455c"
  snow: "#f7f9fc"
  snow-mid: "#eef2f7"
  snow-shadow: "#dfe6ef"
  snow-text: "#f4f8fd"
  sky-day: "#6ea6e0"
  sky-day-high: "#dcebf8"
  sky-dusk: "#8fb3d9"
  sky-dusk-mid: "#c9d6e2"
  dusk-warm: "#f2dcc2"
  cta-groove: "#9fb6d0"
  cta-groove-lit: "#cfe0f2"
  sun: "#ffd6a0"
  sun-deep: "#9a5b12"
  night: "#060c1e"
  night-mid: "#0a142c"
  night-high: "#14223e"
  alert: "#b8452e"
typography:
  display:
    fontFamily: "'Archivo Black', system-ui, sans-serif"
    fontSize: "clamp(44px, 13vw, 200px)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Archivo Black', system-ui, sans-serif"
    fontSize: "clamp(40px, 6vw, 88px)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Archivo Black', system-ui, sans-serif"
    fontSize: "clamp(28px, 4.2vw, 56px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "normal"
  body:
    fontFamily: "ui-monospace, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "ui-monospace, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.3em"
rounded:
  none: "0"
  full: "50%"
spacing:
  sm: "8px"
  md: "20px"
  lg: "28px"
components:
  cta-ghost:
    textColor: "{colors.carve-blue}"
    padding: "12px 20px"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
  cta-ghost-hover:
    backgroundColor: "{colors.carve-blue}"
    textColor: "{colors.snow-text}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    padding: "16px 28px"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
  button-ghost:
    textColor: "{colors.ink}"
    padding: "16px 28px"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
  sig-input:
    backgroundColor: "transparent"
    textColor: "#f2f6fb"
    padding: "10px 2px"
    rounded: "{rounded.none}"
---

# Design System: Isaac Au — Portfolio

## 1. Overview

**Creative North Star: "The Night Run"**

The whole site is a single ride from daylight into a star field. The visitor drops in under a pale alpine sky, carves down a corduroy slope while four career beats surface beside them, launches off a lip into an airborne whiteout, and lands under a deep-navy night sky where the projects have become constellations — and where they can add one of their own. The palette *travels* with that journey (day → dusk → night); it is not one static scheme but a timed transition scrubbed by scroll. This is kinetic and curious made literal: momentum pulling you downhill, and each beat opening into something to look closer at.

The system rejects the two things this is explicitly not (per PRODUCT.md): the **generic dev-portfolio template** (card grid, skills bars, résumé timeline) and the **corporate SaaS landing page** (gradient hero, feature-icon triplets, rounded-everything). There are no cards in the run; the `/work` reference page (§6) is the one card-shaped surface on the site, and it earns it. There is no rounded chrome anywhere. Nothing is stated in a bullet that could instead be *demonstrated* on the canvas. The design IS the proof of ability, so the interface reads like a precision instrument — HUD telemetry, hairline geometry, deterministic drawing — rather than a marketing surface.

Chrome is deliberately spare and hard-edged so the full-viewport canvas carries the experience. Type does the shouting (Archivo Black at display scale); everything else is quiet monospace telemetry.

**Key Characteristics:**
- A palette that transitions day→dusk→night across the scroll, not a fixed scheme.
- Zero border-radius on everything except true circles. Sharp is the house style.
- Two-family type: a heavy display face shouting, a monospace whispering.
- Flat by default — depth comes from atmosphere (gradients, glow, vignette, blur), never cast shadows.
- One constellation grammar (`{ name, stars, edges }`, the `src/constellation/` module) shared by every project and the visitor's own live contribution.
- Two registers, one voice: the cinematic run at `/`, the plain spec sheet at `/work` (§6).

## 2. Colors

A cool alpine base — snow-whites and slate-inks — that warms at dusk and deepens to navy at night, with a single confident blue doing all the wayfinding.

### Primary
- **Carve Blue** (#28569e): The one voice. Named for the snowboard arc. It drives every interactive affordance — CTA outlines and hover fills, the nav "you-are-here" dot, the run-line current stop, the mobile descent gauge, focus rings. It never appears as decoration; if it's Carve Blue, it's telling you where you are or what to do.

### Secondary
- **Slate Ink** (#17222f): The dominant text color on snow, the wordmark, and the fill of the dark contact panel at the base of the run. The structural "ink" of the whole scene.
- **Muted Ink** (#4a5c72): Nav connector lines, separators, secondary telemetry. Slate Ink dropped a register.

### Tertiary
- **Sun** (#ffd6a0) / **Sun Deep** (#9a5b12): The dusk warmth. Used sparingly — the sinking-sun glow, the input caret (`rgba(255,214,160,.95)`), the one warm note in an otherwise cool world. Warmth is an accent, never the body.
- **Alert** (#b8452e): Reserved exclusively for the HUD landing-zone warning (LZ close). Danger only; never a brand color.

### Neutral
- **Snow** (#f7f9fc) → **Snow Mid** (#eef2f7) → **Snow Shadow** (#dfe6ef): The slope surface gradient, brightest at the fall line. The default light "background."
- **Snow Text** (#f4f8fd, also #eef3f9 / #f2f6fb): Light copy over the dark contact panel and night sky.
- **Sky Dusk** (#8fb3d9) → **Sky Dusk Mid** (#c9d6e2) → **Dusk Warm** (#f2dcc2): The *default* sky gradient — `skyMode: 'dusk'` is what ships. **Sky Day** (#6ea6e0) → **Sky Day High** (#dcebf8) is the alternate `bluebird` mode.
- **Night** (#060c1e) → **Night Mid** (#0a142c) → **Night High** (#14223e): The deep-navy night sky the run ends under; the canvas for the constellations.

### Named Rules
**The Traveling-Palette Rule.** Color is a function of scroll position, not a fixed theme. Sky and slope interpolate day→dusk→night as the visitor descends. Never hard-code a "background color"; sample the phase.

**The One Voice Rule.** In the run, Carve Blue is the *only* accent with a job. It marks position and action and nothing else. Sun-warm and Alert are situational (dusk glow, danger); they are never promoted to general-purpose accents. (`/work` runs its own status-coded accents instead — see §6.)

**The Care-Category Palette.** The Ovis beat's Dall-sheep companion carries six desaturated care-category hues (heart `#bc5c52`, lung `#549094`, meds `#c68a46`, sleep `#8676b2`, move `#6a9666`, hydro `#5882be` — the `OV_CATS` rgb triplets), rendered as body-anchored halos and orbiting satellites on the sheep. Five sites are placed today; hydro is reserved. This is a closed, motif-specific set — do not reuse it as a general palette.

## 3. Typography

**Display Font:** Archivo Black (with system-ui / sans-serif fallback), loaded from Google Fonts.
**Body / Label Font:** UI monospace stack (`ui-monospace, Menlo, monospace`) — the `mono` constant.

**Character:** Maximum contrast pairing — a single ultra-heavy display weight against a plain monospace. The Archivo Black headlines are loud, tight, and uppercase; the mono is small, wide-tracked, and instrument-like. No mid-weights, no third family. The tension between "shout" and "telemetry" is the whole voice.

### Hierarchy
- **Display** (Archivo Black, line-height 0.9, tracking -0.02em, UPPERCASE): The fold-filling register. The "ISAAC AU" hero is the reference spec at `clamp(44px, 13vw, 200px)`; the other display moments tune the same register per beat ("ALL IN" `clamp(56px, 11vw, 170px)`, "LET'S TALK" `clamp(40px, 12vw, 150px)`).
- **Headline** (Archivo Black, `clamp(40px, 6vw, 88px)`, line-height 0.9, UPPERCASE): Per-beat two-line headlines (e.g. "ML / INTERN"), width-matched at runtime by `syncTwoLineHeadline`.
- **Title** (Archivo Black, `clamp(28px, 4.2vw, 56px)`, line-height 1.05, UPPERCASE): Sub-headlines and the "software that touches the physical world" register.
- **Body** (mono, 13–14px, line-height ~1.6): Project blurbs and stat copy. Terse by design.
- **Label** (mono, 10–12px, tracking 0.2em–0.4em, UPPERCASE): HUD readouts (SPD / LZ / AIRBORNE), nav labels, CTA text, stat captions. The site's connective tissue.

### Named Rules
**The Two-Voice Rule.** Exactly two families: Archivo Black for anything that shouts, monospace for everything else. Never introduce a third face or a mid-weight sans; the contrast between the two IS the system.

**The Width-Matched Headline Rule.** Two-line beat headlines are measured and scaled at runtime so both lines share an edge (`syncTwoLineHeadline`). A new project headline must wire up matching refs or it will break alignment.

**The Wide-Track Label Rule.** Monospace labels always carry 0.2em+ letter-spacing and uppercase. Tight-tracked mono is off-system.

## 4. Elevation

Flat by default. There are no drop shadows anywhere in the scene chrome. Depth is entirely **atmospheric**: sky and slope gradients, a corner vignette (`rgba(20,30,45,·)`), radial glow sprites behind stars, motion blur on speed, and the whiteout flash at the lip. The one exception is interactive feedback — the Carve Blue focus glow on run-line stops (`box-shadow: 0 0 0 3px color-mix(...)`), which is a *state signal*, not decoration.

### Named Rules
**The Atmospheric-Depth Rule.** Convey depth with light, fog, gradient, and blur — never a cast `box-shadow` on a surface. If a panel looks like it's floating on a drop shadow, it's off-system.

**The Glow-Is-State Rule.** The only allowed `box-shadow` is a focus/hover glow in Carve Blue on interactive controls. It means "this is live/focused," nothing else.

## 5. Components

### Buttons
- **Shape:** Sharp. Zero radius (0px) on every button. No exceptions but true circles.
- **Ghost CTA (`.beat-cta`) — the signature:** 2px Carve Blue outline, transparent fill, mono uppercase label tracked 0.2em. On hover the fill "carves" in (background → Carve Blue, text → `#eef3f9`), a short run of corduroy grooves (`‖‖‖`, `#9fb6d0` brightening to `#cfe0f2` over the fill) grows behind the label, and the arrow slides 4px ahead — a beat-staggered transition (`0.12s` delay on fill). This is the project-beat CTA (TRY THE APP / READ THE PAPER / SEE THE CODE).
- **Primary (EMAIL):** Solid Slate Ink (#17222f) fill, white text, `16px 28px` padding, mono tracked 0.2em. The one filled button; it marks the primary conversion.
- **Ghost (RESUME):** 2px Slate Ink outline, ink text, same padding. The fallback next to EMAIL.

### Inputs / Fields
- **Signature input (`.sig-input`):** For the constellation-naming ending. No box — a single hairline `border-bottom` (`rgba(201,214,226,.35)`), transparent background, centered 20px mono, light text over the night sky.
- **Focus:** The underline shifts to Sun-warm (`rgba(255,214,160,.9)`) and the caret is Sun. No outline box.

### Navigation
- **Wordmark:** Quiet signage in nav ink, not a link.
- **Run-line (desktop):** A row of hairline segments and 9px circular stops — a literal descent gauge. Stops read `done` (filled ink), `here` (Carve Blue fill + glow), or `ahead` (hollow). Doubles as "where am I on the mountain." Labels ride below, revealed on hover / for the current stop.
- **Descent gauge (mobile):** A 2px Carve Blue `scaleX` bar under the scrim.
- **Nav ink adapts** via CSS variables (`--nav-ink`, `--nav-line`, `--nav-accent`) so the chrome stays legible as the background travels from snow to night sky.
- **Resume chip:** The `.beat-cta` grammar shrunk to nav size (1.5px Carve Blue outline, fill on hover).

### Signature Component — the Constellation Canvas
The entire raison d'être. Every project is a deterministic star-and-edge figure drawn in the shared grammar `{ name, stars:[{x,y,size}], edges:[[i,j]] }` — a lineage tree (TDK), a woolly Dall-sheep companion carving an arc (Ovis), a grounded-repair reticle (LLM), a 3D plexus rider (DropIn). The grammar is a real module, not just a convention: `src/constellation/` holds the project figures (`projects.js`), the shared drawing vocabulary (`draw.js`), the sky layout engine (`sky.js`), and schema validation (`validate.js`), all under test.

The signature ending is **live**: the visitor types a description into the sig-input, an LLM (via `/api/sign`) returns a figure in the same grammar, and it joins the persistent shared sky served by `/api/sky`. While the LLM works, stars gather in the clearing as instant feedback (hash-seeded from the input, so even the wait is deterministic); if the backend is capped or down, the same hash seeds a zero-server procedural figure. No runtime randomness anywhere: seeded LCG tables keep every frame reproducible.

## 6. The `/work` Register

The run at `/` is the brand experience; `/work` is its plain-register companion — a glanceable spec-tile index of shipped and in-progress work for the visitor who needs facts faster than a ride. Its own source describes it best: "deliberately plain (no ski language beyond the one sky callback)." It is a second *treatment*, not a second brand.

**What carries over (the voice):**
- The two type families — Archivo Black (`.disp`) for the masthead and project names, tracked mono for everything else — plus tabular numerals.
- Sharp corners, hairline 1px rules, flat surfaces.
- Determinism: the ambient star-field canvas is seeded (`20260707`), like everything in the run.
- A sky callback: the star field, and the closing "shared sky" appendix that routes back to `/#sky`.
- `prefers-reduced-motion` fallbacks.

**What is deliberately different (the treatment):**
- **OS-theme-aware, not scroll-traveling.** Light mode is a daylight spec sheet, dark mode a night instrument panel, via CSS variables (`--bg/--ink/--dim/--faint/--accent/--live/--ship/--rule/--tick`) that respond to `prefers-color-scheme` and a `data-theme` override.
- **Its own accent trio**, statused rather than wayfinding: accent `#1f4f96` (light) / `#5fb0e8` (dark) for research + links, live `#9a5b12` / `#ffcf99` for in-progress, shipped `#2f7d63` / `#6fd0a8`. Carve Blue's One Voice Rule applies to the run, not here — `/work`'s colors encode *status*.
- **Spec tiles are the affordance.** 1px-rule bordered tiles on a translucent panel, a Carve-cornered hover tick (15px corner bracket in accent), status dots, and a stack/links footer per tile. This is the site's sole sanctioned card surface: the page's job is scan speed, and the tile is the honest tool for it.
- One micro-animation: the AVAILABLE pulse (`wkpulse`), disabled under reduced motion.

**Rule of thumb: `/work` shares voice, not treatment.** Don't import run chrome (Carve Blue wayfinding, atmospheric depth, the traveling palette) into `/work`; don't let `/work`'s tiles, status dots, or theme variables leak into the run.

## 7. Do's and Don'ts

### Do:
- **Do** keep every corner sharp (0px radius); reserve `border-radius: 50%` for true circles (nav dots, satellites) only.
- **Do** drive new animated phases off a `smooth()`-gated weight from a section's scroll progress, never wall-clock — everything must scrub with scroll.
- **Do** use Carve Blue (#28569e) exclusively for position + action. If it's not wayfinding or a CTA, pick ink or muted-ink.
- **Do** convey depth atmospherically (gradient, glow, vignette, blur); the only allowed `box-shadow` is a Carve Blue focus/hover glow.
- **Do** keep type to the two families — Archivo Black shouts, monospace (0.2em+ tracked, uppercase for labels) whispers.
- **Do** keep the scene deterministic — seeded tables, no `Math.random()` at runtime.

### Don't:
- **Don't** build a generic dev-portfolio template: no project card grid, no skills bars, no résumé-timeline, no "Hi, I'm Isaac." (PRODUCT.md anti-reference.)
- **Don't** drift toward a corporate SaaS landing page: no gradient hero-with-CTA, no feature-icon triplets, no "trusted by" logo wall, no rounded-everything. (PRODUCT.md anti-reference.)
- **Don't** use cards anywhere in the run at `/`. The `/work` spec tiles (§6) are the site's sole sanctioned exception, and nested cards are always wrong everywhere.
- **Don't** add a third font family or a mid-weight sans; the two-voice contrast is the system.
- **Don't** cast a drop shadow on a surface to fake elevation — that reads as a 2014 app and is off-system here.
- **Don't** hard-code a background color in the run; sample the traveling day→dusk→night palette at the current scroll phase. (`/work` instead themes off its OS-aware CSS variables, §6.)
- **Don't** promote Sun-warm or Alert-red to general accents; they are situational (dusk glow, danger) only.
