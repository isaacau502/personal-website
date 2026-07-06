// Sky-space: the shared sky's coordinate system and placement rules.
// Every constellation record carries a persistent {x, y, scale} in a FIXED
// virtual sky (SKY_W × SKY_H, x/y = figure top-left in sky units). The
// Worker will import placeInSky() for write-time placement; the client maps
// sky→screen per frame. Positions stretch with the viewport; figures never
// distort (their panels stay square via the uniform `s`).
//
//   sky-space (fixed, persistent)          screen (any viewport)
//   ┌──────────────────────────┐           ┌────────────────────────────────┐
//   │ □p1        □p2      □p3  │  x: ·Wu   │  □p1        □p2          □p3   │
//   │      □v1        □v2      │ ────────▶ │       □v1            □v2       │
//   │ □v3   [form zone]  □v4   │  y: ·Hu   │  □v3   (sky parts here)  □v4   │
//   └──────────────────────────┘           └────────────────────────────────┘
//    positions scale per-axis; panel size = min-axis scale → no distortion

export const SKY_W = 1;
export const SKY_H = 0.6;

// Best-candidate (blue-noise) placement — mirror of the Worker's write-time
// algorithm. Try K random spots, keep the one with the largest clearance
// from every existing figure (clearance normalized by combined footprints,
// labels included). Maximizing minimum distance IS even spreading; density
// degrades smoothly instead of falling off a grid-capacity cliff.
// occupied: [{x, y, scale}], scale: figure size in sky units,
// rand: () => [0,1) (caller supplies determinism).
const LABEL_PAD = 0.024; // sky-units reserved under a figure for its caps label
const CANDIDATES = 64;

// The celestial pole: the sky is the visible top slice of a huge circle
// whose center sits far below the page. Figures arrange in the annulus band
// [R_IN, R_OUT] around it — R_OUT rounds off the top corners, R_IN scoops
// the bottom-center (where the invite lives). True circle geometry, no
// drawn border; the dome reads from placement + lean alone.
export const POLE = { x: SKY_W / 2, y: 1.7 };
const R_IN = 1.18;
const R_OUT = 1.7;

export function placeInSky(occupied, scale, rand) {
  const clearance = (x, y) => {
    let score = Infinity;
    for (const p of occupied) {
      const dx = (x + scale / 2) - (p.x + p.scale / 2);
      const dy = (y + (scale + LABEL_PAD) / 2) - (p.y + (p.scale + LABEL_PAD) / 2);
      // 1.0 ≈ footprints exactly touching; > 1 = clear air between them
      const reach = ((scale + p.scale) / 2 + LABEL_PAD) * 1.05;
      score = Math.min(score, Math.hypot(dx, dy) / reach);
    }
    return score;
  };
  let best = null;
  let bestScore = -Infinity;
  // evaluate CANDIDATES in-band spots; rejected samples don't count against
  // the budget (attempt cap keeps a degenerate rand from spinning forever)
  for (let k = 0, attempts = 0; k < CANDIDATES && attempts < CANDIDATES * 4; attempts++) {
    if (bestScore > 1.3) break; // comfortable clear air found — stop sampling
    const x = rand() * (SKY_W - scale);
    const y = rand() * (SKY_H - scale - LABEL_PAD);
    // dome band check: the figure's center must sit within the annulus
    const rr = Math.hypot(x + scale / 2 - POLE.x, y + (scale + LABEL_PAD) / 2 - POLE.y);
    const f = (scale + LABEL_PAD) / 2;
    if (rr < R_IN + f * 0.5 || rr > R_OUT - f * 0.5) continue;
    k++;
    const score = clearance(x, y);
    if (score > bestScore) {
      bestScore = score;
      best = { x, y, scale };
    }
  }
  if (best) return best;
  // degenerate fallback (should not happen with a sane rand): place ignoring
  // the band rather than ever returning null
  for (let k = 0; k < CANDIDATES; k++) {
    const x = rand() * (SKY_W - scale);
    const y = rand() * (SKY_H - scale - LABEL_PAD);
    const score = clearance(x, y);
    if (score > bestScore) {
      bestScore = score;
      best = { x, y, scale };
    }
  }
  return best;
}

// Density-adaptive figure size: few constellations → big figures (the sky
// belongs to them); a filling sky shrinks everyone smoothly. Area budget:
// n footprints (figure + label) should cover ~55% of the dome band
// (~0.85 of the rect after the corner rounding and bottom-center scoop).
export function adaptiveScale(n) {
  const s = Math.sqrt((SKY_W * SKY_H * 0.85 * 0.55) / Math.max(n, 6)) - LABEL_PAD;
  return Math.max(0.055, Math.min(0.14, s));
}

// Planisphere lean: a figure's rotation about its own center so its "up"
// points away from the celestial pole below the page — everything on the
// dome tips toward the distant center, labels ride the arcs. With the pole
// this far down the natural angles stay ±20°ish, so no damping is needed
// (K=1 = true chart geometry) and every figure stays fully legible.
export const LEAN = 1;
export function skyLean(place, k = LEAN) {
  const dx = place.x + place.scale / 2 - POLE.x;
  const dy = POLE.y - (place.y + place.scale / 2);
  return Math.atan2(dx, dy) * k; // 0 = directly above the pole
}

// Portrait: min-axis (width) starves panel size — grow toward the tall axis.
const PORTRAIT_S = 1.45;

// Per-frame sky→screen mapping. Positions stretch per-axis to fill the
// viewport's sky region; `s` (min-axis) sizes the square figure panels.
export function skyToScreen(W, H, opts = {}) {
  const navPad = opts.navPad ?? Math.max(H * 0.055, 48);
  const bottom = opts.bottom ?? H * 0.94;
  const margin = W * 0.03;
  const Wu = W - margin * 2;
  const Hu = Math.max(120, bottom - navPad - 34); // 34 = label room under the lowest row
  let s = Math.min(Wu / SKY_W, Hu / SKY_H);
  let ax = 0; // panel anchor: 0 = top-left (classic)
  if (H > W) { s = Math.min(s * PORTRAIT_S, Hu / SKY_H); ax = 0.5; } // portrait: bigger panels, centered on the stretched footprint
  return { ox: margin, oy: navPad, xs: Wu / SKY_W, ys: Hu / SKY_H, s, ax };
}

// Panel (screen rect) for a placed record under a mapping. Anchored at the
// footprint's top-left classically; centered on it when the mapping sets `ax`
// (portrait, where s outgrows xs and a top-left anchor would spill the edge).
export function skyPanel(place, m) {
  const a = (m.ax || 0) * place.scale;
  return {
    x0: m.ox + m.xs * (place.x + a) - m.s * a,
    y0: m.oy + m.ys * (place.y + a) - m.s * a,
    w: m.s * place.scale,
    h: m.s * place.scale,
  };
}

// Overlap cap: one cheap relaxation pass over the rendered panels. Parting
// (or a crowded sky) can squeeze two figures into the same spot — this
// pushes any pair apart until their overlap is at most maxOverlapFrac of
// their combined radius. Mutates panels in place; order-stable.
export function separatePanels(panels, maxOverlapFrac = 0.15, iterations = 2) {
  for (let it = 0; it < iterations; it++) {
    for (let a = 0; a < panels.length; a++) {
      for (let b = a + 1; b < panels.length; b++) {
        const A = panels[a], B = panels[b];
        const ra = A.w * 0.5, rb = B.w * 0.5;
        const ax = A.x0 + ra, ay = A.y0 + A.h * 0.5;
        const bx = B.x0 + rb, by = B.y0 + B.h * 0.5;
        let dx = bx - ax, dy = by - ay;
        let d = Math.hypot(dx, dy);
        const minD = (ra + rb) * (1 - maxOverlapFrac);
        if (d >= minD) continue;
        if (d < 1e-3) { dx = 1; dy = 0; d = 1; }
        const push = (minD - d) / 2;
        A.x0 -= (dx / d) * push;
        A.y0 -= (dy / d) * push;
        B.x0 += (dx / d) * push;
        B.y0 += (dy / d) * push;
      }
    }
  }
  return panels;
}

// The sky parts for the invite: figures near a reserved screen rect glide
// outward along an elliptical falloff. Returns {dx, dy} for a panel; t is
// the parting strength 0..1 (the form's visibility). Pure & reversible —
// scrubbing back closes the sky again.
export function partingOffset(panel, rect, t) {
  if (t <= 0.001) return { dx: 0, dy: 0 };
  const cx = panel.x0 + panel.w / 2;
  const cy = panel.y0 + panel.h / 2;
  const fx = (rect.x0 + rect.x1) / 2;
  const fy = (rect.y0 + rect.y1) / 2;
  // elliptical distance: 1.0 at the rect's edge (plus the figure's own radius)
  const rx = (rect.x1 - rect.x0) / 2 + panel.w / 2;
  const ry = (rect.y1 - rect.y0) / 2 + panel.h / 2;
  const ex = (cx - fx) / rx;
  const ey = (cy - fy) / ry;
  const d = Math.hypot(ex, ey);
  const REACH = 1.75; // falloff extends beyond the rect so the parting reads as a field
  if (d >= REACH) return { dx: 0, dy: 0 };
  const need = (REACH - d) / REACH; // 1 at dead center → pushed fully clear
  const len = Math.hypot(ex * rx, ey * ry) || 1;
  const ux = d < 0.001 ? 0 : (ex * rx) / len;
  const uy = d < 0.001 ? -1 : (ey * ry) / len; // dead-center figures lift upward
  const ease = need * need * (3 - 2 * need);
  return { dx: ux * rx * 1.15 * ease * t, dy: uy * ry * 1.15 * ease * t };
}
