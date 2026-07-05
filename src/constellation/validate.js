// Validation/normalization for LLM-generated constellations.
// Pure module: used by the Worker (authoritative), the playground, and tests.
// Input shape (from the model):  { name, stars: [{x, y, size}], edges: [[i, j]] }
// Output shape (normalized):     { name, stars: [{id, x, y, size}], edges: [[idA, idB]] }
//
//   LLM JSON ──▶ shape check ──▶ clamp coords/sizes ──▶ dedupe stars (ε-merge)
//            ──▶ remap/dedupe edges ──▶ star-count bounds ──▶ connectivity ──▶ ids
//
// Every rejection returns { ok:false, error, detail } — explicit codes, no throws.

export const MIN_STARS = 2; // just enough for one line — only the MAXIMUM is a real constraint
export const MAX_STARS = 14;
export const MAX_NAME_LEN = 80;
export const MAX_DESCRIPTION_LEN = 100;
const MERGE_EPSILON = 0.02; // unit-grid distance below which two stars are one

const fail = (error, detail) => ({ ok: false, error, detail });
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Printable text: letters, numbers, punctuation, symbols, spaces. No control chars.
const NON_PRINTABLE = /[\p{Cc}\p{Cf}\p{Co}\p{Cn}]/u;

export function validateDescription(text) {
  if (typeof text !== 'string') return fail('description-not-string');
  const trimmed = text.trim();
  if (trimmed.length === 0) return fail('description-empty');
  if (trimmed.length > MAX_DESCRIPTION_LEN) {
    return fail('description-too-long', { length: trimmed.length, max: MAX_DESCRIPTION_LEN });
  }
  if (NON_PRINTABLE.test(trimmed)) return fail('description-not-printable');
  return { ok: true, value: trimmed };
}

export function validateConstellation(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return fail('not-an-object');
  }

  // name
  if (typeof input.name !== 'string') return fail('name-not-string');
  const name = input.name.trim();
  if (name.length === 0) return fail('name-empty');
  if (name.length > MAX_NAME_LEN) return fail('name-too-long', { length: name.length, max: MAX_NAME_LEN });
  if (NON_PRINTABLE.test(name)) return fail('name-not-printable');

  // stars: shape + clamping
  if (!Array.isArray(input.stars)) return fail('stars-not-array');
  const clamped = [];
  for (let i = 0; i < input.stars.length; i++) {
    const s = input.stars[i];
    if (s === null || typeof s !== 'object' || Array.isArray(s)) return fail('star-not-object', { index: i });
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return fail('star-coord-not-finite', { index: i });
    const size = Number.isFinite(s.size) ? clamp(s.size, 0.5, 2) : 1;
    clamped.push({ x: clamp(s.x, 0, 1), y: clamp(s.y, 0, 1), size });
  }

  // dedupe: ε-merge coincident stars, remembering index remapping for edges
  const merged = [];
  const remap = new Array(clamped.length);
  for (let i = 0; i < clamped.length; i++) {
    const s = clamped[i];
    const j = merged.findIndex((m) => Math.hypot(m.x - s.x, m.y - s.y) < MERGE_EPSILON);
    if (j >= 0) {
      remap[i] = j;
    } else {
      remap[i] = merged.length;
      merged.push(s);
    }
  }

  if (merged.length < MIN_STARS) {
    return fail('too-few-stars', { count: merged.length, min: MIN_STARS, before_dedupe: clamped.length });
  }
  if (merged.length > MAX_STARS) {
    return fail('too-many-stars', { count: merged.length, max: MAX_STARS });
  }

  // edges: shape check, remap through the merge, drop self-loops/duplicates
  if (!Array.isArray(input.edges)) return fail('edges-not-array');
  const seen = new Set();
  const edges = [];
  for (let i = 0; i < input.edges.length; i++) {
    const e = input.edges[i];
    if (!Array.isArray(e) || e.length !== 2) return fail('edge-not-pair', { index: i });
    const [a, b] = e;
    if (!Number.isInteger(a) || !Number.isInteger(b)) return fail('edge-index-not-integer', { index: i });
    if (a < 0 || a >= clamped.length || b < 0 || b >= clamped.length) {
      return fail('edge-index-out-of-range', { index: i, edge: [a, b], stars: clamped.length });
    }
    const ma = remap[a], mb = remap[b];
    if (ma === mb) continue; // self-loop (possibly created by the merge) — drop
    const key = ma < mb ? `${ma}-${mb}` : `${mb}-${ma}`;
    if (seen.has(key)) continue; // duplicate — drop
    seen.add(key);
    edges.push([ma, mb]);
  }
  if (edges.length === 0) return fail('no-edges');

  // connectivity: a constellation is one figure. Models occasionally leave a
  // star floating (steam above a mug, a frisbee mid-air) — REPAIR by bridging
  // each stray component to its nearest main-component star instead of
  // rejecting: one extra hairline beats a failed generation.
  const reach = (starts) => {
    const seen = new Set(starts);
    const queue = [...starts];
    while (queue.length) {
      const n = queue.pop();
      for (const [a, b] of edges) {
        const m = a === n ? b : b === n ? a : null;
        if (m !== null && !seen.has(m)) {
          seen.add(m);
          queue.push(m);
        }
      }
    }
    return seen;
  };
  let component = reach([0]);
  let guard = merged.length;
  while (component.size !== merged.length && guard-- > 0) {
    let best = null;
    for (let i = 0; i < merged.length; i++) {
      if (component.has(i)) continue;
      for (const j of component) {
        const d = Math.hypot(merged[i].x - merged[j].x, merged[i].y - merged[j].y);
        if (!best || d < best.d) best = { d, from: j, to: i };
      }
    }
    if (!best) break;
    edges.push([best.from, best.to]);
    component = reach([0]);
  }
  if (component.size !== merged.length) {
    return fail('not-connected', { reachable: component.size, stars: merged.length });
  }

  // stable per-star ids (record-local; the Worker prefixes the record id at write time)
  const stars = merged.map((s, i) => ({ id: `s${i}`, x: s.x, y: s.y, size: s.size }));
  return {
    ok: true,
    value: {
      name,
      stars,
      edges: edges.map(([a, b]) => [stars[a].id, stars[b].id]),
    },
  };
}
