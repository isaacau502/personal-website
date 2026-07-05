// Anthropic seams for the sign pipeline: constellation generation and the
// pixel moderation check. Models per the eng-reviewed design: Haiku-tier by
// default for cost (~$0.002/signature); override with env.GEN_MODEL once the
// playground settles the quality/latency tradeoff (Sonnet/Fable candidates).
import Anthropic from '@anthropic-ai/sdk';
import { GEN_SCHEMA, GEN_SYSTEM } from './prompt.js';

export function makeGenerate(env) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.GEN_MODEL || 'claude-haiku-4-5';
  return async function generate(description) {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: GEN_SYSTEM,
      output_config: { format: { type: 'json_schema', schema: GEN_SCHEMA } },
      messages: [{ role: 'user', content: `Description: ${description}` }],
    });
    if (response.stop_reason === 'refusal') {
      return { safe: false };
    }
    const text = response.content.find((b) => b.type === 'text')?.text ?? '';
    return JSON.parse(text); // malformed JSON throws → pipeline retries once
  };
}

const VISION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['flagged'],
  properties: {
    flagged: { type: 'boolean', description: 'true if the drawing is lewd, phallic, hateful (e.g. swastika), or otherwise offensive' },
  },
};

export function makeVisionCheck(env) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.VISION_MODEL || 'claude-haiku-4-5';
  return async function visionCheck(pngBytes) {
    const data = btoa(String.fromCharCode(...new Uint8Array(pngBytes)));
    const response = await client.messages.create({
      model,
      max_tokens: 256,
      output_config: { format: { type: 'json_schema', schema: VISION_SCHEMA } },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data } },
          { type: 'text', text: 'This is a connect-the-dots line drawing about to be published on a public website. Describe its shape to yourself, then flag it if the shape reads as lewd, phallic, hateful symbols, or otherwise offensive. Innocent figures (animals, objects, people doing ordinary things) are not flagged.' },
        ],
      }],
    });
    const text = response.content.find((b) => b.type === 'text')?.text ?? '';
    return JSON.parse(text);
  };
}
