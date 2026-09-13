# Website audit — September 12, 2026

Audited commit: `92b4425`. The site builds successfully, but there are confirmed issues affecting mobile layouts, keyboard access, published content, and support handling. This report records findings; application code and deployed content were not changed.

## Scope and verification

- Reviewed React routes, hooks, components, CSS, catalog/content JSON, static support/privacy/App Clip pages, Vercel rewrites, and the email handler.
- Tested the production build in the Codex browser, including desktop, 390px, 375px, and 320px viewports. Inspected the homepage, About, Support, Privacy, and representative app details. Tested screenshot-dialog keyboard interaction.
- Compared live responses from [TopDog Labs](https://topdoglabs.com) with local files. The homepage HTML, apps JSON, site JSON, support HTML, and privacy embed matched byte-for-byte.
- `npm run build`: passed. JavaScript bundle: 189.85 kB, 60.00 kB gzip. CSS: 18.49 kB, 4.23 kB gzip.
- `npm run validate:apps`: passed for 10 apps.
- `node --test tests/*.test.mjs`: 8 passed, 0 failed.
- Checked 58 unique catalog asset references: 3 missing files.
- `npm audit`: 11 affected packages (5 high, 5 moderate, 1 low). Production-only audit: 3 moderate, 0 high, 0 critical.
- Exercised malformed requests and HTML input against the email handler locally with a mocked mail provider. No real support messages were sent.

Browser measurements establish layout and interaction defects; this was not a Lighthouse/Core Web Vitals benchmark or a complete assistive-technology certification. Production email delivery and dashboard-level firewall/rate-limit settings were not verified. UI checks used the [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

## Fix first

### 1. Mobile content is clipped

Locations: [src/styles.css:1198](/Volumes/Data/Projects/Web/Apps/website/src/styles.css:1198), [public/support.html:249](/Volumes/Data/Projects/Web/Apps/website/public/support.html:249).

The page-section grid enforces a 320px minimum column inside several padded containers. At a 375px viewport, the support information cards extend to x=373 while the main container ends at x=363. Its `overflow: hidden` cuts off the right side. At 320px, the same cards still extend to x=373 while the main container ends at x=308. The About page also overflows its section at 390px. Shared styles affect FAQ, Terms, Cookies, and Connect as well. At 320px, the support form itself extends beyond the main container.

Use columns that can shrink to the available width, such as `minmax(min(100%, 320px), 1fr)`, and account for nested mobile padding. Apply the correction to both shared CSS and duplicated static support CSS. Recheck at 320px, 375px, and zoomed layouts.

### 2. Screenshot dialog fails keyboard interaction

Location: [src/pages/app-detail.jsx:386](/Volumes/Data/Projects/Web/Apps/website/src/pages/app-detail.jsx:386).

On the 2048 Rush page, opening the hero screenshot leaves focus on the trigger behind the overlay. Escape does not dismiss the dialog. Pressing Tab focuses the background “Previous screenshots” button. The dialog also lacks an accessible name. Declaring `aria-modal` does not implement focus containment.

Move focus into the dialog, contain focus, support Escape, restore focus to the trigger on close, and name the dialog. A native modal `dialog` or a tested accessible dialog implementation can provide the foundation.

### 3. Privacy content contains unfinished template fields

Location: [public/privacy-embed.html:42](/Volumes/Data/Projects/Web/Apps/website/public/privacy-embed.html:42).

The rendered policy contains three `__________` placeholders: a contact in the minors section and two postal-address lines. It also renders “Our servers are located in .” and empty region references. These defects are present in the live content, and the contact instructions are incomplete.

Complete the actual business/contact/hosting fields and regenerate the embed. Check the rendered result for remaining placeholders and empty sentences. This is a content-completeness finding, not a legal-compliance determination.

### 4. Email input is inserted as HTML and malformed bodies cause server errors

Locations: [api/send-email.js:9](/Volumes/Data/Projects/Web/Apps/website/api/send-email.js:9), [api/send-email.js:37](/Volumes/Data/Projects/Web/Apps/website/api/send-email.js:37).

Name, email, subject, and message are interpolated directly into the HTML email. A local mock confirmed that submitted HTML tags and links remain active markup in the outgoing payload. A sender can alter the appearance of an internal support email; this is email-content injection, not a demonstrated browser-script exploit.

The handler only checks truthiness. A missing request body throws before the try/catch, and a numeric message returns HTTP 500 with `message.replace is not a function` exposed to the caller. Validate body shape, string types, trimmed required fields, email format, and length limits before constructing the email. Escape all HTML values or send plain text, and return controlled 400 responses for invalid input.

## Next priorities

### 5. Baccarat references three nonexistent screenshots

Location: [public/apps.json:453](/Volumes/Data/Projects/Web/Apps/website/public/apps.json:453).

`/assets/baccarat/screen-1.png`, `screen-2.png`, and `screen-3.png` do not exist. The browser displays three fallback screenshot buttons and a “Screenshot Coming Soon” hero. The live first-image URL returns HTTP 200 HTML through the SPA fallback, rather than an image. This is partly handled visually, but the broken references leave a nonfunctional gallery.

Supply valid files or use an empty screenshot array until media is available. Extend asset validation to check file existence and image content, not just JSON shape or HTTP success.

### 6. The support dropdown omits four catalog apps

Location: [public/support.html:417](/Volumes/Data/Projects/Web/Apps/website/public/support.html:417).

The public `/support` route serves static HTML with only six app options. Word Rush, BreakVibe, 2048 Rush, and Pattern Lock are missing, although all four exist in `apps.json`. The React form has a dynamic list, but it is on the separate `/support-form` route.

Generate the static dropdown from the catalog at build time or populate it from the same data source with usable fallback options.

### 7. Unknown URLs silently render the homepage with HTTP 200

Locations: [src/App.jsx:35](/Volumes/Data/Projects/Web/Apps/website/src/App.jsx:35), [vercel.json:98](/Volumes/Data/Projects/Web/Apps/website/vercel.json:98).

The wildcard React route renders `HomePage`, and the deployment catch-all rewrites every unmatched path to `index.html`. A live request to `/audit-missing-page` returned HTTP 200. Missing asset URLs also receive homepage HTML. Visitors receive no missing-page explanation, and broken-link detection based only on status codes misses these failures.

Add a real not-found UI and deployment handling that preserves valid SPA deep links while returning appropriate missing-page/asset responses.

### 8. App pages lack distinct search and sharing metadata

Location: [index.html:6](/Volumes/Data/Projects/Web/Apps/website/index.html:6).

All React routes use the same “TopDog Labs” title and generic description. The browser confirmed that About, Privacy, and 2048 Rush retain that title. There are no Open Graph/Twitter tags or canonical links, and initial HTML contains only the empty React root rather than app-specific content.

Provide route-specific titles, descriptions, canonical URLs, and social images. Generate metadata in delivered HTML through prerendering or an equivalent approach so preview fetchers can read it without running React.

### 9. Screenshot assets are much larger than their displayed size requires

Locations: [src/pages/app-detail.jsx:261](/Volumes/Data/Projects/Web/Apps/website/src/pages/app-detail.jsx:261), [src/pages/app-detail.jsx:325](/Volumes/Data/Projects/Web/Apps/website/src/pages/app-detail.jsx:325).

The page uses original PNGs for both hero and gallery images, without responsive image candidates. Pattern Lock's first screenshot is 3,023,532 bytes; BreakVibe's five screenshots total 11,008,206 bytes. The hero screenshot is also marked lazy despite being prominent near the top of the page. Gallery lazy loading helps, so these totals are not claims about the initial network transfer.

Create appropriately sized WebP/AVIF variants and thumbnail sizes, use responsive image sources, and eagerly load the initial hero image when it is above the fold. Measure actual page performance after optimization.

### 10. Site-content failure removes navigation and error copy

Locations: [src/hooks/use-site-content.js:24](/Volumes/Data/Projects/Web/Apps/website/src/hooks/use-site-content.js:24), [src/pages/static-page.jsx:25](/Volumes/Data/Projects/Web/Apps/website/src/pages/static-page.jsx:25).

Code inspection: a failed `site.json` request resets content to an object without navigation or UI strings. Most consumers ignore the hook's error. Even the static page error branch reads its message from the failed content source, so the error title/subtitle are absent. Page CTAs can become unlabeled links.

Keep essential navigation and error text available independently of the fetched JSON. Show a meaningful error/retry state and consider sharing the content request across the page, header, and footer instead of issuing three independent requests.

### 11. No application-level support abuse controls were found

Location: [api/send-email.js:12](/Volumes/Data/Projects/Web/Apps/website/api/send-email.js:12).

The handler attempts a provider send for every request passing its truthiness checks. There is no application-level rate limit, bot check, or field-length cap. Repeated requests can consume mail quota and fill the support inbox if deployment controls do not stop them.

Inspect existing Vercel protections, then enforce appropriate limits before calling the mail provider. This is a code-level exposure finding; production firewall configuration and real abuse were not tested.

### 12. Dependency advisories need maintenance review

Location: [package.json:14](/Volumes/Data/Projects/Web/Apps/website/package.json:14), plus the lockfile.

The current audit identifies 11 affected dependency packages. The five high-severity packages are build/development dependencies: Vite, Rollup, PostCSS, nanoid, and Browserslist. Production-only results contain three moderate packages in the React Router dependency chain. These package counts include inherited findings and are not counts of distinct exploitable site vulnerabilities.

Review and update supported dependency versions, then rebuild and exercise navigation. No reachable production exploit was established in this audit; the site uses client-side routing, and advisory prerequisites differ. Do not treat every build-tool advisory as a public website vulnerability or blindly apply a forced major upgrade.

### 13. Favicon points to a missing file

Location: [index.html:11](/Volumes/Data/Projects/Web/Apps/website/index.html:11).

The document requests `/favicon.png`, which is absent. Available files include `favicon-96x96.png`, `favicon.svg`, and `favicon.ico`. The live `/favicon.png` response is HTTP 200 HTML. Point the link to an existing icon with its correct media type.

## Smaller accessibility and presentation issues

- [src/components/layout.jsx:7](/Volumes/Data/Projects/Web/Apps/website/src/components/layout.jsx:7): no skip-to-main link; add a visible-on-focus shortcut and main-content target.
- [src/styles.css:20](/Volumes/Data/Projects/Web/Apps/website/src/styles.css:20): smooth scrolling and entry/modal animations have no reduced-motion override. The JavaScript gallery scroll also explicitly requests smooth motion.
- [src/styles.css:2](/Volumes/Data/Projects/Web/Apps/website/src/styles.css:2) and [public/support.html:13](/Volumes/Data/Projects/Web/Apps/website/public/support.html:13): `color-scheme: light` conflicts with the dark UI, leaving native controls and browser chrome with light-theme defaults.
- [src/pages/apps.jsx:98](/Volumes/Data/Projects/Web/Apps/website/src/pages/apps.jsx:98): app-card titles use `h4` beneath a page structure that skips `h3`; review heading hierarchy, including the duplicate `h1` in the privacy embed.
- [public/support.html:431](/Volumes/Data/Projects/Web/Apps/website/public/support.html:431): name and email fields omit explicit autocomplete hints. The React form also lacks live announcement/focus handling for submission errors.

## Suggested repair order

1. Fix narrow-screen layouts, screenshot-dialog keyboard behavior, incomplete privacy content, and email input handling.
2. Restore/remove missing assets, synchronize support options, and verify abuse protections.
3. Add proper missing-page behavior and per-route metadata, optimize screenshots, and improve content-loading resilience.
4. Review dependency updates and address the smaller accessibility findings.

The existing tests cover catalog selection, sync tooling, and a robots rewrite. They do not cover the confirmed mobile, dialog, email-validation, or asset-existence failures. Add targeted checks for those behaviors when implementing fixes.


## Repair follow-up

The follow-up implementation addresses the code/content issues above: responsive grids and form controls; a native screenshot dialog with keyboard containment, Escape dismissal, and focus restoration; completed privacy contact/hosting text; typed support validation with plain-text email; removed nonexistent Baccarat screenshot references; generated support app options; prerendered route metadata/content and a 404 page; responsive WebP screenshots; durable content fallbacks; patched dependencies; and the favicon. Skip links, heading hierarchy, reduced-motion styles, form autocomplete, and dark native-control styling were also corrected.

Browser checks confirmed the affected 320px layouts fit, the dialog cycles focus and returns it on Escape, unknown app pages hydrate without errors, and navigation/catalog content continue working while both JSON endpoints return 503. Local preview returns 404 for unknown pages and missing assets, and 200 with the appropriate media type for known pages, the favicon, and both association-file paths.

Deployment has not been performed. The support endpoint has per-instance limits and honeypot/origin/input controls; a shared Vercel WAF rate-limit rule still needs to be configured or verified in the deployment account. Production delivery was not exercised with real email. See README for the concrete rule and release checks.

Final automated verification: production build and catalog validation passed; all 15 tests passed; `npm audit` reported zero vulnerabilities after dependency updates. Responsive screenshots total 3.85 MB across both sizes versus 47.16 MB of originals.
