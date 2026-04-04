import test from "node:test";
import assert from "node:assert/strict";
import * as appModel from "../src/lib/app-model.js";

test("getLatestReleasedApp prefers the newest live release", () => {
  const { getLatestReleasedApp } = appModel;
  const apps = [
    {
      slug: "older-live",
      store: {
        releaseDate: "January 1, 2026",
      },
      distribution: {
        isLive: true,
      },
    },
    {
      slug: "newer-coming-soon",
      comingSoon: true,
      store: {
        releaseDate: "April 4, 2026",
      },
    },
    {
      slug: "newer-live",
      store: {
        releaseDate: "March 1, 2026",
      },
      distribution: {
        isLive: true,
      },
    },
  ];

  assert.equal(typeof getLatestReleasedApp, "function");
  assert.equal(getLatestReleasedApp(apps)?.slug, "newer-live");
});

test("getLatestReleasedApp falls back to the first live app when dates are invalid", () => {
  const { getLatestReleasedApp } = appModel;
  const apps = [
    {
      slug: "invalid-date-live",
      store: {
        releaseDate: "not-a-date",
      },
      distribution: {
        isLive: true,
      },
    },
    {
      slug: "missing-date-live",
      distribution: {
        isLive: true,
      },
    },
    {
      slug: "coming-soon-with-date",
      comingSoon: true,
      store: {
        releaseDate: "April 4, 2026",
      },
    },
  ];

  assert.equal(typeof getLatestReleasedApp, "function");
  assert.equal(getLatestReleasedApp(apps)?.slug, "invalid-date-live");
});

test("getAppsSortedByReleaseDate returns apps in descending release order", () => {
  const { getAppsSortedByReleaseDate } = appModel;
  const apps = [
    {
      slug: "older-live",
      store: {
        releaseDate: "January 1, 2026",
      },
      distribution: {
        isLive: true,
      },
    },
    {
      slug: "newest-coming-soon",
      comingSoon: true,
      store: {
        releaseDate: "April 4, 2026",
      },
    },
    {
      slug: "middle-live",
      store: {
        releaseDate: "March 1, 2026",
      },
      distribution: {
        isLive: true,
      },
    },
    {
      slug: "missing-date",
      distribution: {
        isLive: true,
      },
    },
  ];

  assert.equal(typeof getAppsSortedByReleaseDate, "function");
  assert.deepEqual(
    getAppsSortedByReleaseDate(apps).map((app) => app.slug),
    ["newest-coming-soon", "middle-live", "older-live", "missing-date"]
  );
});
