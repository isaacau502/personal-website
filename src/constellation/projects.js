// The four project constellations — hand-laid abstract figures in the same
// normalized record shape visitor constellations use ({name, stars, edges},
// unit-grid coords, stable star ids). They seed the night sky and are
// validated by validate.js in projects.test.js, so they can never drift from
// the schema the shared sky enforces.

// TDK — a simple lineage tree: root → two branches → leaves, one winning line
//        r
//       / \
//      a   b        (b carries the winning lineage)
//     /|   |\
//    c d   e f
//      |   |
//      g   h ← winner
const TDK = {
  name: 'tdk',
  stars: [
    { id: 's0', x: 0.50, y: 0.06, size: 1.5 },  // root
    { id: 's1', x: 0.28, y: 0.32, size: 1.1 },  // gen-2 left
    { id: 's2', x: 0.70, y: 0.28, size: 1.2 },  // gen-2 right
    { id: 's3', x: 0.10, y: 0.58, size: 0.8 },  // leaf
    { id: 's4', x: 0.40, y: 0.56, size: 0.9 },  // leaf
    { id: 's5', x: 0.60, y: 0.58, size: 0.9 },  // leaf
    { id: 's6', x: 0.90, y: 0.54, size: 0.8 },  // leaf
    { id: 's7', x: 0.34, y: 0.84, size: 0.8 },  // gen-4 left
    { id: 's8', x: 0.66, y: 0.86, size: 1.6 },  // gen-4 winner
  ],
  edges: [
    ['s0', 's1'], ['s0', 's2'],
    ['s1', 's3'], ['s1', 's4'], ['s2', 's5'], ['s2', 's6'],
    ['s4', 's7'], ['s5', 's8'],
  ],
};

// OVIS — a radial dial: a 270° tick arc around a center, needle at the score
const OVIS = (() => {
  const stars = [{ id: 's0', x: 0.5, y: 0.54, size: 1.5 }]; // hub
  const edges = [];
  const N = 8; // arc ticks
  for (let i = 0; i < N; i++) {
    // 270° sweep, gap at the bottom (135° → 405°)
    const a = (Math.PI * 0.75) + (i / (N - 1)) * (Math.PI * 1.5);
    stars.push({
      id: `s${i + 1}`,
      x: 0.5 + Math.cos(a) * 0.42,
      y: 0.54 + Math.sin(a) * 0.42,
      size: i === 5 ? 1.3 : 0.8, // the score tick shines brighter
    });
    if (i > 0) edges.push([`s${i}`, `s${i + 1}`]);
  }
  edges.push(['s0', 's6']); // needle: hub → score tick (~82.5 of the sweep)
  return { name: 'ovis', stars, edges };
})();

// LLM — two detection boxes, linked: 4 corners each, one grounding edge
const LLM = {
  name: 'llm research',
  stars: [
    { id: 's0', x: 0.06, y: 0.16, size: 1.0 },  // box A corners
    { id: 's1', x: 0.52, y: 0.10, size: 1.0 },
    { id: 's2', x: 0.56, y: 0.52, size: 1.0 },
    { id: 's3', x: 0.10, y: 0.58, size: 1.0 },
    { id: 's4', x: 0.44, y: 0.44, size: 1.2 },  // box B corners (the winner box)
    { id: 's5', x: 0.94, y: 0.40, size: 1.0 },
    { id: 's6', x: 0.96, y: 0.86, size: 1.0 },
    { id: 's7', x: 0.46, y: 0.90, size: 1.0 },
  ],
  edges: [
    ['s0', 's1'], ['s1', 's2'], ['s2', 's3'], ['s3', 's0'],  // box A
    ['s4', 's5'], ['s5', 's6'], ['s6', 's7'], ['s7', 's4'],  // box B
    ['s2', 's4'],                                            // grounding link
  ],
};

// DROPIN — a skater mid-ollie: board line, bent legs, body, head, arms out
const DROPIN = {
  name: 'dropin',
  stars: [
    { id: 's0', x: 0.18, y: 0.78, size: 1.1 },  // board nose (popped)
    { id: 's1', x: 0.66, y: 0.90, size: 1.0 },  // board tail
    { id: 's2', x: 0.32, y: 0.74, size: 0.7 },  // front foot
    { id: 's3', x: 0.54, y: 0.82, size: 0.7 },  // back foot
    { id: 's4', x: 0.38, y: 0.58, size: 0.8 },  // front knee
    { id: 's5', x: 0.56, y: 0.64, size: 0.8 },  // back knee
    { id: 's6', x: 0.48, y: 0.44, size: 1.2 },  // pelvis
    { id: 's7', x: 0.52, y: 0.26, size: 1.0 },  // chest
    { id: 's8', x: 0.56, y: 0.10, size: 1.4 },  // head
    { id: 's9', x: 0.24, y: 0.34, size: 0.8 },  // lead hand
    { id: 's10', x: 0.82, y: 0.30, size: 0.8 }, // trail hand
  ],
  edges: [
    ['s0', 's2'], ['s2', 's3'], ['s3', 's1'],   // board line through the feet
    ['s2', 's4'], ['s4', 's6'],                 // front leg
    ['s3', 's5'], ['s5', 's6'],                 // back leg
    ['s6', 's7'], ['s7', 's8'],                 // spine
    ['s7', 's9'], ['s7', 's10'],                // arms
  ],
};

// order = formation order across the airborne scroll (career order).
// place = persistent sky-space position (top-left + scale in sky units,
// see sky.js) — the projects are seeds in the same shared-sky system
// visitor constellations use, just hand-placed instead of grid-assigned.
// Dome sky: the projects sit on one arc of the great circle around the
// celestial pole below the page (sky.js POLE, r = 1.55), career order
// left→right at -14° / -5° / +5° / +14° from vertical — an even arc
// crowning the invite. center = POLE + r·(sin α, -cos α), place = center
// - scale/2.
TDK.place = { x: 0.060, y: 0.131, scale: 0.13 };
LLM.place = { x: 0.295, y: 0.086, scale: 0.14 };
OVIS.place = { x: 0.573, y: 0.093, scale: 0.125 };
DROPIN.place = { x: 0.820, y: 0.141, scale: 0.11 };

export const PROJECT_CONSTELLATIONS = [TDK, OVIS, LLM, DROPIN];
