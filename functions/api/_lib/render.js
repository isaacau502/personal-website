// resvg seam: render a validated constellation record to a 512x512 PNG
// inside the Worker (eng review D9 — pixels are ground truth for moderation,
// checked BEFORE persistence). The figure is drawn plain and high-contrast:
// the vision model judges shape, not aesthetics.
//
// @resvg/resvg-wasm needs its wasm module initialized once per isolate.
// Pages Functions/Workers bundle .wasm imports natively.
import { initWasm, Resvg } from '@resvg/resvg-wasm';
// eslint-disable-next-line import/no-unresolved
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';

let ready;
function init() {
  if (!ready) ready = initWasm(resvgWasm);
  return ready;
}

const SIZE = 512;
const PAD = 48;

export function recordToSvg(record) {
  const span = SIZE - PAD * 2;
  const X = (s) => PAD + s.x * span;
  const Y = (s) => PAD + s.y * span;
  const byId = new Map(record.stars.map((s) => [s.id, s]));
  const edges = record.edges
    .map(([a, b]) => {
      const A = byId.get(a), B = byId.get(b);
      if (!A || !B) return '';
      return `<line x1="${X(A)}" y1="${Y(A)}" x2="${X(B)}" y2="${Y(B)}" stroke="#e8eef8" stroke-width="3"/>`;
    })
    .join('');
  const stars = record.stars
    .map((s) => `<circle cx="${X(s)}" cy="${Y(s)}" r="${6 + s.size * 4}" fill="#ffffff"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="#101c34"/>${edges}${stars}</svg>`;
}

export async function renderPng(record) {
  await init();
  const svg = recordToSvg(record);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } });
  return resvg.render().asPng();
}
