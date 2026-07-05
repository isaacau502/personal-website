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

export function placeInSky(occupied, scale, rand) {
  let best = null;
  let bestScore = -Infinity;
  for (let k = 0; k < CANDIDATES; k++) {
    if (bestScore > 1.3) break; // comfortable clear air found — stop sampling
    const x = rand() * (SKY_W - scale);
    const y = rand() * (SKY_H - scale - LABEL_PAD);
    let score = Infinity;
    for (const p of occupied) {
      const dx = (x + scale / 2) - (p.x + p.scale / 2);
      const dy = (y + (scale + LABEL_PAD) / 2) - (p.y + (p.scale + LABEL_PAD) / 2);
      // 1.0 ≈ footprints exactly touching; > 1 = clear air between them
      const reach = ((scale + p.scale) / 2 + LABEL_PAD) * 1.05;
      score = Math.min(score, Math.hypot(dx, dy) / reach);
    }
    if (score > bestScore) {
      bestScore = score;
      best = { x, y, scale };
    }
  }
  return best;
}

// Density-adaptive figure size: few constellations → big figures (the sky
// belongs to them); a filling sky shrinks everyone smoothly. Area budget:
// n footprints (figure + label) should cover ~55% of the sky.
export function adaptiveScale(n) {
  const s = Math.sqrt((SKY_W * SKY_H * 0.55) / Math.max(n, 6)) - LABEL_PAD;
  return Math.max(0.055, Math.min(0.14, s));
}

// Per-frame sky→screen mapping. Positions stretch per-axis to fill the
// viewport's sky region; `s` (min-axis) sizes the square figure panels.
export function skyToScreen(W, H, opts = {}) {
  const navPad = opts.navPad ?? Math.max(H * 0.055, 48);
  const bottom = opts.bottom ?? H * 0.94;
  const margin = W * 0.03;
  const Wu = W - margin * 2;
  const Hu = Math.max(120, bottom - navPad - 34); // 34 = label room under the lowest row
  const s = Math.min(Wu / SKY_W, Hu / SKY_H);
  return { ox: margin, oy: navPad, xs: Wu / SKY_W, ys: Hu / SKY_H, s };
}

// Panel (screen rect) for a placed record under a mapping.
export function skyPanel(place, m) {
  return {
    x0: m.ox + m.xs * place.x,
    y0: m.oy + m.ys * place.y,
    w: m.s * place.scale,
    h: m.s * place.scale,
  };
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
