import { useEffect } from 'react';
import DATA from './borrow/items.json';

// The unlisted lending shelf at /borrowmystuff — shared by link, noindexed by
// the Worker. Just a list: ask Isaac directly. Content lives in
// borrow/items.json (see CLAUDE.md for the shape); a local agent rewrites it
// from a notes txt, so this file only renders. Tokens mirror /work.

const byCat = (items) => {
  const groups = new Map();
  for (const it of items) {
    const c = it.cat || 'misc';
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(it);
  }
  return [...groups];
};

export default function Borrow() {
  useEffect(() => { document.title = 'Borrow my stuff — Isaac Au'; }, []);
  const items = DATA.items || [];
  const out = items.filter((it) => it.out).length;
  return (
    <>
      <style>{`
        .bw{ --bg:#f4f7fb; --ink:#131b26; --dim:#5b6b7d; --faint:#5f7185;
          --accent:#28569e; --rule:#d6dfe9; --rule2:#c3cedb; }
        @media (prefers-color-scheme:dark){ .bw{ --bg:#070c15; --ink:#dbe6f3; --dim:#7a8a9e; --faint:#90a0b4;
          --accent:#7fa8e0; --rule:rgba(150,178,210,0.14); --rule2:rgba(150,178,210,0.24); } }
        :root[data-theme="light"] .bw{ --bg:#f4f7fb; --ink:#131b26; --dim:#5b6b7d; --faint:#5f7185;
          --accent:#28569e; --rule:#d6dfe9; --rule2:#c3cedb; }
        :root[data-theme="dark"] .bw{ --bg:#070c15; --ink:#dbe6f3; --dim:#7a8a9e; --faint:#90a0b4;
          --accent:#7fa8e0; --rule:rgba(150,178,210,0.14); --rule2:rgba(150,178,210,0.24); }
        .bw{ background:var(--bg); color:var(--ink); font-family:ui-monospace,Menlo,monospace; line-height:1.5;
          -webkit-font-smoothing:antialiased; font-variant-numeric:tabular-nums; min-height:100vh; }
        .bw *{ box-sizing:border-box; }
        .bw .disp{ font-family:'Archivo Black', system-ui, sans-serif; font-weight:400; letter-spacing:-0.01em; }
        .bw ::selection{ background:var(--accent); color:var(--bg); }
        .bw .page{ max-width:760px; margin:0 auto; padding:clamp(28px,6vw,64px) clamp(16px,5vw,48px) 72px; }
        .bw .kier{ font-size:11px; letter-spacing:0.4em; color:var(--dim); }
        .bw h1{ margin:12px 0 0; font-size:clamp(40px,6vw,88px); line-height:0.9; text-transform:uppercase; }
        .bw .sub{ margin:18px 0 0; max-width:52ch; color:var(--dim); font-size:14px; }
        .bw .hud{ margin:22px 0 0; display:flex; flex-wrap:wrap; gap:8px 24px; font-size:11px; letter-spacing:0.2em; color:var(--dim);
          padding:12px 0; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); }
        .bw .hud b{ color:var(--ink); font-weight:400; }
        .bw .shead{ display:flex; align-items:baseline; gap:16px; margin:clamp(34px,5vw,48px) 0 6px; }
        .bw .shead h2{ margin:0; font-size:12px; letter-spacing:0.3em; font-weight:400; text-transform:uppercase; }
        .bw .shead .ln{ flex:1; height:1px; background:var(--rule2); transform:translateY(-4px); }
        .bw .shead .ct{ font-size:11px; letter-spacing:0.24em; color:var(--faint); }
        .bw ul{ list-style:none; margin:0; padding:0; }
        .bw li{ display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 16px; padding:13px 0; border-bottom:1px solid var(--rule); }
        .bw .nm{ font-size:14px; }
        .bw .note{ flex-basis:100%; font-size:13px; color:var(--dim); }
        .bw .st{ margin-left:auto; font-size:11px; letter-spacing:0.16em; color:var(--accent); white-space:nowrap; }
        .bw li.out .nm{ color:var(--dim); }
        .bw li.out .st{ color:var(--faint); }
        .bw .empty{ margin-top:36px; color:var(--dim); font-size:14px; }
        .bw footer{ margin-top:44px; font-size:13px; color:var(--faint); letter-spacing:0.06em; }
        .bw footer a{ color:var(--ink); } .bw footer a:hover{ color:var(--accent); }
      `}</style>
      <div className="bw">
        <div className="page">
          <div className="kier">ISAAC AU · LENDING SHELF</div>
          <h1 className="disp">Borrow my stuff</h1>
          <p className="sub">Things I own and am happy to lend. If you want something, just text me.</p>
          <div className="hud">
            <span><b>{items.length - out}</b> IN</span>
            <span><b>{out}</b> OUT</span>
            {DATA.updated && <span>UPDATED <b>{DATA.updated}</b></span>}
          </div>

          {items.length === 0 && <p className="empty">Nothing on the shelf right now.</p>}
          {byCat(items).map(([cat, list]) => (
            <section key={cat}>
              <div className="shead"><h2>{cat}</h2><span className="ln"></span><span className="ct">{String(list.length).padStart(2, '0')}</span></div>
              <ul>
                {list.map((it) => (
                  <li key={it.name} className={it.out ? 'out' : ''}>
                    <span className="nm">{it.name}</span>
                    <span className="st">{it.out ? `OUT · ${it.out}` : 'AVAILABLE'}</span>
                    {it.note && <span className="note">{it.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <footer><a href="/">isaacau.com</a></footer>
        </div>
      </div>
    </>
  );
}
