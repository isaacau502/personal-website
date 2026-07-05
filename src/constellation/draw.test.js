import { describe, it, expect } from 'vitest';
import { drawConstellation, SKY_PALETTE } from './draw.js';

// minimal recording 2d-context mock — smoke tests assert "draws without
// throwing and actually issues draw calls"; visual quality lives in the
// playground, not here.
function mockCtx() {
  const calls = [];
  const record = (name) => (...args) => {
    calls.push([name, args]);
    if (name === 'createRadialGradient') return { addColorStop: record('addColorStop') };
    return undefined;
  };
  const ctx = {};
  for (const m of [
    'beginPath', 'moveTo', 'lineTo', 'stroke', 'arc', 'fill',
    'createRadialGradient', 'fillText', 'setLineDash',
  ]) ctx[m] = record(m);
  ctx.calls = calls;
  return ctx;
}

const PANEL = { x0: 100, y0: 50, w: 400, h: 300 };
const STARS = [
  { id: 's0', x: 0.1, y: 0.2, size: 1 },
  { id: 's1', x: 0.5, y: 0.3, size: 1.4 },
  { id: 's2', x: 0.8, y: 0.6, size: 0.6 },
];
const EDGES = [['s0', 's1'], ['s1', 's2']];

describe('drawConstellation', () => {
  it('draws a valid figure without throwing', () => {
    const ctx = mockCtx();
    drawConstellation(ctx, STARS, EDGES, PANEL, { t: 1.5, label: 'good dog' });
    const names = ctx.calls.map(([n]) => n);
    expect(names).toContain('stroke'); // edges drawn
    expect(names).toContain('arc');    // stars drawn
    expect(names).toContain('fillText'); // label drawn at full grow
  });

  it('does not throw on degenerate input', () => {
    const ctx = mockCtx();
    // single star, zero-length edge target missing, all-coincident points
    drawConstellation(ctx, [{ id: 's0', x: 0.5, y: 0.5, size: 1 }], [['s0', 'sX']], PANEL, {});
    drawConstellation(ctx, [
      { id: 'a', x: 0.5, y: 0.5, size: 1 },
      { id: 'b', x: 0.5, y: 0.5, size: 1 },
    ], [['a', 'b']], PANEL, {});
    expect(() => drawConstellation(ctx, [], [], PANEL, {})).not.toThrow();
  });

  it('is invisible at alpha 0 and before grow starts', () => {
    const ctx = mockCtx();
    drawConstellation(ctx, STARS, EDGES, PANEL, { alpha: 0 });
    expect(ctx.calls).toHaveLength(0);
    drawConstellation(ctx, STARS, EDGES, PANEL, { grow: 0 });
    expect(ctx.calls.map(([n]) => n)).not.toContain('fillText');
  });

  it('renders the newest star in dusk amber', () => {
    const ctx = mockCtx();
    drawConstellation(ctx, STARS, EDGES, PANEL, { newestId: 's2' });
    const fills = ctx.calls
      .filter(([n]) => n === 'addColorStop')
      .map(([, args]) => args[1]);
    expect(fills.some((c) => c.includes(SKY_PALETTE.amber))).toBe(true);
  });

  it('skips the label until the reveal is nearly complete', () => {
    const ctx = mockCtx();
    drawConstellation(ctx, STARS, EDGES, PANEL, { grow: 0.5, label: 'good dog' });
    expect(ctx.calls.map(([n]) => n)).not.toContain('fillText');
  });
});
