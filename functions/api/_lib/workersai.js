// Workers AI seams — the free-tier default provider (10k neurons/day, native
// env.AI binding, no API key). The Anthropic adapters in anthropic.js remain
// the quality-comparison option; sign.js picks per env. Same contracts:
//   generate(description) -> {name, stars, edges, safe}  (throws on garbage)
//   visionCheck(pngBytes) -> {flagged}

import { GEN_SCHEMA, GEN_SYSTEM } from './prompt.js';

const GEN_MODEL_DEFAULT = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const VISION_MODEL_DEFAULT = '@cf/meta/llama-3.2-11b-vision-instruct';

export function makeGenerate(env) {
  const model = env.GEN_AI_MODEL || GEN_MODEL_DEFAULT;
  return async function generate(description) {
    const result = await env.AI.run(model, {
      messages: [
        { role: 'system', content: GEN_SYSTEM },
        { role: 'user', content: `Description: ${description}` },
      ],
      response_format: { type: 'json_schema', json_schema: GEN_SCHEMA },
      max_tokens: 1200,
    });
    const raw = result.response ?? result;
    return typeof raw === 'string' ? JSON.parse(raw) : raw; // malformed throws → pipeline retries
  };
}

export function makeVisionCheck(env) {
  const model = env.VISION_AI_MODEL || VISION_MODEL_DEFAULT;
  return async function visionCheck(pngBytes) {
    // deliberately a text protocol, not JSON — small vision models are much
    // more reliable emitting a single keyword than valid structured output
    const result = await env.AI.run(model, {
      prompt:
        'This is a connect-the-dots line drawing about to be published on a public website. ' +
        'Describe its shape to yourself, then answer with exactly one word: ' +
        'FLAGGED if the shape reads as lewd, phallic, a hateful symbol, or otherwise offensive; ' +
        'OK otherwise. Innocent figures (animals, objects, people doing ordinary things) are OK.',
      image: [...new Uint8Array(pngBytes)],
      max_tokens: 16,
    });
    const text = String(result.response ?? '').toUpperCase();
    if (!text.includes('FLAGGED') && !text.includes('OK')) {
      throw new Error('vision-check-unparseable'); // pipeline fails closed
    }
    return { flagged: text.includes('FLAGGED') };
  };
}
