// The /api/sign pipeline — pure and dependency-injected so every branch is
// testable without Cloudflare bindings or the Anthropic API. The adapters in
// sign.js wire the real deps; pipeline.test.js wires mocks.
//
//   1 turnstile → 2 rate limit → 3 length/charset → 4 blocklist → 5 spend
//   → 6 LLM generate (+safe flag, one retry on malformed)
//   → 7 validate/normalize → 8 render PNG (resvg) → 9 vision check
//   → 10 write record (MUST succeed) → 11 bump spend (best-effort) → respond
//
// Ordering is load-bearing (eng review D3/D14): every free check precedes the
// paid LLM calls; all moderation precedes persistence.

import { validateDescription, validateConstellation } from '../../../src/constellation/validate.js';

// deps: {
//   verifyTurnstile(token, ip) -> bool        (resolve true when not configured)
//   rateLimit(ip) -> bool                     (true = allowed)
//   kv: { get(key), put(key, value) }         (values are strings)
//   generate(description) -> {name, stars, edges, safe} (LLM shape; throws on API error)
//   renderPng(record) -> bytes                (resvg seam)
//   visionCheck(pngBytes) -> {flagged: bool}  (LLM vision seam)
//   spendCap: number                          (monthly request ceiling)
//   now() -> Date
// }
export function createSignPipeline(deps) {
  return async function sign({ description, turnstileToken, ip }) {
    // 1. Turnstile — free, rejects bots
    if (!(await deps.verifyTurnstile(turnstileToken, ip))) {
      return { ok: false, status: 403, error: 'turnstile-failed' };
    }

    // 2. Rate limit — free
    if (!(await deps.rateLimit(ip))) {
      return { ok: false, status: 429, error: 'rate-limited' };
    }

    // 3. Length/charset — free
    const desc = validateDescription(description);
    if (!desc.ok) {
      return { ok: false, status: 400, error: desc.error };
    }

    // 4. Blocklist — one KV read; a cheap tripwire against lazy resubmission
    const hash = await sha256Hex(desc.value.toLowerCase());
    if (await deps.kv.get(`blocklist:${hash}`)) {
      return { ok: false, status: 400, error: 'rejected' };
    }

    // 5. Spend ceiling — one KV read; reject BEFORE any paid call
    const spendKey = `spend:${monthKey(deps.now())}`;
    const spent = parseInt((await deps.kv.get(spendKey)) || '0', 10);
    if (spent >= deps.spendCap) {
      return { ok: false, status: 503, error: 'sky-is-full' };
    }

    // 6. LLM generate — paid; one retry on malformed output, then friendly error
    let raw;
    try {
      raw = await deps.generate(desc.value);
    } catch (err1) {
      console.error('generate attempt 1 failed:', err1 && err1.message);
      try {
        raw = await deps.generate(desc.value);
      } catch (err2) {
        console.error('generate attempt 2 failed:', err2 && err2.message, err2 && err2.stack);
        return { ok: false, status: 502, error: 'generation-failed' };
      }
    }
    if (raw && raw.safe === false) {
      return { ok: false, status: 400, error: 'rejected' };
    }

    // 7. Validate/normalize — free; clamps, dedupes, checks connectivity
    const validated = validateConstellation(raw);
    if (!validated.ok) {
      console.error('generation invalid:', validated.error, JSON.stringify(validated.detail ?? null));
      return { ok: false, status: 502, error: 'generation-invalid' };
    }

    // 8 + 9. Pixel moderation — render real pixels, judge them (D9:
    // pixels-before-persist; a lewd shape must never exist publicly)
    let flagged;
    try {
      const png = await deps.renderPng(validated.value);
      flagged = (await deps.visionCheck(png)).flagged;
    } catch (err) {
      // moderation unavailable → fail CLOSED; never persist unmoderated
      console.error('moderation stage failed:', err && err.message, err && err.stack);
      return { ok: false, status: 503, error: 'moderation-unavailable' };
    }
    if (flagged) {
      return { ok: false, status: 400, error: 'rejected' };
    }

    // 10. Persist — per-record key (no hot-key races); MUST succeed loudly
    const record = {
      id: crypto.randomUUID(),
      name: validated.value.name,
      stars: validated.value.stars,
      edges: validated.value.edges,
      createdAt: deps.now().toISOString(),
    };
    await deps.kv.put(`constellation:${record.id}`, JSON.stringify(record));

    // 11. Spend counter — best-effort (KV allows 1 write/sec/key; a 429 here
    // must never fail a submission the LLM already ran for). Approximate by
    // design; the cap is set with margin.
    try {
      await deps.kv.put(spendKey, String(spent + 1));
    } catch {
      // swallowed deliberately — see eng review D1
    }

    return { ok: true, status: 200, record };
  };
}

export function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
