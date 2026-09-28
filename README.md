# BeThere

A Singapore social-event representative service prototype. This is a demo planner: no visit is booked, no payment is taken, and no supplier is contacted.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm ci
npm test
npm run build
npm run dev
```

## Vercel

Import this repository as a Next.js project. Use the root directory, `npm ci` for installation, and `npm run build` for the build. No database or environment variables are required.

## Demo storage

The app stores one demo plan in this browser's `localStorage` under `bethere-demo-request-v1`. It restores that plan on reload and removes it when “Arrange another presence” is selected. The plan is visible to anyone using the same browser profile and is not available on another device or private window. Browser storage can be cleared by the user or browser. There is no account, backend persistence, or network request for plans.

Pricing and field validation live in `lib/pricing.ts`. The client computes the displayed estimated total; prices are illustrative and cannot be treated as a binding quote. The representative share is 30% of the illustrative order total. Before a real launch, the product would need operational matching, host consent, payments, and secure server-side storage.
