// POST /api/sign — Pages Functions adapter wiring real dependencies into the
// pure pipeline. (Workers Builds flavor: re-export sign() from the worker
// entry — the pipeline itself is deployment-agnostic. See the design doc's
// deploy-flavor preflight.)
//
// Bindings expected (configured in the Cloudflare dashboard):
//   SKY            — KV namespace
//   ANTHROPIC_API_KEY, TURNSTILE_SECRET (optional in dev) — secrets
//   GEN_MODEL, VISION_MODEL, SPEND_CAP, RATE_LIMIT_PER_10MIN — optional vars
import { createSignPipeline } from './_lib/pipeline.js';
import * as anthropicSeams from './_lib/anthropic.js';
import * as workersAiSeams from './_lib/workersai.js';
import { renderPng } from './_lib/render.js';

// Provider selection: Workers AI by default (free tier, native binding, no
// key); set PROVIDER=anthropic (+ ANTHROPIC_API_KEY) for the quality option.
function pickSeams(env) {
  if (env.PROVIDER === 'anthropic') return anthropicSeams;
  if (env.AI) return workersAiSeams;
  if (env.ANTHROPIC_API_KEY) return anthropicSeams;
  throw new Error('no LLM provider configured (need AI binding or ANTHROPIC_API_KEY)');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-request' }, 400);
  }

  const seams = pickSeams(env);
  const sign = createSignPipeline({
    verifyTurnstile: makeVerifyTurnstile(env),
    rateLimit: makeRateLimit(env),
    kv: env.SKY,
    generate: seams.makeGenerate(env),
    renderPng,
    visionCheck: seams.makeVisionCheck(env),
    spendCap: parseInt(env.SPEND_CAP || '2000', 10),
    now: () => new Date(),
  });

  try {
    const result = await sign({
      description: body.description,
      turnstileToken: body.turnstileToken,
      ip,
    });
    return result.ok
      ? json({ record: result.record }, 200)
      : json({ error: result.error }, result.status);
  } catch (err) {
    // isolation wrapper (eng review D2): an easter-egg bug 500s /api/*
    // without touching site serving
    console.error('sign pipeline error', err);
    return json({ error: 'internal' }, 500);
  }
}

function makeVerifyTurnstile(env) {
  return async (token, ip) => {
    if (!env.TURNSTILE_SECRET) return true; // not configured (dev/preview)
    if (!token) return false;
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const data = await resp.json();
    return data.success === true;
  };
}

// Pages Functions have no Rate Limiting binding — KV-window approximation
// (leaky + eventually consistent; acceptable per eng review D11: Turnstile
// and the spend ceiling are the primary walls). Best-effort writes.
function makeRateLimit(env) {
  const limit = parseInt(env.RATE_LIMIT_PER_10MIN || '6', 10);
  return async (ip) => {
    const windowKey = `rl:${ip}:${Math.floor(Date.now() / 600_000)}`;
    const count = parseInt((await env.SKY.get(windowKey)) || '0', 10);
    if (count >= limit) return false;
    try {
      await env.SKY.put(windowKey, String(count + 1), { expirationTtl: 1200 });
    } catch {
      // best-effort — a 429 on the counter must not fail the request
    }
    return true;
  };
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
