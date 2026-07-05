// Workers Builds entry — this repo deploys as a git-linked Worker (not
// Pages), so /api/* routing is explicit here instead of the functions/
// directory convention. The handlers are shared: functions/api/*.js export
// Pages-style onRequest* functions, and this adapter feeds them the same
// {request, env, waitUntil} context. Anything that isn't /api/* falls
// through to the static assets binding (the built dist/).
import { onRequestPost as sign } from '../functions/api/sign.js';
import { onRequestGet as sky } from '../functions/api/sky.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const context = { request, env, waitUntil: ctx.waitUntil.bind(ctx) };
    if (pathname === '/api/sign') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return sign(context);
    }
    if (pathname === '/api/sky') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return sky(context);
    }
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'not-found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    return env.ASSETS.fetch(request);
  },
};

function methodNotAllowed(allow) {
  return new Response(JSON.stringify({ error: 'method-not-allowed' }), {
    status: 405,
    headers: { 'content-type': 'application/json', allow },
  });
}
