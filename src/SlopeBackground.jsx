import { Component, createRef } from 'react';

const mono = 'ui-monospace, monospace';

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
    this.spdRef = createRef();
    this.distRef = createRef();
    this.landPageRef = createRef();
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
      c.width = this.W * dpr; c.height = this.H * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.makeRidges();
    };
    // deterministic pseudo-random tables
    this.rand = [];
    let seed = 1234;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 600; i++) this.rand.push(rnd());
    // sparks (rushing dashes on the snow)
    this.sparks = [];
    for (let i = 0; i < 150; i++) {
      this.sparks.push({ u: (rnd() - 0.5), o: rnd(), w: 0.6 + rnd() * 1.6, cold: rnd() > 0.55 });
    }
    // spray particles
    this.spray = [];
    for (let i = 0; i < 70; i++) this.spray.push({ a: rnd() * Math.PI * 2, s: 0.2 + rnd() * 0.8, o: rnd() });

    // landing spray: fine particles popping in, more and more
    this.fines = [];
    for (let i = 0; i < 620; i++) {
      this.fines.push({ x: rnd(), y: rnd(), o: rnd(), r: 1 + Math.pow(rnd(), 2) * 9, cold: rnd() > 0.82 });
    }
    this.holeNoise = [];
    for (let i = 0; i < 40; i++) this.holeNoise.push(rnd());

    this.lipEl = document.querySelector('[data-screen-label="The lip"]');
    this.takeEl = document.querySelector('[data-screen-label="Takeoff"]');
    this.airEl = document.querySelector('[data-screen-label="Airborne"]');
    this.landEl = document.querySelector('[data-screen-label="The landing"]');
    this.sections = Array.from(document.querySelectorAll('[data-reveal]'));
    window.addEventListener('resize', this.resize);
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
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
    const bob = Math.sin(d * 2.1) * 3 * (1 - lift) + Math.sin(t * 0.02) * lift * 2;

    const ctx = this.ctx, W = this.W, H = this.H;
    const fall = smooth(0.0, 0.12, this.sm.land);
    // gaze tilts upward mid-sky (horizon sinks, sky fills the frame), then back down for descent
    const upGaze = smooth(0.1, 0.45, this.sm.air) * (1 - smooth(0.55, 0.85, this.sm.air + preLand));
    // falling: pitch down hard onto the tracks — horizon climbs, slope fills the frame
    const downGaze = smooth(0.1, 0.85, descent);
    const horizon = Math.max(H * 0.09, H * (0.26 + lift * 0.5 * (1 - fall * 0.75) + upGaze * 0.19 * (1 - fall) - downGaze * 0.58)) + bob;
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
    if (lift > 0) {
      ctx.fillStyle = `rgba(255,255,255,${lift * 0.12})`;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
      for (let i = 0; i < 40; i++) {
        const r1 = this.rand[(i * 11) % 600], r2 = this.rand[(i * 17 + 5) % 600];
        const fy = ((r2 + t * 0.00004 * (1 + r1)) % 1) * H;
        ctx.fillStyle = `rgba(255,255,255,${0.4 * lift})`;
        ctx.beginPath(); ctx.arc(r1 * W, fy, 1 + r1 * 2, 0, 7); ctx.fill();
      }
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
      const op = Math.max(0, Math.min(1, 1 - Math.abs(dd) * 1.7));
      el.style.opacity = op.toFixed(3);
      el.style.transform = `translateY(${(dd * 60).toFixed(1)}px)`;
    }

    // ---- HUD ----
    if (this.spdRef.current) {
      const kmh = Math.max(0, Math.round((28 + p * 54 + Math.min(Math.abs(this.scrollV) * 60, 20)) * Math.pow(1 - stop, 2)));
      this.spdRef.current.textContent = 'SPD ' + String(kmh).padStart(2, '0') + ' KM/H';
      const lipM = Math.max(0, Math.round(400 * (1 - (this.sm.lip + this.sm.take) / 1.7)));
      let label;
      if (stop > 0.3) label = 'STOMPED';
      else if (descent > 0.015) label = 'LZ ' + Math.max(0, Math.round(240 * (1 - descent))) + ' M';
      else if (lift > 0.5) label = 'AIRBORNE';
      else label = 'LIP ' + lipM + ' M';
      this.distRef.current.textContent = label;
      const lzClose = descent > 0.015 && 240 * (1 - descent) < 30;
      this.distRef.current.style.color = (lzClose || (stop <= 0.3 && lift <= 0.5 && lipM < 80)) ? '#b8452e' : '';
    }
  };

  progEl(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const H = this.H || window.innerHeight;
    return Math.max(0, Math.min(1, (H * 0.5 - r.top) / Math.max(r.height, 1)));
  }

  drawImpact(ctx, W, H, impact, fullWhite, t) {
    // particles pop in one by one — bottom first, denser and larger as impact grows
    if (impact > 0.001) {
      for (const f of this.fines) {
        const thresh = (1 - f.y) * 0.55 + f.o * 0.4;
        const a = Math.max(0, Math.min(1, (impact - thresh) * 5));
        if (a <= 0) continue;
        const pop = 1 - Math.pow(1 - a, 3);
        const x = f.x * W;
        const y = f.y * H - pop * 14 * f.o;
        const rad = f.r * (0.35 + pop * 0.65) * (1 + impact * 3.2);
        const al = Math.min(1, a * 2) * (f.cold ? 0.55 : 0.92);
        ctx.fillStyle = f.cold ? `rgba(165,186,212,${al.toFixed(3)})` : `rgba(255,255,255,${al.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
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
    return (
      <>
        <canvas
          ref={this.canvasRef}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, display: 'block' }}
        />

        <div style={{ position: 'relative', zIndex: 1, color: '#17222f', fontFamily: "'Archivo Black', sans-serif" }}>

          <section data-screen-label="Drop in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.35em', color: '#4a5c72' }}>RUN 01 — GROOMED — 06:48</div>
              <h1 style={{ margin: 0, fontSize: 'clamp(64px, 13vw, 200px)', lineHeight: 0.9, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Drop In</h1>
              <div style={{ fontFamily: mono, fontSize: 14, letterSpacing: '0.2em', color: '#4a5c72' }}>HOLD YOUR LINE. THE JUMP IS COMING.</div>
            </div>
            <div style={{ position: 'absolute', bottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.3em', color: '#4a5c72' }}>SCROLL</div>
              <div style={{ width: 2, height: 34, background: '#17222f', animation: 'cueDrop 1.6s ease-in-out infinite' }} />
            </div>
          </section>

          <section data-screen-label="The approach" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 8vw' }}>
            <div data-reveal="1" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>01 / THE APPROACH</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.95, textTransform: 'uppercase' }}>Speed builds</h2>
              <p style={{ margin: 0, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Edge to edge. Every turn loads the legs a little more. Keep scrolling — you are accelerating.</p>
            </div>
          </section>

          <section data-screen-label="The lip" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8vw' }}>
            <div data-reveal="1" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'right', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>02 / THE LIP</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.95, textTransform: 'uppercase' }}>It rises ahead</h2>
              <p style={{ margin: 0, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>The kicker grows on the horizon. Line up. Stop carving. Let it run straight.</p>
            </div>
          </section>

          <section data-screen-label="Takeoff" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>03 / TAKEOFF</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(56px, 11vw, 170px)', lineHeight: 0.9, textTransform: 'uppercase' }}>Send it</h2>
            </div>
          </section>

          <section data-screen-label="Airborne" style={{ height: '500vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '260vh' }}>
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#dbe7f4' }}>— AIRBORNE —</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1, textTransform: 'uppercase', color: '#f4f8fd' }}>Nothing but sky</h2>
            </div>
          </section>

          <section data-screen-label="The landing" style={{ height: '190vh' }} />

          <section
            ref={this.landPageRef}
            data-screen-label="Landing page"
            style={{ minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '14vh 8vw', textAlign: 'center', position: 'relative' }}
          >
            <div data-reveal="1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, willChange: 'transform, opacity' }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.35em', color: '#4a5c72' }}>04 / THE LANDING — STOMPED</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(56px, 10vw, 150px)', lineHeight: 0.9, textTransform: 'uppercase' }}>White room</h2>
              <p style={{ margin: 0, maxWidth: 480, fontFamily: mono, fontSize: 14, lineHeight: 1.7, color: '#33455c' }}>Buried to the waist, grinning. Every run ends in powder — start yours.</p>
              <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                <a href="#" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', background: '#17222f', color: '#ffffff', fontFamily: mono, fontSize: 13, letterSpacing: '0.2em', textDecoration: 'none' }}>BOOK A RUN</a>
                <a href="#" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', border: '2px solid #17222f', color: '#17222f', fontFamily: mono, fontSize: 13, letterSpacing: '0.2em', textDecoration: 'none' }}>WATCH THE LINE</a>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 22, fontFamily: mono, fontSize: 11, letterSpacing: '0.3em', color: '#8fa2b8' }}>CARVE — WINTER 26/27</div>
          </section>

        </div>

        <div style={{ position: 'fixed', left: 24, bottom: 22, zIndex: 2, fontFamily: mono, fontSize: 12, letterSpacing: '0.18em', color: '#33455c', display: 'flex', gap: 22 }}>
          <span ref={this.spdRef}>SPD 00 KM/H</span>
          <span ref={this.distRef}>LIP 400 M</span>
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
