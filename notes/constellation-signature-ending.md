# Site ending: leave a constellation in the night sky

**Status:** active development (as of 2026-07-05). Replaces the earlier minigame idea for the site's final beat.

## Concept

Visitors sign the site by describing anything ("a bear making eggs") and genAI
generates a constellation for it in the night sky. Their signature joins the
shared sky — visitors literally join the site's constellation motif, which
retroactively justifies the whole secondary grammar.

## Why cost is a non-issue

Don't ask the model for pixels — ask for JSON in the constellation grammar the
site already has:

```json
{ "name": "...", "stars": [{ "x": 0.0, "y": 0.0, "size": 1 }], "edges": [[0, 1]] }
```

The existing canvas code draws it with the same glow/dash/twinkle treatment as
the Ovis and LLM beats. ~300 tokens in, ~400 out per request.

- **Haiku:** ~$1/$5 per Mtok → **~$0.002 per constellation**. 10k signatures ≈ $20 total.
- **Sonnet:** ~2–3¢ each. Still trivial.
- Image generation would be 10–50× the cost and clash with the flat
  slate-on-snow language anyway.

The real cost risk is abuse (scripted endpoint hits), not legit visitors.

## What needs building

1. **Tiny backend** (the only hard requirement — can't ship an API key in a
   static Vite site). One Cloudflare Worker or Vercel function, ~50 lines:
   description in → structured-output LLM call → JSON out.
2. **Abuse protection:**
   - Per-IP rate limit (Workers KV)
   - Cloudflare Turnstile on the form
   - Hard monthly spend cap on the Anthropic key (with a $10 cap, worst case
     the feature degrades to "sky is full tonight")
3. **Persistence** (shared sky): Cloudflare KV/D1 or Supabase free tier.
   - **Moderation:** the name renders publicly — have the same LLM call return
     a `safe: true/false` flag and reject flagged input. Free (same request).
4. **Prompt quality — the actually hard part.** LLMs are mediocre at freeform
   2D layout; asked naively you get a blob. What works: force it to first name
   8–14 semantic anchor points ("snout, ear, shoulder hump, front paw, the
   egg…"), then place them on a unit grid with edges connecting anatomically
   adjacent points. Constellations are forgiving — real ones barely resemble
   their subjects; "squint and it's a bear" is the bar, and the label does half
   the work (see: Ursa Major).

## Zero-server fallback

Hash the description into a seed, generate procedurally (star count/spread from
word features). Free and instant, but it's a slot machine, not genAI — it can't
put the egg under the bear. Use as the degraded mode when the rate limit or
budget cap trips.

## Build order (when we come back)

1. **Prompt experiment first** — test whether generated layouts look good in
   the existing renderer before writing any infra.
2. Cloudflare Worker + Turnstile + rate limit + spend cap.
3. Persistence + moderation flag.
4. Wire the form and render into `SlopeBackground`'s night-sky section (the
   star/edge drawing vocabulary already exists there).

**Estimate:** a weekend. Half a day for Worker + storage + Turnstile, half a
day wiring form + render, rest iterating on the layout prompt until bears look
bear-ish.
