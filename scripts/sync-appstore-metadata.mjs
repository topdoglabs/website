#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_APPS_FILE = path.resolve("public/apps.json");
const DEFAULT_LOCALE = "en-US";

const STATE_PRIORITY = [
  "READY_FOR_SALE",
  "PENDING_DEVELOPER_RELEASE",
  "PENDING_APPLE_RELEASE",
  "PROCESSING_FOR_APP_STORE",
  "IN_REVIEW",
  "WAITING_FOR_REVIEW",
  "PREPARE_FOR_SUBMISSION",
];

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

main().catch((error) => {
  console.error(`\nSync failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const appsFilePath = path.resolve(args.appsFile ?? DEFAULT_APPS_FILE);
  const locale = args.locale ?? DEFAULT_LOCALE;

  const rawApps = await fs.readFile(appsFilePath, "utf8");
  const apps = JSON.parse(rawApps);
  if (!Array.isArray(apps)) {
    throw new Error(`Expected array in ${appsFilePath}`);
  }

  log(`Loading App Store Connect apps...`);
  const remoteApps = await ascJson(["apps", "list", "--paginate"], args.profile);
  const remoteData = asArray(remoteApps?.data);
  if (remoteData.length === 0) {
    throw new Error("No apps returned from App Store Connect.");
  }

  const slugFilter = Array.isArray(args.slug) && args.slug.length > 0
    ? new Set(args.slug)
    : null;
  const updates = new Map();
  const warnings = [];
  const errors = [];

  for (const [index, app] of apps.entries()) {
    if (!isObject(app)) {
      warnings.push(`Skipping non-object app entry.`);
      continue;
    }
    if (slugFilter && !slugFilter.has(app.slug)) {
      continue;
    }

    try {
      const match = findRemoteApp(app, remoteData);
      if (!match) {
        warnings.push(`No ASC match for "${app.slug || app.name || "unknown"}".`);
        continue;
      }

      const remoteId = match.id;
      const versions = await ascJson(
        ["versions", "list", "--app", remoteId, "--platform", "IOS", "--paginate"],
        args.profile
      );
      const selectedVersion = pickVersion(asArray(versions?.data));

      const [appInfoLocs, versionLocs] = await Promise.all([
        ascJson(
          ["localizations", "list", "--app", remoteId, "--type", "app-info", "--paginate"],
          args.profile
        ),
        selectedVersion
          ? ascJson(
              ["localizations", "list", "--version", selectedVersion.id, "--paginate"],
              args.profile
            )
          : Promise.resolve({ data: [] }),
      ]);

      const appInfoLocalization = pickLocalization(asArray(appInfoLocs?.data), locale);
      const versionLocalization = pickLocalization(asArray(versionLocs?.data), locale);

      const nextApp = buildUpdatedApp({
        app,
        remoteApp: match,
        version: selectedVersion,
        appInfoLocalization,
        versionLocalization,
      });

      updates.set(index, {
        changed: JSON.stringify(app) !== JSON.stringify(nextApp),
        app: nextApp,
      });
    } catch (error) {
      errors.push(
        `Failed "${app.slug || app.name || "unknown"}": ${error.message}`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const updatedApps = apps.map((app, index) => updates.get(index)?.app ?? app);

  const changedApps = apps
    .map((app, index) => ({ app, update: updates.get(index) }))
    .filter((entry) => entry.update?.changed)
    .map((entry) => entry.app.slug || entry.app.name || "unknown");
  if (changedApps.length === 0) {
    console.log("No app metadata changes detected.");
  } else {
    console.log(`Updated ${changedApps.length} app(s): ${changedApps.join(", ")}`);
  }
  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  if (args.dryRun) {
    console.log("Dry run enabled; no file changes were written.");
    return;
  }

  await fs.writeFile(appsFilePath, `${JSON.stringify(updatedApps, null, 2)}\n`, "utf8");
  console.log(`Wrote synced metadata to ${appsFilePath}`);
}

function buildUpdatedApp({
  app,
  remoteApp,
  version,
  appInfoLocalization,
  versionLocalization,
}) {
  const next = {
    ...app,
    appStoreUrl: `https://apps.apple.com/app/id${remoteApp.id}`,
  };

  next.asc = {
    ...(isObject(app.asc) ? app.asc : {}),
    appId: remoteApp.id,
    bundleId: valueOr(remoteApp?.attributes?.bundleId, app?.asc?.bundleId),
    primaryLocale: valueOr(
      remoteApp?.attributes?.primaryLocale,
      app?.asc?.primaryLocale
    ),
    appStoreState: valueOr(version?.attributes?.appStoreState, app?.asc?.appStoreState),
    versionId: valueOr(version?.id, app?.asc?.versionId),
    syncedAt: new Date().toISOString(),
  };

  next.name = valueOr(
    appInfoLocalization?.attributes?.name,
    valueOr(app.name, remoteApp?.attributes?.name)
  );
  next.tagline = valueOr(appInfoLocalization?.attributes?.subtitle, app.tagline);

  if (version?.attributes?.versionString) {
    next.version = version.attributes.versionString;
  }
  if (version?.attributes?.createdDate) {
    next.date = new Date(version.attributes.createdDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  if (version?.attributes?.appStoreState) {
    next.asc.appStoreState = version.attributes.appStoreState;
  }

  next.website = valueOr(versionLocalization?.attributes?.marketingUrl, app.website);
  next.appStoreInfo = {
    ...(isObject(app.appStoreInfo) ? app.appStoreInfo : {}),
    supportUrl: valueOr(versionLocalization?.attributes?.supportUrl, app?.appStoreInfo?.supportUrl),
    privacyPolicyUrl: valueOr(
      appInfoLocalization?.attributes?.privacyPolicyUrl,
      app?.appStoreInfo?.privacyPolicyUrl
    ),
  };

  next.appStore = {
    ...(isObject(app.appStore) ? app.appStore : {}),
    promotionalText: valueOr(
      versionLocalization?.attributes?.promotionalText,
      app?.appStore?.promotionalText
    ),
    keywords: valueOr(versionLocalization?.attributes?.keywords, app?.appStore?.keywords),
    description: valueOr(
      versionLocalization?.attributes?.description,
      app?.appStore?.description
    ),
  };

  if (versionLocalization?.attributes?.whatsNew) {
    next.whatsNew = versionLocalization.attributes.whatsNew;
  }

  return next;
}

function findRemoteApp(localApp, remoteApps) {
  if (!Array.isArray(remoteApps) || remoteApps.length === 0) {
    return null;
  }

  const localAppId = localApp?.asc?.appId || localApp.ascAppId;
  if (localAppId) {
    const byId = remoteApps.find((item) => item?.id === localAppId);
    if (byId) {
      return byId;
    }
  }

  const localBundleId = localApp?.asc?.bundleId || localApp.bundleId;
  if (localBundleId) {
    const byBundleId = remoteApps.find(
      (item) => item?.attributes?.bundleId === localBundleId
    );
    if (byBundleId) {
      return byBundleId;
    }
  }

  const localNameKey = nameKey(localApp.name);
  if (localNameKey) {
    const byName = remoteApps.find(
      (item) => nameKey(item?.attributes?.name) === localNameKey
    );
    if (byName) {
      return byName;
    }
  }

  const localSlugKey = slugKey(localApp.slug || localApp.name);
  if (localSlugKey) {
    const bySlug = remoteApps.find((item) => {
      const remoteName = item?.attributes?.name;
      return slugKey(remoteName) === localSlugKey;
    });
    if (bySlug) {
      return bySlug;
    }
  }

  return null;
}

function pickVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }

  return [...versions].sort((a, b) => {
    const stateA = a?.attributes?.appStoreState;
    const stateB = b?.attributes?.appStoreState;
    const rankA = STATE_PRIORITY.indexOf(stateA);
    const rankB = STATE_PRIORITY.indexOf(stateB);
    const normalizedRankA = rankA === -1 ? STATE_PRIORITY.length : rankA;
    const normalizedRankB = rankB === -1 ? STATE_PRIORITY.length : rankB;
    if (normalizedRankA !== normalizedRankB) {
      return normalizedRankA - normalizedRankB;
    }

    const dateA = Date.parse(a?.attributes?.createdDate || "");
    const dateB = Date.parse(b?.attributes?.createdDate || "");
    return Number.isNaN(dateB) ? -1 : dateB - dateA;
  })[0];
}

function pickLocalization(localizations, locale) {
  if (!Array.isArray(localizations) || localizations.length === 0) {
    return null;
  }

  const exact = localizations.find((entry) => entry?.attributes?.locale === locale);
  if (exact) {
    return exact;
  }

  const language = locale.split("-")[0];
  const langMatch = localizations.find((entry) =>
    String(entry?.attributes?.locale || "").startsWith(`${language}-`)
  );
  return langMatch || localizations[0];
}

async function ascJson(commandArgs, profile) {
  const args = [];
  if (profile) {
    args.push("--profile", profile);
  }
  args.push(...commandArgs, "--output", "json");

  const { stdout, stderr } = await execFileAsync("asc", args, {
    maxBuffer: 20 * 1024 * 1024,
  });
  if (stderr && args.debug) {
    log(stderr);
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Could not parse ASC response as JSON for: asc ${args.join(" ")}`);
  }
}

function parseArgs(argv) {
  const parsed = {
    appsFile: null,
    locale: DEFAULT_LOCALE,
    profile: "",
    dryRun: false,
    help: false,
    slug: [],
    verbose: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--apps-file":
        parsed.appsFile = argv[index + 1];
        index += 1;
        break;
      case "--locale":
        parsed.locale = argv[index + 1];
        index += 1;
        break;
      case "--profile":
        parsed.profile = argv[index + 1];
        index += 1;
        break;
      case "--slug":
        parsed.slug.push(argv[index + 1]);
        index += 1;
        break;
      case "--dry-run":
        parsed.dryRun = true;
        break;
      case "--verbose":
        parsed.verbose = true;
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
Sync App Store Connect metadata into website/public/apps.json

Usage:
  node scripts/sync-appstore-metadata.mjs [options]

Options:
  --apps-file <path>   Path to apps JSON file (default: public/apps.json)
  --locale <locale>    Preferred locale (default: en-US)
  --profile <name>     ASC profile name (optional)
  --slug <slug>        Sync one app slug (repeatable)
  --dry-run            Show updates without writing file
  --verbose            Print extra logs
  -h, --help           Show help
  `.trim());
}

function slugKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function nameKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\bby topdog\b/g, "")
    .replace(/\bby topdoglabs\b/g, "")
    .replace(/\btopdog\b/g, "")
    .replace(/\btopdoglabs\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function valueOr(primary, fallback) {
  if (primary === null || primary === undefined) {
    return fallback;
  }
  if (typeof primary === "string" && primary.trim() === "") {
    return fallback;
  }
  return primary;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function log(message) {
  if (args.verbose) {
    console.log(message);
  }
}
