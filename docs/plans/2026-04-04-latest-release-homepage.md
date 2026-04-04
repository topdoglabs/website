# Latest Release Homepage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the homepage "Latest Release" card automatically show the newest live App Store release instead of whichever app appears first in `public/apps.json`.

**Architecture:** Add a selector in `src/lib/app-model.js` that filters to live apps and picks the newest valid `store.releaseDate`. Keep the homepage page component thin by calling that selector, and lock the behavior with a focused unit test in the Node test suite.

**Tech Stack:** React 18, Vite, JavaScript modules, Node test runner

---

### Task 1: Add selector coverage

**Files:**
- Create: `tests/app-model.test.mjs`
- Modify: `src/lib/app-model.js`

**Step 1: Write the failing test**

```js
test("getLatestReleasedApp prefers the newest live release", () => {
  const apps = [
    { slug: "older-live", store: { releaseDate: "January 1, 2026" }, distribution: { isLive: true } },
    { slug: "newer-coming-soon", comingSoon: true, store: { releaseDate: "April 4, 2026" } },
    { slug: "newer-live", store: { releaseDate: "March 1, 2026" }, distribution: { isLive: true } },
  ];

  assert.equal(getLatestReleasedApp(apps)?.slug, "newer-live");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/app-model.test.mjs`
Expected: FAIL because `getLatestReleasedApp` does not exist yet.

**Step 3: Write minimal implementation**

```js
export const getLatestReleasedApp = (apps) => {
  // normalize, filter live apps, compare parsed release dates, and return the newest
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/app-model.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/app-model.test.mjs src/lib/app-model.js
git commit -m "Use latest live release on homepage"
```

### Task 2: Use selector on the homepage

**Files:**
- Modify: `src/pages/home.jsx`
- Test: `tests/app-model.test.mjs`

**Step 1: Update the page to use the selector**

```js
const featured = getLatestReleasedApp(apps);
```

**Step 2: Keep existing rendering paths intact**

Use the selected app in the existing loading, error, live, and coming-soon branches without changing the rest of the card markup.

**Step 3: Run focused tests**

Run: `node --test tests/app-model.test.mjs tests/sync-appstore-metadata.test.mjs tests/sync-appstore-screenshots.test.mjs`
Expected: PASS

**Step 4: Run production build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/home.jsx
git commit -m "Derive homepage latest release from live App Store data"
```
