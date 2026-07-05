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

// Occupancy-grid placement — mirror of the Worker's write-time algorithm.
// One FIXED grid for every record (a per-scale grid made placements collide:
// two calls disagreed about where cells were). Odd columns drop half a cell
// (checkerboard) so the filled sky scatters instead of reading as rows.
// occupied: [{x, y, scale}], scale: figure size in sky units (≤ GRID_CELL),
// rand: () => [0,1) (caller supplies determinism).
export const GRID_CELL = 0.105;
const LABEL_PAD = 0.024; // sky-units reserved under a figure for its caps label

export function placeInSky(occupied, scale, rand) {
  const cell = GRID_CELL;
  const cols = Math.max(1, Math.floor(SKY_W / cell));
  const rows = Math.max(1, Math.floor((SKY_H - cell * 0.5) / cell)); // half-cell kept for the stagger
  const colPhase = (c) => (c % 2 === 1 ? cell * 0.5 : 0);
  // a placement claims EVERY cell its footprint (figure + label) touches —
  // hand-placed seeds larger than one cell must block their whole area
  const taken = new Set();
  for (const p of occupied) {
    const c0 = Math.max(0, Math.floor(p.x / cell));
    const c1 = Math.min(cols - 1, Math.floor((p.x + p.scale) / cell));
    for (let c = c0; c <= c1; c++) {
      const r0 = Math.max(0, Math.floor((p.y - colPhase(c)) / cell));
      const r1 = Math.min(rows - 1, Math.floor((p.y + p.scale + LABEL_PAD - colPhase(c)) / cell));
      for (let r = r0; r <= r1; r++) taken.add(`${c}:${r}`);
    }
  }
  const free = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!taken.has(`${c}:${r}`)) free.push([c, r]);
    }
  }
  let c, r;
  if (free.length) {
    [c, r] = free[Math.floor(rand() * free.length)];
  } else {
    // crowded sky: allow adjacency, pick any cell (the sky may get dense)
    c = Math.floor(rand() * cols);
    r = Math.floor(rand() * rows);
  }
  // jitter bounded by the cell's spare room so neighbors can never touch
  const spare = Math.max(0, cell - scale - LABEL_PAD);
  const jitter = () => (rand() - 0.5) * spare;
  const x = Math.max(0, Math.min(SKY_W - scale, c * cell + (cell - scale) / 2 + jitter()));
  const y = Math.max(0, Math.min(SKY_H - scale, r * cell + colPhase(c) + (cell - scale - LABEL_PAD) / 2 + jitter()));
  return { x, y, scale };
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
