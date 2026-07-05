# TODOS

## Constellation signature — deferred by eng review (2026-07-05)

### v2: One Connected Sky
- **What:** Require each new constellation to share at least one star with an existing one, making the sky a single traceable graph.
- **Why:** Upgrades "I was here" to "I'm connected to everyone who was here" — the strongest version of the concept, only possible because of the structured-JSON grammar.
- **Pros:** Uniquely copy-proof; solves sky layout density organically.
- **Cons:** Stacks anchor-constraint difficulty on top of layout-quality difficulty; sparse early sky distorts the first figures most.
- **Context:** Designed in the eng-reviewed doc (`~/.gstack/projects/isaacau502-personal-website/isaac-main-design-20260705-011153.md`, Approach C). Mechanics: Worker returns 3 nearest existing stars for a region → prompt requires one as an anatomical anchor → server snaps the index to the shared star ID. KV records already carry stable per-star IDs specifically to keep this door open.
- **Depends on:** v1 shipped; prompt quality proven.

### Rewire existing motifs through drawConstellation()
- **What:** Route the TDK/Ovis/LLM beats' star/edge drawing through `src/constellation/draw.js` instead of their bespoke inline code.
- **Why:** True DRY — one renderer for all constellation work; v1 deliberately kept the extraction additive (eng review D6) to protect shipped beats during the sprint.
- **Pros:** Future motif work happens in one place; deletes duplicated vocabulary.
- **Cons:** Touches three working, untested, visual beats.
- **Context:** MANDATORY if attempted: before/after screenshot diff of the three beats at fixed scroll positions (browse binary or Playwright). The duplication is bounded and documented; there is no urgency.
- **Depends on:** v1 shipped; screenshot-diff harness.

### Turnstile UX decision
- **What:** Decide always-on Turnstile vs only-after-first-submission per IP.
- **Why:** Open question from the design doc; affects first-submission friction on the beat.
- **Context:** Currently planned always-on (simplest, safest). Revisit only if real visitors visibly bounce off the widget.
- **Depends on:** v1 live with real traffic.
