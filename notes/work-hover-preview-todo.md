# TODO — re-add the /work card hover-preview (media reveal)

**Status:** deferred. Shipped `/work` (src/Work.jsx) *without* the media reveal
because real screenshots/clips aren't ready. Add it back once assets exist.

## The interaction (validated in the artifact mock)

On hover, a project card cross-fades from its data face to a screenshot / short
clip *inside the same card frame* — no flip, no layout shift. A caption stays
pinned so the name + metric never disappear behind the image. Cards without
assets simply omit the media and stay pure data tiles (graceful degradation).

- **Motion → webm/mp4, not gif** (a mocap gif is multi-MB; webm ~10× smaller).
- **Touch has no hover:** on `@media (hover:none)` show the media as a fixed
  ~112px strip at the top of the card instead of a hover reveal.
- Lazy-load media (only when near viewport / on first hover).

## Which cards have good assets

- **Ovis** — app screenshot or a short check-in gif
- **GUI-Grounded Repair** — before/after repair overlay (repo has
  `poster/grounding_overlays/*.png`) or the poster
- **DropIn** — short mocap clip (the plexus-rider ollie) → webm  ← the star
- **Rice Robotics** — robot demo clip / photo
- **Agentmon** — gameplay clip
- **GSD** — app mockup
- Clinical Data Curation, Distributed KV Store — likely no media; leave as data tiles

## Implementation reference

The working POC markup/CSS is preserved in the artifact scratch file
(`.../scratchpad/work.html`, label `media-reveal-poc`). Sketch:

```css
.card.media{ overflow:hidden; }
.shot{ position:absolute; inset:0; z-index:3; opacity:0; transition:opacity .28s;
       display:flex; align-items:center; justify-content:center; }
.shot img,.shot video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.card.media:hover .shot{ opacity:1; }
@media (hover:none){ .card.media .shot{ position:relative; opacity:1; height:112px; margin:-22px -22px 6px; } }
```

In `Work.jsx`: add an optional `media` field to the SHIPPED/WIP records
(`{ src, poster, kind: 'img'|'video', tag, caption }`), render a `.shot` child
when present, and add `media` to the card's className. Put assets in `public/`
(e.g. `public/work/dropin.webm`).
