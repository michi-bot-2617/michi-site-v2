# michi-tanstack

Michi's portfolio site, rebuilt on TanStack Start (React 19, TanStack Router,
Vite) and deployed to Cloudflare Workers.

## Stack

- TanStack Start 1.132 (SSR via TanStack Router)
- MDX for post content (`src/content/`)
- Cloudflare Workers + static assets (`wrangler.jsonc`, `src/worker.ts`)
- Self-hosted Geist variable fonts (`public/fonts/`)

## Commands

- `npm run dev` - local dev server
- `npm run build` - build client + server bundles into `dist/`
- `npm run deploy` - build and deploy to Cloudflare Workers
- `npx wrangler dev` - run the production bundle locally

## Architecture notes

`src/worker.ts` is the Worker entry: it serves static files from the `ASSETS`
binding and hands everything else to the TanStack Start SSR handler
(`dist/server/server.js`, bundled by Wrangler with `nodejs_compat`).
