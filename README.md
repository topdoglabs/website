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

- [Node.js](https://nodejs.org/) (v18 or later recommended)
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

## 🏗 Architecture & Content Management

This website is designed to be **data-driven**. Most of the copy and content is stored in JSON files in the `public/` directory, allowing you to update the site without touching the React code.

### 📄 Content Files

- **`public/site.json`**: The "brain" of the site.
  - **Navigation**: Header/footer links and social links.
  - **Copy**: All headlines, body text, and CTA labels for the Home, About, FAQ, and Privacy pages.
  - **Footer**: Branding note and copyright text.
- **`public/apps.json`**: The database for TopDog apps.
  - Add a new object here to automatically generate a new app detail page.
  - Define slugs, names, taglines, features, and screenshots.

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
3. If colors need changing, edit the SVG file's `fill` attributes.

## 🤝 Support & Email

- **Service**: [Resend](https://resend.com)
- **API Key**: Managed in Vercel Environment Variables (`RESEND_API_KEY`).
- **Support Form**: Logic is in `src/pages/support.jsx` and calls the `/api/send-email` endpoint.

---

© 2026 TopDog Labs. All rights reserved.
