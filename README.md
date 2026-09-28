# BeThere

A Singapore social-event representative service prototype for the Next Founders Hackathon. Premium obsidian and champagne interface; transparent pricing; durable, authenticated demo requests. **No real visits, payments or supplier orders occur.**

## Run locally

Requirements: Node >=22.13, npm.

```sh
npm ci
npm run db:generate # Only if the schema changes; initial migration is included.
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_yummy_azazel.sql
npm run dev -- --hostname 127.0.0.1
```

Apply the initial migration only once per local database. Open the printed local URL. `/signin-with-chatgpt?return_to=/` sets the starter's loopback-only development identity. Hosted Sites supply authenticated identity; never replace this with a browser-provided user ID. The local identity simulation is excluded from the production build.

## Architecture

```text
React / TypeScript interface
  ├─ lib/pricing.ts — shared price rules, integer cents, validation
  ├─ POST /api/quote — independently validated estimate
  └─ POST /api/requests — sign-in + validation + server repricing
       └─ D1 demo_requests — primary-key request ID, owner ID, bounded payload
GET /api/requests?id=… — exact reference + authenticated ownership check
```

The frontend calculates instantly using the same pure price function the server uses. Only the server decides the saved total. Requests carry a UUID idempotency key. An identical retry returns the same record; a conflicting retry returns 409. The database is durable. React state represents an unsaved draft; session storage is used only to carry that temporary draft through sign-in.

## Important files

- `app/page.tsx`: customer journey, client validation, API integration, and the final-page representative reassurance.
- `app/globals.css`: brand tokens, layout, responsive styling and motion.
- `lib/pricing.ts`: catalogue, quote and contribution calculation, Zod schemas.
- `app/api/requests/route.ts`: authenticated create/read, repricing, retry protection.
- `app/api/quote/route.ts`: public read-only quote calculation.
- `db/schema.ts`, `db/requests.ts`, `drizzle/`: D1 schema, access and generated migration.
- `tests/pricing.test.mjs`: price boundaries, prohibited combinations, dates and tampering.
- `public/images/`: original generated illustrative catalogue photography.

## Checks

```sh
node tests/pricing.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

The Node pricing test uses native TypeScript stripping (Node 24 recommended for this direct invocation). API checks were also run against the local preview for authentication, origin validation, persistence, retry idempotency, conflict handling, malformed prices and funeral restrictions. Browser checks cover selections, form errors, sample-data review, saving, reload and a mobile viewport.

## Economics

S$199 base / 2 hours; S$79 each extra hour up to 4 hours; bouquet S$79, cake S$89, gift S$99. The representative receives 30% of the fulfilled order, including every add-on, excluding any taxes/refunds. Prototype assumes a non-GST-registered pilot. Figures are proposals, not actual supplier contracts or operating results.

## Scope and scaling

Vinext/Vite compiles the React application into Cloudflare Worker code and static assets. D1 stores requests; primary-key lookup avoids listing all users' data. Stateless routes, strict schemas and bounded fields provide a simple foundation. Scale claims require load testing. Before a public launch, add rate limits/abuse prevention, monitoring, deletion/retention, audit logs, payment webhooks and payout reconciliation, plus operational matching, availability and host consent. No benchmark or actual customer traction is claimed.

Sites hosting is configured by `.openai/hosting.json`. Do not publish `.wrangler`, local cookies, environment files or credentials. The deployed version starts private.
