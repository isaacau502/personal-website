// GET /api/sky — the shared sky. Edge-cached ~5 minutes (eng review D7): KV
// reads drop to ~1 list + N gets per cache miss per colo. The submitter
// appends their own record client-side, so their reveal is never stale; the
// kill script purges this cache so removals are globally immediate.
const CACHE_TTL = 300;

export async function onRequestGet(context) {
  const { request, env } = context;
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/sky', request.url), { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const records = [];
    let cursor;
    do {
      const page = await env.SKY.list({ prefix: 'constellation:', cursor });
      const values = await Promise.all(page.keys.map((k) => env.SKY.get(k.name)));
      for (const value of values) {
        if (!value) continue;
        try {
          records.push(JSON.parse(value));
        } catch {
          // malformed record: skip, never fatal (test plan)
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    records.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

    // Browsers must always revalidate (your own signature reappearing on
    // refresh is non-negotiable); only the EDGE holds the 5-min KV shield.
    // s-maxage also drives the worker-internal caches.default expiry.
    const response = new Response(JSON.stringify({ constellations: records }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': `public, max-age=0, must-revalidate, s-maxage=${CACHE_TTL}`,
      },
    });
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error('sky read error', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
