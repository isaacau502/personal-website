import { Component, createRef } from 'react';
import { PROJECT_CONSTELLATIONS } from './constellation/projects.js';
import { drawConstellation, SKY_PALETTE } from './constellation/draw.js';

// The professional reference page at /work — a STAR CATALOG. Every project is
// a constellation in the site's own {stars, edges} grammar: the run's flagship
// beats (TDK, Ovis, GUI-Repair=LLM, DropIn) reuse their exact hand-laid figures from
// projects.js; the rest are charted here in the same vocabulary. The page reads
// as a celestial almanac — a scannable chart, not a card grid — tying /work
// literally to the site's thesis. Theme-aware (dark = night chart, light =
// daylight chart); the run at "/" stays the cinematic experience.

// ---- figures ----
// shared with the run (identical geometry — same star every place they appear)
const fig = (n) => PROJECT_CONSTELLATIONS.find((f) => f.name === n);
const TDK = fig('tdk');
const OVIS = fig('ovis');
const LLM = fig('llm research');
const DROPIN = fig('dropin');

// charted here only — hand-laid in the same record shape (unit coords, stable
// ids, ≤14 stars, connected), each an abstract of what the project IS.
const RICE = { // a robot arm reaching for its target — the real-time round-trip
  stars: [
    { id: 's0', x: 0.16, y: 0.90, size: 1.2 }, // base
    { id: 's1', x: 0.30, y: 0.60, size: 0.9 }, // shoulder
    { id: 's2', x: 0.50, y: 0.42, size: 0.9 }, // elbow
    { id: 's3', x: 0.70, y: 0.30, size: 0.9 }, // wrist
    { id: 's4', x: 0.86, y: 0.16, size: 1.3 }, // gripper
    { id: 's5', x: 0.92, y: 0.54, size: 1.0 }, // target
  ],
  edges: [['s0', 's1'], ['s1', 's2'], ['s2', 's3'], ['s3', 's4'], ['s4', 's5']],
};
const CURATION = { // a distillation funnel: 2M entries converge to 50k gold rows
  stars: [
    { id: 's0', x: 0.08, y: 0.12, size: 0.7 }, { id: 's1', x: 0.30, y: 0.09, size: 0.7 },
    { id: 's2', x: 0.52, y: 0.12, size: 0.7 }, { id: 's3', x: 0.72, y: 0.09, size: 0.7 },
    { id: 's4', x: 0.92, y: 0.13, size: 0.7 },
    { id: 's5', x: 0.34, y: 0.44, size: 0.9 }, { id: 's6', x: 0.66, y: 0.44, size: 0.9 },
    { id: 's7', x: 0.50, y: 0.66, size: 1.0 }, // neck
    { id: 's8', x: 0.50, y: 0.90, size: 1.5 }, // the distilled gold
  ],
  edges: [
    ['s0', 's5'], ['s1', 's5'], ['s2', 's5'], ['s2', 's6'], ['s3', 's6'], ['s4', 's6'],
    ['s5', 's7'], ['s6', 's7'], ['s7', 's8'],
  ],
};
const KV = { // a distributed ring of replicas with last-writer-wins sync links
  stars: [
    { id: 's0', x: 0.50, y: 0.08, size: 1.0 }, { id: 's1', x: 0.90, y: 0.40, size: 1.0 },
    { id: 's2', x: 0.74, y: 0.90, size: 1.0 }, { id: 's3', x: 0.26, y: 0.90, size: 1.0 },
    { id: 's4', x: 0.10, y: 0.40, size: 1.0 },
  ],
  edges: [
    ['s0', 's1'], ['s1', 's2'], ['s2', 's3'], ['s3', 's4'], ['s4', 's0'], // ring
    ['s0', 's2'], ['s1', 's3'], ['s4', 's2'], // sync diagonals
  ],
};
const AGENTMON = { // an orchestrator hub with sub-agents, linked to an opponent
  stars: [
    { id: 's0', x: 0.36, y: 0.50, size: 1.4 }, // hub
    { id: 's1', x: 0.16, y: 0.30, size: 0.8 }, { id: 's2', x: 0.18, y: 0.72, size: 0.8 },
    { id: 's3', x: 0.44, y: 0.20, size: 0.8 },
    { id: 's4', x: 0.82, y: 0.50, size: 1.2 }, // opponent
    { id: 's5', x: 0.94, y: 0.28, size: 0.7 },
  ],
  edges: [['s0', 's1'], ['s0', 's2'], ['s0', 's3'], ['s0', 's4'], ['s4', 's5']],
};
const GSD = { // a checkmark, fed by chunked tasks
  stars: [
    { id: 's0', x: 0.22, y: 0.50, size: 0.9 }, { id: 's1', x: 0.42, y: 0.72, size: 1.0 },
    { id: 's2', x: 0.86, y: 0.20, size: 1.2 },
    { id: 's3', x: 0.10, y: 0.28, size: 0.7 }, { id: 's4', x: 0.30, y: 0.16, size: 0.7 },
  ],
  edges: [['s0', 's1'], ['s1', 's2'], ['s3', 's0'], ['s4', 's0']],
};

// ---- catalog data ----
// kind drives the FORM marker (status by shape, never a second accent hue):
// ● ship · ○ research · ◇ systems · ◌ still forming
const MARK = { ship: '●', res: '○', sys: '◇', wip: '◌' };

const HERO = {
  fig: OVIS, kind: 'ship', tag: 'CO-FOUNDED', name: 'Ovis Medical',
  ctx: 'Co-founder · Tech Lead — 2024–2026',
  desc: 'A daily AI voice between cancer patients and their care team — check-ins, symptom triage, and a wellness signal the clinic can act on. Led a 5-person team.',
  stat: '$100k', read: 'SAFE raised · IRB submitted with HKU oncologists', stack: 'LLMs · TTS · React · AWS',
  links: [{ t: 'TRY IT', href: 'https://app.ovismedical.com' }],
};

const CHARTED = [
  { fig: TDK, kind: 'ship', tag: 'INTERNSHIP', name: 'TDK', ctx: 'ML Intern · Pittsburgh — 2026',
    desc: 'SensorFlow: an LLM-guided evolutionary search agent that Pareto-optimizes TinyML models for production sensors.',
    stat: '~98%', read: 'lower latency · production signal reconstruction', stack: 'LLMs · AWS Bedrock · Lambda', links: [] },
  { fig: RICE, kind: 'ship', tag: 'INTERNSHIP', name: 'Rice Robotics', ctx: 'SWE Intern · Hong Kong — 2024',
    desc: 'Azure OpenAI autonomy for an embodied robot — perception to motion, in real time.',
    stat: '3.5×', read: 'faster round-trip · 10s → 3s', stack: 'Azure OpenAI · Multimodal', links: [] },
  { fig: LLM, kind: 'res', tag: 'RESEARCH', name: 'GUI-Grounded Repair', ctx: 'CMU 11-711 — 2026',
    desc: 'Frozen GUI-grounding models as zero-shot scaffolding for VLM code repair.',
    stat: '+29%', read: 'visual fidelity · p<0.01', stack: 'VLMs · Qwen2.5-VL',
    links: [{ t: 'PAPER', href: '/gui-grounded-repair.pdf' }, { t: 'CODE', href: 'https://github.com/isaacau502/GUI-grounded-gen' }] },
  { fig: CURATION, kind: 'res', tag: 'RESEARCH', name: 'Clinical Data Curation', ctx: 'with Prof. Bryan Wilder — 2025',
    desc: 'An LLM judge distills 2M+ clinical entries into 50k gold rows for fine-tuning.',
    stat: '+15%', read: 'medical reasoning', stack: 'LLMs · LoRA SFT · PyTorch', links: [] },
  { fig: KV, kind: 'sys', tag: 'SYSTEMS', name: 'Distributed KV Store', ctx: 'CMU 15-440 — 2025',
    desc: 'FIFO mailbox, RPC, and last-writer-wins sync across shared-nothing replicas.',
    stat: '500ms / 2s', read: 'convergence · eventual', stack: 'Go · RPC · Actor Model', links: [] },
  { fig: DROPIN, kind: 'ship', tag: 'PERSONAL', name: 'DropIn', ctx: 'Motion Capture — 2026',
    desc: 'Real-time mocap from an iPhone — no $50k optical rig.',
    stat: '<50ms', read: 'latency @ 100Hz IMU', stack: 'Swift · IMU · WebGL',
    links: [{ t: 'CODE', href: 'https://github.com/isaacau502/DropIn' }] },
];

const FORMING = [
  { fig: AGENTMON, kind: 'wip', tag: 'IN BUILD', name: 'Agentmon', ctx: 'Personal — 2026',
    desc: 'Agentic orchestration, gamified — train and battle LLM agents.',
    stack: 'LLMs · Agents · Orchestration', links: [{ t: 'CODE', href: 'https://github.com/isaacau502/agentmon' }] },
  { fig: GSD, kind: 'wip', tag: 'IN BUILD', name: 'GSD', ctx: 'Personal — 2026',
    desc: 'Earn screen time by finishing tasks; AI chunks and verifies them.',
    stack: 'LLMs · Mobile · Verification', links: [{ t: 'CODE', href: 'https://github.com/isaacau502/GSDscreentime' }] },
];

// dark chart = the sky's own pale-ice palette; light chart = ink figures on pale sky
const FIG_LIGHT = { star: '38,57,89', glow: '40,86,158', edge: '96,116,146', label: '91,107,125', amber: '154,91,18' };

// ---- one constellation figure (its own canvas + twinkle loop) ----
class Figure extends Component {
  constructor(props) { super(props); this.ref = createRef(); this._raf = 0; }
  componentDidMount() {
    this.setup();
    // off-screen plates don't need a live twinkle — pause the loop until they scroll in
    if (typeof IntersectionObserver !== 'undefined' && this.ref.current) {
      this._io = new IntersectionObserver(([e]) => { this._visible = e.isIntersecting; if (this._visible) this.resume(); });
      this._io.observe(this.ref.current);
    }
  }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme || prev.reduced !== this.props.reduced) { this.teardown(); this.setup(); }
  }
  componentWillUnmount() { this.teardown(); if (this._io) { this._io.disconnect(); this._io = null; } }
  teardown() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; if (this._ro) { this._ro.disconnect(); this._ro = null; } }
  resume() { if (this._loop && !this._raf) this._raf = requestAnimationFrame(this._loop); }
  setup() {
    const cv = this.ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const palette = this.props.theme === 'light' ? FIG_LIGHT : SKY_PALETTE;
    const alpha = this.props.forming ? 0.5 : 1;
    const paint = (t) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
      if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const pad = Math.min(w, h) * 0.16;
      const panel = { x0: pad, y0: pad, w: w - pad * 2, h: h - pad * 2 };
      drawConstellation(ctx, this.props.fig.stars, this.props.fig.edges, panel, { t, alpha, grow: 1, palette });
    };
    paint(0);
    this._loop = null;
    if (this.props.reduced) {
      // static: repaint only when the box resizes (DPR / layout changes)
      if (typeof ResizeObserver !== 'undefined') { this._ro = new ResizeObserver(() => paint(0)); this._ro.observe(cv); }
    } else {
      this._loop = (ms) => {
        paint(ms / 1000);
        // stop scheduling once scrolled out; the observer resumes on re-entry
        this._raf = this._visible === false ? 0 : requestAnimationFrame(this._loop);
      };
      this._raf = requestAnimationFrame(this._loop);
    }
  }
  render() { return <canvas className="fig" ref={this.ref} aria-hidden="true" />; }
}

function Plate({ p, theme, reduced, hero }) {
  return (
    <article className={'plate' + (hero ? ' hero' : '')} data-kind={p.kind}>
      <div className="figwrap"><Figure fig={p.fig} theme={theme} reduced={reduced} forming={p.kind === 'wip'} /></div>
      <div className="phead">
        <span className="mk" aria-hidden="true">{MARK[p.kind]}</span>
        <span className="tag">{p.tag}</span>
        {p.stat && <span className="stat">{p.stat}</span>}
      </div>
      <h3 className="nm disp">{p.name}</h3>
      <div className={'ctx' + (p.kind === 'wip' ? ' wip' : '')}>{p.ctx}</div>
      <p className="desc">{p.desc}</p>
      {p.read && <div className="read">{p.read}</div>}
      <div className="pfoot">
        <span className="stk">{p.stack}</span>
        {p.links.length > 0 && (
          <span className="lk">
            {p.links.map((l) => (
              <a key={l.t} href={l.href} target="_blank" rel="noopener noreferrer">{l.t} <span className="ar" aria-hidden="true">→</span></a>
            ))}
          </span>
        )}
      </div>
    </article>
  );
}

export default class Work extends Component {
  constructor(props) {
    super(props);
    this.starRef = createRef();
    const win = typeof window !== 'undefined';
    this.state = {
      theme: this.resolveTheme(),
      reduced: win && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    };
  }

  resolveTheme() {
    if (typeof document === 'undefined') return 'dark';
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  componentDidMount() {
    document.title = 'Isaac Au — Work';

    // background starfield — seeded, viewport-scaled, theme-tinted (unchanged craft)
    const c = this.starRef.current;
    if (c) {
      const x = c.getContext('2d');
      let stars = [];
      // --tick is declared on .wk (the canvas's parent), not on :root
      const col = () => getComputedStyle(c.parentElement).getPropertyValue('--tick').trim() || 'rgba(120,140,170,0.25)';
      const rand = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const build = () => {
        const r = rand(20260707); stars = [];
        const n = Math.min(70, Math.round(window.innerWidth * window.innerHeight / 26000));
        for (let i = 0; i < n; i++) stars.push({ x: r(), y: r(), s: 0.4 + r() * 1.1 });
      };
      const draw = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = window.innerWidth, h = window.innerHeight;
        c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        x.clearRect(0, 0, w, h); x.fillStyle = col();
        for (const st of stars) { x.globalAlpha = 0.3 + st.s * 0.3; x.beginPath(); x.arc(st.x * w, st.y * h, st.s, 0, 7); x.fill(); }
        x.globalAlpha = 1;
      };
      this._drawStars = draw;
      this._onResize = () => { build(); draw(); };
      build(); draw();
      window.addEventListener('resize', this._onResize);
    }

    // theme + motion listeners → repaint figures (via props) and the starfield
    const onTheme = () => { this.setState({ theme: this.resolveTheme() }); if (this._drawStars) this._drawStars(); };
    this._mo = new MutationObserver(onTheme);
    this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this._mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    this._mqMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._onScheme = onTheme;
    this._onMotion = () => this.setState({ reduced: !!(this._mqMotion && this._mqMotion.matches) });
    if (this._mqDark && this._mqDark.addEventListener) this._mqDark.addEventListener('change', this._onScheme);
    if (this._mqMotion && this._mqMotion.addEventListener) this._mqMotion.addEventListener('change', this._onMotion);
  }

  componentWillUnmount() {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._mo) this._mo.disconnect();
    if (this._mqDark && this._mqDark.removeEventListener) this._mqDark.removeEventListener('change', this._onScheme);
    if (this._mqMotion && this._mqMotion.removeEventListener) this._mqMotion.removeEventListener('change', this._onMotion);
  }

  render() {
    const { theme, reduced } = this.state;
    return (
      <>
        <style>{`
          .wk{ --bg:#f4f7fb; --ink:#131b26; --dim:#5b6b7d; --faint:#5f7185;
            --accent:#28569e; --rule:#d6dfe9; --rule2:#c3cedb; --tick:rgba(19,27,38,0.20); }
          @media (prefers-color-scheme:dark){ .wk{ --bg:#070c15; --ink:#dbe6f3; --dim:#7a8a9e; --faint:#90a0b4;
            --accent:#7fa8e0; --rule:rgba(150,178,210,0.14); --rule2:rgba(150,178,210,0.24); --tick:rgba(150,178,210,0.30); } }
          :root[data-theme="light"] .wk{ --bg:#f4f7fb; --ink:#131b26; --dim:#5b6b7d; --faint:#5f7185;
            --accent:#28569e; --rule:#d6dfe9; --rule2:#c3cedb; --tick:rgba(19,27,38,0.20); }
          :root[data-theme="dark"] .wk{ --bg:#070c15; --ink:#dbe6f3; --dim:#7a8a9e; --faint:#90a0b4;
            --accent:#7fa8e0; --rule:rgba(150,178,210,0.14); --rule2:rgba(150,178,210,0.24); --tick:rgba(150,178,210,0.30); }
          .wk{ background:var(--bg); color:var(--ink); font-family:ui-monospace,Menlo,monospace; line-height:1.5;
            -webkit-font-smoothing:antialiased; font-variant-numeric:tabular-nums; min-height:100vh; }
          .wk *{ box-sizing:border-box; }
          .wk #stars{ position:fixed; inset:0; z-index:0; pointer-events:none; }
          .wk .disp{ font-family:'Archivo Black', system-ui, sans-serif; font-weight:400; letter-spacing:-0.01em; }
          .wk ::selection{ background:var(--accent); color:var(--bg); }
          .wk a:focus-visible{ outline:2px solid var(--accent); outline-offset:3px; }
          .wk .page{ position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:0 clamp(18px,5vw,64px); }

          .wk nav{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 0 18px; font-size:11px; letter-spacing:0.22em; }
          .wk nav .mark{ font-size:12px; letter-spacing:0.3em; }
          .wk nav .n{ display:flex; gap:clamp(14px,3vw,26px); align-items:center; }
          .wk nav a{ color:var(--dim); text-decoration:none; transition:color .18s; display:inline-flex; align-items:center; min-height:32px; }
          .wk nav a:hover, .wk nav a.on{ color:var(--ink); }
          .wk nav .rsm{ color:var(--accent); }

          .wk .mast{ padding:clamp(28px,5vw,48px) 0 0; }
          .wk .kier{ font-size:11px; letter-spacing:0.4em; color:var(--dim); }
          .wk .mast h1{ margin:12px 0 0; font-size:clamp(48px,11vw,116px); line-height:0.86; text-transform:uppercase; }
          .wk .sub{ margin:20px 0 0; max-width:56ch; color:var(--dim); font-size:14px; }
          .wk .hud{ margin:26px 0 0; display:flex; flex-wrap:wrap; gap:10px 26px; align-items:center; font-size:11px; letter-spacing:0.2em; color:var(--dim); padding:14px 0; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); }
          .wk .hud b{ color:var(--ink); font-weight:400; }
          .wk .hud .avl{ display:inline-flex; align-items:center; gap:8px; color:var(--accent); }
          .wk .hud .avl i{ width:7px; height:7px; border-radius:50%; background:var(--accent); display:inline-block; animation:wkpulse 2.4s ease-out infinite; }
          @keyframes wkpulse{ 0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 55%,transparent);} 70%{box-shadow:0 0 0 7px transparent;} 100%{box-shadow:0 0 0 0 transparent;} }

          /* section heads — a single hairline rule + label; no repeated eyebrows */
          .wk .shead{ display:flex; align-items:baseline; gap:16px; margin:clamp(40px,6vw,64px) 0 clamp(20px,3vw,30px); }
          .wk .shead h2{ margin:0; font-size:14px; letter-spacing:0.3em; font-weight:400; text-transform:uppercase; }
          .wk .shead .ln{ flex:1; height:1px; background:var(--rule2); transform:translateY(-4px); }
          .wk .shead .ct{ font-size:11px; letter-spacing:0.24em; color:var(--faint); }

          /* the chart field — a scatter of plates, NOT a card grid: no borders,
             no panels, staggered baselines so it reads as a star chart */
          .wk .field{ display:flex; flex-wrap:wrap; gap:clamp(30px,4vw,52px) clamp(24px,3.4vw,46px); align-items:flex-start; }
          .wk .plate{ flex:1 1 230px; min-width:200px; max-width:320px; }
          .wk .field .plate:nth-child(3n+2){ margin-top:clamp(0px,3vw,38px); }
          .wk .field .plate:nth-child(3n){ margin-top:clamp(0px,1.6vw,18px); }

          .wk .figwrap{ height:132px; margin-bottom:16px; }
          .wk .plate.hero .figwrap{ height:210px; }
          .wk .fig{ width:100%; height:100%; display:block; }

          .wk .phead{ display:flex; align-items:center; gap:10px; font-size:11px; letter-spacing:0.16em; color:var(--faint); }
          .wk .phead .mk{ color:var(--dim); font-size:10px; line-height:1; }
          .wk .phead .tag{ color:var(--dim); }
          .wk .phead .stat{ margin-left:auto; color:var(--accent); font-size:14px; letter-spacing:0; }
          .wk .nm{ margin:12px 0 0; font-size:24px; line-height:0.98; }
          .wk .plate.hero .nm{ font-size:clamp(34px,5vw,52px); }
          .wk .ctx{ margin:9px 0 0; font-size:12px; color:var(--accent); letter-spacing:0.02em; }
          .wk .ctx.wip{ color:var(--dim); }
          .wk .desc{ margin:12px 0 0; font-size:13px; color:var(--dim); max-width:52ch; }
          .wk .read{ margin:10px 0 0; font-size:12px; color:var(--faint); letter-spacing:0.02em; }
          .wk .pfoot{ margin-top:16px; padding-top:13px; border-top:1px solid var(--rule); display:flex; flex-wrap:wrap; gap:6px 16px; align-items:center; justify-content:space-between; font-size:11px; letter-spacing:0.1em; }
          .wk .pfoot .stk{ color:var(--dim); }
          .wk .pfoot .lk{ display:flex; gap:6px 18px; flex-wrap:wrap; }
          .wk .pfoot a{ color:var(--ink); text-decoration:none; display:inline-flex; align-items:center; min-height:44px; }
          .wk .pfoot a .ar{ display:inline-block; color:var(--accent); margin-left:5px; transition:transform .18s; }
          .wk .pfoot a:hover{ color:var(--accent); } .wk .pfoot a:hover .ar{ transform:translateX(3px); }

          /* hero plate spans the row and lays the figure beside the text on wide screens */
          .wk .field.lead{ display:block; }
          .wk .plate.hero{ max-width:none; }
          @media (min-width:760px){
            .wk .plate.hero{ display:grid; grid-template-columns:minmax(240px,340px) 1fr; gap:clamp(28px,4vw,56px); align-items:center; }
            .wk .plate.hero .figwrap{ height:240px; margin-bottom:0; grid-row:1 / span 6; }
            .wk .plate.hero .pfoot{ grid-column:2; }
          }

          .wk .apx{ margin:clamp(48px,7vw,72px) 0 0; padding-top:24px; border-top:1px solid var(--rule2); display:flex; align-items:flex-end; justify-content:space-between; gap:24px; flex-wrap:wrap; }
          .wk .apx .k{ font-size:11px; letter-spacing:0.34em; color:var(--faint); }
          .wk .apx .b{ margin-top:12px; font-size:16px; max-width:52ch; line-height:1.55; }
          .wk .apx .cta{ font-size:12px; letter-spacing:0.16em; color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; min-height:44px; white-space:nowrap; }
          .wk .apx .cta .ar{ margin-left:6px; transition:transform .18s; } .wk .apx .cta:hover{ color:var(--ink); } .wk .apx .cta:hover .ar{ transform:translateX(3px); }

          .wk footer{ margin:clamp(44px,6vw,60px) 0 70px; padding-top:22px; border-top:1px solid var(--rule); display:flex; flex-wrap:wrap; gap:14px 44px; }
          .wk footer .fk{ font-size:10px; letter-spacing:0.34em; color:var(--faint); display:block; margin-bottom:5px; }
          .wk footer a{ font-size:13px; color:var(--ink); text-decoration:none; display:inline-flex; min-height:32px; align-items:center; } .wk footer a:hover{ color:var(--accent); }

          @media (max-width:680px){
            .wk .plate{ flex:1 1 100%; max-width:none; }
            .wk .field .plate:nth-child(3n+2), .wk .field .plate:nth-child(3n){ margin-top:0; }
          }
          @media (prefers-reduced-motion:reduce){
            .wk .hud .avl i{ animation:none; }
            .wk .pfoot a .ar, .wk .apx .cta .ar{ transition:none; }
          }
        `}</style>

        <div className="wk">
          <canvas id="stars" ref={this.starRef}></canvas>
          <div className="page">
            <nav>
              <span className="mark disp">ISAAC AU</span>
              <span className="n">
                <a href="/work" className="on">WORK</a>
                <a href="/" title="The cinematic scroll experience">THE RUN ↗</a>
                <a href="/#contact">CONTACT</a>
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="rsm">RÉSUMÉ ↓</a>
              </span>
            </nav>

            <div className="mast">
              <div className="kier">STAR CATALOG</div>
              <h1 className="disp">WORK</h1>
              <p className="sub">Every project as a constellation &mdash; systems that touch the physical world: sensors, patients, riders, real-time streams, tight budgets. The same figures you rode past on the run, charted.</p>
              <div className="hud">
                <span className="avl"><i></i>INCOMING SWE @ GOOGLE</span>
                <span>AI CATALYST · <b>JUN 2027</b></span>
                <span>CMU · <b>BS CS (ML)</b></span>
                <span>PITTSBURGH, PA</span>
              </div>
            </div>

            <div className="shead"><h2>Flagship</h2><span className="ln"></span><span className="ct">01</span></div>
            <div className="field lead">
              <Plate p={HERO} theme={theme} reduced={reduced} hero />
            </div>

            <div className="shead"><h2>Charted</h2><span className="ln"></span><span className="ct">{String(CHARTED.length).padStart(2, '0')}</span></div>
            <div className="field">
              {CHARTED.map((p) => <Plate key={p.name} p={p} theme={theme} reduced={reduced} />)}
            </div>

            <div className="shead"><h2>Still forming</h2><span className="ln"></span><span className="ct">UNRELEASED</span></div>
            <div className="field">
              {FORMING.map((p) => <Plate key={p.name} p={p} theme={theme} reduced={reduced} />)}
            </div>

            <div className="apx">
              <div>
                <div className="k">✦ THE SHARED SKY</div>
                <div className="b">This portfolio is also a living night sky. Ride the run, describe anything, and it becomes a constellation everyone after you can see — charted right beside these.</div>
              </div>
              <a href="/#sky" className="cta">LEAVE YOUR MARK<span className="ar" aria-hidden="true">→</span></a>
            </div>

            <footer>
              <div><span className="fk">EMAIL</span><a href="mailto:ayhisaac@gmail.com">ayhisaac@gmail.com</a></div>
              <div><span className="fk">GITHUB</span><a href="https://github.com/isaacau502" target="_blank" rel="noopener noreferrer">@isaacau502</a></div>
              <div><span className="fk">LINKEDIN</span><a href="https://linkedin.com/in/isaacayh" target="_blank" rel="noopener noreferrer">/in/isaacayh</a></div>
              <div><span className="fk">RÉSUMÉ</span><a href="/resume.pdf" target="_blank" rel="noopener noreferrer">resume.pdf ↓</a></div>
            </footer>
          </div>
        </div>
      </>
    );
  }
}
