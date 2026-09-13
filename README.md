# TopDog Labs Website

This repository contains the source code for the [TopDog Labs](https://topdoglabs.com) website, a one-person iOS studio crafting focused, intentional apps.

## 🚀 Overview

TopDog Labs is dedicated to building premium iOS experiences that feel calm, reliable, and delightful to use. We prioritize clean SwiftUI interfaces, privacy-first decisions, and offline-first design.

## 🛠 Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Styling**: Vanilla CSS with Bedrock design tokens
- **Hosting**: [Vercel](https://vercel.com)

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22.12 or later)
- `npm` or `yarn`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mattbruce/topdoglabs-website.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Hosting & Deployment

The website is hosted on **Vercel**. 
- **Production URL**: [topdoglabs.com](https://topdoglabs.com)
- **Automatic Deploys**: Any push to the `develop` branch triggers a new production build on Vercel.

### App Clip Web Infrastructure

This site also hosts the App Clip association and fallback route for BusinessCard:

- `public/.well-known/apple-app-site-association` (AASA file for Apple verification)
- `public/apple-app-site-association` (root-level AASA fallback for Apple verification)
- `public/appclip-businesscard.html` (fallback web page for `/appclip/businesscard`, `/bc`, etc.)
- `vercel.json` includes explicit handling for:
  - `/.well-known/apple-app-site-association`
  - `/apple-app-site-association`
  - `/appclip/businesscard` (primary namespaced path)
  - `/appclip` (legacy compatibility)
  - `/api/*`
  - Generated route HTML and a genuine `404.html` fallback for unknown paths

## 🏗 Architecture & Content Management

This website is designed to be **data-driven**. Most of the copy and content is stored in JSON files in the `public/` directory, allowing you to update the site without touching the React code.

### 📄 Content Files

- **`public/site.json`**: The "brain" of the site.
  - **Navigation**: Header/footer links and social links.
  - **Copy**: All headlines, body text, and CTA labels for the Home, About, FAQ, and Privacy pages.
  - **Footer**: Branding note and copyright text.
- **`public/apps.json`**: The database for TopDog apps.
  - Add a new object here and rebuild to generate a new app detail page.
  - Uses a nested schema:
    - `identity` (`name`, `tagline`)
    - `store` (`category`, `version`, `price`, `rating`, `platform`, `releaseDate`)
    - `distribution` (`appStoreUrl`, `website`, `supportEmail`, `supportUrl`, `privacyPolicyUrl`)
    - `presentation` (`icon`, `screenshots`)
    - `content` (`summary`, `description`, `whatsNew`, `highlights`, `features`, `copy`)
    - `appStore` (`promotionalText`, `keywords`, `description`)
    - `sync` (`asc`, `fallback`)

## App Store Sync Workflow

Use this flow when refreshing app content:

1. Sync metadata from App Store Connect:
   ```bash
   npm run sync:appstore -- --dry-run --verbose
   npm run sync:appstore
   ```

2. Optional screenshot/icon sync (if needed):
   ```bash
   npm run sync:screenshots -- --dry-run --replace-json
   npm run sync:screenshots -- --replace-json
   ```

3. Regenerate UI-facing fields from synced metadata:
   - Ask the `appstore-ui-content` skill to overwrite/fill from `appStore` + `sync`.

4. Validate the schema before commit/deploy:
   ```bash
   npm run validate:apps
   ```

### 🎨 Styling & Branding

- **`src/styles.css`**: Contains the central design system.
  - Uses CSS Variables (e.g., `--accent: #46d1a1`) for easy theme updates.
  - The `.logo` and `.logo-img` classes control the header branding.
- **Assets**: All images and logos live in `public/assets/`.

## 🛠 Maintenance: 6-Month Guide

If you need to make changes 6 months from now, here is your quick-start guide:

### Update a Page Headline or Text
1. Open `public/site.json`.
2. Find the relevant section (e.g., `"home"` or `"pages.about"`).
3. Edit the text and save.

### Add a New App
1. Place the app icon and screenshots in `public/assets/[app-slug]/`.
2. Open `public/apps.json` and duplicate an existing app entry.
3. Update the `slug`, `name`, and paths to the new assets.
4. The site will automatically create the URL at `/apps/[slug]`.

### Change the Logo
1. Upload the new SVG to `public/assets/logos/`.
2. Update the filename in `src/components/site-header.jsx` (the `<img>` tag).
3. If colors or paths need changing, you can edit the SVGs using **[Boxy SVG](https://boxy-svg.com)**.

## 🤝 Support & Email

- **Service**: [Resend](https://resend.com)
- **API Key**: Managed in Vercel Environment Variables (`RESEND_API_KEY`).
- **Support Form**: Logic is in `src/pages/support.jsx` and calls the `/api/send-email` endpoint.

---

© 2026 TopDog Labs. All rights reserved.


## Build, preview, and regression checks

Use Node.js 22.12 or newer. Run `npm ci`, `npm run build`, and `npm test` before publishing.

The build validates catalog assets, generates 480px and 960px WebP screenshots, builds the React client, and prerenders each known route with content and unique search/social metadata. It also generates the static support dropdown from `apps.json` and `site.json`, plus `sitemap.xml`. Generated screenshots are ignored by Git and recreated by `npm run dev` and `npm run build`. Keep the original PNGs for subsequent App Store syncs.

Content hooks share one refresh request per JSON resource and retain a bundled build snapshot when a refresh fails. Changes to catalog routes, privacy copy, or site metadata require a rebuild so the generated HTML and browser fallback stay consistent. Run a build before the build-output regression tests.

`npm run preview` serves the generated site at `http://127.0.0.1:4173`, applies explicit static rewrites, and returns real 404 responses for missing paths. It intentionally does not send email. Vercel is configured as a static output with explicit API/App Clip/support handling; there is no blanket SPA rewrite. Verify the same route status codes in a Vercel preview before promoting a deployment.

## Support form protections

Both forms submit to `/api/send-email`. The handler validates types, required fields, email format, and field lengths; sends plain text; rejects unrelated browser origins; checks a hidden honeypot; limits each client to five attempts per ten minutes per warm function instance; and returns controlled provider errors. Request names, email addresses, and messages are no longer written to application logs.

`RESEND_API_KEY` remains required. `SUPPORT_FROM_EMAIL` can optionally select an already-verified Resend sender. The existing `onboarding@resend.dev` sender and fixed recipient are preserved until a verified sender is configured.

**The shared Vercel firewall rule is configured.** On September 12, 2026, `Support form rate limit` (`rule_support_form_rate_limit_UMBAn5`) was published for `POST` requests to `/api/send-email`, keyed by client IP: five requests per 600-second fixed window, then HTTP 429. A controlled check against the production endpoint sent empty payloads that cannot send mail: the first five requests returned HTTP 400, and the sixth returned HTTP 429. Manage this rule in the project's Firewall settings; check for it before creating a replacement. The in-process limit is defense in depth and resets on cold starts; it is not shared across instances or regions. This firewall setting lives outside the repository. See [Vercel's rate-limit documentation](https://vercel.com/kb/guide/add-rate-limiting-vercel).
