// Shared constellation renderer — the site's light-on-sky star/edge/glow
// vocabulary as a pure function. Additive extraction (eng review D6): built
// from the motifs' vocabulary in SlopeBackground.jsx (renderGraph's
// dark:false palette); the existing TDK/Ovis/LLM beats keep their own code.
//
// Consumers: the night-sky beat (thin adapter in SlopeBackground), the
// prompt playground, and tests. No React, no DOM lookups, no class state —
// caller passes a 2d context and a panel.

export const SKY_PALETTE = {
  star: '206,222,244',   // star fill (pale ice)
  glow: '150,180,220',   // radial glow around stars
  edge: '176,196,224',   // hairline figure edges
  label: '201,214,226',  // monospace caps beneath the figure
  amber: '255,214,160',  // dusk amber — the newest star (matches the sun gradient)
};

// Pre-rendered glow sprites — creating a radial gradient per star per frame
// is the sky's hottest path once the shared sky fills up (the cost grows with
// every visitor signature). One cached sprite per glow color, drawn scaled
// under globalAlpha, replaces gradient-create+fill per star. Falls back to
// live gradients where no canvas factory exists (node tests).
const GLOW_R = 64;
const glowSprites = new Map();
// soft=true is the atmosphere halo (mid-stop falloff); soft=false is the
// plain two-stop glow renderGraph's nodes use.
export function glowSprite(color, soft = true) {
  const key = color + (soft ? '|s' : '|p');
  if (glowSprites.has(key)) return glowSprites.get(key);
  let cv = null;
  if (typeof OffscreenCanvas !== 'undefined') {
    cv = new OffscreenCanvas(GLOW_R * 2, GLOW_R * 2);
  } else if (typeof document !== 'undefined') {
    cv = document.createElement('canvas');
    cv.width = cv.height = GLOW_R * 2;
  }
  if (cv) {
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(GLOW_R, GLOW_R, 0, GLOW_R, GLOW_R, GLOW_R);
    g.addColorStop(0, `rgba(${color},1)`);
    if (soft) g.addColorStop(0.32, `rgba(${color},0.45)`);
    g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, GLOW_R * 2, GLOW_R * 2);
  }
  glowSprites.set(key, cv);
  return cv;
}

// stars: [{id, x, y, size}] unit coords · edges: [[idA, idB]]
// panel: {x0, y0, w, h} sky-space rect the unit grid maps into
// opts: t (seconds, twinkle) · alpha (0..1) · grow (0..1 draw-on reveal)
//       newestId (drawn amber) · label (string) · palette (SKY_PALETTE override)
//       rot (radians — planisphere lean: figure + label rotate about the
//       panel center, like constellations around a star chart's pole)
export function drawConstellation(ctx, stars, edges, panel, opts = {}) {
  const {
    t = 0,
    alpha = 1,
    grow = 1,
    newestId = null,
    label = null,
    labelAlpha = 0.75,
    palette = SKY_PALETTE,
    rot = 0,
  } = opts;
  if (alpha <= 0.002 || !stars.length) return;
  const rotated = Math.abs(rot) > 0.001;
  if (rotated) {
    ctx.save();
    ctx.translate(panel.x0 + panel.w / 2, panel.y0 + panel.h / 2);
    ctx.rotate(rot);
    ctx.translate(-(panel.x0 + panel.w / 2), -(panel.y0 + panel.h / 2));
  }

  const byId = new Map(stars.map((s) => [s.id, s]));
  const X = (s) => panel.x0 + s.x * panel.w;
  const Y = (s) => panel.y0 + s.y * panel.h;
  // per-element reveal stagger: edge k draws in [k/(n+1), k/(n+1)+0.18] of grow
  const stagger = (k, n) => smooth(k / (n + 1), k / (n + 1) + 0.18, grow);

  // edges — hairline, draw-on from a toward b
  for (let k = 0; k < edges.length; k++) {
    const a = byId.get(edges[k][0]);
    const b = byId.get(edges[k][1]);
    if (!a || !b) continue;
    const er = stagger(k, edges.length);
    if (er <= 0.002) continue;
    const ax = X(a), ay = Y(a);
    const ex = ax + (X(b) - ax) * er, ey = ay + (Y(b) - ay) * er;
    ctx.strokeStyle = `rgba(${palette.edge},${(alpha * 0.5 * er).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // stars — glow underlay + twinkling core; the newest star is dusk amber.
  // Twinkle is radius AND brightness, per-star frequency/phase, so the sky
  // visibly shimmers instead of breathing in lockstep.
  const baseR = Math.min(panel.w, panel.h) * 0.018;
  for (let k = 0; k < stars.length; k++) {
    const s = stars[k];
    const cr = stagger(k, stars.length);
    if (cr <= 0.002) continue;
    const x = X(s), y = Y(s);
    const newest = s.id === newestId;
    const tw = 1 + Math.sin(t * (2.3 + s.x * 1.6) + s.y * 20 + k * 2.1) * 0.16;
    const twA = 0.68 + 0.32 * Math.sin(t * (3.1 + s.y * 2.2) + s.x * 31 + k * 1.7);
    const rad = baseR * (0.5 + s.size * 0.75) * cr * tw;
    const glowCol = newest ? palette.amber : palette.glow;
    // muted gradient halo — wide and soft, with a mid-stop so the falloff
    // reads as an atmosphere around the star, breathing with the twinkle
    const glowR = rad * (newest ? 5.6 : 4.8) * (0.85 + 0.15 * twA);
    const glowA = (newest ? 0.30 : 0.20) * alpha * cr * (0.65 + 0.35 * twA);
    const spr = glowSprite(glowCol);
    if (spr) {
      ctx.globalAlpha = glowA;
      ctx.drawImage(spr, x - glowR, y - glowR, glowR * 2, glowR * 2);
      ctx.globalAlpha = 1;
    } else {
      const gl = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      gl.addColorStop(0, `rgba(${glowCol},${glowA.toFixed(3)})`);
      gl.addColorStop(0.32, `rgba(${glowCol},${(glowA * 0.45).toFixed(3)})`);
      gl.addColorStop(1, `rgba(${glowCol},0)`);
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = newest
      ? `rgba(${palette.amber},${(0.95 * alpha * cr).toFixed(3)})`
      : `rgba(${palette.star},${(alpha * (0.55 + 0.3 * s.size) * cr * twA).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 7);
    ctx.fill();
  }

  // label — small monospace caps beneath the figure's lowest star
  if (label && grow > 0.85) {
    const la = alpha * smooth(0.85, 1, grow) * labelAlpha;
    let lowX = panel.x0 + panel.w / 2;
    let lowY = panel.y0;
    for (const s of stars) {
      if (Y(s) > lowY) {
        lowY = Y(s);
        lowX = X(s);
      }
    }
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(${palette.label},${la.toFixed(3)})`;
    ctx.fillText(spaceOut(label.toUpperCase()), lowX, lowY + 22);
    ctx.textAlign = 'left';
  }
  if (rotated) ctx.restore();
}

// smoothstep between edges a..b (same shape as SlopeBackground's smooth())
function smooth(a, b, v) {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a || 1e-6)));
  return x * x * (3 - 2 * x);
}

// canvas has no letter-spacing; the site's letterspaced-caps look via thin spaces
function spaceOut(text) {
  return text.split('').join(' ');
}
