import { describe, it, expect } from 'vitest';
import { SKY_W, SKY_H, GRID_CELL, placeInSky, skyToScreen, skyPanel, partingOffset } from './sky.js';

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

  it('never lets two placements touch while free cells remain (mixed scales)', () => {
    const rand = lcg(11);
    // seed with an oversized hand-placed figure — it must block ALL the
    // cells it covers, not just its center (the old bug)
    const placed = [{ x: 0.40, y: 0.02, scale: 0.14 }];
    const cols = Math.floor(SKY_W / GRID_CELL);
    const rows = Math.floor((SKY_H - GRID_CELL * 0.5) / GRID_CELL);
    // 0.06/0.078 both fit one cell incl. label pad; the seed claims several cells
    const count = cols * rows - 9;
    for (let i = 0; i < count; i++) {
      placed.push(placeInSky(placed, i % 2 ? 0.078 : 0.06, rand));
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

  it('still places (with overlap allowed) once the sky is full', () => {
    const rand = lcg(13);
    const placed = [];
    for (let i = 0; i < 80; i++) placed.push(placeInSky(placed, 0.12, rand));
    expect(placed).toHaveLength(80);
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
