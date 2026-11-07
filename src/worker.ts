// Cloudflare Worker entry for Michi (TanStack Start).
// The TanStack Start server bundle (dist/server/server.js) exports { fetch }
// built on h3's H3Event, which relies on AsyncLocalStorage - available on
// Workers with nodejs_compat. Static assets come from dist/client via the
// ASSETS binding; everything else hits the SSR handler.
// @ts-expect-error - bundled JS without types
import server from "../dist/server/server.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Server functions and data endpoints go straight to SSR.
    if (pathname.startsWith("/_serverFn")) {
      return server.fetch(request, env, ctx);
    }

    // Static assets: match a file in the assets binding.
    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(
        new Request(url.origin + pathname, request),
      );
      if (asset.status !== 404) {
        return asset;
      }
    }

    // RSS feed: serve /feed.xml from the /feed server route.
    if (pathname === "/feed.xml") {
      const feedUrl = new Request(url.origin + "/feed", request);
      return server.fetch(feedUrl, env, ctx);
    }

    // SSR for everything else (pages, 404s).
    return server.fetch(request, env, ctx);
  },
};
