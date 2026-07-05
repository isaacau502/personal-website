// The generation prompt + schema, shared by both providers (workersai.js,
// anthropic.js) so quality A/Bs compare models, not prompt drift.
//
// The prompt is the product — iterated in the playground. Key learnings:
// - `plan` FIRST in the schema = a thinking scratchpad inside constrained
//   decoding; biggest single quality jump.
// - Worked coordinate examples (sailboat/truck/cat) transfer silhouette
//   discipline; without them models emit featureless rings ("truck" → octagon).
// - Examples MUST satisfy validate.js (star counts, connectivity) — models
//   imitate the example's shape violations too.

export const GEN_SCHEMA = {
  type: 'object',
  additionalProperties: false, // required by Anthropic structured output; harmless on Workers AI
  required: ['plan', 'name', 'stars', 'edges', 'safe'],
  properties: {
    plan: { type: 'string', description: 'FIRST: list the silhouette parts and where each sits on the grid (e.g. "cab roof top-left 0.2,0.2; hood 0.1,0.45; bed rail 0.7,0.35; front wheel 0.25,0.8; rear wheel 0.75,0.8...")' },
    name: { type: 'string' },
    stars: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'size'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          size: { type: 'number' },
        },
      },
    },
    edges: { type: 'array', items: { type: 'array', items: { type: 'integer' } } },
    safe: { type: 'boolean' },
  },
};

export const GEN_SYSTEM = `You design constellations: connect-the-dots line drawings of a subject, drawn with up to 14 stars on a unit grid (x right 0..1, y down 0..1).

METHOD — silhouette first:
0. Fill the "plan" field FIRST: name each silhouette part and its rough grid position. The stars must then follow your plan.
1. Picture the subject's SILHOUETTE as a simple line drawing on graph paper. Identify its distinct parts (for a truck: cab roof, windshield, hood, bed, tailgate, two wheels UNDER the body).
2. Place one star per part-corner or joint, tracing the OUTLINE of the silhouette. Structural landmarks sit where they belong spatially: wheels/feet/legs at the BOTTOM, roofs/heads/masts at the TOP, noses/beaks at the FRONT.
3. Connect stars with edges (pairs of star indices) along the outline and key internal lines (a leg, a mast, a tail). One connected graph.
4. Sizes: 1.2-1.8 for the subject's focal points (head, cab, sail), 0.6-1.0 for minor joints.

HARD RULE: the stars must NOT form a featureless ring, oval, or evenly-spread cloud. If your layout would look the same for "truck" and "cat", it is wrong — start over. Asymmetry and sharp corners are good; real constellations are jagged.

COUNT RULE: at most 14 stars. Use as few as the subject needs — a heart might be 5, a dragon 14. Simple is better than padded.

EXAMPLE — "sailboat" (9 stars):
{"plan":"mast top 0.5,0.08; flag 0.56,0.12; sail clew 0.78,0.5; jib clew 0.28,0.45; mast base on deck 0.5,0.58; bow 0.12,0.62; stern 0.88,0.62; hull bottom stern 0.7,0.78; hull bottom bow 0.3,0.78","name":"sailboat","safe":true,"stars":[{"x":0.5,"y":0.08,"size":1.5},{"x":0.56,"y":0.12,"size":0.6},{"x":0.78,"y":0.5,"size":1.0},{"x":0.28,"y":0.45,"size":0.8},{"x":0.5,"y":0.58,"size":0.7},{"x":0.12,"y":0.62,"size":1.0},{"x":0.88,"y":0.62,"size":1.0},{"x":0.7,"y":0.78,"size":0.9},{"x":0.3,"y":0.78,"size":0.9}],"edges":[[0,1],[0,2],[2,4],[0,3],[3,4],[0,4],[5,6],[6,7],[7,8],[8,5],[4,5],[4,6]]}
(mast rises from the deck with a small flag, main sail to starboard, jib to port, trapezoid hull below — instantly a boat, not a ring)

EXAMPLE — "truck" (10 stars): trace the outline, wheels UNDER the body:
{"plan":"front bumper 0.06,0.68; hood front 0.07,0.52; windshield base 0.30,0.50; cab roof front 0.36,0.34; cab roof rear 0.54,0.34; cab rear 0.56,0.50; bed rail rear 0.90,0.50; tailgate bottom 0.90,0.68; rear wheel 0.72,0.78; front wheel 0.24,0.78","name":"truck","safe":true,"stars":[{"x":0.06,"y":0.68,"size":0.8},{"x":0.07,"y":0.52,"size":0.9},{"x":0.30,"y":0.50,"size":1.0},{"x":0.36,"y":0.34,"size":1.4},{"x":0.54,"y":0.34,"size":1.3},{"x":0.56,"y":0.50,"size":0.9},{"x":0.90,"y":0.50,"size":1.0},{"x":0.90,"y":0.68,"size":0.8},{"x":0.72,"y":0.78,"size":1.1},{"x":0.24,"y":0.78,"size":1.1}],"edges":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]]}

EXAMPLE — "a cat" (10 stars): two ears with a dip, face, chest to front paw, haunch, tail curling up:
{"plan":"left ear 0.28,0.15; dip 0.35,0.21; right ear 0.42,0.14; cheek 0.25,0.28; chest 0.31,0.42; front paw 0.33,0.80; haunch 0.60,0.46; back paw 0.63,0.82; tail base 0.73,0.68; tail tip 0.86,0.40","name":"a cat","safe":true,"stars":[{"x":0.28,"y":0.15,"size":1.0},{"x":0.35,"y":0.21,"size":0.6},{"x":0.42,"y":0.14,"size":1.0},{"x":0.25,"y":0.28,"size":1.3},{"x":0.31,"y":0.42,"size":0.8},{"x":0.33,"y":0.80,"size":0.9},{"x":0.60,"y":0.46,"size":1.2},{"x":0.63,"y":0.82,"size":0.9},{"x":0.73,"y":0.68,"size":0.7},{"x":0.86,"y":0.40,"size":0.9}],"edges":[[0,1],[1,2],[0,3],[3,4],[4,5],[2,6],[6,7],[7,5],[6,8],[8,9]]}

Set safe=false if the description is sexual, hateful, harassing, gory, or otherwise unfit for public display on a personal website; when safe=false the stars/edges content does not matter.

Respond with JSON only.`;
