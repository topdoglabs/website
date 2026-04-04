#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_APPS_FILE = path.resolve("public/apps.json");
const DEFAULT_LOCALE = "en-US";
const DEFAULT_DISPLAY_PRIORITY = [
  "APP_IPHONE_67",
  "APP_IPHONE_65",
  "APP_IPHONE_61",
  "APP_IPHONE_55",
  "APP_IPAD_PRO_3GEN_129",
];

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

main().catch((error) => {
  console.error(`\nScreenshot sync failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const appsFilePath = path.resolve(args.appsFile ?? DEFAULT_APPS_FILE);
  const parsedApps = JSON.parse(await fs.readFile(appsFilePath, "utf8"));
  if (!Array.isArray(parsedApps)) {
    throw new Error(`Expected array in ${appsFilePath}`);
  }

  const apps = parsedApps.map(normalizeAppShape);

  const slugFilter = Array.isArray(args.slug) && args.slug.length > 0
    ? new Set(args.slug)
    : null;

  const changed = [];
  const warnings = [];
  const updates = new Map();

  for (const [index, app] of apps.entries()) {
    if (slugFilter && !slugFilter.has(app.slug)) {
      continue;
    }

    const appId = app?.sync?.asc?.appId || "";
    if (!appId) {
      warnings.push(`Skipping "${app.slug || app.identity.name || "unknown"}": missing appId.`);
      continue;
    }

    const versions = await ascJson(
      ["versions", "list", "--app", appId, "--platform", "IOS", "--paginate"],
      args.profile
    );
    const selectedVersion = pickMostRecentVersion(asArray(versions?.data));
    if (!selectedVersion?.id) {
      warnings.push(`Skipping "${app.slug || app.identity.name || appId}": no iOS version found.`);
      continue;
    }

    const localizations = await ascJson(
      ["localizations", "list", "--version", selectedVersion.id, "--paginate"],
      args.profile
    );
    const localization = pickLocalization(asArray(localizations?.data), args.locale);
    if (!localization?.id) {
      warnings.push(`Skipping "${app.slug || app.identity.name || appId}": locale ${args.locale} not found.`);
      continue;
    }

    const slug = app.slug || slugify(app.identity.name || appId);
    const targetDir = path.resolve("public/assets", slug);
    const downloadedPaths = [];
    let appChanged = false;

    if (!args.dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    const iconUrl = await fetchAppIconUrl(appId);
    if (iconUrl) {
      const iconExt = extensionFromUrl(iconUrl) || "png";
      const iconName = `asc-icon.${iconExt}`;
      const iconOutputPath = path.join(targetDir, iconName);
      const iconPublicPath = `/assets/${slug}/${iconName}`;
      if (!args.dryRun) {
        await downloadFile(iconUrl, iconOutputPath, slug, "icon");
      }
      app.sync.asc = {
        ...(isObject(app.sync.asc) ? app.sync.asc : {}),
        iconSyncedAt: new Date().toISOString(),
        iconSourceUrl: iconUrl,
      };
      if (args.replaceJson) {
        app.presentation.icon = iconPublicPath;
      }
      appChanged = true;
    } else {
      warnings.push(`No icon URL found for "${slug}" (appId: ${appId}).`);
    }

    const screenshotSets = await ascJson(
      ["screenshots", "list", "--version-localization", localization.id],
      args.profile
    );
    const chosenSet = chooseScreenshotSet(asArray(screenshotSets?.sets), args.displayType);
    if (!chosenSet || asArray(chosenSet.screenshots).length === 0) {
      warnings.push(
        `Skipping screenshots for "${app.slug || app.identity.name || appId}": none in locale ${localization.attributes?.locale || args.locale}.`
      );
    } else {
      const screenshots = asArray(chosenSet.screenshots).slice(0, args.limit);
      for (let index = 0; index < screenshots.length; index += 1) {
        const shot = screenshots[index];
        const attrs = shot?.attributes || {};
        const ext = extensionFromFilename(attrs.fileName);
        const outputName = `asc-${String(index + 1).padStart(2, "0")}.${ext}`;
        const outputPath = path.join(targetDir, outputName);
        const publicPath = `/assets/${slug}/${outputName}`;
        const downloadUrl = buildImageUrl(attrs.imageAsset, ext);
        if (!downloadUrl) {
          warnings.push(
            `Skipping screenshot ${index + 1} for "${slug}": missing imageAsset URL.`
          );
          continue;
        }

        if (!args.dryRun) {
          await downloadFile(downloadUrl, outputPath, slug, `screenshot ${index + 1}`);
        }

        downloadedPaths.push(publicPath);
      }

      if (downloadedPaths.length > 0) {
        app.sync.asc = {
          ...(isObject(app.sync.asc) ? app.sync.asc : {}),
          screenshotDisplayType: chosenSet?.set?.attributes?.screenshotDisplayType || "",
          screenshotLocale: localization.attributes?.locale || args.locale,
          screenshotSyncedAt: new Date().toISOString(),
        };

        if (args.replaceJson) {
          app.presentation.screenshots = downloadedPaths;
        }
        appChanged = true;
      }
    }

    if (appChanged) {
      changed.push(slug);
      updates.set(index, app);
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  if (changed.length === 0) {
    console.log("No screenshot changes detected.");
    return;
  }

  console.log(`Synced screenshots for ${changed.length} app(s): ${changed.join(", ")}`);
  if (args.dryRun) {
    console.log("Dry run enabled; no files were written.");
    return;
  }

  const updatedApps = parsedApps.map((app, index) => updates.get(index) ?? app);
  await fs.writeFile(appsFilePath, `${JSON.stringify(updatedApps, null, 2)}\n`, "utf8");
  console.log(`Updated ${appsFilePath}`);
}

function normalizeAppShape(rawApp) {
  const app = isObject(rawApp) ? rawApp : {};
  return {
    slug: valueOr(app.slug, slugify(app.identity?.name || app.name || "app")),
    comingSoon: Boolean(app.comingSoon),
    identity: {
      name: valueOr(app.identity?.name, app.name),
      tagline: valueOr(app.identity?.tagline, app.tagline),
    },
    presentation: {
      icon: valueOr(app.presentation?.icon, app.icon),
      screenshots: asArray(valueOr(app.presentation?.screenshots, app.screenshots)),
    },
    sync: {
      asc: isObject(app.sync?.asc) ? app.sync.asc : (isObject(app.asc) ? app.asc : {}),
      fallback: isObject(app.sync?.fallback) ? app.sync.fallback : {},
    },
    store: isObject(app.store) ? app.store : {},
    distribution: isObject(app.distribution) ? app.distribution : {},
    content: isObject(app.content) ? app.content : {},
    appStore: isObject(app.appStore) ? app.appStore : {},
  };
}

async function ascJson(commandArgs, profile) {
  const cliArgs = [];
  if (profile) {
    cliArgs.push("--profile", profile);
  }
  cliArgs.push(...commandArgs, "--output", "json");
  const { stdout } = await execFileAsync("asc", cliArgs, {
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

async function fetchAppIconUrl(appId) {
  const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=us`;
  const response = await fetch(lookupUrl);
  if (!response.ok) {
    return "";
  }
  const payload = await response.json();
  const result = asArray(payload?.results)[0];
  const url = String(
    result?.artworkUrl512 ||
      result?.artworkUrl100 ||
      result?.artworkUrl60 ||
      ""
  ).trim();
  return url;
}

async function downloadFile(url, outputPath, slug, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${label} (${response.status}) for "${slug}": ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
}

function parseArgs(argv) {
  const parsed = {
    appsFile: null,
    locale: DEFAULT_LOCALE,
    profile: "",
    slug: [],
    limit: 10,
    displayType: "",
    replaceJson: false,
    dryRun: false,
    help: false,
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
      case "--limit":
        parsed.limit = Math.max(1, Number(argv[index + 1] || 10));
        index += 1;
        break;
      case "--display-type":
        parsed.displayType = argv[index + 1];
        index += 1;
        break;
      case "--replace-json":
        parsed.replaceJson = true;
        break;
      case "--dry-run":
        parsed.dryRun = true;
        break;
      case "-h":
      case "--help":
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
Download App Store screenshots and App Store icons, and optionally replace apps.json paths.

Usage:
  node scripts/sync-appstore-screenshots.mjs [options]

Options:
  --apps-file <path>      Path to apps JSON (default: public/apps.json)
  --locale <locale>       Localization (default: en-US)
  --profile <name>        ASC profile (optional)
  --slug <slug>           Sync one app slug (repeatable)
  --limit <n>             Max screenshots per app (default: 10)
  --display-type <type>   Force display type (e.g. APP_IPHONE_67)
  --replace-json          Replace presentation.icon and presentation.screenshots
  --dry-run               Print changes without writing files
  -h, --help              Show help
  `.trim());
}

function chooseScreenshotSet(sets, forcedDisplayType) {
  const normalized = asArray(sets).filter((entry) => asArray(entry?.screenshots).length > 0);
  if (normalized.length === 0) {
    return null;
  }

  if (forcedDisplayType) {
    const forced = normalized.find(
      (entry) => entry?.set?.attributes?.screenshotDisplayType === forcedDisplayType
    );
    if (forced) {
      return forced;
    }
  }

  for (const displayType of DEFAULT_DISPLAY_PRIORITY) {
    const found = normalized.find(
      (entry) => entry?.set?.attributes?.screenshotDisplayType === displayType
    );
    if (found) {
      return found;
    }
  }

  return [...normalized].sort(
    (a, b) => asArray(b.screenshots).length - asArray(a.screenshots).length
  )[0];
}

function pickMostRecentVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }
  return [...versions].sort((a, b) => {
    const dateA = Date.parse(a?.attributes?.createdDate || "");
    const dateB = Date.parse(b?.attributes?.createdDate || "");
    if (Number.isNaN(dateA) && Number.isNaN(dateB)) {
      return 0;
    }
    if (Number.isNaN(dateA)) {
      return 1;
    }
    if (Number.isNaN(dateB)) {
      return -1;
    }
    return dateB - dateA;
  })[0];
}

function pickLocalization(localizations, locale) {
  const entries = asArray(localizations);
  if (entries.length === 0) {
    return null;
  }

  const exact = entries.find((entry) => entry?.attributes?.locale === locale);
  if (exact) {
    return exact;
  }

  const lang = locale.split("-")[0];
  const partial = entries.find((entry) =>
    String(entry?.attributes?.locale || "").startsWith(`${lang}-`)
  );
  return partial || entries[0];
}

function buildImageUrl(imageAsset, ext) {
  const template = imageAsset?.templateUrl;
  const width = imageAsset?.width;
  const height = imageAsset?.height;
  if (!template || !width || !height) {
    return "";
  }
  return template
    .replace("{w}", String(width))
    .replace("{h}", String(height))
    .replace("{f}", ext || "png");
}

function extensionFromFilename(fileName) {
  const name = String(fileName || "");
  const ext = path.extname(name).toLowerCase().replace(".", "");
  return ext || "png";
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase().replace(".", "");
    return ext || "png";
  } catch {
    return "png";
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
