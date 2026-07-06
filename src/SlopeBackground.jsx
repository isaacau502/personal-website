import { Component, createRef } from 'react';
import { drawConstellation, glowSprite } from './constellation/draw.js';
import { PROJECT_CONSTELLATIONS } from './constellation/projects.js';
import { adaptiveScale, placeInSky, skyToScreen, skyPanel, partingOffset, separatePanels, skyLean } from './constellation/sky.js';

const mono = 'ui-monospace, monospace';

// ---- mobile beat choreography ----
// under MB_BP the copy/motif pairs can't sit side by side, so each beat serializes.
// to keep the motif from reading as "patched on", the beat's TITLE persists: as the
// body copy lifts out [MB_OUT0..MB_OUT1], the project name rises into a pinned header
// [MB_HDR0..MB_HDR1] and the motif forms beneath it. the windows OVERLAP (motif starts
// at MB_MOTIF0, before the copy is fully gone) so the frame is never empty and the
// diagram materializes as a labeled panel, not an orphan.
const MB_BP = 768;
const MB_OUT0 = 0.38, MB_OUT1 = 0.56;
const MB_HDR0 = 0.44, MB_HDR1 = 0.60;
const MB_MOTIF0 = 0.50;
// sig-form anchor on mobile — high enough that the iOS keyboard never covers the input
const MB_SIG_Y = 0.42;
// name/sub anchor the diagram; kick echoes the section's mono lead-in
const MB_TITLE = {
  tdk: { kick: '01 · MAY 2026 – PRESENT · INTERNSHIP', name: 'TDK', sub: 'ML Intern' },
  ovis: { kick: '02 · 2022 – 2026 · CO-FOUNDER', name: 'Ovis', sub: 'Medical Solutions' },
  llm: { kick: '03 · RESEARCH', name: 'LLM', sub: 'Research' },
  drop: { kick: '04 · 2026 · PERSONAL PROJECT', name: 'DropIn', sub: 'Motion Capture' },
};

// night-sky star chart: formation window per figure in _skyGrow space
// (staggered, career order — matches PROJECT_CONSTELLATIONS). Placement is
// sky-space ({x,y,scale} on each record, mapped per-frame by skyToScreen);
// during the invite the sky PARTS around the form via partingOffset.
const SKY_WINDOWS = [
  [0.00, 0.38], // tdk
  [0.18, 0.56], // ovis
  [0.38, 0.76], // llm research
  [0.58, 0.96], // dropin
];

// mock visitor constellations for layout proofing: ?skyfill=N reuses the
// project geometries under visitor-ish names, placed by the same occupancy
// grid the Worker will use. Dev/QA-only; the real shared sky replaces this.
const SKYFILL_NAMES = [
  'good dog', 'sailboat', 'a bear making eggs', 'paper plane', 'first coffee',
  'orion but worse', 'my cat', 'home', 'the wave', 'night train',
  'a very tall sandwich', 'lighthouse', 'two left skis', 'the eiffel tower',
  'moose on skates', 'grandma’s soup', 'a bicycle uphill', 'the moon’s moon',
  'lost mitten', 'powder day', 'campfire', 'a whale in a suit',
  'sunday morning', 'the last lift', 'hot chocolate', 'après',
];
const HEADLINE_SIZE = 'clamp(40px, 6vw, 88px)';

// ---- Ovis "Patient Constellation" motif (02 / It rises ahead) ----
// structure palette stays the slope's; care categories desaturated from the app's landing ring
const OV_INKB = '23,52,104';
const OV_SLATE = '58,78,106';
const OV_EDGE = '74,94,120';
const OV_ALERT = '184,69,46';
const OV_CATS = ['188,92,82', '84,144,148', '198,138,70', '134,118,178', '106,150,102', '88,130,190']; // heart lung meds sleep move hydro
const OV_NODES = [
  ['head', 0, -0.460, 1.9], ['neck', 0, -0.365, 1.0], ['chest', 0.014, -0.272, 1.2],
  ['heart', -0.032, -0.256, 1.3], ['spine', 0.004, -0.130, 0.9], ['gut', -0.004, -0.055, 1.2],
  ['pelvis', 0, 0.030, 1.1], ['shL', -0.105, -0.315, 1.1], ['shR', 0.108, -0.312, 1.1],
  ['armL', -0.140, -0.230, 0.7], ['armR', 0.146, -0.228, 0.7], ['elbL', -0.158, -0.150, 0.9],
  ['elbR', 0.164, -0.152, 0.9], ['wristL', -0.172, -0.040, 0.8], ['wristR', 0.180, -0.048, 0.8],
  ['handL', -0.176, 0.010, 1.0], ['handR', 0.186, 0.002, 1.0], ['hipL', -0.068, 0.045, 1.0],
  ['hipR', 0.070, 0.045, 1.0], ['kneeL', -0.076, 0.215, 1.0], ['kneeR', 0.084, 0.218, 1.0],
  ['shinL', -0.080, 0.320, 0.7], ['shinR', 0.090, 0.325, 0.7], ['footL', -0.088, 0.430, 1.1],
  ['footR', 0.098, 0.432, 1.1],
].map((n, i) => ({ id: n[0], x: n[1], y: n[2], r: n[3], o: i }));
const OV_IDX = {};
OV_NODES.forEach((n, i) => { OV_IDX[n.id] = i; });
const OV_EDGES = [
  ['head', 'neck'], ['neck', 'chest'], ['chest', 'heart'], ['chest', 'spine'], ['spine', 'gut'], ['gut', 'pelvis'],
  ['neck', 'shL'], ['neck', 'shR'], ['shL', 'armL'], ['armL', 'elbL'], ['elbL', 'wristL'], ['wristL', 'handL'],
  ['shR', 'armR'], ['armR', 'elbR'], ['elbR', 'wristR'], ['wristR', 'handR'], ['pelvis', 'hipL'], ['pelvis', 'hipR'],
  ['hipL', 'kneeL'], ['kneeL', 'shinL'], ['shinL', 'footL'], ['hipR', 'kneeR'], ['kneeR', 'shinR'], ['shinR', 'footR'],
  ['shL', 'heart'], ['shR', 'chest'], ['heart', 'gut'], ['hipL', 'gut'],
];
const OV_CROSS_FROM = OV_EDGES.length - 4; // last 4 are faint constellation cross-links
const OV_SITES = [
  { id: 'heart', color: OV_CATS[0], base: 0.50, pulse: 1.7 },
  { id: 'chest', color: OV_CATS[1], base: 0.34, pulse: 1.2 },
  { id: 'gut', color: OV_CATS[2], base: 0.46, pulse: 1.0 },
  { id: 'head', color: OV_CATS[3], base: 0.38, pulse: 0.8 },
  { id: 'kneeR', color: OV_CATS[4], base: 0.34, pulse: 1.4 },
  { id: 'wristL', color: OV_CATS[5], base: 0.30, pulse: 1.1 },
];
const OV_SATS = [
  { site: 'heart', color: OV_CATS[0], ang: 3.60, rad: 0.135, sp: 0.22 },
  { site: 'chest', color: OV_CATS[1], ang: 0.55, rad: 0.125, sp: -0.18 },
  { site: 'gut', color: OV_CATS[2], ang: 2.60, rad: 0.130, sp: 0.16 },
  { site: 'head', color: OV_CATS[3], ang: 5.60, rad: 0.120, sp: -0.14 },
  { site: 'kneeR', color: OV_CATS[4], ang: 0.90, rad: 0.120, sp: 0.20 },
  { site: 'wristL', color: OV_CATS[5], ang: 3.90, rad: 0.110, sp: -0.22 },
];
// the AI tracker's outcomes — the app's own vocabulary; every 4th escalates
const OV_OUTCOMES = [
  { site: 'heart', cat: 0, color: OV_CATS[2], text: 'FATIGUE · 65% · MILD', high: false },
  { site: 'head', cat: 3, color: OV_CATS[3], text: 'SLEEP · 7.2HR · GOOD', high: false },
  { site: 'gut', cat: 2, color: OV_CATS[2], text: 'NAUSEA · 72% · MILD', high: false },
  { site: 'head', cat: 3, color: OV_ALERT, text: 'HEADACHE · 80% · HIGH', high: true },
];
const OV_CONVO_DOTS = 5, OV_DOT_TRAVEL = 1.8, OV_DOT_STAGGER = 0.3;
const OV_CONVO_DUR = (OV_CONVO_DOTS - 1) * OV_DOT_STAGGER + OV_DOT_TRAVEL;
const OV_A0 = Math.PI * 0.75, OV_A1 = Math.PI * 2.25; // 270° dial, gap at the bottom

// ---- LLM research "grounded repair constellation" motif (03, right of copy) ----
// a reticle walks a crooked wireframe; each landing grounds an axis-aligned, labeled
// detection bbox (the frozen model's scaffold) and the element snaps into it,
// then box centers link into the site's constellation grammar
const LG_INK = '23,34,47';
const LG_ELS = [
  { x: 0.04, y: 0.055, w: 0.92, h: 0.125, rot: -0.038, lab: 'NAV', conf: '0.98' },
  { x: 0.06, y: 0.155, w: 0.56, h: 0.345, rot: 0.034, lab: 'HERO', conf: '0.94' },
  { x: 0.585, y: 0.215, w: 0.335, h: 0.165, rot: -0.052, lab: 'CARD', conf: '0.91' },
  { x: 0.585, y: 0.360, w: 0.335, h: 0.145, rot: 0.046, lab: 'CARD', conf: '0.88' },
  { x: 0.06, y: 0.475, w: 0.35, h: 0.115, rot: -0.044, lab: 'INPUT', conf: '0.93' },
  { x: 0.06, y: 0.570, w: 0.23, h: 0.105, rot: 0.062, lab: 'BUTTON', conf: '0.97', win: 1 },
];
const LG_PAIRS = [[0, 1], [0, 2], [1, 4], [2, 3], [3, 1], [4, 5], [1, 5]];
const LG_BASE = (i) => 0.08 + i * 0.125; // reticle arrival per element, in grow-space
const star4 = (ctx, x, y, r) => {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const rr = i % 2 === 0 ? r : r * 0.36;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
};

// ---- DropIn follow-view rider (04, left of copy) ----
// a low-poly plexus rider — irregular wireframe tube mesh over a mocap skeleton,
// baggy outerwear proportions — carves in from frame-left, straightens his line,
// pops an ollie center-frame, lands, and arcs back out the left edge.
// local rider frame: +z downhill (away from viewer), +x rider's right / toe edge, y up
const DI_AIR0 = 0.43, DI_AIR1 = 0.62, DI_AIRMAX = 0.70;
const DI_SPEED = 60, DI_SWEEP = 16.4, DI_CARVE = 1.15, DI_RUN_S = 8;
const DI_DELAY = 0.20; // copy gets this fraction of the dwell to itself before the rider starts forming
const DI_CROUCH = [[0, .30], [.33, .30], [.415, .72], [.45, .08], [.50, .55], [.57, .50], [.62, .78], [.71, .34], [1, .30]];
const DI_PITCH = [[0, 0], [.40, 0], [.435, .55], [.49, .12], [.58, .06], [.615, -.10], [.66, 0], [1, 0]];
const DI_ARMS = [[0, .15], [.35, .28], [.43, .5], [.48, .85], [.57, .85], [.64, .4], [.74, .15], [1, .15]];
const diLp = (a, b, s) => a + (b - a) * s;
const diL3 = (a, b, s) => [diLp(a[0], b[0], s), diLp(a[1], b[1], s), diLp(a[2], b[2], s)];
const diAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const diSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const diMul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const diCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const diDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const diNorm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const diHash = (i) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
const diKeys = (ks, u) => {
  let i = 0;
  while (i < ks.length - 2 && u > ks[i + 1][0]) i++;
  const [ua, va] = ks[i], [ub, vb] = ks[i + 1];
  return diLp(va, vb, smooth(0, 1, (u - ua) / Math.max(1e-6, ub - ua)));
};
const diRotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
const diRotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
const diWigRaw = (x) => DI_CARVE * Math.sin(3 * Math.PI * x + 0.3);
// ease into a straight line before the pop (hold the offset — no snap-back),
// keep it through the trick, pick the carve back up after landing
function diWiggle(u) {
  const settle = smooth(0.32, 0.42, u);
  const release = smooth(DI_AIR1 + 0.04, DI_AIR1 + 0.18, u);
  return diLp(diLp(diWigRaw(u), diWigRaw(0.42), settle), diWigRaw(u), release);
}
// edge lean: carve component fades while the line is straight, arc lean stays
function diLean(u) {
  const settle = smooth(0.32, 0.42, u);
  const release = smooth(DI_AIR1 + 0.04, DI_AIR1 + 0.18, u);
  const factor = Math.max(1 - settle, release);
  const grounded = 1 - smooth(DI_AIR0, DI_AIR0 + .03, u) + smooth(DI_AIR1 - .03, DI_AIR1, u);
  return (-0.38 * (diWigRaw(u) / DI_CARVE) * factor + 0.14) * Math.max(0, Math.min(1, grounded));
}
// arc: in from frame-left, center at the trick, then forward-and-out —
// drifting left while pulling away downhill (diRiderZ) so he exits into the distance
const diBaseX = (u) => -DI_SWEEP / 2 + 4 * (DI_SWEEP / 2 + 1.2) * u * (1 - u);
const diRiderX = (u) => diBaseX(u) + diWiggle(u);
// gentle power ramp (no smoothstep): the pull-away builds gradually, so the
// fast stretch lands when he's already distant instead of bursting mid-frame
const diRiderZ = (u) => 20 * Math.pow(Math.min(1, Math.max(0, (u - 0.62) / 0.38)), 1.4);
function diAir(u) {
  const p = (u - DI_AIR0) / (DI_AIR1 - DI_AIR0);
  return (p > 0 && p < 1) ? DI_AIRMAX * 4 * p * (1 - p) : 0;
}

function diBuildRider(u) {
  const c = diKeys(DI_CROUCH, u);
  const arms = diKeys(DI_ARMS, u);
  const pitch = diKeys(DI_PITCH, u);

  const tail = [0, 0.045, -0.92];
  const pv = (p) => { // pitch about the tail (x-axis) so the pop lifts the nose
    const q = diSub(p, tail);
    return diAdd(tail, [q[0], q[1] * Math.cos(pitch) + q[2] * Math.sin(pitch), q[2] * Math.cos(pitch) - q[1] * Math.sin(pitch)]);
  };

  const verts = [], edges = [];
  function tube(a, b, radii, K) {
    const d = diNorm(diSub(b, a));
    const ref = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const e1 = diNorm(diCross(d, ref)), e2 = diCross(d, e1);
    const S = radii.length, base = verts.length;
    for (let s = 0; s < S; s++) {
      for (let k = 0; k < K; k++) {
        const vi = verts.length;
        // jittered station / radius / angle — irregular plexus, not a lathe
        const tj = s / (S - 1) + (diHash(vi * 3 + 7) - 0.5) * 0.14 * (s > 0 && s < S - 1 ? 1 : 0.35);
        const ce = diL3(a, b, Math.max(0, Math.min(1, tj)));
        const rr = radii[s] * (0.82 + 0.36 * diHash(vi * 5 + 1));
        const th = (k + 0.5 * (s % 2)) / K * 2 * Math.PI + (diHash(vi * 7 + 3) - 0.5) * 0.7;
        verts.push(diAdd(ce, diAdd(diMul(e1, Math.cos(th) * rr), diMul(e2, Math.sin(th) * rr))));
      }
    }
    let ec = base * 7;
    for (let s = 0; s < S; s++) for (let k = 0; k < K; k++) {
      const i0 = base + s * K + k, i1 = base + s * K + (k + 1) % K;
      if (diHash(++ec) > 0.10) edges.push([i0, i1]);
      if (s < S - 1) {
        if (diHash(++ec) > 0.10) edges.push([i0, i0 + K]);
        if (diHash(++ec) > 0.20) edges.push([i0, base + (s + 1) * K + (k + 1) % K]);
      }
    }
  }

  // board: triangulated deck grid with kicked tips (manufactured — stays regular)
  const bbase = verts.length;
  const secs = [[0.84, 0.135], [0.52, 0.165], [0.17, 0.175], [-0.17, 0.175], [-0.52, 0.165], [-0.76, 0.135]];
  const deckY = (z) => 0.045 + 0.045 * Math.pow(Math.max(0, Math.abs(z) - 0.60) / 0.34, 2);
  verts.push(pv([0, deckY(1.0), 1.0]));
  for (const [z, w] of secs) for (const x of [-w, 0, w]) verts.push(pv([x, deckY(z), z]));
  verts.push(pv([0, deckY(-0.94), -0.94]));
  const nS = secs.length, noseI = bbase, tailI = bbase + 1 + nS * 3;
  const si = (s, col) => bbase + 1 + s * 3 + col;
  for (let col = 0; col < 3; col++) { edges.push([noseI, si(0, col)]); edges.push([tailI, si(nS - 1, col)]); }
  for (let s = 0; s < nS; s++) {
    edges.push([si(s, 0), si(s, 1)], [si(s, 1), si(s, 2)]);
    if (s < nS - 1) {
      for (let col = 0; col < 3; col++) edges.push([si(s, col), si(s + 1, col)]);
      edges.push([si(s, s % 2 ? 0 : 1), si(s + 1, s % 2 ? 1 : 0)]);
      edges.push([si(s, s % 2 ? 1 : 2), si(s + 1, s % 2 ? 2 : 1)]);
    }
  }

  // skeleton (baggy outerwear hangs off these)
  const ankleF = pv([0, 0.15, 0.30]);
  const ankleB = pv([0, 0.15, -0.30]);
  const pelvis = [0.02, 1.00 - c * 0.34, -0.02];
  const chest = diAdd(pelvis, [0.03, 0.40 - c * 0.08, 0.07]);
  const shF = diAdd(chest, [-0.16, 0.04, 0.20]);
  const shB = diAdd(chest, [0.16, 0.04, -0.20]);
  const neckB = diAdd(chest, [0, 0.08, 0.02]);
  const headT = diAdd(neckB, [0.02, 0.24, 0.07]);
  const hipF = diAdd(pelvis, [-0.06, 0, 0.15]);
  const hipB = diAdd(pelvis, [0.06, 0, -0.15]);
  const elF = diL3(diAdd(shF, [-0.06, -0.26, 0.12]), diAdd(shF, [-0.20, 0.03, 0.26]), arms);
  const haF = diL3(diAdd(elF, [0.00, -0.26, 0.14]), diAdd(elF, [-0.20, 0.02, 0.30]), arms);
  const elB = diL3(diAdd(shB, [0.07, -0.26, -0.10]), diAdd(shB, [0.22, 0.04, -0.24]), arms);
  const haB = diL3(diAdd(elB, [0.06, -0.24, -0.12]), diAdd(elB, [0.22, 0.02, -0.28]), arms);
  const bendDir = diNorm([0.18, 0, 0.12]);
  const bend = 0.10 + c * 0.24;
  const knee = (hip, ank) => diAdd(diMul(diAdd(hip, ank), 0.5), diMul(bendDir, bend));
  const knF = knee(hipF, ankleF), knB = knee(hipB, ankleB);

  // clothing tubes: baggy jacket, round hood, sleeves, mittens, pants, boots
  tube(diAdd(pelvis, [0, -0.20, 0]), chest, [0.225, 0.195, 0.235], 7);
  tube(neckB, headT, [0.055, 0.115, 0.115, 0.055], 6); // near-spherical head
  tube(shF, elF, [0.095, 0.082], 4); tube(elF, haF, [0.080, 0.088], 4);
  tube(shB, elB, [0.095, 0.082], 4); tube(elB, haB, [0.080, 0.088], 4);
  const mitt = (el, ha) => tube(ha, diAdd(ha, diMul(diNorm(diSub(ha, el)), 0.15)), [0.062, 0.032], 4);
  mitt(elF, haF); mitt(elB, haB);
  tube(hipF, knF, [0.125, 0.105], 5); tube(knF, ankleF, [0.10, 0.078], 5);
  tube(hipB, knB, [0.125, 0.105], 5); tube(knB, ankleB, [0.10, 0.078], 5);
  tube(pv([-0.11, 0.11, 0.27]), pv([0.23, 0.10, 0.35]), [0.058, 0.072, 0.048], 4); // boots, toes to toe edge
  tube(pv([-0.11, 0.11, -0.33]), pv([0.23, 0.10, -0.25]), [0.058, 0.072, 0.048], 4);
  const clav = verts.length;
  verts.push(shF, chest, shB);
  edges.push([clav, clav + 1], [clav + 1, clav + 2]);
  // irregular cross-links between nearby body vertices (skip the board)
  const bStart = tailI + 1;
  for (let k = 0; k < 42; k++) {
    const i = bStart + Math.floor(diHash(k * 13 + 2) * (verts.length - bStart));
    const j = bStart + Math.floor(diHash(k * 29 + 5) * (verts.length - bStart));
    if (i === j) continue;
    const dd = diSub(verts[i], verts[j]);
    if (Math.hypot(dd[0], dd[1], dd[2]) < 0.30) edges.push([i, j]);
  }

  return { verts, edges, sensors: [pelvis, ankleB, haF], boardEnd: tailI };
}

// world transform: edge lean roll → heading yaw along the arc → translate
function diTransform(u) {
  const roll = diLean(u);
  const e = 1e-3;
  const dzr = (diRiderZ(u + e) - diRiderZ(u - e)) / (2 * e);
  const hYaw = Math.atan2((diRiderX(u + e) - diRiderX(u - e)) / (2 * e), DI_SPEED + dzr);
  const air = diAir(u), x = diRiderX(u);
  return (p) => diAdd(diRotY(diRotZ(p, roll), hYaw), [x, air, diRiderZ(u)]);
}

// fixed camera slightly left of viewport center (copy sits right); rider crosses the frame
function diMakeCam(u, W, H) {
  // mobile: the rider has the frame to himself, so center him and key the focal length
  // off width — portrait H would otherwise blow the figure past the edges
  const mob = W < MB_BP;
  const pos = [0, 1.85, -5.7];
  const tgt = [diRiderX(u) * 0.12, 0.85, 1.8];
  const fwd = diNorm(diSub(tgt, pos));
  const rgt = diNorm(diCross([0, 1, 0], fwd));
  const up = diCross(fwd, rgt);
  const f = mob ? W * 2.2 : H * 2.0, cx = W * (mob ? 0.5 : 0.38), cy = H * (mob ? 0.5 : 0.52);
  return (p) => {
    const q = diSub(p, pos);
    const z = diDot(q, fwd);
    if (z < 0.25) return null;
    return [cx + f * diDot(q, rgt) / z, cy - f * diDot(q, up) / z, z];
  };
}

class SlopeBackground extends Component {
  static defaultProps = {
    carve: 1,
    decel: 0.92,
    spray: true,
    sky: 'dusk',
  };

  constructor(props) {
    super(props);
    this.canvasRef = createRef();
    this.graphCanvasRef = createRef();
    this.spdRef = createRef();
    this.distRef = createRef();
    this.landPageRef = createRef();
    this.sigRef = createRef();
    this.sigInputRef = createRef();
    this.sigStatusRef = createRef();
    this.navRef = createRef();
    this.tdkRef = createRef();
    this.mlRef = createRef();
    this.ovisRef = createRef();
    this.medRef = createRef();
    this.llmRef = createRef();
    this.llmSubRef = createRef();
    this.dropRef = createRef();
    this.dropSubRef = createRef();
    this.hudRef = createRef();
    this.hdrRef = createRef();
    this.hdrKickRef = createRef();
    this.hdrNameRef = createRef();
    // mob mirrors state.mob for per-frame reads (no re-render on the hot path);
    // state.mob drives the JSX that must re-render on a breakpoint flip
    this.state = { mob: typeof window !== 'undefined' && window.innerWidth < MB_BP };
    this.mob = this.state.mob;
    this.dist = 0;
    this.p = 0; // smoothed scroll progress 0..1
    this.pRaw = 0;
    this.scrollV = 0;
    this.lastT = 0;
    this.raf = 0;
  }

  componentDidMount() {
    const c = this.canvasRef.current;
    this.ctx = c.getContext('2d');
    this.resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = window.innerWidth; this.H = window.innerHeight;
      this.mob = this.W < MB_BP;
      if (this.mob !== this.state.mob) this.setState({ mob: this.mob });
      // CSS size must track innerHeight — 100vh overshoots the visible viewport on
      // mobile Safari, which would stretch the drawing while the toolbar is up
      c.width = this.W * dpr; c.height = this.H * dpr;
      c.style.width = this.W + 'px'; c.style.height = this.H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gc = this.graphCanvasRef.current;
      if (gc) {
        gc.width = this.W * dpr; gc.height = this.H * dpr;
        gc.style.width = this.W + 'px'; gc.style.height = this.H + 'px';
        this.gctx = gc.getContext('2d');
        this.gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this.syncHeadlineWidth();
      this.makeRidges();
    };
    // deterministic pseudo-random tables
    this.rand = [];
    let seed = 1234;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 600; i++) this.rand.push(rnd());

    // ---- shared-sky model: projects are seeds; visitor records join later.
    // ?skyfill=N adds mock visitors (dev/QA) through the same occupancy grid
    // the Worker will use, so a filled sky is provable before the API exists.
    const fillN = Math.min(60, parseInt(new URLSearchParams(window.location.search).get('skyfill'), 10) || 0);
    this._fillN = fillN; // mock mode: skip the /api/sky fetch, keep the fill deterministic
    // density-adaptive layout: figure size and spread scale with the count —
    // a near-empty sky shows big, evenly spread figures; a filling one packs.
    const aScale = adaptiveScale(PROJECT_CONSTELLATIONS.length + fillN);
    const projMult = Math.max(1, Math.min(1.45, aScale / 0.09));
    this.skyRecords = PROJECT_CONSTELLATIONS.map((fig, i) => ({
      fig,
      place: { ...fig.place, scale: fig.place.scale * projMult },
      win: SKY_WINDOWS[i], project: true,
    }));
    if (fillN > 0) {
      const occupied = this.skyRecords.map((r) => r.place);
      for (let i = 0; i < fillN; i++) {
        const geom = PROJECT_CONSTELLATIONS[(i * 7 + 3) % PROJECT_CONSTELLATIONS.length];
        const scale = aScale * (0.72 + rnd() * 0.55);
        const place = placeInSky(occupied, scale, rnd);
        occupied.push(place);
        const w0 = 0.10 + (i / Math.max(fillN, 1)) * 0.62;
        this.skyRecords.push({
          fig: { name: SKYFILL_NAMES[i % SKYFILL_NAMES.length], stars: geom.stars, edges: geom.edges },
          place, win: [w0, w0 + 0.28], project: false,
          depth: 0.55 + rnd() * 0.45, // brightness layer — gives the filled sky depth
        });
      }
    }
    // sparks (rushing dashes on the snow)
    this.sparks = [];
    for (let i = 0; i < 150; i++) {
      this.sparks.push({ u: (rnd() - 0.5), o: rnd(), w: 0.6 + rnd() * 1.6, cold: rnd() > 0.55 });
    }
    // spray particles
    this.spray = [];
    for (let i = 0; i < 70; i++) this.spray.push({ a: rnd() * Math.PI * 2, s: 0.2 + rnd() * 0.8, o: rnd() });

    // landing spray: visceral crash explosion (radial bursts + lens splats)
    this.fines = [];
    for (let i = 0; i < 800; i++) {
      const type = rnd() > 0.35 ? 0 : 1; // 65% burst, 35% lens splats
      
      // Weighted glyph selection: more circles, plus coding symbols
      let glyph = 0;
      const rGlyph = rnd();
      if (rGlyph < 0.4) glyph = 3; // 40% circles/dots
      else if (rGlyph < 0.5) glyph = 0; // 10% solid square
      else if (rGlyph < 0.6) glyph = 1; // 10% hollow square
      else if (rGlyph < 0.7) glyph = 2; // 10% plus
      else {
        // 30% ASCII coding symbols
        const symbols = ['{', '}', '</>', '/', '*', ';', '[]'];
        glyph = symbols[Math.floor(rnd() * symbols.length)];
      }
      
      if (type === 0) {
        // radial burst from skis
        const angle = Math.PI * 1.5 + (rnd() - 0.5) * Math.PI * Math.pow(rnd(), 0.5) * 1.3; // skewed upwards
        const speed = 0.15 + Math.pow(rnd(), 2) * 1.8;
        this.fines.push({
          type: 0,
          glyph,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          o: rnd() * 0.25, // stagger start
          r: 2 + Math.pow(rnd(), 3) * 18,
          cold: rnd() > 0.75,
          rot: rnd() * Math.PI * 2, // initial rotation
          rotV: (rnd() - 0.5) * 0.5 // rotation speed
        });
      } else {
        // lens splats flying at camera
        this.fines.push({
          type: 1,
          glyph,
          x: rnd(),
          y: rnd(),
          o: 0.15 + rnd() * 0.45,
          r: 4 + rnd() * 25,
          cold: rnd() > 0.85,
          rot: rnd() * Math.PI * 2,
          rotV: (rnd() - 0.5) * 0.2
        });
      }
    }
    this.holeNoise = [];
    for (let i = 0; i < 40; i++) this.holeNoise.push(rnd());

    this.approachEl = document.querySelector('[data-screen-label="The approach"]');
    // TDK: an ordered lineage tree (dark-on-snow, right of "The approach")
    this.graphA = this.buildGraph({ seed: 92017, G: 6, counts: [1, 4, 6, 5, 3, 2], extra: 0, jitter: 0, nyJitter: 0 });
    // Sky constellation: wider, more nodes, irregular formation + cross-links (light-on-sky, airborne)
    // (former procedural graphSky removed — the night sky now charts the four
    // project constellations from src/constellation/projects.js)
    // Ovis patient-constellation engine (check-in conversations -> classifications)
    this.ovisEng = { elapsed: 0, convo: null, readings: [], next: 1.6, ix: 0 };
    this.lipEl = document.querySelector('[data-screen-label="The lip"]');
    this.llmEl = document.querySelector('[data-screen-label="LLM research"]');
    this.dropEl = document.querySelector('[data-screen-label="DropIn"]');
    this.takeEl = document.querySelector('[data-screen-label="Takeoff"]');
    this.airEl = document.querySelector('[data-screen-label="Airborne"]');
    this.landEl = document.querySelector('[data-screen-label="The landing"]');
    this.sections = Array.from(document.querySelectorAll('[data-reveal]'));
    // mobile: maps each data-beat copy block to the scroll element that scrubs it
    this.beatEls = { tdk: this.approachEl, ovis: this.lipEl, llm: this.llmEl, drop: this.dropEl };
    window.addEventListener('resize', this.resize);
    this.resize();
    this.raf = requestAnimationFrame(this.loop);

    // the shared sky: visitor constellations join the project seeds. Layout
    // is client-derived (records store only figures) — a seeded LCG over the
    // createdAt-sorted list keeps placement stable across reloads. Offline or
    // pre-deploy the fetch fails silently and the sky stays projects-only.
    if (!this._fillN) {
      fetch('/api/sky')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.constellations) && data.constellations.length) {
            this.applySkyFromApi(data.constellations);
          }
        })
        .catch(() => {});
    }
  }

  componentDidUpdate() {
    this.syncHeadlineWidth(); // breakpoint flips change font sizes under the width-matched headlines
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
  }

  // mobile: the motif only gets the scrub after the copy has left the frame
  mGrow(grow) {
    return this.mob ? Math.max(0, Math.min(1, (grow - MB_MOTIF0) / (1 - MB_MOTIF0))) : grow;
  }

  makeRidges() {
    // jagged mountain silhouettes near the horizon
    const n = 40;
    this.ridgeA = []; this.ridgeB = [];
    for (let i = 0; i <= n; i++) {
      const r1 = this.rand ? this.rand[(i * 7) % 600] : 0.5;
      const r2 = this.rand ? this.rand[(i * 13 + 3) % 600] : 0.5;
      this.ridgeA.push(r1);
      this.ridgeB.push(r2);
    }
  }

  loop = (t) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(Math.max((t - this.lastT) / 1000, 0), 0.05) || 0.016;
    this.lastT = t;

    const doc = document.documentElement;
    const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const pTarget = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    const prev = this.p;
    this.p += (pTarget - this.p) * Math.min(dt * 6, 1);
    const pv = (this.p - prev) / dt;
    this.scrollV += (pv - this.scrollV) * Math.min(dt * 4, 1);

    const carveAmp = Math.max(0, Math.min(2, this.props.carve ?? 1));
    const p = this.p;
    const pLip = this.progEl(this.lipEl);
    const pTake = this.progEl(this.takeEl);
    const pAir = this.progEl(this.airEl);
    const pLand = this.progEl(this.landEl);
    if (!this.sm) this.sm = { lip: pLip, take: pTake, air: pAir, land: pLand };
    const kk = Math.min(dt * 7, 1);
    const kkLand = Math.min(dt * 16, 1); // snappier — must never visibly lag behind the DOM section it gates
    this.sm.lip += (pLip - this.sm.lip) * kk;
    this.sm.take += (pTake - this.sm.take) * kk;
    this.sm.air += (pAir - this.sm.air) * kk;
    this.sm.land += (pLand - this.sm.land) * kkLand;

    const lipT = smooth(0.15, 1.5, this.sm.lip + this.sm.take);    // kicker rising ahead
    const straight = smooth(0.6, 1.2, this.sm.lip + this.sm.take); // stop carving before the lip
    const lift = smooth(1.0, 1.35, this.sm.take + this.sm.air);    // takeoff / airborne
    const stop = smooth(0.06, 0.2, this.sm.land);                  // hockey-stop: rotate + halt
    const impact = smooth(0.12, 0.8, this.sm.land);                // spray filling the screen
    const fullWhite = smooth(0.66, 0.88, this.sm.land);            // whiteout -> landing page
    const shake = (this.sm.land > 0.001 && this.sm.land < 0.5) ? Math.sin(this.sm.land * 70) * 20 * Math.exp(-this.sm.land * 9) : 0;

    // ---- DESCENT: apex (0) -> touchdown (1). Sculpture only shows late in the airborne stretch. ----
    const preLand = Math.min(this.sm.land / 0.12, 1);          // last stretch of the spacer, up to impact
    const airLate = smooth(0.7, 1, this.sm.air);               // long hang time before "You've made it"
    const descent = Math.min(1, airLate * 0.8 + preLand * 0.2);

    // ---- NIGHT: mid-air the dusk deepens to true night for the signature sky,
    // then lifts again before descent so the landing whiteout still reads
    const night = smooth(0.32, 0.58, this.sm.air) * (1 - smooth(0.80, 0.96, this.sm.air + preLand));
    this._night = night;

    // deceleration hits hard the instant "Send it" appears, reaches a crawl through
    // "Nothing but sky", then picks back up on descent toward the sculpture
    const decelStrength = Math.max(0, Math.min(1, this.props.decel ?? 0.92));
    const decelT = smooth(0.05, 0.7, this.sm.take + this.sm.air * 0.5);
    const crawlFloor = 0.012 + 0.15 * (1 - decelStrength);
    const regain = smooth(0.3, 1, descent);
    const airSlow = Math.max(crawlFloor, 1 - (1 - crawlFloor) * decelT + 2.4 * regain * decelT);
    const speed = (0.55 + p * 1.5 + Math.min(Math.abs(this.scrollV) * 5, 2.5)) * airSlow * Math.pow(1 - stop, 2) * (1 - impact);
    this.dist += speed * dt;
    const d = this.dist;

    const carve = carveAmp * (1 - straight);
    const sway = Math.sin(d * 1.05) * carve;
    const roll = Math.cos(d * 1.05) * 0.055 * carve;
    const bob = Math.sin(d * 2.1) * 3 * (1 - lift) + Math.sin(t * 0.02) * lift * 0.5;

    const ctx = this.ctx, W = this.W, H = this.H;
    const fall = smooth(0.0, 0.12, this.sm.land);
    // gaze tilts upward mid-sky (horizon sinks, sky fills the frame), then back down for descent
    const upGaze = smooth(0.1, 0.45, this.sm.air) * (1 - smooth(0.72, 0.92, this.sm.air + preLand));
    // falling: pitch down hard onto the tracks — horizon climbs, slope fills the frame
    const downGaze = smooth(0.1, 0.85, descent);
    const horizon = Math.max(H * 0.09, H * (0.26 + lift * 0.5 * (1 - fall * 0.75) + upGaze * 0.38 * (1 - fall) - downGaze * 0.58)) + bob;
    const vpx = W * 0.5 + sway * W * 0.11;

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(roll);
    ctx.scale(1.1, 1.1);
    ctx.translate(-W / 2, -H / 2);

    // ---- SKY ----
    const skyMode = this.props.sky ?? 'dusk';
    const sg = ctx.createLinearGradient(0, -H * 0.1, 0, horizon + 10);
    if (skyMode === 'bluebird') {
      sg.addColorStop(0, '#6ea6e0'); sg.addColorStop(1, '#dcebf8');
    } else {
      sg.addColorStop(0, '#8fb3d9'); sg.addColorStop(0.65, '#c9d6e2'); sg.addColorStop(1, '#f2dcc2');
    }
    ctx.fillStyle = sg;
    ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, horizon + 10 + H * 0.1);

    // overhead deep blue when airborne + gazing up — gives contrast for the white copy
    if (lift > 0.01) {
      const deepA = Math.min(0.92, lift * (0.55 + upGaze * 0.8)) * (1 - fall);
      const deep = ctx.createLinearGradient(0, -H * 0.1, 0, H * 1.05);
      deep.addColorStop(0, `rgba(34,66,114,${deepA.toFixed(3)})`);
      deep.addColorStop(0.65, `rgba(52,88,140,${(deepA * 0.85).toFixed(3)})`);
      deep.addColorStop(1, `rgba(70,104,152,${(deepA * 0.45).toFixed(3)})`);
      ctx.fillStyle = deep;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, horizon + 10 + H * 0.1);
    }

    if (skyMode === 'dusk' && lift < 0.98) {
      ctx.globalAlpha = 1 - lift;
      const sun = ctx.createRadialGradient(W * 0.18, horizon - 8, 0, W * 0.18, horizon - 8, W * 0.4);
      sun.addColorStop(0, 'rgba(255,214,160,0.55)'); sun.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, horizon + 10 + H * 0.1);
      ctx.globalAlpha = 1;
    }

    // ---- NIGHT SKY (signature beat) — the dusk deepens to true night ----
    if (night > 0.01) {
      const na = night * (1 - fall);
      const ng = ctx.createLinearGradient(0, -H * 0.1, 0, H * 1.05);
      ng.addColorStop(0, `rgba(6,12,30,${(na * 0.96).toFixed(3)})`);
      ng.addColorStop(0.55, `rgba(10,20,44,${(na * 0.9).toFixed(3)})`);
      ng.addColorStop(1, `rgba(20,34,62,${(na * 0.62).toFixed(3)})`);
      ctx.fillStyle = ng;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);

      // ambient field stars — static positions, gentle seconds-based twinkle
      const sec = t * 0.001;
      for (let i = 0; i < 90; i++) {
        const rx = this.rand[(i * 2) % 600], ry = this.rand[(i * 2 + 1) % 600];
        const sx = -W * 0.1 + rx * W * 1.2;
        const sy = -H * 0.1 + ry * H * 0.92;
        const tw = 0.55 + 0.45 * Math.sin(sec * (0.6 + rx) + i * 1.7);
        const sa = na * (0.14 + 0.5 * this.rand[(i * 3 + 5) % 600]) * tw;
        if (sa <= 0.02) continue;
        ctx.fillStyle = `rgba(226,236,250,${sa.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(sx, sy, 0.6 + this.rand[(i * 5 + 11) % 600] * 1.1, 0, 7); ctx.fill();
      }
    }

    // ---- RIDGES ----
    this.drawRidge(ctx, this.ridgeB, horizon, W, 34, 'rgba(90,102,116,0.55)');
    this.drawRidge(ctx, this.ridgeA, horizon, W, 18, 'rgba(58,68,80,0.8)');

    // ---- SLOPE BASE ----
    const slope = ctx.createLinearGradient(0, horizon, 0, H * 1.1);
    slope.addColorStop(0, '#dfe6ef'); slope.addColorStop(0.4, '#eef2f7'); slope.addColorStop(1, '#f7f9fc');
    ctx.fillStyle = slope;
    ctx.fillRect(-W * 0.1, horizon, W * 1.2, H * 1.2 - horizon);

    // warm light band across the slope (low sun)
    if (skyMode === 'dusk') {
      const warm = ctx.createLinearGradient(0, horizon, W, H);
      warm.addColorStop(0, 'rgba(255,225,190,0.16)'); warm.addColorStop(0.5, 'rgba(255,225,190,0)');
      ctx.fillStyle = warm;
      ctx.fillRect(-W * 0.1, horizon, W * 1.2, H * 1.2 - horizon);
    }

    // ---- GROOVES (fan of corduroy lines) ----
    const N = 110;
    const bend = -Math.sin(d * 1.05) * W * 0.05 * carve;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N - 0.5;
      const r = this.rand[i % 600];
      const bx = vpx + u * W * 3.4;
      const w = 0.8 + r * 6.5;
      const cold = this.rand[(i * 3 + 1) % 600] > 0.5;
      const a = 0.07 + this.rand[(i * 5 + 2) % 600] * 0.2;
      ctx.fillStyle = cold ? `rgba(168,188,214,${a})` : `rgba(255,251,243,${a + 0.08})`;
      const midY = horizon + (H - horizon) * 0.5;
      const cx = vpx + u * W * 1.4 + bend;
      ctx.beginPath();
      ctx.moveTo(vpx, horizon + 1);
      ctx.quadraticCurveTo(cx - w * 0.5, midY, bx - w, H + 60);
      ctx.lineTo(bx + w, H + 60);
      ctx.quadraticCurveTo(cx + w * 0.5, midY, vpx, horizon + 1);
      ctx.fill();
    }

    // ---- CROSS RIPPLES (rushing toward viewer) ----
    for (let k = 0; k < 7; k++) {
      const s = ((d * 0.55 + k / 7) % 1);
      const f = Math.pow(s, 2.8);
      const y = horizon + (H + 80 - horizon) * f;
      ctx.strokeStyle = `rgba(140,162,192,${0.10 * s})`;
      ctx.lineWidth = 1 + f * 3;
      ctx.beginPath();
      ctx.moveTo(vpx - W * 1.7 * f, y + 20 * f);
      ctx.quadraticCurveTo(vpx + bend * f, y - 26 * f, vpx + W * 1.7 * f, y + 20 * f);
      ctx.stroke();
    }

    // ---- SPARKS (speed dashes) ----
    const rush = 0.5 + p * 1.2 + Math.min(Math.abs(this.scrollV) * 4, 2);
    for (const sp of this.sparks) {
      const s = ((d * 0.5 * (0.7 + sp.w * 0.3) + sp.o) % 1);
      const f = Math.pow(s, 2.8);
      const f2 = Math.pow(Math.min(s + 0.015 + 0.02 * rush * f, 1), 2.8);
      const x1 = vpx + sp.u * W * 3.4 * f + bend * f;
      const y1 = horizon + (H + 60 - horizon) * f;
      const x2 = vpx + sp.u * W * 3.4 * f2 + bend * f2;
      const y2 = horizon + (H + 60 - horizon) * f2;
      ctx.strokeStyle = sp.cold ? `rgba(150,175,205,${0.35 * s})` : `rgba(255,255,255,${0.5 * s})`;
      ctx.lineWidth = sp.w * (0.4 + f * 1.6);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // ---- THE LIP / KICKER ----
    if (lipT > 0.001) {
      const rise = lipT * H * 0.16 * (1 - lift);
      const baseY = horizon + 6;
      // sunlit face
      const lipGrad = ctx.createLinearGradient(0, baseY - rise, 0, baseY + H * 0.12);
      lipGrad.addColorStop(0, '#ffffff'); lipGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lipGrad;
      ctx.beginPath();
      ctx.moveTo(-W * 0.1, baseY + 20);
      ctx.quadraticCurveTo(vpx - W * 0.22, baseY - rise * 0.4, vpx, baseY - rise);
      ctx.quadraticCurveTo(vpx + W * 0.22, baseY - rise * 0.4, W * 1.1, baseY + 20);
      ctx.lineTo(W * 1.1, baseY + H * 0.14);
      ctx.lineTo(-W * 0.1, baseY + H * 0.14);
      ctx.closePath();
      ctx.fill();
      // crest shadow
      ctx.strokeStyle = `rgba(120,145,178,${0.5 * lipT * (1 - lift)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(vpx - W * 0.3, baseY - rise * 0.25);
      ctx.quadraticCurveTo(vpx, baseY - rise * 1.05, vpx + W * 0.3, baseY - rise * 0.25);
      ctx.stroke();
    }

    // ---- SIDE SHADING ----
    const shL = ctx.createLinearGradient(0, 0, W * 0.32, 0);
    shL.addColorStop(0, 'rgba(84,112,150,0.20)'); shL.addColorStop(1, 'rgba(84,112,150,0)');
    ctx.fillStyle = shL; ctx.fillRect(-W * 0.1, horizon, W * 0.42, H * 1.2 - horizon);
    const shR = ctx.createLinearGradient(W, 0, W * 0.68, 0);
    shR.addColorStop(0, 'rgba(84,112,150,0.20)'); shR.addColorStop(1, 'rgba(84,112,150,0)');
    ctx.fillStyle = shR; ctx.fillRect(W * 0.58, horizon, W * 0.52, H * 1.2 - horizon);


    // ---- SNOW SPRAY ----
    if ((this.props.spray ?? true) && lift < 0.99) {
      const burst = 0.25 + Math.abs(Math.cos(d * 1.05)) * carve * 0.6 + lift * 1.5;
      for (const q of this.spray) {
        const life = ((d * (1.2 + q.s) + q.o) % 1);
        const rr = life * (H * 0.4) * (0.5 + q.s);
        const ang = q.a * 0.35 + Math.PI * 0.5 + (q.a > Math.PI ? 0.8 : -0.8);
        const px = (q.a > Math.PI ? W * 0.12 : W * 0.88) + Math.cos(ang) * rr * (q.a > Math.PI ? 1 : -1);
        const py = H * 1.02 - Math.sin(ang) * rr;
        const al = (1 - life) * 0.5 * burst;
        if (al > 0.02) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(al, 0.8)})`;
          ctx.beginPath(); ctx.arc(px, py, 1 + q.s * 2.4 * life, 0, 7); ctx.fill();
        }
      }
    }

    // ---- AIRBORNE WHITE FLASH + falling flakes ----
    // the white wash fights the night sky — fade it out as night deepens
    if (lift > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(lift * 0.12 * (1 - night)).toFixed(3)})`;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
    }

    ctx.restore();

    // ---- LANDING IMPACT (screen space) ----
    if (impact > 0.001) {
      ctx.save();
      ctx.translate(shake * 0.5, shake);
      this.drawImpact(ctx, W, H, impact, fullWhite, t);
      ctx.restore();
    }

    // ---- VIGNETTE (screen space) ----
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(20,30,45,0)'); vg.addColorStop(1, `rgba(20,30,45,${(0.22 * (1 - fullWhite)).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // ---- TEXT REVEAL ----
    for (const el of this.sections) {
      const r = el.getBoundingClientRect();
      const dd = (r.top + r.height / 2 - H / 2) / H;
      let op = Math.max(0, Math.min(1, 1 - Math.abs(dd) * 1.7));
      let ty = dd * 60;
      // mobile beats hand the frame from copy to motif: lift the copy out mid-scrub
      if (this.mob && el.dataset.beat) {
        const out = smooth(MB_OUT0, MB_OUT1, this.scrubTall(this.beatEls[el.dataset.beat]).grow);
        op *= 1 - out;
        ty -= out * 50;
      }
      el.style.opacity = op.toFixed(3);
      el.style.transform = `translateY(${ty.toFixed(1)}px)`;
    }

    // ---- PERSISTENT BEAT TITLE (mobile) ----
    // the project name the copy just showed rises into a pinned header and owns the
    // motif forming below it, so the diagram never reads as detached
    if (this.hdrRef.current) {
      let best = 0, key = '';
      if (this.mob && this.beatEls) {
        for (const k in this.beatEls) {
          const s = this.scrubTall(this.beatEls[k]);
          const a = smooth(MB_HDR0, MB_HDR1, s.grow) * s.vis;
          if (a > best) { best = a; key = k; }
        }
      }
      const hdr = this.hdrRef.current;
      hdr.style.opacity = best.toFixed(3);
      // slight settle: title drifts up into place as it fades in
      hdr.style.transform = `translateY(${((1 - best) * 12).toFixed(1)}px)`;
      if (key && this._hdrKey !== key) {
        this._hdrKey = key;
        const tt = MB_TITLE[key];
        this.hdrKickRef.current.textContent = tt.kick;
        this.hdrNameRef.current.textContent = tt.sub ? `${tt.name} · ${tt.sub}` : tt.name;
      }
    }

    // ---- SIGNATURE FORM (DOM overlay, not canvas) ----
    // Choreography: the project chart forms and HOLDS first (viewing beat),
    // then the invite fades in while the chart dims to ~38% — never to zero.
    this._sigVis = smooth(0.66, 0.76, this.sm.air) * (1 - smooth(0.80, 0.92, this.sm.air + preLand));
    if (this.sigRef.current) {
      // while a constellation is forming, the form steps back (dim, inert),
      // fading on the same smooth curve the sky's clearing uses
      const sa = this._sigVis * (1 - 0.94 * (this._formExpand || 0));
      const sig = this.sigRef.current;
      sig.style.opacity = sa.toFixed(3);
      sig.style.pointerEvents = sa > 0.5 ? 'auto' : 'none';
      sig.style.transform = `translate(-50%, calc(-50% + ${((1 - sa) * 26).toFixed(1)}px))`;
      if (sa < 0.5 && this.sigInputRef.current === document.activeElement) {
        this.sigInputRef.current.blur();
      }
      // generation takes seconds — keep the wait alive with a slow pulse
      if (this._pending && this.sigStatusRef.current) {
        this.sigStatusRef.current.textContent = 'charting the sky ' + '·'.repeat(1 + (Math.floor(t / 450) % 3));
      }
    }
    // nav re-inks pale while the sky is night so it stays legible
    if (this.navRef.current) {
      const pale = night > 0.55;
      if (this._navPale !== pale) {
        this._navPale = pale;
        const nav = this.navRef.current;
        nav.style.setProperty('--nav-ink', pale ? '#f4f8fd' : '#17222f');
        nav.style.setProperty('--nav-line', pale ? 'rgba(201,214,226,0.45)' : '#4a5c72');
        nav.style.setProperty('--nav-hover', pale ? '#c9d6e2' : '#4a5c72');
      }
    }

    // ---- HUD ----
    if (this.spdRef.current) {
      const kmh = Math.max(0, Math.round((28 + p * 54 + Math.min(Math.abs(this.scrollV) * 60, 20)) * Math.pow(1 - stop, 2)));
      this.spdRef.current.textContent = 'SPD ' + String(kmh).padStart(2, '0') + ' KM/H';
      const lipM = Math.max(0, Math.round(400 * (1 - (this.sm.lip + this.sm.take) / 1.7)));
      let label;
      if (stop > 0.3) label = 'LANDING PAGE';
      else if (descent > 0.015) label = 'LZ ' + Math.max(0, Math.round(240 * (1 - descent))) + ' M';
      else if (lift > 0.5) label = 'AIRBORNE';
      else label = 'LIP ' + lipM + ' M';
      this.distRef.current.textContent = label;
      const lzClose = descent > 0.015 && 240 * (1 - descent) < 30;
      this.distRef.current.style.color = (lzClose || (stop <= 0.3 && lift <= 0.5 && lipM < 80)) ? '#b8452e' : '';
    }
    // mobile: the run's over at the whiteout, so retire the telemetry HUD before it
    // collides with the contact footer (it stays pinned on desktop)
    if (this.hudRef.current) {
      this.hudRef.current.style.opacity = this.mob ? (1 - fullWhite).toFixed(3) : '1';
    }

    // ---- PROJECT GRAPHS : TDK lineage tree (right of "The approach") + sky constellation (airborne) ----
    // chart formation completes by mid-dwell so it gets a clean viewing hold
    // (sm.air ~0.55–0.66) before the invite arrives at 0.66
    this._skyGrow = smooth(0.08, 0.55, this.sm.air);
    this._skyVis = Math.max(0, Math.min(1, lift)) * (1 - smooth(0.1, 0.55, descent));
    this.drawGraph(t);
    // Ovis patient constellation + wellness dial (left of "It rises ahead")
    this.drawOvis(t, dt);
    // LLM research: grounded repair constellation (right of the LLM copy)
    this.drawLLM(t);
    // DropIn: low-poly plexus rider ollies through the frame (left of copy)
    this.drawDropIn(t);
  };

  syncHeadlineWidth() {
    this.syncTwoLineHeadline(this.tdkRef, this.mlRef);
    this.syncTwoLineHeadline(this.ovisRef, this.medRef);
    this.syncTwoLineHeadline(this.llmRef, this.llmSubRef);
    this.syncTwoLineHeadline(this.dropRef, this.dropSubRef);
  }

  syncTwoLineHeadline(shortRef, longRef) {
    const short = shortRef.current, long = longRef.current;
    if (!short || !long) return;
    short.style.fontSize = HEADLINE_SIZE; // reset to base clamp before measuring
    const basePx = parseFloat(getComputedStyle(short).fontSize);
    const shortWidth = short.getBoundingClientRect().width;
    const longWidth = long.getBoundingClientRect().width;
    if (shortWidth > 0 && longWidth > 0) {
      short.style.fontSize = (basePx * (longWidth / shortWidth)) + 'px';
    }
  }

  // Rebuild the sky from API records: project seeds + one placed panel per
  // visitor figure, density-adaptive exactly like the ?skyfill mock path.
  // Records this visitor signed are merged from localStorage until the
  // server list includes them — the edge caches /api/sky ~5 min and KV
  // lists are eventually consistent, and "my constellation vanished on
  // refresh" is the one staleness that must never happen.
  applySkyFromApi = (records) => {
    try {
      const own = JSON.parse(localStorage.getItem('sky-own') || '[]');
      if (own.length) {
        const have = new Set(records.map((r) => r.id));
        const pending = own.filter((r) => r.id && !have.has(r.id) && Date.now() - (r.savedAt || 0) < 86400e3);
        if (pending.length !== own.length) {
          localStorage.setItem('sky-own', JSON.stringify(pending));
        }
        records = records.concat(pending);
      }
    } catch { /* no storage (private mode) — server list only */ }
    const aScale = adaptiveScale(PROJECT_CONSTELLATIONS.length + records.length);
    const projMult = Math.max(1, Math.min(1.45, aScale / 0.09));
    const recs = PROJECT_CONSTELLATIONS.map((fig, i) => ({
      fig,
      place: { ...fig.place, scale: fig.place.scale * projMult },
      win: SKY_WINDOWS[i], project: true,
    }));
    let s = 88911;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const occupied = recs.map((rec) => rec.place);
    records.forEach((rec, i) => {
      if (!rec || !Array.isArray(rec.stars) || !Array.isArray(rec.edges)) return;
      const scale = aScale * (0.72 + r() * 0.55);
      const place = placeInSky(occupied, scale, r);
      occupied.push(place);
      const w0 = 0.10 + (i / Math.max(records.length, 1)) * 0.62;
      recs.push({
        fig: { name: rec.name, stars: rec.stars, edges: rec.edges },
        place, win: [w0, Math.min(w0 + 0.28, 0.999)],
        project: false, depth: 0.55 + r() * 0.45,
      });
    });
    this.skyRecords = recs;
  };

  // Enter submits the description and starts the forming animation.
  onSignatureKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const value = e.target.value.trim();
    if (!value) return;
    this.startSignature(value);
    e.target.blur();
  };

  setSigStatus = (msg) => {
    const el = this.sigStatusRef.current;
    if (!el) return;
    el.textContent = msg || 'press enter · it stays here for everyone after you';
    el.style.color = msg ? 'rgba(255,214,160,0.8)' : 'rgba(201,214,226,0.4)';
  };

  // POST the description; the pipeline moderates, renders and persists.
  // Friendly failures re-open the form; infra failures degrade to the local
  // procedural sketch so the reveal still happens (just not persisted).
  startSignature = (value) => {
    if (this._signing || this._pending) return;
    this._pending = true;
    this.setSigStatus('charting the sky…');
    if (this.sigInputRef.current) this.sigInputRef.current.disabled = true;
    // instant feedback: stars gather in the clearing right away — the LLM's
    // figure will form FROM them (drawGraph morphs each to a star position)
    const gh = [...value].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7) || 1;
    let gs = gh;
    const gr = () => { gs = (gs * 1664525 + 1013904223) >>> 0; return gs / 4294967296; };
    this._gather = {
      born: null, dyingAt: null, targets: null,
      stars: Array.from({ length: 10 }, () => ({
        x: 0.14 + gr() * 0.72, y: 0.12 + gr() * 0.62,
        size: 0.55 + gr() * 0.6, w: 1.6 + gr() * 2.4, p: gr() * Math.PI * 2,
      })),
    };
    fetch('/api/sign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: value }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.record) return this.beginForming(body.record);
        const err = body.error || '';
        if (err === 'rejected') return this.failSignature('the sky declined that one — try something else');
        if (err === 'rate-limited') return this.failSignature('one constellation at a time — try again in a few minutes');
        if (err === 'turnstile-failed') return this.failSignature('couldn’t verify you’re human — reload and try again');
        if (res.status === 400) return this.failSignature('try something shorter and simpler');
        // sky-is-full / generation flake / moderation outage → degraded mode
        return this.beginForming(this.proceduralRecord(value));
      })
      .catch(() => this.beginForming(this.proceduralRecord(value)));
  };

  failSignature = (msg) => {
    this._pending = false;
    this.setSigStatus(msg);
    if (this.sigInputRef.current) this.sigInputRef.current.disabled = false;
    if (this._gather) this._gather.dyingAt = performance.now();
  };

  beginForming = (record) => {
    this._pending = false;
    this.setSigStatus(null);
    if (this.sigInputRef.current) this.sigInputRef.current.disabled = false;
    // persisted records (id = API path; procedural fallbacks have none)
    // survive refresh via localStorage until the server list catches up
    if (record.id) {
      try {
        const own = JSON.parse(localStorage.getItem('sky-own') || '[]');
        own.push({ id: record.id, name: record.name, stars: record.stars, edges: record.edges, savedAt: Date.now() });
        localStorage.setItem('sky-own', JSON.stringify(own.slice(-20)));
      } catch { /* no storage — the reveal still plays, it just won't outlive the tab */ }
    }
    const h = [...record.name].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7) || 1;
    let s = h;
    const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const occupied = this.skyRecords.map((rec) => rec.place);
    const scale = adaptiveScale(this.skyRecords.length + 1) * (0.78 + r() * 0.5);
    this._signing = {
      fig: { name: record.name, stars: record.stars, edges: record.edges },
      place: placeInSky(occupied, scale, r),
      born: null,
    };
    // hand each constellation star its nearest gather star to morph from
    if (this._gather) {
      const gs = this._gather.stars;
      this._gather.targets = record.stars.map((st) => {
        let best = 0, bd = 1e9;
        for (let j = 0; j < gs.length; j++) {
          const d = Math.hypot(gs[j].x - st.x, gs[j].y - st.y);
          if (d < bd) { bd = d; best = j; }
        }
        gs[best].used = true;
        return {
          sx: gs[best].x, sy: gs[best].y, ssize: gs[best].size,
          w: gs[best].w, p: gs[best].p,
          tx: st.x, ty: st.y, tsize: st.size,
        };
      });
    }
  };

  // zero-server fallback (design doc: degraded mode): hash-seeded variation
  // of a project geometry — same record shape, same animation, not persisted.
  proceduralRecord = (value) => {
    const h = [...value].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7) || 1;
    let s = h;
    const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const geom = PROJECT_CONSTELLATIONS[h % PROJECT_CONSTELLATIONS.length];
    const stars = geom.stars.map((st) => ({
      id: st.id,
      x: Math.max(0, Math.min(1, st.x + (r() - 0.5) * 0.09)),
      y: Math.max(0, Math.min(1, st.y + (r() - 0.5) * 0.09)),
      size: Math.max(0.5, Math.min(2, st.size * (0.85 + r() * 0.4))),
    }));
    return { name: value, stars, edges: geom.edges };
  };

  progEl(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const H = this.H || window.innerHeight;
    return Math.max(0, Math.min(1, (H * 0.5 - r.top) / Math.max(r.height, 1)));
  }

  // tall sticky sections: copy pins while scroll scrubs the animation.
  // grow runs from half-entry to ~88% of the pinned phase; vis fades at both ends
  scrubTall(el, frac = 0.88) {
    if (!el) return { grow: 0, vis: 0 };
    const H = this.H;
    const r = el.getBoundingClientRect();
    const grow = Math.max(0, Math.min(1, (H * 0.5 - r.top) / ((r.height - H * 0.5) * frac)));
    const vis = Math.max(0, Math.min(1, (H - r.top) / (H * 0.45)))
              * Math.max(0, Math.min(1, (r.top + r.height) / (H * 0.55)));
    return { grow, vis };
  }

  buildGraph(cfg) {
    // deterministic aesthetic graph. jitter/nyJitter break the layered look; extra = cross-links (web)
    const { seed, G, counts, extra = 0, jitter = 0, nyJitter = 0 } = cfg;
    let s = seed;
    const rr = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const nodes = [];
    const genStart = [];
    for (let g = 0; g < G; g++) {
      genStart[g] = nodes.length;
      const n = counts[g];
      for (let i = 0; i < n; i++) {
        let nx = n === 1 ? 0.5 : 0.06 + 0.88 * (i / (n - 1));
        nx += (rr() - 0.5) * 0.12;
        nx = Math.max(0.03, Math.min(0.97, nx));
        let ny = G === 1 ? 0.5 : g / (G - 1);
        ny += (rr() - 0.5) * nyJitter;
        ny = Math.max(0.02, Math.min(0.98, ny));
        let parent = -1;
        if (g > 0) {
          let best = -1, bd = 1e9;
          for (let pi = genStart[g - 1]; pi < genStart[g]; pi++) {
            const d = Math.abs(nodes[pi].nx - nx) + rr() * 0.09;
            if (d < bd) { bd = d; best = pi; }
          }
          parent = best;
        }
        let reveal = (g / G) * 0.72 + (rr() - 0.5) * jitter;
        reveal = Math.max(0, Math.min(0.92, reveal));
        nodes.push({ gen: g, nx, ny, r: 0.32 + rr() * 0.42, parent, winner: false, reveal, accent: rr() > 0.8 });
      }
    }
    // winner lineage: pick the most-central leaf so the highlighted line resolves near center
    let cur = genStart[G - 1], cbd = 1e9;
    for (let li = genStart[G - 1]; li < nodes.length; li++) {
      const d = Math.abs(nodes[li].nx - 0.5);
      if (d < cbd) { cbd = d; cur = li; }
    }
    const winnerPath = [];
    while (cur !== -1) { nodes[cur].winner = true; nodes[cur].r = Math.max(nodes[cur].r, 0.72 + rr() * 0.28); winnerPath.unshift(cur); cur = nodes[cur].parent; }
    // long recombination arc across the graph
    const cross = { from: genStart[1] + Math.floor(rr() * counts[1]), to: genStart[G - 2] + Math.floor(rr() * counts[G - 2]) };
    // extra cross-connections make it a web, not layers
    const links = [];
    for (let k = 0; k < extra; k++) {
      const a = Math.floor(rr() * nodes.length);
      let b = Math.floor(rr() * nodes.length);
      if (b === a) b = (b + 1) % nodes.length;
      if (nodes[a].parent === b || nodes[b].parent === a) continue;
      links.push({ a, b, accent: rr() > 0.7 });
    }
    return { nodes, links, winnerPath, cross, G };
  }

  drawGraph(t) {
    const gctx = this.gctx;
    if (!gctx) return;
    const W = this.W, H = this.H;
    gctx.clearRect(0, 0, W, H);

    // TDK lineage tree — dark-on-snow, right of "The approach" (mobile: full-frame after the copy)
    if (this.approachEl && this.graphA) {
      const s = this.scrubTall(this.approachEl);
      const grow = this.mGrow(s.grow), vis = s.vis;
      if (vis > 0.002 && grow > 0.002) {
        // mobile top stays under the horizon band so the tree sits on snow while the lip rises
        const panel = this.mob
          ? { x0: W * 0.10, x1: W * 0.90, y0: H * 0.30, y1: H * 0.88 }
          : { x0: W * 0.54, x1: W * 0.93, y0: H * 0.18, y1: H * 0.82 };
        this.renderGraph(this.graphA, { grow, vis, t, dark: true, panel });
      }
    }

    // Night-sky star chart — the four project constellations form in career
    // order across the airborne dwell, drawn through the shared visitor-
    // constellation renderer (same grammar the signature beat uses)
    if (this._skyVis > 0.002 && this.skyRecords) {
      const sec = t * 0.001;
      const smoothW = (a, b, v) => {
        const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
        return x * x * (3 - 2 * x);
      };
      const m = skyToScreen(W, H);
      const sig = this._sigVis || 0;
      // Signature phases, computed up front: the clearing EXPANDS smoothly
      // with the forming and CONTRACTS as the drift completes, so neither
      // the neighbors nor the joining figure ever jump (the join frame has
      // formExpand === 0 → same offset basis as a settled record).
      let sgnGrow = 0, sgnDrift = 0, formExpand = 0;
      if (this._signing) {
        const sgn = this._signing;
        if (sgn.born === null) sgn.born = t;
        const age = (t - sgn.born) / 1000;
        sgnGrow = smoothW(0.1, 3.2, age);
        sgnDrift = smoothW(4.2, 6.4, age);
        formExpand = smoothW(0, 1.1, age) * (1 - sgnDrift);
      }
      // gather phase (LLM in flight): the clearing opens partway so the
      // instant-feedback stars have room; hands off to the forming curve
      // (max) with no contraction, and eases shut if the submission fails
      if (this._gather) {
        const g = this._gather;
        const gAge = g.born === null ? 0 : (t - g.born) / 1000;
        const dieK = g.dyingAt ? 1 - smoothW(0, 0.5, (t - g.dyingAt) / 1000) : 1;
        formExpand = Math.max(formExpand, smoothW(0, 0.8, gAge) * 0.35 * dieK * (1 - sgnDrift));
      }
      this._formExpand = formExpand;
      // the invite's reserved zone (screen space) — the sky parts around it;
      // while a signature forms it grows to hold the center-stage figure.
      // mobile: anchored at the raised form (MB_SIG_Y) and capped to the viewport —
      // the desktop 330px half-width would evacuate the whole portrait sky
      const cs = Math.max(m.s * 0.16, Math.min(W, H) * 0.52); // center-stage size — the reveal owns the sky
      const fy = H * (this.mob ? MB_SIG_Y : 0.5);
      const hx0 = this.mob ? Math.min(330, W * 0.44) : 330;
      const hy = this.mob ? Math.min(150, H * 0.18) : 150;
      const hx = hx0 + (Math.max(hx0, cs * 0.7) - hx0) * formExpand;
      const formRect = {
        x0: W / 2 - hx, x1: W / 2 + hx,
        y0: fy - hy - (cs - 20) * formExpand,
        y1: fy + hy,
      };
      // two passes: compute parted panels, cap pairwise overlap, then draw
      const visible = [];
      for (const rec of this.skyRecords) {
        const grow = smoothW(rec.win[0], rec.win[1], this._skyGrow);
        if (grow <= 0.002) continue;
        const panel = skyPanel(rec.place, m);
        const off = partingOffset(panel, formRect, sig);
        visible.push({ rec, grow, panel: { x0: panel.x0 + off.dx, y0: panel.y0 + off.dy, w: panel.w, h: panel.h } });
      }
      separatePanels(visible.map((v) => v.panel));
      for (const { rec, grow, panel: shifted } of visible) {
        // figures still overlapping the zone after parting dim locally;
        // the rest of the sky keeps (nearly) full brightness
        const still = sig > 0.01 &&
          shifted.x0 < formRect.x1 && shifted.x0 + shifted.w > formRect.x0 &&
          shifted.y0 < formRect.y1 && shifted.y0 + shifted.h > formRect.y0;
        const alpha = this._skyVis * (rec.depth ?? 1) * (1 - (still ? 0.55 : 0.12) * sig);
        // label only when the caps text fits its figure's footprint —
        // long names on small figures spill into neighbors and read as mess.
        // mobile: projects always keep their names (they anchor the beat);
        // visitors get a relaxed spill allowance — portrait's vertical gaps absorb it
        const labelFits = this.mob
          ? (rec.project ? shifted.w > 40 : shifted.w > 52 && rec.fig.name.length * 7.4 < shifted.w * 1.8)
          : shifted.w > 64 && rec.fig.name.length * 7.4 < shifted.w * 1.3;
        drawConstellation(gctx, rec.fig.stars, rec.fig.edges, shifted, {
          t: sec, grow, alpha,
          label: labelFits ? rec.fig.name : null,
          labelAlpha: rec.project ? 0.75 : 0.5,
          newestId: rec.newestId ?? null,
          rot: skyLean(rec.place),
        });
      }

      // ---- SIGNATURE FORMING: the visitor's figure draws itself in the
      // parted clearing above the input, holds with its name, then drifts
      // to its placed spot. Drift targets the CURRENT parted position of
      // its panel, so joining skyRecords at the end is seamless.
      if (this._signing) {
        const sgn = this._signing;
        const grow = sgnGrow;
        const drift = sgnDrift;
        const target = skyPanel(sgn.place, m);
        const tOff = partingOffset(target, formRect, sig);
        const tx = target.x0 + tOff.dx, ty = target.y0 + tOff.dy;
        const cx0 = W / 2 - cs / 2;
        const cy0 = Math.max(H * 0.05, fy - 140 - cs); // above the invite, clamped on-screen
        const panel = {
          x0: cx0 + (tx - cx0) * drift,
          y0: cy0 + (ty - cy0) * drift,
          w: cs + (target.w - cs) * drift,
          h: cs + (target.h - cs) * drift,
        };
        drawConstellation(gctx, sgn.fig.stars, sgn.fig.edges, panel, {
          t: sec, grow, alpha: this._skyVis,
          label: sgn.fig.name, labelAlpha: 0.7,
          rot: skyLean(sgn.place) * drift, // upright center-stage, leans in as it settles
        });
        if (drift >= 1) {
          this.skyRecords.push({
            fig: sgn.fig, place: sgn.place, win: [0, 0.001],
            project: false, depth: 0.95,
          });
          this._signing = null;
          if (this.sigInputRef.current) this.sigInputRef.current.value = '';
        }
      }

      // ---- GATHER STARS: instant feedback while the LLM works. On submit a
      // handful of stars fade into the clearing and hover; when the figure
      // arrives each glides to its assigned star position and crossfades out
      // exactly as the real star's draw-on stagger reaches it, so the
      // constellation appears to form FROM them. On failure they disperse.
      if (this._gather) {
        const g = this._gather;
        if (g.born === null) g.born = t;
        const gAge = (t - g.born) / 1000;
        const cx0g = W / 2 - cs / 2;
        const cy0g = Math.max(H * 0.05, fy - 140 - cs);
        const baseR = cs * 0.018;
        const star = (ux, uy, size, a, w, p) => {
          const x = cx0g + ux * cs, y = cy0g + uy * cs;
          const tw = 1 + Math.sin(t * 0.0023 * w + p) * 0.16;
          const rad = baseR * (0.5 + size * 0.75) * tw;
          const glowR = rad * 4.8;
          const gl = gctx.createRadialGradient(x, y, 0, x, y, glowR);
          gl.addColorStop(0, `rgba(150,180,220,${(a * 0.25).toFixed(3)})`);
          gl.addColorStop(0.32, `rgba(150,180,220,${(a * 0.11).toFixed(3)})`);
          gl.addColorStop(1, 'rgba(150,180,220,0)');
          gctx.fillStyle = gl;
          gctx.beginPath(); gctx.arc(x, y, glowR, 0, 7); gctx.fill();
          gctx.fillStyle = `rgba(206,222,244,${(a * (0.5 + 0.3 * size)).toFixed(3)})`;
          gctx.beginPath(); gctx.arc(x, y, rad, 0, 7); gctx.fill();
        };
        const dieK = g.dyingAt ? 1 - smoothW(0, 0.5, (t - g.dyingAt) / 1000) : 1;
        if (dieK <= 0.002 || sgnGrow >= 1) {
          this._gather = null;
        } else if (g.targets && this._signing) {
          // morph: glide to star positions, crossfade with the draw-on stagger
          const mv = smoothW(0, 0.9, (t - this._signing.born) / 1000);
          const n = this._signing.fig.stars.length;
          for (let k = 0; k < g.targets.length; k++) {
            const tg = g.targets[k];
            const cr = smoothW(k / (n + 1), k / (n + 1) + 0.18, sgnGrow);
            const a = this._skyVis * 0.8 * (1 - cr);
            if (a <= 0.002) continue;
            star(
              tg.sx + (tg.tx - tg.sx) * mv,
              tg.sy + (tg.ty - tg.sy) * mv,
              tg.ssize + (tg.tsize - tg.ssize) * mv,
              a, tg.w, tg.p,
            );
          }
          for (const gs of g.stars) {
            if (gs.used) continue;
            const a = this._skyVis * 0.5 * (1 - mv);
            if (a > 0.002) star(gs.x, gs.y, gs.size, a, gs.w, gs.p);
          }
        } else {
          // pending: fade in one by one, hover with a slow lissajous breath
          for (let k = 0; k < g.stars.length; k++) {
            const gs = g.stars[k];
            const a = this._skyVis * 0.55 * smoothW(k * 0.07, k * 0.07 + 0.3, gAge) * dieK;
            if (a <= 0.002) continue;
            star(
              gs.x + Math.sin(t * 0.00035 * gs.w + gs.p) * 0.012,
              gs.y + Math.cos(t * 0.00028 * gs.w + gs.p * 1.7) * 0.01,
              gs.size, a, gs.w, gs.p,
            );
          }
        }
      }
    }
  }

  renderGraph(graph, o) {
    const gctx = this.gctx, t = o.t, A = o.vis, grow = o.grow;
    const { x0, x1, y0, y1 } = o.panel;
    const nodes = graph.nodes;
    const PX = (n) => x0 + (x1 - x0) * n.nx;
    const PY = (n) => y0 + (y1 - y0) * n.ny;
    const rev = (n) => smooth(n.reveal, n.reveal + 0.18, grow);
    const pal = o.dark ? {
      node: (a) => `rgba(58,78,106,${a.toFixed(3)})`, nodeWin: 'rgba(23,52,104,',
      winGlow: '28,62,120', nodeGlow: '58,78,106',
      edge: '74,94,120', edgeW: 0.5, winEdge: '28,62,120', winEdgeW: 0.92,
      accent: '196,138,72', accentW: 0.6, cross: '120,96,150',
      link: '96,116,146', linkW: 0.3, pulse: '40,86,158', glow: false,
    } : {
      node: (a) => `rgba(206,222,244,${a.toFixed(3)})`, nodeWin: 'rgba(245,250,255,',
      winGlow: '150,190,240', nodeGlow: '150,180,220',
      edge: '176,196,224', edgeW: 0.5, winEdge: '214,230,250', winEdgeW: 0.9,
      accent: '234,206,150', accentW: 0.6, cross: '196,186,224',
      link: '166,188,220', linkW: 0.36, pulse: '255,255,255', glow: true,
    };

    // cross-links (web) — faint, form irregularly
    if (graph.links) {
      for (const lk of graph.links) {
        const a = nodes[lk.a], b = nodes[lk.b];
        const er = Math.max(a.reveal, b.reveal);
        const lp = smooth(er, er + 0.18, grow); if (lp <= 0.002) continue;
        const ax = PX(a), ay = PY(a), bx = PX(b), by = PY(b);
        const ex = ax + (bx - ax) * lp, ey = ay + (by - ay) * lp;
        gctx.beginPath(); gctx.moveTo(ax, ay); gctx.lineTo(ex, ey);
        const col = lk.accent ? pal.accent : pal.link;
        const w = lk.accent ? pal.accentW * 0.7 : pal.linkW;
        gctx.strokeStyle = `rgba(${col},${(A * w * lp).toFixed(3)})`; gctx.lineWidth = 1; gctx.stroke();
      }
    }

    // recombination arc (draws late)
    const carc = smooth(0.55, 0.9, grow);
    if (carc > 0.01 && graph.cross) {
      const cf = nodes[graph.cross.from], ct = nodes[graph.cross.to];
      const fx = PX(cf), fy = PY(cf), tx = PX(ct), ty = PY(ct);
      gctx.beginPath(); gctx.moveTo(fx, fy);
      gctx.quadraticCurveTo((fx + tx) / 2 + (x1 - x0) * 0.18, (fy + ty) / 2, tx, ty);
      gctx.strokeStyle = `rgba(${pal.cross},${(A * 0.5 * carc).toFixed(3)})`;
      gctx.lineWidth = 1; gctx.setLineDash([3, 5]); gctx.stroke(); gctx.setLineDash([]);
    }

    // parent edges (draw-on)
    for (const n of nodes) {
      if (n.parent < 0) continue;
      const p = nodes[n.parent];
      const er = Math.max(n.reveal, p.reveal);
      const cr = smooth(er, er + 0.16, grow); if (cr <= 0.002) continue;
      const px = PX(p), py = PY(p), cx = PX(n), cy = PY(n);
      const ex = px + (cx - px) * cr, ey = py + (cy - py) * cr;
      const mx = (px + ex) / 2 + (n.nx - p.nx) * 12, my = (py + ey) / 2;
      gctx.beginPath(); gctx.moveTo(px, py); gctx.quadraticCurveTo(mx, my, ex, ey);
      if (n.winner && p.winner) {
        gctx.strokeStyle = `rgba(${pal.winEdge},${(A * pal.winEdgeW * cr).toFixed(3)})`; gctx.lineWidth = 2.2; gctx.stroke();
      } else if (n.accent) {
        gctx.strokeStyle = `rgba(${pal.accent},${(A * pal.accentW * cr).toFixed(3)})`; gctx.lineWidth = 1.2; gctx.stroke();
      } else {
        gctx.strokeStyle = `rgba(${pal.edge},${(A * pal.edgeW * cr).toFixed(3)})`; gctx.lineWidth = 1.1; gctx.stroke();
      }
    }

    // nodes
    const baseR = Math.min(this.W, this.H) * (o.dark ? 0.009 : 0.008);
    for (const n of nodes) {
      const cr = rev(n); if (cr <= 0.002) continue;
      const x = PX(n), y = PY(n);
      const tw = 1 + Math.sin(t * 1.5 + n.nx * 10 + n.ny * 7) * (o.dark ? 0.06 : 0.16);
      const rad = baseR * (0.5 + n.r * 1.25) * cr * tw;
      if (n.winner || pal.glow) {
        const gr = n.winner ? rad * 3.2 : rad * 2.6;
        const gcol = n.winner ? pal.winGlow : pal.nodeGlow;
        const ga = (n.winner ? 0.3 : 0.16) * A * cr;
        const spr = glowSprite(gcol, false);
        if (spr) {
          gctx.globalAlpha = ga;
          gctx.drawImage(spr, x - gr, y - gr, gr * 2, gr * 2);
          gctx.globalAlpha = 1;
        } else {
          const gl = gctx.createRadialGradient(x, y, 0, x, y, gr);
          gl.addColorStop(0, `rgba(${gcol},${ga.toFixed(3)})`);
          gl.addColorStop(1, `rgba(${gcol},0)`);
          gctx.fillStyle = gl; gctx.beginPath(); gctx.arc(x, y, gr, 0, 7); gctx.fill();
        }
      }
      gctx.fillStyle = n.winner ? `${pal.nodeWin}${(A * cr).toFixed(3)})` : pal.node(A * (0.55 + 0.4 * n.r) * cr);
      gctx.beginPath(); gctx.arc(x, y, rad, 0, 7); gctx.fill();
    }

    // signal pulse travelling down the winning lineage once formed
    const wp = graph.winnerPath;
    if (grow > 0.9 && wp.length > 1) {
      const seg = ((t * 0.18) % 1) * (wp.length - 1);
      const i0 = Math.floor(seg), f = seg - i0;
      const a0 = nodes[wp[i0]], a1 = nodes[wp[Math.min(i0 + 1, wp.length - 1)]];
      const x = PX(a0) + (PX(a1) - PX(a0)) * f, y = PY(a0) + (PY(a1) - PY(a0)) * f;
      gctx.fillStyle = `rgba(${pal.pulse},${(A * 0.95).toFixed(3)})`;
      gctx.beginPath(); gctx.arc(x, y, baseR * 0.8, 0, 7); gctx.fill();
    }
  }

  drawOvis(t, dt) {
    const gctx = this.gctx;
    if (!gctx || !this.lipEl) return;
    const W = this.W, H = this.H;
    const r = this.lipEl.getBoundingClientRect();
    // scroll-scrubbed formation: the sticky dwell (section height - 100vh) is the scrub range,
    // with a lead-in as the section arrives — scrolling back unforms it
    const dwell = Math.max(r.height - H, 1);
    const lead = H * 0.45;
    const grow = this.mGrow(Math.max(0, Math.min(1, (lead - r.top) / (dwell + lead))));
    const enter = Math.max(0, Math.min(1, (H * 0.85 - r.top) / (H * 0.35)));
    const exit = Math.max(0, Math.min(1, (r.top + r.height - H * 0.15) / (H * 0.35)));
    const vis = Math.min(enter, exit);
    if (vis <= 0.002 || grow <= 0.002) return;
    const A = vis;

    // check-in engine only runs while the beat is on screen and formed
    const eng = this.ovisEng;
    if (grow > 0.9) {
      eng.elapsed += dt;
      if (!eng.convo) {
        eng.next -= dt;
        if (eng.next <= 0) eng.convo = { born: eng.elapsed };
      } else if (eng.elapsed - eng.convo.born >= OV_CONVO_DUR) {
        eng.readings.push({ ...OV_OUTCOMES[eng.ix++ % OV_OUTCOMES.length], born: eng.elapsed });
        eng.convo = null;
        eng.next = 9;
      }
      eng.readings = eng.readings.filter((rd) => eng.elapsed - rd.born < 3.0);
    }
    const et = eng.elapsed;

    // mobile: centered full-frame, seated low enough that the dial ring stays on the
    // snow while the lip climbs the horizon behind it; fh capped by width for the ring
    const mob = this.mob;
    const cx = mob ? W * 0.5 : W * 0.27, cy = mob ? H * 0.58 : H * 0.50;
    const fh = mob ? Math.min(H * 0.40, W * 0.60) : H * 0.68;
    const breathe = (id) => {
      const b = Math.sin(et * 1.4) * 0.004;
      if (id === 'chest' || id === 'heart') return -b * 1.6;
      if (id === 'shL' || id === 'shR') return -b;
      if (id === 'head') return -b * 0.7;
      return 0;
    };
    const XY = (i) => [cx + OV_NODES[i].x * fh, cy + (OV_NODES[i].y + breathe(OV_NODES[i].id)) * fh];
    const rev = (o) => smooth(o / OV_NODES.length * 0.34, o / OV_NODES.length * 0.34 + 0.10, grow);

    // ---- wellness ring, in the back — the gauge asset from the concept board ----
    const R = fh * 0.66;
    const arcA = smooth(0.08, 0.35, grow) * A;
    const segA = smooth(0.3, 0.6, grow);
    const scoreP = smooth(0.45, 0.85, grow);
    const score = 61 + (82.5 - 61) * scoreP + Math.sin(et * 0.3) * 0.15 * scoreP;
    if (arcA > 0.01) {
      // track sweeps in
      gctx.strokeStyle = `rgba(${OV_EDGE},${(0.18 * arcA).toFixed(3)})`;
      gctx.lineWidth = 4.5;
      gctx.lineCap = 'round';
      gctx.beginPath();
      gctx.arc(cx, cy, R, OV_A0, OV_A0 + (OV_A1 - OV_A0) * smooth(0.08, 0.4, grow));
      gctx.stroke();
      // score fill
      const fillEnd = OV_A0 + (OV_A1 - OV_A0) * (score / 100) * smooth(0.25, 0.6, grow);
      gctx.strokeStyle = `rgba(${OV_INKB},${(0.85 * arcA).toFixed(3)})`;
      gctx.lineWidth = 4.5;
      gctx.beginPath();
      gctx.arc(cx, cy, R, OV_A0, fillEnd);
      gctx.stroke();
      gctx.lineCap = 'butt';
      // endpoint glow
      if (grow > 0.3) {
        const ex = cx + Math.cos(fillEnd) * R, ey = cy + Math.sin(fillEnd) * R;
        const gl = gctx.createRadialGradient(ex, ey, 0, ex, ey, 10);
        gl.addColorStop(0, `rgba(${OV_INKB},${(0.5 * arcA).toFixed(3)})`);
        gl.addColorStop(1, `rgba(${OV_INKB},0)`);
        gctx.fillStyle = gl;
        gctx.beginPath(); gctx.arc(ex, ey, 10, 0, 7); gctx.fill();
        gctx.fillStyle = `rgba(${OV_INKB},${(0.95 * arcA).toFixed(3)})`;
        gctx.beginPath(); gctx.arc(ex, ey, 3.2, 0, 7); gctx.fill();
      }
      // colored category segments outside the ring
      const segSpan = (OV_A1 - OV_A0) / OV_CATS.length;
      for (let i = 0; i < OV_CATS.length; i++) {
        const s0 = OV_A0 + i * segSpan + 0.05, s1 = OV_A0 + (i + 1) * segSpan - 0.05;
        const mid = (s0 + s1) / 2;
        const reveal = smooth(0.3 + i * 0.05, 0.45 + i * 0.05, grow);
        if (reveal <= 0.01) continue;
        let boost = 0, isHigh = false;
        for (const rd of eng.readings) {
          if (rd.cat !== i) continue;
          const age = et - rd.born;
          boost = Math.max(boost, Math.max(0, 1 - Math.abs(age - 0.4) / 1.6));
          if (rd.high) isHigh = true;
        }
        const col = isHigh && boost > 0.1 ? OV_ALERT : OV_CATS[i];
        gctx.strokeStyle = `rgba(${col},${((0.4 + boost * 0.55) * reveal * segA * A).toFixed(3)})`;
        gctx.lineWidth = 2.5 + boost * 1.5;
        gctx.beginPath(); gctx.arc(cx, cy, R + 11, s0, s1); gctx.stroke();
        const pulse = 0.5 + 0.5 * Math.sin(et * 1.3 + i * 1.1);
        const mx = cx + Math.cos(mid) * (R + 17), my = cy + Math.sin(mid) * (R + 17);
        gctx.fillStyle = `rgba(${col},${((0.55 + pulse * 0.3 + boost * 0.15) * reveal * segA * A).toFixed(3)})`;
        gctx.beginPath(); gctx.arc(mx, my, 2.6 + boost * 1.6, 0, 7); gctx.fill();
      }
      // the score, in the ring's bottom gap
      if (scoreP > 0.02) {
        gctx.font = '600 22px ui-monospace, Menlo, monospace';
        const st = score.toFixed(1);
        const sw = gctx.measureText(st).width;
        gctx.fillStyle = `rgba(${OV_INKB},${(0.92 * scoreP * A).toFixed(3)})`;
        gctx.fillText(st, cx - sw / 2, cy + R * 0.80);
        gctx.font = '9px ui-monospace, Menlo, monospace';
        const lb = 'WELLNESS';
        const lw = gctx.measureText(lb).width;
        gctx.fillStyle = `rgba(${OV_EDGE},${(0.65 * scoreP * A).toFixed(3)})`;
        gctx.fillText(lb, cx - lw / 2, cy + R * 0.80 + 14);
      }
    }

    // ---- site halos (behind the figure) ----
    const haloA = smooth(0.45, 0.70, grow) * A;
    if (haloA > 0.01) {
      for (const s of OV_SITES) {
        const [sx, sy] = XY(OV_IDX[s.id]);
        const pulse = 0.5 + 0.5 * Math.sin(et * s.pulse + s.base * 9);
        let boost = 0, boostCol = null;
        for (const rd of eng.readings) {
          if (rd.site !== s.id) continue;
          const age = et - rd.born;
          boost = Math.max(boost, Math.max(0, 1 - Math.abs(age - 0.4) / 1.4));
          if (rd.high) boostCol = OV_ALERT;
        }
        const col = boostCol || s.color;
        const rr = fh * (0.052 + pulse * 0.018 + boost * 0.03);
        const a = (s.base * (0.5 + pulse * 0.5) + boost * 0.5) * haloA;
        const gl = gctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
        gl.addColorStop(0, `rgba(${col},${(a * 0.5).toFixed(3)})`);
        gl.addColorStop(1, `rgba(${col},0)`);
        gctx.fillStyle = gl;
        gctx.beginPath(); gctx.arc(sx, sy, rr, 0, 7); gctx.fill();
      }
    }

    // ---- satellites tethered to care sites ----
    const satA = smooth(0.52, 0.78, grow) * A;
    if (satA > 0.01) {
      for (const s of OV_SATS) {
        const [ax, ay] = XY(OV_IDX[s.site]);
        const ang = s.ang + et * s.sp;
        const sx = ax + Math.cos(ang) * fh * s.rad;
        const sy = ay + Math.sin(ang) * fh * s.rad * 0.85;
        gctx.strokeStyle = `rgba(${s.color},${(0.22 * satA).toFixed(3)})`;
        gctx.lineWidth = 1;
        gctx.beginPath(); gctx.moveTo(ax, ay); gctx.lineTo(sx, sy); gctx.stroke();
        gctx.fillStyle = `rgba(${s.color},${(0.8 * satA).toFixed(3)})`;
        gctx.beginPath(); gctx.arc(sx, sy, 2.4, 0, 7); gctx.fill();
      }
    }

    // ---- figure edges + nodes ----
    OV_EDGES.forEach((e, ei) => {
      const a = OV_IDX[e[0]], b = OV_IDX[e[1]];
      const er = Math.min(rev(OV_NODES[a].o), rev(OV_NODES[b].o));
      if (er <= 0.01) return;
      const [x0, y0] = XY(a), [x1, y1] = XY(b);
      const ex = x0 + (x1 - x0) * er, ey = y0 + (y1 - y0) * er;
      const cross = ei >= OV_CROSS_FROM;
      gctx.strokeStyle = cross
        ? `rgba(${OV_EDGE},${(0.16 * er * A).toFixed(3)})`
        : `rgba(${OV_SLATE},${(0.48 * er * A).toFixed(3)})`;
      gctx.lineWidth = cross ? 1 : 1.4;
      gctx.beginPath(); gctx.moveTo(x0, y0); gctx.lineTo(ex, ey); gctx.stroke();
    });
    const baseR = Math.min(W, H) * 0.0075;
    for (let i = 0; i < OV_NODES.length; i++) {
      const n = OV_NODES[i];
      const cr = rev(n.o);
      if (cr <= 0.01) continue;
      const [nx, ny] = XY(i);
      const tw = 1 + Math.sin(et * 1.8 + n.x * 30 + n.y * 20) * 0.08;
      const site = OV_SITES.find((s) => s.id === n.id);
      const rad = baseR * n.r * cr * tw;
      const glowCol = site ? site.color : OV_SLATE;
      const glowR = rad * (site ? 3.4 : 2.6);
      const glowA = (site ? 0.28 : 0.18) * cr * A;
      const gl = gctx.createRadialGradient(nx, ny, 0, nx, ny, glowR);
      gl.addColorStop(0, `rgba(${glowCol},${glowA.toFixed(3)})`);
      gl.addColorStop(1, `rgba(${glowCol},0)`);
      gctx.fillStyle = gl;
      gctx.beginPath(); gctx.arc(nx, ny, glowR, 0, 7); gctx.fill();
      gctx.fillStyle = site
        ? `rgba(${site.color},${(0.92 * cr * A).toFixed(3)})`
        : `rgba(${OV_SLATE},${((0.55 + 0.3 * n.r / 1.9) * cr * A).toFixed(3)})`;
      gctx.beginPath(); gctx.arc(nx, ny, rad, 0, 7); gctx.fill();
    }

    // ---- Florence conversation: message dots streaming in from the left ----
    if (eng.convo) {
      const [hx, hy] = XY(OV_IDX.head);
      const sx = -8, sy = hy - H * 0.10;
      const bend = -H * 0.06;
      gctx.strokeStyle = `rgba(${OV_INKB},${(0.08 * A).toFixed(3)})`;
      gctx.lineWidth = 1;
      gctx.setLineDash([2, 5]);
      gctx.beginPath();
      gctx.moveTo(sx, sy);
      gctx.quadraticCurveTo((sx + hx) / 2, (sy + hy) / 2 + bend, hx, hy);
      gctx.stroke();
      gctx.setLineDash([]);
      const age = et - eng.convo.born;
      for (let k = 0; k < OV_CONVO_DOTS; k++) {
        const f = (age - k * OV_DOT_STAGGER) / OV_DOT_TRAVEL;
        if (f <= 0 || f >= 1) continue;
        const ff = smooth(0, 1, f);
        const mx = (sx + hx) / 2, my = (sy + hy) / 2 + bend;
        const ia = 1 - ff;
        const px = ia * ia * sx + 2 * ia * ff * mx + ff * ff * hx;
        const py = ia * ia * sy + 2 * ia * ff * my + ff * ff * hy;
        const florence = k % 2 === 0;
        gctx.fillStyle = florence ? `rgba(${OV_INKB},${(0.85 * A).toFixed(3)})` : `rgba(${OV_SLATE},${(0.7 * A).toFixed(3)})`;
        gctx.beginPath(); gctx.arc(px, py, florence ? 2.6 : 2.0, 0, 7); gctx.fill();
      }
    }

    // ---- classification readouts + red pulse ----
    gctx.font = '10px ui-monospace, Menlo, monospace';
    for (const rd of eng.readings) {
      const age = et - rd.born;
      const a = Math.min(smooth(0, 0.35, age), 1 - smooth(2.2, 3.0, age)) * A;
      if (a <= 0.01) continue;
      const [sx, sy] = XY(OV_IDX[rd.site]);
      gctx.fillStyle = `rgba(${rd.high ? OV_ALERT : rd.color},${(0.95 * a).toFixed(3)})`;
      // mobile: keep the readout inside the narrow viewport
      let tx = sx + 18;
      if (mob) tx = Math.max(4, Math.min(tx, W - 8 - gctx.measureText(rd.text).width));
      gctx.fillText(rd.text, tx, sy - 9);
      if (rd.high && age < 1.1) {
        gctx.strokeStyle = `rgba(${OV_ALERT},${(0.55 * (1 - age / 1.1) * A).toFixed(3)})`;
        gctx.lineWidth = 1.5;
        gctx.beginPath(); gctx.arc(sx, sy, 6 + age * 28, 0, 7); gctx.stroke();
      }
    }
  }

  drawLLM(t) {
    const gctx = this.gctx;
    if (!gctx || !this.llmEl) return;
    const W = this.W, H = this.H;
    const mob = this.mob;
    const s = this.scrubTall(this.llmEl);
    const grow = this.mGrow(s.grow), vis = s.vis;
    if (vis <= 0.002 || grow <= 0.002) return;
    const A = vis;

    // mobile: near-full-width, seated low so the wireframe reads under the pinned title
    const gx = W * (mob ? 0.06 : 0.52), gy = H * (mob ? 0.30 : 0.16);
    const gw = W * (mob ? 0.88 : 0.42), gh = H * (mob ? 0.52 : 0.66);
    const fr = smooth(0, 0.06, grow);
    gctx.strokeStyle = `rgba(${OV_EDGE},${(0.22 * fr * A).toFixed(3)})`;
    gctx.lineWidth = 1;
    gctx.strokeRect(gx, gy, gw, gh);

    const starR = Math.min(W, H) * 0.011;
    const chipH = Math.max(13, H * 0.026);
    const chipFont = Math.max(9, H * 0.015);
    const rects = LG_ELS.map((e) => ({ x: gx + e.x * gw, y: gy + e.y * gh, w: e.w * gw, h: e.h * gh }));
    const centers = rects.map((rc) => [rc.x + rc.w / 2, rc.y + rc.h / 2]);
    let repairedSum = 0;

    LG_ELS.forEach((e, i) => {
      const rc = rects[i];
      const b = LG_BASE(i);
      const ghost = smooth(0.01, 0.05, grow);
      const la = smooth(b + 0.095, b + 0.135, grow); // label chip, as the border closes
      const rep = smooth(b + 0.09, b + 0.17, grow);  // element snaps straight
      repairedSum += rep;

      // the element itself — a crooked ghost that dissolves as it snaps into its box,
      // leaving only the stars + dashed bbox behind
      const ghostA = 0.30 * (1 - rep) * ghost * A;
      if (ghostA > 0.01) {
        const ecx = rc.x + rc.w / 2, ecy = rc.y + rc.h / 2;
        gctx.save();
        gctx.translate(ecx, ecy);
        gctx.rotate(e.rot * (1 - rep));
        gctx.strokeStyle = `rgba(${OV_SLATE},${ghostA.toFixed(3)})`;
        gctx.lineWidth = 1;
        gctx.strokeRect(-rc.w / 2, -rc.h / 2, rc.w, rc.h);
        gctx.restore();
      }

      if (smooth(b, b + 0.04, grow) <= 0.01) return;
      // corner stars — the grounding marks land first, axis-aligned
      const cornerPts = [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x + rc.w, rc.y + rc.h], [rc.x, rc.y + rc.h]];
      cornerPts.forEach(([px, py], j) => {
        const cs = smooth(b + j * 0.008, b + j * 0.008 + 0.028, grow);
        if (cs <= 0.01) return;
        const pop = 1 + (1 - cs) * 0.8;
        const tw = 1 + Math.sin(t * 2.1 + px * 0.05 + py * 0.07) * 0.09;
        star4(gctx, px, py, starR * cs * pop * tw);
        gctx.fillStyle = e.win ? `rgba(${OV_INKB},${(0.92 * cs * A).toFixed(3)})` : `rgba(${LG_INK},${(0.8 * cs * A).toFixed(3)})`;
        gctx.fill();
        if (e.win) {
          const gl = gctx.createRadialGradient(px, py, 0, px, py, starR * 3);
          gl.addColorStop(0, `rgba(${OV_INKB},${(0.25 * cs * A).toFixed(3)})`);
          gl.addColorStop(1, `rgba(${OV_INKB},0)`);
          gctx.fillStyle = gl;
          gctx.beginPath(); gctx.arc(px, py, starR * 3, 0, 7); gctx.fill();
        }
      });
      // dashed detection box — once all four stars have landed, the border
      // extends clockwise around the perimeter from the top-left star
      const db = smooth(b + 0.055, b + 0.115, grow);
      if (db > 0.01) {
        gctx.setLineDash([4, 5]);
        gctx.strokeStyle = e.win ? `rgba(${OV_INKB},${(0.78 * A).toFixed(3)})` : `rgba(${OV_EDGE},${(0.5 * A).toFixed(3)})`;
        gctx.lineWidth = e.win ? 1.6 : 1.1;
        const segs = [
          [rc.x, rc.y, rc.x + rc.w, rc.y],
          [rc.x + rc.w, rc.y, rc.x + rc.w, rc.y + rc.h],
          [rc.x + rc.w, rc.y + rc.h, rc.x, rc.y + rc.h],
          [rc.x, rc.y + rc.h, rc.x, rc.y],
        ];
        let remain = db * 2 * (rc.w + rc.h);
        gctx.beginPath();
        for (const [x0, y0, x1, y1] of segs) {
          if (remain <= 0) break;
          const len = Math.hypot(x1 - x0, y1 - y0);
          const f = Math.min(1, remain / len);
          gctx.moveTo(x0, y0);
          gctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
          remain -= len;
        }
        gctx.stroke();
        gctx.setLineDash([]);
      }
      // class-confidence chip, top-left, detector style
      if (la > 0.01) {
        gctx.font = `600 ${chipFont}px ui-monospace, Menlo, monospace`;
        const txt = `${e.lab} ${e.conf}`;
        const tw2 = gctx.measureText(txt).width;
        gctx.fillStyle = e.win ? `rgba(${OV_INKB},${(0.92 * la * A).toFixed(3)})` : `rgba(${LG_INK},${(0.85 * la * A).toFixed(3)})`;
        gctx.fillRect(rc.x, rc.y - chipH, tw2 + chipH * 0.7, chipH);
        gctx.fillStyle = `rgba(242,246,251,${(0.95 * la * A).toFixed(3)})`;
        gctx.fillText(txt, rc.x + chipH * 0.35, rc.y - chipH * 0.28);
      }
    });

    // constellation: grounded box centers link once the sweep is done
    LG_PAIRS.forEach(([a, b2], k) => {
      const ce = smooth(0.82 + k * 0.022, 0.88 + k * 0.022, grow);
      if (ce <= 0.01) return;
      const [ax, ay] = centers[a], [bx, by] = centers[b2];
      const ex = ax + (bx - ax) * ce, ey = ay + (by - ay) * ce;
      gctx.setLineDash([2, 5]);
      gctx.strokeStyle = `rgba(${OV_SLATE},${(0.35 * ce * A).toFixed(3)})`;
      gctx.lineWidth = 1;
      gctx.beginPath(); gctx.moveTo(ax, ay); gctx.lineTo(ex, ey); gctx.stroke();
      gctx.setLineDash([]);
    });
    centers.forEach(([x, y], i) => {
      const na = smooth(0.83 + i * 0.02, 0.89 + i * 0.02, grow);
      if (na <= 0.01) return;
      const win = LG_ELS[i].win;
      gctx.fillStyle = win ? `rgba(${OV_INKB},${(0.95 * na * A).toFixed(3)})` : `rgba(${OV_SLATE},${(0.7 * na * A).toFixed(3)})`;
      gctx.beginPath(); gctx.arc(x, y, (win ? 4.4 : 3) * na, 0, 7); gctx.fill();
    });

    // reticle traveling between box centers
    const N = LG_ELS.length;
    const path = smooth(0.06, 0.80, grow) * (N - 1);
    const i0 = Math.min(N - 2, Math.floor(path)), f = smooth(0, 1, path - i0);
    const rx = centers[i0][0] + (centers[i0 + 1][0] - centers[i0][0]) * f;
    const ry = centers[i0][1] + (centers[i0 + 1][1] - centers[i0][1]) * f;
    const ra = smooth(0.02, 0.07, grow) * (1 - smooth(0.80, 0.86, grow)) * A;
    if (ra > 0.01) {
      const rr = Math.min(W, H) * 0.02;
      gctx.strokeStyle = `rgba(${OV_INKB},${(0.9 * ra).toFixed(3)})`;
      gctx.lineWidth = 1.4;
      gctx.beginPath(); gctx.arc(rx, ry, rr, 0, 7); gctx.stroke();
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
        gctx.beginPath();
        gctx.moveTo(rx + dx * rr * 0.55, ry + dy * rr * 0.55);
        gctx.lineTo(rx + dx * rr * 1.45, ry + dy * rr * 1.45);
        gctx.stroke();
      });
      gctx.fillStyle = `rgba(${OV_INKB},${(0.9 * ra).toFixed(3)})`;
      gctx.beginPath(); gctx.arc(rx, ry, 1.6, 0, 7); gctx.fill();
      const near = Math.abs(path - Math.round(path));
      if (near < 0.12) {
        gctx.strokeStyle = `rgba(${OV_INKB},${(0.4 * (1 - near / 0.12) * ra).toFixed(3)})`;
        gctx.beginPath(); gctx.arc(rx, ry, rr * (1.6 + near * 6), 0, 7); gctx.stroke();
      }
    }

    // fidelity readout above the wireframe
    const frac = repairedSum / N;
    const ha = smooth(0.10, 0.2, grow);
    if (ha > 0.01) {
      // mobile: headline hugs the wireframe (clear of the ridge line) and the stat
      // line moves below the box instead of running off the right edge
      const hy = gy - (mob ? 16 : Math.max(14, H * 0.045));
      gctx.font = `600 ${Math.max(12, W * 0.010)}px ui-monospace, Menlo, monospace`;
      gctx.fillStyle = `rgba(${OV_INKB},${(0.9 * ha * A).toFixed(3)})`;
      gctx.fillText(`CLIP FIDELITY +${Math.round(29 * frac)}%`, gx, hy);
      if (frac > 0.98) {
        gctx.font = `${Math.max(9, W * 0.0072)}px ui-monospace, Menlo, monospace`;
        gctx.fillStyle = `rgba(${OV_EDGE},${(0.8 * A).toFixed(3)})`;
        gctx.fillText('p < 0.01 · 128 PAIRED TESTS · ZERO-SHOT', mob ? gx : gx + W * 0.165, mob ? gy + gh + 20 : hy);
      }
    }
  }

  drawDropIn(t) {
    const gctx = this.gctx;
    if (!gctx || !this.dropEl) return;
    const W = this.W, H = this.H;
    const { grow, vis } = this.scrubTall(this.dropEl);
    if (vis <= 0.002 || grow <= 0.002) return;
    const A = vis;
    // text reads alone for the first stretch, then the rider forms; on mobile that
    // handoff is the shared MB_MOTIF0 point and nothing (flecks, trail) draws before it
    const u = smooth(this.mob ? MB_MOTIF0 + 0.02 : DI_DELAY, 1, grow);
    if (this.mob && u <= 0.001) return;
    const proj = diMakeCam(u, W, H);
    const dist = DI_SPEED * u;

    // ground flecks flowing past (the viewer is riding too)
    for (let k = 0; k < 70; k++) {
      const gx2 = (diHash(k * 11 + 5) - 0.5) * 26;
      const z0 = diHash(k * 17 + 3) * 46;
      const rz = ((z0 - dist) % 46 + 46) % 46 - 4;
      const s = proj([gx2, 0, rz]);
      if (!s) continue;
      const a = 0.26 * Math.max(0, 1 - s[2] / 30) * A;
      if (a <= 0.01) continue;
      gctx.beginPath(); gctx.arc(s[0], s[1], Math.max(0.6, 2.2 - s[2] * 0.05), 0, 7);
      gctx.fillStyle = `rgba(${OV_SLATE},${a.toFixed(3)})`; gctx.fill();
    }

    // rider mesh, forming while entering (stars settle into place)
    const rig = diBuildRider(u);
    const xf = diTransform(u);
    const sp = rig.verts.map((p, i) => {
      const s = proj(xf(p));
      if (!s) return null;
      const form = smooth(0.10 + (i % 40) * 0.0025, 0.16 + (i % 40) * 0.0025, u);
      return [s[0] + (diHash(i) - 0.5) * 130 * (1 - form), s[1] + (diHash(i + 31) - 0.5) * 90 * (1 - form), s[2], form];
    });

    // depth fade: the rider dims and shrinks as he pulls away on exit
    const bodyC = xf([0, 0.9, 0]);
    const bodyS = proj(bodyC);
    if (!bodyS) return;
    const far = Math.max(0, Math.min(1, 1.5 - bodyS[2] / 16));
    if (far <= 0.01) return;
    const shrink = Math.min(1.2, 6.5 / bodyS[2]);

    // board trail — two carve lines, gap while airborne; shares the rider's
    // depth fade so his track dissolves with him instead of outliving him
    gctx.strokeStyle = `rgba(${OV_SLATE},${(0.32 * A * far).toFixed(3)})`;
    gctx.lineWidth = 1.2;
    for (const off of [-0.11, 0.11]) {
      gctx.beginPath();
      let pen = false;
      for (let tp = Math.max(0, u - 0.30); tp <= u; tp += 0.0035) {
        if (diAir(tp) > 0.02) { pen = false; continue; }
        const s = proj([diRiderX(tp) + off, 0.015, diRiderZ(tp) - (dist - DI_SPEED * tp)]);
        if (!s) { pen = false; continue; }
        if (pen) gctx.lineTo(s[0], s[1]); else gctx.moveTo(s[0], s[1]);
        pen = true;
      }
      gctx.stroke();
    }

    // plexus motes floating around the body
    for (let k = 0; k < 14; k++) {
      const mp = diAdd(bodyC, [(diHash(k * 7) - 0.5) * 2.6, (diHash(k * 13 + 2) - 0.3) * 2.0, (diHash(k * 3 + 8) - 0.5) * 2.2]);
      const s = proj(mp);
      if (!s) continue;
      const a = 0.28 * (0.3 + 0.7 * diHash(k + 50)) * far * A;
      gctx.beginPath(); gctx.arc(s[0], s[1], 1.2 + diHash(k + 21) * 1.2, 0, 7);
      gctx.fillStyle = `rgba(${OV_SLATE},${a.toFixed(3)})`; gctx.fill();
      if (k < 7) {
        const vi = Math.floor(diHash(k * 9 + 4) * sp.length);
        const v = sp[vi];
        if (v && v[3] > 0.5) {
          gctx.beginPath(); gctx.moveTo(s[0], s[1]); gctx.lineTo(v[0], v[1]);
          gctx.strokeStyle = `rgba(${OV_SLATE},${(0.10 * A).toFixed(3)})`; gctx.lineWidth = 0.8; gctx.stroke();
        }
      }
    }

    // mesh edges with depth fog (dark-on-snow)
    gctx.lineWidth = 0.9; gctx.lineCap = 'round';
    for (const [a2, b2] of rig.edges) {
      const P = sp[a2], Q = sp[b2];
      if (!P || !Q) continue;
      const fa = Math.min(P[3], Q[3]);
      if (fa < 0.03) continue;
      const board = a2 <= rig.boardEnd && b2 <= rig.boardEnd;
      const fog = Math.max(0, Math.min(1, 1.5 - (P[2] + Q[2]) / 2 / 16));
      gctx.strokeStyle = board
        ? `rgba(${OV_INKB},${(0.55 * fa * fog * A).toFixed(3)})`
        : `rgba(${OV_SLATE},${(0.42 * fa * fog * A).toFixed(3)})`;
      gctx.beginPath(); gctx.moveTo(P[0], P[1]); gctx.lineTo(Q[0], Q[1]); gctx.stroke();
    }

    // mesh vertices (every other one) as glowing stars — TDK/Ovis-style halos
    for (let i = 0; i < sp.length; i += 2) {
      const v = sp[i];
      if (!v || v[3] < 0.05) continue;
      const tw = 0.85 + 0.15 * Math.sin(t * 2 + i * 1.7);
      if (i % 4 === 0) { // halo on every 4th star only — keeps the glow airy
        const gr = 10 * shrink;
        const g = gctx.createRadialGradient(v[0], v[1], 0, v[0], v[1], gr);
        g.addColorStop(0, `rgba(${OV_SLATE},${(0.20 * tw * v[3] * far * A).toFixed(3)})`);
        g.addColorStop(1, `rgba(${OV_SLATE},0)`);
        gctx.fillStyle = g;
        gctx.beginPath(); gctx.arc(v[0], v[1], gr, 0, 7); gctx.fill();
      }
      gctx.beginPath(); gctx.arc(v[0], v[1], 1.6 * shrink, 0, 7);
      gctx.fillStyle = `rgba(${LG_INK},${(0.58 * tw * v[3] * far * A).toFixed(3)})`; gctx.fill();
    }

    // IMU sensor nodes — ink-blue, ringed, glowing
    for (const jp of rig.sensors) {
      const s = proj(xf(jp));
      if (!s) continue;
      const g = gctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], 13 * shrink);
      g.addColorStop(0, `rgba(${OV_INKB},${(0.30 * far * A).toFixed(3)})`);
      g.addColorStop(1, `rgba(${OV_INKB},0)`);
      gctx.fillStyle = g; gctx.beginPath(); gctx.arc(s[0], s[1], 13 * shrink, 0, 7); gctx.fill();
      gctx.beginPath(); gctx.arc(s[0], s[1], 3 * shrink, 0, 7); gctx.fillStyle = `rgba(${OV_INKB},${(0.95 * far * A).toFixed(3)})`; gctx.fill();
      gctx.beginPath(); gctx.arc(s[0], s[1], 6.5 * shrink, 0, 7); gctx.strokeStyle = `rgba(${OV_INKB},${(0.5 * far * A).toFixed(3)})`; gctx.lineWidth = 1; gctx.stroke();
    }

    // HUD — live IMU readouts, above the run
    const ha = smooth(0.08, 0.18, u);
    if (ha > 0.01) {
      gctx.font = `600 ${Math.max(12, W * 0.010)}px ui-monospace, Menlo, monospace`;
      gctx.fillStyle = `rgba(${OV_INKB},${(0.9 * ha * A).toFixed(3)})`;
      const edgeDeg = Math.round(Math.abs(diLean(u)) * 57.3);
      const airS = (u > DI_AIR0 && u < DI_AIR1) ? ((u - DI_AIR0) * DI_RUN_S).toFixed(2)
                 : (u >= DI_AIR1 ? ((DI_AIR1 - DI_AIR0) * DI_RUN_S).toFixed(2) : '0.00');
      gctx.fillText(`IMU 100HZ · EDGE ${String(edgeDeg).padStart(2, ' ')}° · AIR ${airS}s`, W * 0.06, H * (this.mob ? 0.24 : 0.14));
    }
  }

  drawGlyph(ctx, f, x, y, rad, p) {
    const rot = f.rot + f.rotV * p * 15;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (f.glyph === 0) {
      // solid square
      ctx.fillRect(-rad / 2, -rad / 2, rad, rad);
    } else if (f.glyph === 1) {
      // hollow square
      ctx.lineWidth = Math.max(1, rad * 0.15);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.strokeRect(-rad / 2, -rad / 2, rad, rad);
    } else if (f.glyph === 2) {
      // plus (+)
      ctx.lineWidth = Math.max(1, rad * 0.2);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(-rad / 2, 0); ctx.lineTo(rad / 2, 0);
      ctx.moveTo(0, -rad / 2); ctx.lineTo(0, rad / 2);
      ctx.stroke();
    } else if (f.glyph === 3) {
      // dot / small algorithmic node
      ctx.beginPath(); ctx.arc(0, 0, rad * 0.4, 0, 7); ctx.fill();
    } else {
      // ASCII coding symbol
      ctx.font = `bold ${rad * 1.2}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.glyph, 0, 0);
    }
    ctx.restore();
  }

  drawImpact(ctx, W, H, impact, fullWhite, t) {
    // visceral impact: explosive radial burst from the skis + heavy snow splatting the camera lens
    if (impact > 0.001) {
      const startX = W * 0.5;
      // Start below the screen so the origin point isn't visible
      const startY = H * 1.15;

      for (const f of this.fines) {
        if (f.type === 0) {
          // radial burst
          const p = Math.max(0, impact - f.o);
          if (p <= 0) continue;
          
          const easeOut = 1 - Math.pow(1 - p, 2.5); // decelerate due to drag
          const gravity = Math.pow(p, 2) * H * 0.35;
          const x = startX + f.vx * W * 1.2 * easeOut;
          const y = startY + f.vy * H * 1.3 * easeOut + gravity;
          
          const rad = f.r * (0.4 + easeOut * 1.6) * (1 + impact * 1.5);
          const al = Math.min(1, p * 5) * (1 - Math.pow(impact, 3)) * (f.cold ? 0.65 : 0.95);
          
          if (al > 0.01) {
            ctx.fillStyle = f.cold ? `rgba(175,195,220,${al.toFixed(3)})` : `rgba(255,255,255,${al.toFixed(3)})`;
            this.drawGlyph(ctx, f, x, y, rad, p);
          }
        } else {
          // lens splats
          const p = Math.max(0, impact - f.o);
          if (p <= 0) continue;
          
          // z-depth acceleration towards camera
          const z = Math.pow(p / (1 - f.o + 0.01), 4);
          
          const cx = f.x - 0.5;
          const cy = f.y - 0.5;
          const x = W * (0.5 + cx * (1 + z * 2.0));
          const y = H * (0.5 + cy * (1 + z * 2.0));
          
          const rad = f.r * (0.2 + z * 18);
          const al = Math.min(1, p * 4) * (f.cold ? 0.75 : 1);
          
          if (al > 0.01) {
            ctx.fillStyle = f.cold ? `rgba(190,205,230,${al.toFixed(3)})` : `rgba(255,255,255,${al.toFixed(3)})`;
            this.drawGlyph(ctx, f, x, y, rad, p);
          }
        }
      }
    }

    if (fullWhite > 0) {
      ctx.fillStyle = `rgba(255,255,255,${fullWhite.toFixed(3)})`;
      ctx.fillRect(-60, -60, W + 120, H + 120);
    }
    if (this.landPageRef && this.landPageRef.current) {
      this.landPageRef.current.style.background = `rgba(255,255,255,${fullWhite.toFixed(3)})`;
    }
  }

  drawRidge(ctx, arr, horizon, W, height, color) {
    const n = arr.length - 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-W * 0.1, horizon + 6);
    for (let i = 0; i <= n; i++) {
      const x = -W * 0.1 + (W * 1.2) * (i / n);
      ctx.lineTo(x, horizon + 4 - arr[i] * height);
    }
    ctx.lineTo(W * 1.1, horizon + 6);
    ctx.closePath();
    ctx.fill();
  }

  render() {
    const mob = this.state.mob;
    return (
      <>
        <canvas
          ref={this.canvasRef}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, display: 'block' }}
        />
        <canvas
          ref={this.graphCanvasRef}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, display: 'block', pointerEvents: 'none' }}
        />

        <div style={{ position: 'relative', zIndex: 1, color: '#17222f', fontFamily: "'Archivo Black', sans-serif" }}>

          <section data-screen-label="Drop in" style={{ height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.35em', color: '#4a5c72' }}>SOFTWARE · AI / ML ENGINEER</div>
              <h1 style={{ margin: 0, fontSize: 'clamp(44px, 13vw, 200px)', lineHeight: 0.9, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Isaac Au</h1>
              <div style={{ fontFamily: mono, fontSize: 14, letterSpacing: '0.2em', color: '#4a5c72' }}>CARNEGIE MELLON UNIVERSITY · PITTSBURGH, PA</div>
            </div>
            <div style={{ position: 'absolute', bottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.3em', color: '#4a5c72' }}>SCROLL</div>
              <div style={{ width: 2, height: 34, background: '#17222f', animation: 'cueDrop 1.6s ease-in-out infinite' }} />
            </div>
          </section>

          {/* 220vh (300vh mobile) + sticky copy: the extra scroll scrubs the lineage-tree formation */}
          <section id="work" data-screen-label="The approach" style={{ height: mob ? '300vh' : '220vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: mob ? '0 7vw' : '0 8vw' }}>
            <div data-reveal="1" data-beat="tdk" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>01 · MAY 2026 – PRESENT · INTERNSHIP</div>
              <h2 style={{ margin: 0, lineHeight: 0.95, textTransform: 'uppercase' }}>
                <span ref={this.tdkRef} style={{ display: 'block', width: 'fit-content', fontSize: HEADLINE_SIZE, whiteSpace: 'nowrap' }}>TDK</span>
                <span ref={this.mlRef} style={{ display: 'block', width: 'fit-content', fontSize: HEADLINE_SIZE, whiteSpace: 'nowrap' }}>ML Intern</span>
              </h2>
              <p style={{ margin: 0, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Algorithms team — SensorFlow, a Pareto-optimal TinyML search built on evolutionary algorithms, modeled on DeepMind&rsquo;s AlphaEvolve. Ships inside sensors that supply Apple. Latest run: a production crash-detection model 35% lighter at +1.3% rare-event F1.</p>
            </div>
            </div>
          </section>

          {/* 220vh (300vh mobile) + sticky copy: the extra scroll scrubs the Ovis constellation formation */}
          <section id="projects" data-screen-label="The lip" style={{ height: mob ? '300vh' : '220vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: mob ? '0 7vw' : '0 8vw' }}>
              <div data-reveal="1" data-beat="ovis" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, textAlign: mob ? 'left' : 'right', willChange: 'transform, opacity' }}>
                <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>02 · 2022 – 2026 · CO-FOUNDER</div>
                <h2 style={{ margin: 0, lineHeight: 0.95, textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: mob ? 'flex-start' : 'flex-end' }}>
                  <span ref={this.ovisRef} style={{ fontSize: HEADLINE_SIZE, whiteSpace: 'nowrap' }}>OVIS</span>
                  <span ref={this.medRef} style={{ fontSize: 'clamp(18px, 2.6vw, 36px)', whiteSpace: 'nowrap' }}>Medical Solutions</span>
                </h2>
                <p style={{ margin: 0, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Co-founded Ovis to put a daily voice between cancer patients and their care team. Florence, our AI nurse, turns each conversation into a wellness score and flags what needs attention before it becomes an ER visit. Piloted with oncologists at HKU.</p>
                <a href="https://app.ovismedical.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.2em', color: '#28569e', textDecoration: 'none' }}>VIEW →</a>
              </div>
            </div>
          </section>

          {/* spacer — lets the Ovis constellation scroll off before LLM copy arrives */}
          <div style={{ height: '60vh' }} />

          {/* 220vh (300vh mobile) + sticky copy: the extra scroll scrubs the grounded-repair sweep */}
          <section data-screen-label="LLM research" style={{ height: mob ? '300vh' : '220vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: mob ? '0 7vw' : '0 8vw' }}>
            <div data-reveal="1" data-beat="llm" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>03 · RESEARCH</div>
              <h2 style={{ margin: 0, lineHeight: 0.95, textTransform: 'uppercase' }}>
                <span ref={this.llmRef} style={{ display: 'block', width: 'fit-content', fontSize: HEADLINE_SIZE, whiteSpace: 'nowrap' }}>LLM</span>
                <span ref={this.llmSubRef} style={{ display: 'block', width: 'fit-content', fontSize: HEADLINE_SIZE, whiteSpace: 'nowrap' }}>Research</span>
              </h2>
              <p style={{ margin: 0, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Ground the model in structure. Frozen GUI-grounding models injected into a VLM code-repair pipeline&mdash;zero-shot, no fine-tuning&mdash;lifted visual fidelity +29% on Angular (p&lt;0.01, 128 paired tests). An LLM judge sieved 2M+ clinical entries into 50k gold rows: +15% medical reasoning after LoRA SFT.</p>
            </div>
            </div>
          </section>

          {/* 340vh + sticky copy: the extra scroll scrubs the full ollie run */}
          <section data-screen-label="DropIn" style={{ height: '340vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: mob ? '0 7vw' : '0 8vw' }}>
            <div data-reveal="1" data-beat="drop" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, textAlign: mob ? 'left' : 'right', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>04 · 2026 · PERSONAL PROJECT</div>
              <h2 style={{ margin: 0, lineHeight: 0.95, textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: mob ? 'flex-start' : 'flex-end' }}>
                <span ref={this.dropRef} style={{ fontSize: HEADLINE_SIZE, whiteSpace: 'nowrap' }}>DropIn</span>
                <span ref={this.dropSubRef} style={{ fontSize: 'clamp(18px, 2.6vw, 36px)', whiteSpace: 'nowrap' }}>Motion Capture</span>
              </h2>
              <p style={{ margin: 0, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Real-time mocap on consumer hardware&mdash;no $50k optical rigs, just an iPhone. A quaternion-based kinematic solver reconstructs rider kinematics from raw 100Hz IMU streams with sub-50ms latency, while a custom backpressure protocol sheds stale frames to keep every joint coherent. WebGL telemetry turns each run into actionable coaching.</p>
            </div>
            </div>
          </section>

          <section data-screen-label="Takeoff" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>05 / FULL COMMIT</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(56px, 11vw, 170px)', lineHeight: 0.9, textTransform: 'uppercase' }}>All in</h2>
            </div>
          </section>

          {/* 640vh: the extra 140vh over the original 500vh is the night-sky signature dwell */}
          <section data-screen-label="Airborne" style={{ height: '640vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '260vh' }}>
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '0 6vw', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#dbe7f4' }}>— WHERE I LIKE TO WORK —</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4.2vw, 56px)', lineHeight: 1.05, textTransform: 'uppercase', color: '#f4f8fd' }}>Software that touches<br />the physical world</h2>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.2em', color: '#c3d5ea' }}>SENSORS · PATIENTS · RIDERS · 100HZ STREAMS · TIGHT BUDGETS</div>
            </div>
          </section>

          <section data-screen-label="The landing" style={{ height: '190vh' }} />

          <section
            id="contact"
            ref={this.landPageRef}
            data-screen-label="Landing page"
            style={{ boxSizing: 'border-box', minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '14vh 8vw', textAlign: 'center', position: 'relative' }}
          >
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#28569e' }}>OPEN TO FULL-TIME · NEW-GRAD 2027</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(40px, 12vw, 150px)', lineHeight: 0.9, textTransform: 'uppercase' }}>Let&rsquo;s talk</h2>
              <div style={{ width: 48, height: 1.5, background: '#c8d4e0' }} />
              <p style={{ margin: 0, maxWidth: 480, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Got a project, a question, or just want to say hey&mdash;I&rsquo;d love to hear from you.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: mob ? '20px 32px' : 48, marginTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.4em', color: '#4a5c72' }}>EMAIL</div>
                  <a href="mailto:ayhisaac@gmail.com" style={{ fontFamily: mono, fontSize: 14, color: '#17222f', textDecoration: 'none' }}>ayhisaac@gmail.com</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.4em', color: '#4a5c72' }}>GITHUB</div>
                  <a href="https://github.com/isaacau502" target="_blank" rel="noopener noreferrer" style={{ fontFamily: mono, fontSize: 14, color: '#17222f', textDecoration: 'none' }}>@isaacau502</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.4em', color: '#4a5c72' }}>LINKEDIN</div>
                  <a href="https://linkedin.com/in/isaacayh" target="_blank" rel="noopener noreferrer" style={{ fontFamily: mono, fontSize: 14, color: '#17222f', textDecoration: 'none' }}>/in/isaacayh</a>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 10 }}>
                <a href="mailto:ayhisaac@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', background: '#17222f', color: '#ffffff', fontFamily: mono, fontSize: 13, letterSpacing: '0.2em', textDecoration: 'none' }}>EMAIL</a>
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', border: '2px solid #17222f', color: '#17222f', fontFamily: mono, fontSize: 13, letterSpacing: '0.2em', textDecoration: 'none' }}>RESUME ↓</a>
              </div>
              {/* tech-stack strip — scannable keywords for recruiters; label widths matched so values align */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 680 }}>
                <div style={{ width: 48, height: 1.5, background: '#c8d4e0' }} />
                {[
                  ['LANGUAGES', 'Python · Go · C/C++ · TypeScript · Swift'],
                  ['ML / AI', 'PyTorch · LLMs / VLMs · LoRA · TinyML'],
                  ['SYSTEMS', 'React · WebGL · Real-time / IMU'],
                  ['INFRA', 'AWS · Azure · Docker'],
                ].map(([label, items]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.4em', color: '#4a5c72', minWidth: 92, textAlign: 'right' }}>{label}</span>
                    <span style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.06em', color: '#17222f' }}>{items}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '4px 10px', padding: '0 14px', fontFamily: mono, fontSize: 11, letterSpacing: '0.3em', color: '#8fa2b8' }}>
              <span>© ISAAC AU 2026</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#c8d4e0', display: 'inline-block' }} />
              <span>BUILT WITH CLAUDE CODE & CLAUDE DESIGN</span>
            </div>
          </section>

        </div>

        <style>{`
          /* small-viewport height for the hero so the scroll cue clears mobile browser chrome */
          @supports (height: 100svh) {
            section[data-screen-label="Drop in"] { height: 100svh !important; }
          }
          .nav-link { position: relative; color: var(--nav-ink, #17222f); transition: color 0.45s ease; }
          .nav-link::after {
            content: ''; position: absolute; left: 0; bottom: -4px; height: 1px; width: 0;
            background: var(--nav-line, #4a5c72); transition: width 0.22s ease;
          }
          .nav-link:hover { color: var(--nav-hover, #4a5c72); }
          .nav-link:hover::after { width: 100%; }
          .nav-sep { background: var(--nav-line, #4a5c72); transition: background 0.45s ease; }
          .sig-input {
            width: 100%; background: transparent; border: none;
            border-bottom: 1px solid rgba(201,214,226,0.35);
            padding: 10px 2px; color: #f2f6fb; text-align: center;
            font-family: ui-monospace, Menlo, monospace; font-size: 20px;
            outline: none; caret-color: rgba(255,214,160,0.95);
            transition: border-color 0.25s ease;
          }
          .sig-input:focus { border-bottom-color: rgba(255,214,160,0.9); }
          .sig-input::placeholder { color: rgba(201,214,226,0.28); }
          .sig-input:disabled { opacity: 0.45; }
        `}</style>
        <nav ref={this.navRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '28px 36px', fontFamily: mono, fontSize: 14, letterSpacing: '0.16em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <a href="#work" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ width: 9, height: 9, background: 'currentColor', display: 'inline-block' }} />
              WORK
            </a>
            <span className="nav-sep" style={{ width: 1, height: 14 }} />
            <a href="#projects" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ width: 9, height: 9, background: 'currentColor', display: 'inline-block', transform: 'rotate(45deg)' }} />
              PROJECTS
            </a>
            <span className="nav-sep" style={{ width: 1, height: 14 }} />
            <a href="#contact" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ width: 9, height: 9, background: 'currentColor', display: 'inline-block', borderRadius: '50%' }} />
              CONTACT
            </a>
          </div>
        </nav>

        {/* signature form — opacity/pointer-events driven per-frame by the night factor.
            mobile: anchored higher so the software keyboard never covers the input */}
        <div
          ref={this.sigRef}
          style={{ position: 'fixed', left: '50%', top: this.state.mob ? MB_SIG_Y * 100 + '%' : '50%', transform: 'translate(-50%, calc(-50% + 26px))', zIndex: 2, opacity: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, fontFamily: mono, width: 'min(560px, 86vw)' }}
        >
          <div style={{ fontSize: 12, letterSpacing: '0.4em', color: '#c9d6e2', textAlign: 'center' }}>LEAVE A CONSTELLATION IN THE SKY</div>
          <input
            ref={this.sigInputRef}
            className="sig-input"
            maxLength={100}
            placeholder="describe anything"
            aria-label="Describe your constellation"
            onKeyDown={this.onSignatureKey}
          />
          <div ref={this.sigStatusRef} style={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,214,226,0.4)', transition: 'color 0.3s ease' }}>press enter · it stays here for everyone after you</div>
        </div>

        <div ref={this.hudRef} style={{ position: 'fixed', left: 24, bottom: 22, zIndex: 2, fontFamily: mono, fontSize: 12, letterSpacing: '0.18em', color: '#33455c', display: 'flex', gap: 22 }}>
          <span ref={this.spdRef}>SPD 00 KM/H</span>
          <span ref={this.distRef}>LIP 400 M</span>
        </div>

        {/* mobile: the beat's title persists here and anchors the motif forming below it; driven from loop */}
        <div ref={this.hdrRef} style={{ position: 'fixed', top: 62, left: 0, right: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, opacity: 0, pointerEvents: 'none' }}>
          <span ref={this.hdrKickRef} style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.32em', color: '#4a5c72' }} />
          <span ref={this.hdrNameRef} style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, letterSpacing: '0.01em', textTransform: 'uppercase', color: '#17222f' }} />
        </div>
      </>
    );
  }
}

function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export default SlopeBackground;
