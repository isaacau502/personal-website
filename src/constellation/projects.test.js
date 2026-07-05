import { describe, it, expect } from 'vitest';
import { PROJECT_CONSTELLATIONS } from './projects.js';
import { validateConstellation, MAX_STARS } from './validate.js';

// The seed figures must satisfy the exact schema visitor constellations do —
// if these fail, the shared-sky rules and the site's own sky have diverged.
describe('project constellations', () => {
  it('exports the four figures in career order', () => {
    expect(PROJECT_CONSTELLATIONS.map((c) => c.name)).toEqual([
      'tdk', 'ovis', 'llm research', 'dropin',
    ]);
  });

  for (const figure of PROJECT_CONSTELLATIONS) {
    it(`"${figure.name}" passes the visitor-constellation validator`, () => {
      // validator takes index edges; convert the id edges back for the check
      const idx = new Map(figure.stars.map((s, i) => [s.id, i]));
      const raw = {
        name: figure.name,
        stars: figure.stars.map(({ x, y, size }) => ({ x, y, size })),
        edges: figure.edges.map(([a, b]) => [idx.get(a), idx.get(b)]),
      };
      const r = validateConstellation(raw);
      expect(r.ok, r.ok ? '' : `${figure.name}: ${r.error}`).toBe(true);
      expect(r.value.stars.length).toBe(figure.stars.length); // no ε-merges
    });

    it(`"${figure.name}" stays within the 12-star cap the user set`, () => {
      expect(figure.stars.length).toBeLessThanOrEqual(12);
      expect(figure.stars.length).toBeLessThanOrEqual(MAX_STARS);
    });
  }
});
