import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceAppsPath = path.join(repoRoot, "public/apps.json");

test("slug-filtered metadata sync preserves untouched apps", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "topdog-asc-sync-"));
  const tempAppsPath = path.join(tempDir, "apps.json");

  try {
    const sourceApps = JSON.parse(await fs.readFile(sourceAppsPath, "utf8"));
    const businessCard = sourceApps.find((app) => app.slug === "businesscard");
    const untouchedApp = {
      slug: "synthetic-app",
      comingSoon: false,
      identity: {
        name: "Synthetic App",
        tagline: "Leave this entry unchanged",
      },
      store: {
        category: "Utilities",
        version: "9.9.9",
        price: "Free",
        rating: "5.0",
        platform: "iOS",
        releaseDate: "April 1, 2026",
      },
      distribution: {
        appStoreUrl: "https://apps.apple.com/app/id1234567890",
        website: "https://topdoglabs.com/apps/synthetic-app",
        supportEmail: "info@topdoglabs.com",
        supportUrl: "https://topdoglabs.com/support",
        privacyPolicyUrl: "https://topdoglabs.com/privacy",
        isLive: true,
      },
      presentation: {
        icon: "/assets/synthetic-app/icon.png",
        screenshots: ["/assets/synthetic-app/screen-1.png"],
      },
      content: {
        summary: "Synthetic summary",
        description: "Synthetic description",
        whatsNew: "Synthetic update",
        highlights: ["Synthetic highlight"],
        features: [
          {
            title: "Synthetic feature",
            description: "Synthetic feature description",
          },
        ],
      },
      appStore: {
        promotionalText: "Synthetic promo",
        keywords: "synthetic,app",
        description: "Synthetic ASC description",
      },
      sync: {
        asc: {
          appId: "1234567890",
          bundleId: "com.topdoglabs.synthetic",
          isLive: true,
        },
        fallback: {
          name: false,
          tagline: false,
          platform: false,
          category: false,
          price: false,
          rating: false,
          version: false,
          updatedAt: "2026-04-01T00:00:00.000Z",
        },
      },
    };
    const fixtureApps = [untouchedApp, businessCard];

    await fs.writeFile(tempAppsPath, `${JSON.stringify(fixtureApps, null, 2)}\n`, "utf8");

    await execFileAsync(
      "node",
      [
        "scripts/sync-appstore-metadata.mjs",
        "--apps-file",
        tempAppsPath,
        "--slug",
        "businesscard",
      ],
      {
        cwd: repoRoot,
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    const syncedApps = JSON.parse(await fs.readFile(tempAppsPath, "utf8"));
    const originalUntouched = fixtureApps.find((app) => app.slug === "synthetic-app");
    const syncedUntouched = syncedApps.find((app) => app.slug === "synthetic-app");

    assert.deepEqual(syncedUntouched, originalUntouched);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("live app metadata sync uses the public App Store release date", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "topdog-asc-live-date-"));
  const tempAppsPath = path.join(tempDir, "apps.json");

  try {
    const sourceApps = JSON.parse(await fs.readFile(sourceAppsPath, "utf8"));
    const patternLock = sourceApps.find((app) => app.slug === "pattern-lock");

    await fs.writeFile(tempAppsPath, `${JSON.stringify([patternLock], null, 2)}\n`, "utf8");

    await execFileAsync(
      "node",
      [
        "scripts/sync-appstore-metadata.mjs",
        "--apps-file",
        tempAppsPath,
        "--slug",
        "pattern-lock",
      ],
      {
        cwd: repoRoot,
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    const lookupResponse = await fetch("https://itunes.apple.com/lookup?id=6761767215&country=us");
    const lookupPayload = await lookupResponse.json();
    const lookupApp = lookupPayload.results?.[0];
    const expectedReleaseDate = new Date(
      lookupApp.currentVersionReleaseDate || lookupApp.releaseDate
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const syncedApps = JSON.parse(await fs.readFile(tempAppsPath, "utf8"));
    const syncedPatternLock = syncedApps.find((app) => app.slug === "pattern-lock");

    assert.equal(syncedPatternLock.store.releaseDate, expectedReleaseDate);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
