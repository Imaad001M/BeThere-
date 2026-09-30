# BeThere — Vercel demo

The final BeThere design, configured for Vercel as a **Next.js static website**. Includes the capitalised BeThere logo, event selection, live SGD pricing, all three images, and the final-page representative reassurance. The business-model module is removed.

## Deploy on Vercel

1. Unzip `BeThere-vercel.zip` and open the `BeThere` folder.
2. Replace the old project files in your GitHub repository with this folder's contents. Preserve your repository's `.git` directory if working locally. `package.json`, `app`, `public`, `vendor`, and `vercel.json` must be at the repository root, not inside another `BeThere` folder.
3. Remove the old platform-specific files if you are copying over an existing checkout: `vite.config.ts`, `app/api/`, `app/chatgpt-auth.ts`, `db/`, `drizzle/`, `drizzle.config.ts`, `cloudflare-env.d.ts`, `build/`, `.openai/`, and the old files under `scripts/`. Keep the new `scripts/preview.mjs`.
4. Commit and push **all** updated files, including `vendor/`, `public/images/`, and `package-lock.json`. Upload the extracted contents, not the ZIP itself.
5. In the Vercel project, select **Settings → Build and Deployment** and use:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Next.js |
   | Root directory | Repository root (`./`), containing `package.json` |
   | Install command | `npm ci` |
   | Build command | `npm run build` |
   | Output directory | Default (Override OFF) |
   | Node.js | 24.x |
   | Environment variables | None required |

6. Deploy the new commit. Clear any old Vite build command and turn OFF the Output Directory override (including `out` or `dist`). Vercel automatically detects the Next.js static export. `vercel.json` includes the framework and build settings.

The previous error came from a missing `.openai/hosting.json` file. This version removes that dependency entirely and builds through Next.js rather than the original Cloudflare/Vinext setup.

## What this demo does

- Select birthdays, weddings, remembrance, or another occasion.
- Price the S$199 / two-hour service, extra hours, and bouquet/cake/gift additions.
- Validate dates, contact details, and occasion-specific additions.
- Save demo plans in `localStorage` in the current browser and site origin.
- Reload a saved plan using its `?request=` reference in the same browser.
- Download a text copy of the demo plan.

**There are no online accounts or shared database in this version.** A plan saved at one address will not appear at another address or on another device. Clearing site data removes saved plans; private browsing may also discard them. The interface discloses this before saving. No customer details are submitted to BeThere, and no actual visit, payment, or supplier order is made.

## Run locally

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

For the production build:

```sh
npm test
npm run build
npm start
```

Open `http://localhost:3000` for development, or the URL printed by `npm start`. The production preview is a local static server for the generated `out/` folder.

## Main files

- `app/page.tsx`: complete booking demonstration and premium interface.
- `app/globals.css`: colours, typography, layout, and responsive rules.
- `lib/pricing.ts`: integer-cent pricing and form validation.
- `lib/demo-storage.ts`: validated browser storage, saved-plan retrieval, and storage-error handling.
- `public/images/`: bouquet, cake, and gift images.
- `next.config.ts`: static export configuration.
- `vercel.json`: deployment settings.

The 30% representative share is a proposed service policy. Browser calculations and storage are suitable for a demonstration, not a payment or fulfilment backend. A real service would need authenticated server storage, server-side repricing, payment processing, and operational representative matching.
