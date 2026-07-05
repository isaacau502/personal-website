import { describe, it, expect, vi } from 'vitest';
import { createSignPipeline, monthKey, sha256Hex } from './pipeline.js';

// A well-formed LLM response (8-star connected chain, safe)
function goodGeneration() {
  return {
    name: 'a bear making eggs',
    safe: true,
    stars: Array.from({ length: 8 }, (_, i) => ({
      x: i * 0.12 + 0.05,
      y: (i % 2) * 0.3 + 0.2,
      size: 1,
    })),
    edges: Array.from({ length: 7 }, (_, i) => [i, i + 1]),
  };
}

function makeKv(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    get: vi.fn(async (k) => store.get(k) ?? null),
    put: vi.fn(async (k, v) => { store.set(k, v); }),
  };
}

// All-green deps; individual tests break one thing at a time
function makeDeps(overrides = {}) {
  return {
    verifyTurnstile: vi.fn(async () => true),
    rateLimit: vi.fn(async () => true),
    kv: makeKv(),
    generate: vi.fn(async () => goodGeneration()),
    renderPng: vi.fn(async () => new Uint8Array([1, 2, 3])),
    visionCheck: vi.fn(async () => ({ flagged: false })),
    spendCap: 2000,
    now: () => new Date('2026-07-05T12:00:00Z'),
    ...overrides,
  };
}

const INPUT = { description: 'a bear making eggs', turnstileToken: 'tok', ip: '1.2.3.4' };

describe('sign pipeline — happy path', () => {
  it('persists a record and returns it', async () => {
    const deps = makeDeps();
    const result = await createSignPipeline(deps)(INPUT);
    expect(result.ok).toBe(true);
    expect(result.record.name).toBe('a bear making eggs');
    expect(result.record.stars).toHaveLength(8);
    expect(result.record.createdAt).toBe('2026-07-05T12:00:00.000Z');
    expect(deps.kv.store.get(`constellation:${result.record.id}`)).toBeTruthy();
    expect(deps.kv.store.get('spend:2026-07')).toBe('1');
  });
});

describe('sign pipeline — free checks run before paid calls', () => {
  it('turnstile failure → 403, no LLM call', async () => {
    const deps = makeDeps({ verifyTurnstile: vi.fn(async () => false) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 403, error: 'turnstile-failed' });
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('rate limited → 429, no LLM call', async () => {
    const deps = makeDeps({ rateLimit: vi.fn(async () => false) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 429, error: 'rate-limited' });
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('over-long description → 400, no LLM call', async () => {
    const deps = makeDeps();
    const result = await createSignPipeline(deps)({ ...INPUT, description: 'x'.repeat(101) });
    expect(result).toMatchObject({ ok: false, status: 400, error: 'description-too-long' });
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('blocklisted description → 400, no LLM call (D14: blocklist precedes paid calls)', async () => {
    const hash = await sha256Hex('a bear making eggs');
    const deps = makeDeps({ kv: makeKv({ [`blocklist:${hash}`]: '1' }) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 400, error: 'rejected' });
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('spend ceiling hit → 503 sky-is-full, no LLM call, no persistence', async () => {
    const deps = makeDeps({ spendCap: 10, kv: makeKv({ 'spend:2026-07': '10' }) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 503, error: 'sky-is-full' });
    expect(deps.generate).not.toHaveBeenCalled();
    expect([...deps.kv.store.keys()].some((k) => k.startsWith('constellation:'))).toBe(false);
  });
});

describe('sign pipeline — generation', () => {
  it('malformed LLM output retries once, then succeeds', async () => {
    const deps = makeDeps({
      generate: vi.fn()
        .mockRejectedValueOnce(new Error('malformed json'))
        .mockResolvedValueOnce(goodGeneration()),
    });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result.ok).toBe(true);
    expect(deps.generate).toHaveBeenCalledTimes(2);
  });

  it('malformed twice → 502 generation-failed', async () => {
    const deps = makeDeps({ generate: vi.fn(async () => { throw new Error('boom'); }) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 502, error: 'generation-failed' });
    expect(deps.generate).toHaveBeenCalledTimes(2);
  });

  it('safe:false → 400 rejected, no render, no persistence', async () => {
    const deps = makeDeps({ generate: vi.fn(async () => ({ ...goodGeneration(), safe: false })) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 400, error: 'rejected' });
    expect(deps.renderPng).not.toHaveBeenCalled();
    expect([...deps.kv.store.keys()].some((k) => k.startsWith('constellation:'))).toBe(false);
  });

  it('schema-invalid figure (no edges) → 502 generation-invalid', async () => {
    const bad = goodGeneration();
    bad.edges = []; // nothing to draw — unrepairable
    const deps = makeDeps({ generate: vi.fn(async () => bad) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 502, error: 'generation-invalid' });
  });
});

describe('sign pipeline — pixel moderation before persistence (D9)', () => {
  it('vision flag → 400 rejected, nothing persisted', async () => {
    const deps = makeDeps({ visionCheck: vi.fn(async () => ({ flagged: true })) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 400, error: 'rejected' });
    expect([...deps.kv.store.keys()].some((k) => k.startsWith('constellation:'))).toBe(false);
  });

  it('moderation unavailable → fail CLOSED (503), nothing persisted', async () => {
    const deps = makeDeps({ visionCheck: vi.fn(async () => { throw new Error('api down'); }) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 503, error: 'moderation-unavailable' });
    expect([...deps.kv.store.keys()].some((k) => k.startsWith('constellation:'))).toBe(false);
  });

  it('render failure → fail CLOSED (503), no vision call, nothing persisted', async () => {
    const deps = makeDeps({ renderPng: vi.fn(async () => { throw new Error('wasm'); }) });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result).toMatchObject({ ok: false, status: 503, error: 'moderation-unavailable' });
    expect(deps.visionCheck).not.toHaveBeenCalled();
  });
});

describe('sign pipeline — persistence semantics', () => {
  it('record-write failure is LOUD (throws to the adapter)', async () => {
    const kv = makeKv();
    kv.put = vi.fn(async (k) => {
      if (k.startsWith('constellation:')) throw new Error('kv down');
    });
    const deps = makeDeps({ kv });
    await expect(createSignPipeline(deps)(INPUT)).rejects.toThrow('kv down');
  });

  it('spend-counter write failure is SWALLOWED — submission still succeeds (D1)', async () => {
    const kv = makeKv();
    const realPut = kv.put;
    kv.put = vi.fn(async (k, v) => {
      if (k.startsWith('spend:')) throw new Error('429 hot key');
      return realPut(k, v);
    });
    const deps = makeDeps({ kv });
    const result = await createSignPipeline(deps)(INPUT);
    expect(result.ok).toBe(true);
  });

  it('spend counter increments across submissions', async () => {
    const deps = makeDeps();
    const sign = createSignPipeline(deps);
    await sign(INPUT);
    await sign({ ...INPUT, description: 'a sailboat' });
    expect(deps.kv.store.get('spend:2026-07')).toBe('2');
  });
});

describe('helpers', () => {
  it('monthKey formats UTC year-month', () => {
    expect(monthKey(new Date('2026-07-05T23:59:00Z'))).toBe('2026-07');
    expect(monthKey(new Date('2026-12-31T23:59:00Z'))).toBe('2026-12');
  });

  it('sha256Hex is stable', async () => {
    expect(await sha256Hex('chair')).toBe(await sha256Hex('chair'));
    expect(await sha256Hex('chair')).not.toBe(await sha256Hex('one'));
  });
});
