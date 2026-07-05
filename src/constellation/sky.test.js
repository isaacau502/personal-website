import { describe, it, expect } from 'vitest';
import { SKY_W, SKY_H, adaptiveScale, placeInSky, skyToScreen, skyPanel, partingOffset } from './sky.js';

// deterministic rand for placement tests
function lcg(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('placeInSky', () => {
  it('keeps every placement inside the sky bounds', () => {
    const rand = lcg(7);
    const placed = [];
    for (let i = 0; i < 40; i++) {
      const p = placeInSky(placed, 0.12, rand);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.scale).toBeLessThanOrEqual(SKY_W + 1e-9);
      expect(p.y + p.scale).toBeLessThanOrEqual(SKY_H + 1e-9);
      placed.push(p);
    }
  });

  it('keeps figures from overlapping at comfortable density (mixed scales)', () => {
    const rand = lcg(11);
    // seed with an oversized hand-placed figure — best-candidate must route
    // around it like anything else
    const placed = [{ x: 0.40, y: 0.02, scale: 0.14 }];
    const n = 20;
    const scaleFor = (i) => (i % 2 ? adaptiveScale(n) : adaptiveScale(n) * 0.85);
    for (let i = 0; i < n; i++) {
      placed.push(placeInSky(placed, scaleFor(i), rand));
    }
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const pa = placed[a], pb = placed[b];
        const overlapX = pa.x < pb.x + pb.scale && pa.x + pa.scale > pb.x;
        const overlapY = pa.y < pb.y + pb.scale && pa.y + pa.scale > pb.y;
        expect(overlapX && overlapY, `placements ${a} and ${b} overlap`).toBe(false);
      }
    }
  });

  it('spreads a sparse sky instead of clumping', () => {
    const rand = lcg(29);
    const placed = [];
    for (let i = 0; i < 6; i++) placed.push(placeInSky(placed, 0.1, rand));
    // every figure should have real clear air at this density
    for (let a = 0; a < placed.length; a++) {
      let nearest = Infinity;
      for (let b = 0; b < placed.length; b++) {
        if (a === b) continue;
        const dx = placed[a].x - placed[b].x;
        const dy = placed[a].y - placed[b].y;
        nearest = Math.min(nearest, Math.hypot(dx, dy));
      }
      expect(nearest).toBeGreaterThan(0.14); // > combined half-footprints
    }
  });

  it('is deterministic for the same occupied list and seed', () => {
    const a = placeInSky([{ x: 0.2, y: 0.2, scale: 0.1 }], 0.09, lcg(5));
    const b = placeInSky([{ x: 0.2, y: 0.2, scale: 0.1 }], 0.09, lcg(5));
    expect(a).toEqual(b);
  });

  it('still places (degrading gracefully) once the sky is crowded', () => {
    const rand = lcg(13);
    const placed = [];
    for (let i = 0; i < 80; i++) placed.push(placeInSky(placed, 0.12, rand));
    expect(placed).toHaveLength(80);
  });

  it('adaptiveScale grows figures on an empty sky and shrinks on a full one', () => {
    expect(adaptiveScale(4)).toBeGreaterThan(adaptiveScale(30));
    expect(adaptiveScale(4)).toBeLessThanOrEqual(0.14);
    expect(adaptiveScale(200)).toBeGreaterThanOrEqual(0.055);
  });
});

describe('skyToScreen / skyPanel', () => {
  it('keeps figure panels square (no distortion) at any aspect', () => {
    for (const [W, H] of [[1440, 900], [2000, 725], [900, 1400]]) {
      const m = skyToScreen(W, H);
      const panel = skyPanel({ x: 0.4, y: 0.2, scale: 0.12 }, m);
      expect(panel.w).toBeCloseTo(panel.h);
    }
  });

  it('keeps the full sky on screen at any aspect', () => {
    for (const [W, H] of [[1440, 900], [2000, 725], [900, 1400]]) {
      const m = skyToScreen(W, H);
      const corner = skyPanel({ x: SKY_W - 0.12, y: SKY_H - 0.12, scale: 0.12 }, m);
      expect(corner.x0 + corner.w).toBeLessThanOrEqual(W);
      expect(corner.y0 + corner.h).toBeLessThanOrEqual(H);
    }
  });
});

describe('partingOffset', () => {
  const rect = { x0: 500, x1: 940, y0: 320, y1: 580 }; // centered form zone
  const panelAt = (cx, cy) => ({ x0: cx - 60, y0: cy - 60, w: 120, h: 120 });

  it('is zero at zero strength and far away', () => {
    expect(partingOffset(panelAt(720, 450), rect, 0)).toEqual({ dx: 0, dy: 0 });
    const far = partingOffset(panelAt(60, 60), rect, 1);
    expect(far.dx).toBe(0);
    expect(far.dy).toBe(0);
  });

  it('pushes a centered figure clear of the rect', () => {
    const off = partingOffset(panelAt(721, 452), rect, 1);
    expect(Math.hypot(off.dx, off.dy)).toBeGreaterThan(100);
  });

  it('pushes outward along the figure→form direction', () => {
    const right = partingOffset(panelAt(900, 450), rect, 1);
    expect(right.dx).toBeGreaterThan(0);
    const above = partingOffset(panelAt(720, 340), rect, 1);
    expect(above.dy).toBeLessThan(0);
  });

  it('scales with strength and reverses cleanly', () => {
    const half = partingOffset(panelAt(900, 450), rect, 0.5);
    const full = partingOffset(panelAt(900, 450), rect, 1);
    expect(Math.abs(half.dx)).toBeLessThan(Math.abs(full.dx));
  });
});
