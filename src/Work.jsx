import { Component, createRef } from 'react';

// The professional reference page at /work — a glanceable spec-tile index of
// shipped + in-progress work. Deliberately plain (no ski language beyond the
// one sky callback); OS-theme-aware (dark = night instrument panel, light =
// daylight spec sheet). The run at "/" stays the cinematic experience.
//
// TODO(hover-preview): re-add the per-card media reveal (screenshot/gif that
// cross-fades into the card frame on hover, media strip on touch). Design +
// which cards have assets are in notes/work-hover-preview-todo.md. Removed for
// the first ship because the real assets aren't ready yet.

const SHIPPED = [
  { n: '01', st: 'shp', tag: 'PILOTED', name: 'Ovis Medical', ctx: 'Co-founder · Tech Lead — 2022–2026',
    desc: 'A daily AI voice between cancer patients and their care team.',
    fig: 'Clinical pilot', read: ' — oncology, HKU', stack: 'LLMs · TTS · React · AWS',
    links: [{ t: 'TRY IT', href: 'https://app.ovismedical.com' }] },
  { n: '02', st: 'shp', tag: 'INTERNSHIP', name: 'Rice Robotics', ctx: 'SWE Intern · Hong Kong — May–Jul 2024',
    desc: 'Azure OpenAI autonomy for an embodied robot — perception to motion, in real time.',
    fig: '3.5× faster', read: ' round-trip, 10s → 3s', stack: 'Azure OpenAI · Multimodal', links: [] },
  { n: '03', st: 'res', tag: 'RESEARCH', name: 'GUI-Grounded Repair', ctx: 'CMU 11-711 — 2026',
    desc: 'Frozen GUI-grounding models as zero-shot scaffolding for VLM code repair.',
    fig: '+29%', read: ' visual fidelity · p<0.01', stack: 'VLMs · Qwen2.5-VL',
    links: [{ t: 'PAPER', href: '/gui-grounded-repair.pdf' }, { t: 'CODE', href: 'https://github.com/isaacau502/GUI-grounded-gen' }] },
  { n: '04', st: 'res', tag: 'RESEARCH', name: 'Clinical Data Curation', ctx: 'LLM-Judge — 2026',
    desc: 'An LLM judge distills 2M+ clinical entries into 50k gold rows for fine-tuning.',
    fig: '+15%', read: ' medical reasoning', stack: 'LLMs · LoRA SFT · PyTorch', links: [] },
  { n: '05', st: 'res', tag: 'SYSTEMS', name: 'Distributed KV Store', ctx: 'CMU 15-440 Distributed Systems — 2025',
    desc: 'FIFO mailbox, RPC, and last-writer-wins sync across shared-nothing replicas.',
    fig: '500ms / 2s', read: ' convergence, eventual', stack: 'Go · RPC · Actor Model', links: [] },
  { n: '06', st: 'shp', tag: 'PERSONAL', name: 'DropIn', ctx: 'Motion Capture — 2026',
    desc: 'Real-time mocap from an iPhone — no $50k optical rig.',
    fig: '<50ms', read: ' latency @ 100Hz IMU', stack: 'Swift · IMU · WebGL',
    links: [{ t: 'CODE', href: 'https://github.com/isaacau502/DropIn' }] },
];

const WIP = [
  { n: '07', name: 'Agentmon', ctx: 'Personal — 2026', desc: 'Agentic orchestration, gamified — train and battle LLM agents.',
    stack: 'LLMs · Agents · Orchestration', links: [{ t: 'CODE', href: 'https://github.com/isaacau502/agentmon' }] },
  { n: '08', name: 'GSD', ctx: 'Personal — 2026', desc: 'Earn screen time by finishing tasks; AI chunks and verifies them.',
    stack: 'LLMs · Mobile · Verification', links: [{ t: 'CODE', href: 'https://github.com/isaacau502/GSDscreentime' }] },
];

function Links({ links }) {
  if (!links.length) return null;
  return (
    <span className="lk">
      {links.map((l) => (
        <a key={l.t} href={l.href} target="_blank" rel="noopener noreferrer">{l.t} <span className="ar">→</span></a>
      ))}
    </span>
  );
}

export default class Work extends Component {
  constructor(props) {
    super(props);
    this.starRef = createRef();
  }

  componentDidMount() {
    document.title = 'Isaac Au — Work';
    const c = this.starRef.current;
    if (!c) return;
    const x = c.getContext('2d');
    let stars = [];
    const col = () => getComputedStyle(document.documentElement).getPropertyValue('--tick').trim() || 'rgba(120,140,170,0.25)';
    const rand = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const build = () => {
      const r = rand(20260707); stars = [];
      const n = Math.min(70, Math.round(window.innerWidth * window.innerHeight / 26000));
      for (let i = 0; i < n; i++) stars.push({ x: r(), y: r(), s: 0.4 + r() * 1.1 });
    };
    const draw = () => {
      c.width = window.innerWidth; c.height = window.innerHeight;
      x.clearRect(0, 0, c.width, c.height); x.fillStyle = col();
      for (const st of stars) { x.globalAlpha = 0.3 + st.s * 0.3; x.beginPath(); x.arc(st.x * c.width, st.y * c.height, st.s, 0, 7); x.fill(); }
      x.globalAlpha = 1;
    };
    this._onResize = () => { build(); draw(); };
    build(); draw();
    window.addEventListener('resize', this._onResize);
    this._mo = new MutationObserver(draw);
    this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  componentWillUnmount() {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._mo) this._mo.disconnect();
  }

  render() {
    return (
      <>
        <style>{`
          .wk{ --bg:#f4f7fb; --panel:rgba(255,255,255,0.62); --ink:#131b26; --dim:#5b6b7d; --faint:#8695a6;
            --accent:#1f4f96; --live:#9a5b12; --ship:#2f7d63; --rule:#d6dfe9; --rule2:#c3cedb; --tick:rgba(19,27,38,0.20); }
          @media (prefers-color-scheme:dark){ .wk{ --bg:#070c15; --panel:rgba(150,178,210,0.045); --ink:#dbe6f3; --dim:#7a8a9e; --faint:#526176;
            --accent:#5fb0e8; --live:#ffcf99; --ship:#6fd0a8; --rule:rgba(150,178,210,0.14); --rule2:rgba(150,178,210,0.24); --tick:rgba(150,178,210,0.30); } }
          :root[data-theme="light"] .wk{ --bg:#f4f7fb; --panel:rgba(255,255,255,0.62); --ink:#131b26; --dim:#5b6b7d; --faint:#8695a6;
            --accent:#1f4f96; --live:#9a5b12; --ship:#2f7d63; --rule:#d6dfe9; --rule2:#c3cedb; --tick:rgba(19,27,38,0.20); }
          :root[data-theme="dark"] .wk{ --bg:#070c15; --panel:rgba(150,178,210,0.045); --ink:#dbe6f3; --dim:#7a8a9e; --faint:#526176;
            --accent:#5fb0e8; --live:#ffcf99; --ship:#6fd0a8; --rule:rgba(150,178,210,0.14); --rule2:rgba(150,178,210,0.24); --tick:rgba(150,178,210,0.30); }
          .wk{ background:var(--bg); color:var(--ink); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; line-height:1.5;
            -webkit-font-smoothing:antialiased; font-variant-numeric:tabular-nums; min-height:100vh; }
          .wk *{ box-sizing:border-box; }
          .wk #stars{ position:fixed; inset:0; z-index:0; pointer-events:none; }
          .wk .disp{ font-family:'Archivo Black', system-ui, sans-serif; font-weight:400; }
          .wk ::selection{ background:var(--accent); color:var(--bg); }
          .wk .page{ position:relative; z-index:1; max-width:1240px; margin:0 auto; padding:0 clamp(18px,5vw,64px); }

          .wk nav{ display:flex; align-items:center; justify-content:space-between; padding:20px 0 18px; font-size:11px; letter-spacing:0.22em; }
          .wk nav .mark{ font-size:12px; letter-spacing:0.3em; }
          .wk nav .n{ display:flex; gap:20px; align-items:center; }
          .wk nav a{ color:var(--dim); text-decoration:none; transition:color .18s; }
          .wk nav a:hover, .wk nav a.on{ color:var(--ink); }
          .wk nav .rsm{ color:var(--accent); }

          .wk .mast{ padding:38px 0 0; }
          .wk .kier{ font-size:11px; letter-spacing:0.4em; color:var(--faint); }
          .wk .mast h1{ margin:12px 0 0; font-size:clamp(48px,11vw,116px); line-height:0.86; letter-spacing:-0.01em; }
          .wk .sub{ margin:20px 0 0; max-width:54ch; color:var(--dim); font-size:14px; }
          .wk .hud{ margin:24px 0 0; display:flex; flex-wrap:wrap; gap:8px 26px; align-items:center; font-size:11px; letter-spacing:0.2em; color:var(--dim); padding:12px 0; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); }
          .wk .hud b{ color:var(--ink); font-weight:400; }
          .wk .hud .avl{ display:inline-flex; align-items:center; gap:8px; color:var(--accent); }
          .wk .hud .avl i{ width:7px; height:7px; border-radius:50%; background:var(--accent); display:inline-block; animation:wkpulse 2.4s ease-out infinite; }
          @keyframes wkpulse{ 0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 55%,transparent);} 70%{box-shadow:0 0 0 7px transparent;} 100%{box-shadow:0 0 0 0 transparent;} }

          .wk .shead{ display:flex; align-items:center; gap:16px; margin:44px 0 16px; }
          .wk .shead .lbl{ font-size:11px; letter-spacing:0.34em; }
          .wk .shead .lbl.ship{ color:var(--dim); } .wk .shead .lbl.wip{ color:var(--live); }
          .wk .shead .ln{ flex:1; height:1px; background:var(--rule2); }
          .wk .shead .ct{ font-size:11px; letter-spacing:0.24em; color:var(--faint); }

          .wk .grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
          @media (min-width:980px){ .wk .grid{ grid-template-columns:repeat(3,1fr); } }
          @media (max-width:680px){ .wk .grid{ grid-template-columns:1fr; } }

          .wk .card{ position:relative; border:1px solid var(--rule); background:var(--panel); padding:22px; display:flex; flex-direction:column; transition:border-color .2s; }
          .wk .card::before{ content:''; position:absolute; top:-1px; left:-1px; width:15px; height:15px; border-top:2px solid var(--accent); border-left:2px solid var(--accent); opacity:0; transition:opacity .2s; }
          .wk .card:hover{ border-color:var(--rule2); }
          .wk .card:hover::before{ opacity:1; }
          .wk .chd{ display:flex; align-items:center; justify-content:space-between; font-size:10.5px; letter-spacing:0.18em; color:var(--faint); }
          .wk .chd .st{ display:inline-flex; align-items:center; gap:7px; }
          .wk .chd .st i{ width:6px; height:6px; border-radius:50%; background:var(--ship); display:inline-block; }
          .wk .chd .st.res i{ background:var(--accent); } .wk .chd .st.wip i{ background:var(--live); }
          .wk .chd .st.res{ color:var(--accent); } .wk .chd .st.wip{ color:var(--live); } .wk .chd .st.shp{ color:var(--ship); }
          .wk .nm{ margin:16px 0 0; font-size:27px; line-height:0.98; letter-spacing:-0.01em; }
          .wk .ctx{ margin:11px 0 0; font-size:12px; color:var(--accent); letter-spacing:0.03em; }
          .wk .ctx.live{ color:var(--live); }
          .wk .desc{ margin:12px 0 0; font-size:13px; color:var(--dim); }
          .wk .read{ margin:13px 0 0; font-size:12px; letter-spacing:0.02em; color:var(--faint); }
          .wk .read .fig{ color:var(--accent); font-size:14.5px; letter-spacing:0; }
          .wk .read.live .fig{ color:var(--live); }
          .wk .cf{ margin-top:18px; padding-top:14px; border-top:1px solid var(--rule); display:flex; flex-wrap:wrap; gap:8px 14px; align-items:center; justify-content:space-between; font-size:10.5px; letter-spacing:0.1em; }
          .wk .cf .stk{ color:var(--faint); }
          .wk .cf .lk{ display:flex; gap:14px; }
          .wk .cf a{ color:var(--ink); text-decoration:none; border-bottom:1px solid var(--accent); padding-bottom:2px; }
          .wk .cf a:hover{ color:var(--accent); }
          .wk .cf a .ar{ display:inline-block; transition:transform .18s; } .wk .cf a:hover .ar{ transform:translateX(3px); }

          .wk .apx{ margin:52px 0 0; padding:26px; border:1px solid var(--rule2); background:var(--panel); display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; }
          .wk .apx .k{ font-size:11px; letter-spacing:0.34em; color:var(--faint); }
          .wk .apx .b{ margin-top:9px; font-size:16px; max-width:48ch; }
          .wk .apx .cta{ font-size:12px; letter-spacing:0.16em; color:var(--accent); text-decoration:none; border-bottom:1px solid var(--accent); padding-bottom:3px; white-space:nowrap; }
          .wk .apx .cta:hover{ color:var(--ink); }

          .wk footer{ margin:52px 0 70px; padding-top:22px; border-top:1px solid var(--rule); display:flex; flex-wrap:wrap; gap:14px 44px; }
          .wk footer .fk{ font-size:10px; letter-spacing:0.34em; color:var(--faint); display:block; margin-bottom:5px; }
          .wk footer a{ font-size:13px; color:var(--ink); text-decoration:none; } .wk footer a:hover{ color:var(--accent); }
          @media (prefers-reduced-motion:reduce){ .wk .hud .avl i{ animation:none; } }
        `}</style>

        <div className="wk">
          <canvas id="stars" ref={this.starRef}></canvas>
          <div className="page">
            <nav>
              <span className="mark disp">ISAAC AU</span>
              <span className="n">
                <a href="/work" className="on">WORK</a>
                <a href="/">EXPERIENCE</a>
                <a href="/#contact">CONTACT</a>
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="rsm">RÉSUMÉ ↓</a>
              </span>
            </nav>

            <div className="mast">
              <div className="kier">SELECTED WORK</div>
              <h1 className="disp">WORK</h1>
              <p className="sub">Systems that touch the physical world &mdash; sensors, patients, riders, real-time streams, tight budgets.</p>
              <div className="hud">
                <span className="avl"><i></i>AVAILABLE</span>
                <span>FULL-TIME · <b>NEW-GRAD 2027</b></span>
                <span>CMU · <b>BS CS (ML)</b></span>
                <span>PITTSBURGH, PA</span>
              </div>
            </div>

            <div className="shead"><span className="lbl ship">SHIPPED</span><span className="ln"></span><span className="ct">06</span></div>
            <div className="grid">
              {SHIPPED.map((p) => (
                <article className="card" key={p.n}>
                  <div className="chd"><span>{p.n}</span><span className={'st ' + p.st}><i></i>{p.tag}</span></div>
                  <h3 className="nm disp">{p.name}</h3>
                  <div className="ctx">{p.ctx}</div>
                  <p className="desc">{p.desc}</p>
                  <div className="read"><span className="fig">{p.fig}</span>{p.read}</div>
                  <div className="cf"><span className="stk">{p.stack}</span><Links links={p.links} /></div>
                </article>
              ))}
            </div>

            <div className="shead"><span className="lbl wip">IN PROGRESS</span><span className="ln"></span><span className="ct">UNRELEASED</span></div>
            <div className="grid">
              {WIP.map((p) => (
                <article className="card" key={p.n}>
                  <div className="chd"><span>{p.n}</span><span className="st wip"><i></i>IN BUILD</span></div>
                  <h3 className="nm disp">{p.name}</h3>
                  <div className="ctx live">{p.ctx}</div>
                  <p className="desc">{p.desc}</p>
                  <div className="read live"><span className="fig">◷ In progress</span></div>
                  <div className="cf"><span className="stk">{p.stack}</span><Links links={p.links} /></div>
                </article>
              ))}
            </div>

            <div className="apx">
              <div>
                <div className="k">✦ APPENDIX — THE SHARED SKY</div>
                <div className="b">This portfolio is also a living night sky. Describe anything and it becomes a constellation everyone after you can see.</div>
              </div>
              <a href="/#sky" className="cta">LEAVE YOUR MARK →</a>
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
