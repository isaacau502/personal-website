# Product

## Register

brand

## Platform

web

## Users

Isaac Au's personal portfolio. The audience is anyone evaluating Isaac as a software / AI-ML engineer — AI/ML lab recruiters and hiring managers, startup founders and eng leads, and technically literate peers alike. Isaac's own framing: "all of the above, and it has to look nice." There is no niche to segment for; the visitor arrives to answer one question — *is this person good?* — and craft is the answer that lands on every one of them regardless of their role. They are typically skimming, often on a mobile screen, deciding in seconds whether to keep scrolling or close the tab. The site's job is to make them keep riding.

## Product Purpose

The heart of the site is a scroll-driven canvas experience at `/` where the visitor "rides" a snowboard run down a slope and each career beat (TDK, Ovis, LLM research, DropIn) is revealed as an animated constellation drawn on canvas. It exists to demonstrate — not describe — Isaac's range: the same person did the ML, the medical AI, the research, and this from-scratch 3D/canvas engine you're looking at. The medium is the evidence. Success is a visitor finishing the run with the impression that the work is unusually well-made, and reaching out.

A companion route, `/work`, is the plain-register spec sheet: a glanceable, status-tagged index of shipped and in-progress work (including beats the run doesn't cover — Rice Robotics, the distributed KV store, current builds) for the visitor who needs facts faster than a ride. The run persuades; `/work` confirms. It keeps the site's voice (type, sharpness, determinism) but deliberately drops the ski language, and routes back into the run for the sky ending and contact.

## Positioning

An engineer who builds things that make you ask *how was this made* — where the portfolio itself is the proof, not a list of claims about it.

## Conversion & proof
- Primary CTA: email Isaac (`ayhisaac@gmail.com`) — the contact block at the base of the run is the conversion.
- Secondary CTA: add your own constellation to the shared night sky — the signature interactive ending, live in production: describe anything and an LLM returns a figure in the site's constellation grammar, joining a persistent shared sky (with a deterministic procedural fallback when the backend is unavailable). For visitors not ready to email but worth capturing; it turns a passive view into a mark left, and retroactively justifies the whole constellation motif.
- Recruiter fast-path: `/work` — spec tiles with the headline figure per project (piloted, +29%, <50ms), stack lines, and links to the app, paper, and code. It ends with an appendix pointing back to the shared sky, so even the fast path exits through the signature.
- The line a visitor remembers after 10 seconds: *the snowboard site where every project was a constellation — and someone actually built all this.*
- Belief ladder: (1) this is unlike any portfolio I've seen → (2) the craft here is real, not a template → (3) whoever made this can build hard things across ML, product, and frontend → (4) I want to talk to this person.
- Proof on hand: the shipped projects themselves — Ovis (`app.ovismedical.com`), GitHub `@isaacau502`, LinkedIn `/in/isaacayh`, `/resume.pdf`. The site's own execution is the primary proof artifact.

## Brand Personality

Kinetic and curious. Kinetic like the snowboard — momentum, carve, the run pulling you downhill; nothing static, everything responds to motion. Curious like exploring the stars — each beat opens into a constellation, an invitation to look closer. Underneath both sits exacting craft: the intended emotional payoff is exhilaration plus technical awe, the "how was this built?" reaction. The voice never explains itself or oversells; it lets the execution carry the confidence. Whimsy (the Dall-sheep companion, the constellation names) is welcome, but always in service of the ride, never a gimmick standing alone.

## Anti-references

Not a generic dev-portfolio template: no "Hi, I'm Isaac," no skills bars, no résumé-timeline-as-webpage — and in the run at `/`, no project card grid. (`/work`'s spec tiles are the one deliberate exception: a plain register chosen for scan speed, not template drift; the anti-references bind hardest on the run.) Not a corporate SaaS landing page: no gradient hero, no feature-icon triplets, no "trusted by" logo wall, no rounded-everything AI-marketing look. Effects must always earn their place through the narrative — style with substance behind it, never spectacle for its own sake.

## Design Principles

Show, don't tell — the site is the résumé; every claim about Isaac's ability is demonstrated by the thing the visitor is currently experiencing, not stated in copy.

The medium is the message — a scroll-driven canvas run proves range (ML, 3D, product, research) better than any list could; keep the experience itself as the primary evidence.

Motion is meaning — every animated phase scrubs off scroll position, never wall-clock; the visitor's own input drives the run, so the site feels alive and responsive rather than performed at them.

Determinism and precision — no runtime randomness, seeded tables, DPR-aware canvases, width-matched headlines. The invisible rigor is part of the craft even when only Isaac knows it's there.

One constellation grammar — every beat and the visitor's own generated contribution speak the same visual language (`{ name, stars, edges }`, now a real shared module in `src/constellation/`); the live shared night-sky ending is the thesis that ties the motif together.

## Accessibility & Inclusion

No formal WCAG target for this personal project; best-effort only. Given how motion- and canvas-heavy the experience is, the highest-value best-effort investments are a sane `prefers-reduced-motion` path and keeping real content (project text, contact links) present in the DOM rather than trapped in canvas — but neither is a hard requirement Isaac has committed to.
