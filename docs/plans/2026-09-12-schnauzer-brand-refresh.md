# Schnauzer brand refresh implementation plan

**Goal:** Implement the homepage mockup approved in this task, keeping the salt-and-pepper miniature schnauzer identity.

**Architecture:** Retain React, JSON-driven content, prerendered routes, and existing data selectors. Share the refined brand artwork across the header and homepage; keep the standalone support page visually consistent. The featured release continues to follow catalog release dates and uses real app artwork.

**Tech stack:** React, Vite, vanilla CSS, JSON, sharp for asset encoding and responsive sizes.

## Approved design

Charcoal background, warm-white typography, mint accents, compact horizontal header, a two-column hero with the schnauzer, a flatter quality/principles row, and a latest-release panel. Preserve the gray coat, folded ears, pale eyebrows, glasses, and full beard. Remove collar and medal. Retain accessible navigation, focus rings, reduced-motion support and responsive layouts.

## Execution

1. Export the approved mascot with true transparency. Keep the master in `public/assets/logos/`, encode appropriately sized WebP derivatives, and refresh favicon/manifest artwork. Verify alpha and asset sizes.
2. Update `src/pages/home.jsx` and `public/site.json`: hero, principles with decorative SVG icons, catalog-driven release panel using existing selectors and real app assets. Retain loading/empty handling and deep links.
3. Update the shared header and CSS shell; synchronize standalone support branding. Preserve other routes' content and behavior. Test mobile header layout, keyboard access, and contrast.
4. Build and run existing regression tests, then inspect localhost at 320, 375, 768 and 1280px. Verify homepage actions, every route's assets, dialog interaction, no console errors, and support form structure without sending more email.
5. Commit/push a branch, create a PR, verify the Vercel preview, merge the approved work and verify production routes and artwork. Record release evidence in the PR.

## Asset provenance

Logo concept and production cutout generated with the built-in image generation tool from the approved salt-and-pepper concept board. The first export had a false checkerboard background and was rejected. The second export has a verified alpha channel. Raster derivatives are not described as vector artwork. Existing original SVGs remain available.

Production master: `public/assets/logos/schnauzer-master.png`. Website derivatives: `schnauzer-160.webp`, `schnauzer-480.webp`, and `schnauzer-800.webp` in the same folder (approximately 10, 35, and 66 KB). Sora is served locally with its OFL license. Browser PNG/ICO icons and the SVG raster wrapper use the updated artwork.

Final generation prompt, with the approved concept board as the reference:

> Production cutout asset, TRANSPARENT BACKGROUND OUTPUT REQUIRED. Isolate only the upper-left schnauzer logo from the input, remove all the surrounding board, text and backgrounds. Return a PNG with a REAL transparent alpha channel: pixels outside the dog and small flask should be invisible. Do NOT draw or render a checkerboard, grid, white background, drop shadow, floor or frame. One centered mark with full flask and full beard on a square canvas, 5% margin. Faithfully preserve the exact approved salt-and-pepper schnauzer with medium-gray fur, charcoal folded ears, white-silver eyebrows and beard, round black glasses and mint liquid flask above its head. No collar or medal. No new styling. Clean illustrated edges. This will be composited directly onto dark website backgrounds, so the background must actually be absent.

## Verification

Build and all 16 existing tests passed. The homepage, app list, app detail, standalone support and privacy pages fit at 320, 768 and 1280px without broken images or browser errors; the homepage was also visually checked at 375px. Homepage links reach the expected routes; screenshot-dialog Escape restores focus. Static support loads the compiled shared stylesheet and retains all 13 subject choices. Independent code review found no actionable issues. Deployment evidence is recorded in the pull request.
