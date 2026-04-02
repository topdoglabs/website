#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_APPS_FILE = path.resolve("public/apps.json");
const DEFAULT_LOCALE = "en-US";
const DEFAULTS = {
  category: "Uncategorized",
  price: "Price pending",
  rating: "Not yet rated",
  version: "TBD",
  tagline: "Coming soon",
  platform: "iOS",
};

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
  const parsedApps = JSON.parse(rawApps);
  if (!Array.isArray(parsedApps)) {
    throw new Error(`Expected array in ${appsFilePath}`);
  }

  const apps = parsedApps.map(normalizeAppShape);

  log("Loading App Store Connect apps...");
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
      warnings.push("Skipping non-object app entry.");
      continue;
    }
    if (slugFilter && !slugFilter.has(app.slug)) {
      continue;
    }

    try {
      const match = findRemoteApp(app, remoteData);
      if (!match) {
        warnings.push(`No ASC match for "${app.slug || app.identity.name || "unknown"}".`);
        continue;
      }

      const remoteId = match.id;
      const versions = await ascJson(
        ["versions", "list", "--app", remoteId, "--platform", "IOS", "--paginate"],
        args.profile
      );
      const versionList = asArray(versions?.data);
      const selectedVersion = pickVersion(versionList);
      const liveVersion = pickLiveVersion(versionList);
      const publicVersion = liveVersion || selectedVersion;

      const [
        appInfoLocs,
        versionLocs,
        appInfoDetails,
        lookup,
        manualPrices,
        automaticPrices,
      ] = await Promise.all([
        ascJson(
          ["localizations", "list", "--app", remoteId, "--type", "app-info", "--paginate"],
          args.profile
        ),
        publicVersion
          ? ascJson(
              ["localizations", "list", "--version", publicVersion.id, "--paginate"],
              args.profile
            )
          : Promise.resolve({ data: [] }),
        ascJson(
          ["app-info", "get", "--app", remoteId, "--include", "primaryCategory"],
          args.profile
        ).catch(() => ({})),
        fetchITunesLookup(remoteId).catch(() => null),
        ascJson(["pricing", "schedule", "manual-prices", "--schedule", remoteId], args.profile).catch(
          () => ({})
        ),
        ascJson(["pricing", "schedule", "automatic-prices", "--schedule", remoteId], args.profile).catch(
          () => ({})
        ),
      ]);

      const appInfoLocalization = pickLocalization(asArray(appInfoLocs?.data), locale);
      const versionLocalization = pickLocalization(asArray(versionLocs?.data), locale);

      const nextApp = buildUpdatedApp({
        app,
        remoteApp: match,
        version: selectedVersion,
        publicVersion,
        liveVersion,
        appInfoLocalization,
        versionLocalization,
        appInfoDetails,
        lookup,
        manualPrices,
        automaticPrices,
      });

      updates.set(index, {
        changed: JSON.stringify(app) !== JSON.stringify(nextApp),
        app: nextApp,
      });
    } catch (error) {
      errors.push(`Failed "${app.slug || app.identity.name || "unknown"}": ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const updatedApps = parsedApps.map((app, index) => updates.get(index)?.app ?? app);

  const changedApps = apps
    .map((app, index) => ({ app, update: updates.get(index) }))
    .filter((entry) => entry.update?.changed)
    .map((entry) => entry.app.slug || entry.app.identity.name || "unknown");
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

function normalizeAppShape(rawApp) {
  const app = isObject(rawApp) ? rawApp : {};

  return {
    slug: valueOr(app.slug, slugKey(app.identity?.name || app.name || "app")),
    comingSoon: Boolean(app.comingSoon),
    identity: {
      name: valueOr(app.identity?.name, app.name),
      tagline: valueOr(app.identity?.tagline, app.tagline),
    },
    store: {
      category: valueOr(app.store?.category, app.category),
      version: valueOr(app.store?.version, app.version),
      price: valueOr(app.store?.price, app.price),
      rating: valueOr(app.store?.rating, app.rating),
      platform: valueOr(app.store?.platform, app.platform),
      releaseDate: valueOr(app.store?.releaseDate, app.date),
    },
    distribution: {
      appStoreUrl: valueOr(app.distribution?.appStoreUrl, app.appStoreUrl),
      website: valueOr(app.distribution?.website, app.website),
      supportEmail: valueOr(app.distribution?.supportEmail, app.supportEmail),
      supportUrl: valueOr(app.distribution?.supportUrl, app.appStoreInfo?.supportUrl),
      privacyPolicyUrl: valueOr(
        app.distribution?.privacyPolicyUrl,
        app.appStoreInfo?.privacyPolicyUrl
      ),
    },
    presentation: {
      icon: valueOr(app.presentation?.icon, app.icon),
      screenshots: asArray(valueOr(app.presentation?.screenshots, app.screenshots)),
    },
    content: {
      summary: valueOr(app.content?.summary, app.summary),
      description: valueOr(app.content?.description, app.description),
      whatsNew: valueOr(app.content?.whatsNew, app.whatsNew),
      highlights: asArray(valueOr(app.content?.highlights, app.highlights)),
      features: asArray(valueOr(app.content?.features, app.features)),
      copy: isObject(app.content?.copy) ? app.content.copy : (isObject(app.copy) ? app.copy : null),
    },
    appStore: {
      promotionalText: valueOr(app.appStore?.promotionalText, ""),
      keywords: valueOr(app.appStore?.keywords, ""),
      description: valueOr(app.appStore?.description, ""),
    },
    sync: {
      asc: isObject(app.sync?.asc) ? app.sync.asc : (isObject(app.asc) ? app.asc : {}),
      fallback: isObject(app.sync?.fallback)
        ? app.sync.fallback
        : (isObject(app.uiFallback) ? app.uiFallback : {}),
    },
  };
}

function buildUpdatedApp({
  app,
  remoteApp,
  version,
  publicVersion,
  liveVersion,
  appInfoLocalization,
  versionLocalization,
  appInfoDetails,
  lookup,
  manualPrices,
  automaticPrices,
}) {
  const fallback = {};
  const isLive = Boolean(liveVersion);

  const categoryFromAsc = extractPrimaryCategory(appInfoDetails);
  const lookupName = valueOr(lookup?.trackName, "");
  const lookupSubtitle = valueOr(lookup?.subtitle, "");
  const lookupCategory = valueOr(lookup?.primaryGenreName, "");
  const lookupVersion = valueOr(lookup?.version, "");
  const lookupRating = normalizeRating(lookup?.averageUserRating);
  const lookupPrice = formatPrice(lookup?.formattedPrice, lookup?.price);
  const ascPriceHint = inferPriceHintFromSchedule(manualPrices, automaticPrices);
  const lookupUrl = valueOr(lookup?.trackViewUrl, "");
  const lookupReleaseDate = valueOr(
    lookup?.currentVersionReleaseDate || lookup?.releaseDate,
    ""
  );

  const next = {
    ...app,
    comingSoon: isLive ? false : Boolean(app.comingSoon),
    identity: {
      ...app.identity,
      name: preferValue(
        [
          appInfoLocalization?.attributes?.name,
          lookupName,
          app.identity.name,
          remoteApp?.attributes?.name,
        ],
        "Untitled App",
        fallback,
        "name"
      ),
      tagline: preferValue(
        [appInfoLocalization?.attributes?.subtitle, lookupSubtitle, app.identity.tagline],
        DEFAULTS.tagline,
        fallback,
        "tagline"
      ),
    },
    store: {
      ...app.store,
      platform: preferValue([app.store.platform], DEFAULTS.platform, fallback, "platform"),
      category: preferValue(
        [categoryFromAsc, lookupCategory, app.store.category],
        DEFAULTS.category,
        fallback,
        "category"
      ),
      version: preferValue(
        [publicVersion?.attributes?.versionString, lookupVersion, app.store.version],
        DEFAULTS.version,
        fallback,
        "version"
      ),
      rating: preferValue([lookupRating, app.store.rating], DEFAULTS.rating, fallback, "rating"),
      price: preferValue(
        [resolvePriceValue(lookupPrice, ascPriceHint, app.store.price)],
        DEFAULTS.price,
        fallback,
        "price"
      ),
      releaseDate: app.store.releaseDate,
    },
    distribution: {
      ...app.distribution,
      appStoreUrl: valueOr(lookupUrl, `https://apps.apple.com/app/id${remoteApp.id}`),
      website: valueOr(versionLocalization?.attributes?.marketingUrl, app.distribution.website),
      supportUrl: valueOr(versionLocalization?.attributes?.supportUrl, app.distribution.supportUrl),
      privacyPolicyUrl: valueOr(
        appInfoLocalization?.attributes?.privacyPolicyUrl,
        app.distribution.privacyPolicyUrl
      ),
      isLive,
    },
    appStore: {
      ...app.appStore,
      promotionalText: valueOr(
        versionLocalization?.attributes?.promotionalText,
        app.appStore.promotionalText
      ),
      keywords: valueOr(versionLocalization?.attributes?.keywords, app.appStore.keywords),
      description: valueOr(versionLocalization?.attributes?.description, app.appStore.description),
    },
    sync: {
      ...app.sync,
      asc: {
        ...(isObject(app.sync.asc) ? app.sync.asc : {}),
        appId: remoteApp.id,
        bundleId: valueOr(remoteApp?.attributes?.bundleId, app.sync.asc?.bundleId),
        primaryLocale: valueOr(remoteApp?.attributes?.primaryLocale, app.sync.asc?.primaryLocale),
        appStoreState: valueOr(version?.attributes?.appStoreState, app.sync.asc?.appStoreState),
        versionId: valueOr(publicVersion?.id, app.sync.asc?.versionId),
        draftVersionId: valueOr(version?.id, app.sync.asc?.draftVersionId),
        liveVersionId: valueOr(liveVersion?.id, app.sync.asc?.liveVersionId),
        publicVersionString: valueOr(
          publicVersion?.attributes?.versionString,
          app.sync.asc?.publicVersionString
        ),
        draftVersionString: valueOr(
          version?.attributes?.versionString,
          app.sync.asc?.draftVersionString
        ),
        isLive,
        syncedAt: new Date().toISOString(),
      },
      fallback: {
        ...(isObject(app.sync.fallback) ? app.sync.fallback : {}),
        ...fallback,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const dateSource = valueOr(publicVersion?.attributes?.createdDate, lookupReleaseDate);
  if (dateSource) {
    next.store.releaseDate = new Date(dateSource).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (versionLocalization?.attributes?.whatsNew) {
    next.content.whatsNew = versionLocalization.attributes.whatsNew;
  }

  next.content.description = valueOr(next.content.description, next.appStore.description);

  return next;
}

function findRemoteApp(localApp, remoteApps) {
  if (!Array.isArray(remoteApps) || remoteApps.length === 0) {
    return null;
  }

  const localAppId = localApp?.sync?.asc?.appId || localApp.ascAppId;
  if (localAppId) {
    const byId = remoteApps.find((item) => item?.id === localAppId);
    if (byId) {
      return byId;
    }
  }

  const localBundleId = localApp?.sync?.asc?.bundleId || localApp.bundleId;
  if (localBundleId) {
    const byBundleId = remoteApps.find(
      (item) => item?.attributes?.bundleId === localBundleId
    );
    if (byBundleId) {
      return byBundleId;
    }
  }

  const localNameKey = nameKey(localApp.identity?.name);
  if (localNameKey) {
    const byName = remoteApps.find(
      (item) => nameKey(item?.attributes?.name) === localNameKey
    );
    if (byName) {
      return byName;
    }
  }

  const localSlugKey = slugKey(localApp.slug || localApp.identity?.name);
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

function pickLiveVersion(versions) {
  const entries = asArray(versions).filter(
    (version) => version?.attributes?.appStoreState === "READY_FOR_SALE"
  );
  if (entries.length === 0) {
    return null;
  }
  return [...entries].sort((a, b) => {
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

async function fetchITunesLookup(appId) {
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=us`
  );
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  const result = asArray(payload?.results)[0];
  return isObject(result) ? result : null;
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

  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`Could not parse ASC response as JSON for: asc ${cliArgs.join(" ")}`);
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

function preferValue(candidates, fallbackValue, fallbackState, key) {
  for (const candidate of candidates) {
    if (!isBlank(candidate)) {
      if (isObject(fallbackState) && key) {
        fallbackState[key] = false;
      }
      return candidate;
    }
  }
  if (isObject(fallbackState) && key) {
    fallbackState[key] = true;
  }
  return fallbackValue;
}

function extractPrimaryCategory(appInfoDetails) {
  const relationId = appInfoDetails?.data?.relationships?.primaryCategory?.data?.id;
  if (relationId) {
    return humanizeCategoryId(relationId);
  }
  return "";
}

function humanizeCategoryId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function normalizeRating(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }
  return Number(value).toFixed(1);
}

function formatPrice(formattedPrice, rawPrice) {
  if (!isBlank(formattedPrice)) {
    return formattedPrice;
  }
  if (rawPrice === 0 || rawPrice === "0") {
    return "Free";
  }
  const num = Number(rawPrice);
  if (!Number.isNaN(num) && num > 0) {
    return `$${num.toFixed(2)}`;
  }
  return "";
}

function inferPriceHintFromSchedule(manualPrices, automaticPrices) {
  const today = new Date();
  const manualEntries = decodePriceEntries(asArray(manualPrices?.data));
  const automaticEntries = decodePriceEntries(asArray(automaticPrices?.data));

  const activeManual = manualEntries.filter((entry) => {
    if (!entry.endDate) {
      return true;
    }
    return entry.endDate >= today;
  });
  if (activeManual.length > 0) {
    return classifyPriceFromEntries(activeManual);
  }

  const startedAutomatic = automaticEntries.filter((entry) => {
    if (!entry.startDate) {
      return true;
    }
    return entry.startDate <= today;
  });
  if (startedAutomatic.length > 0) {
    return classifyPriceFromEntries(startedAutomatic);
  }

  if (manualEntries.length > 0) {
    return classifyPriceFromEntries(manualEntries);
  }
  if (automaticEntries.length > 0) {
    return classifyPriceFromEntries(automaticEntries);
  }
  return "";
}

function decodePriceEntries(entries) {
  return entries
    .map((entry) => {
      const decoded = decodePriceId(entry?.id);
      if (!decoded) {
        return null;
      }
      return {
        priceCode: String(decoded.p || ""),
        startDate: toDate(decoded.sd, entry?.attributes?.startDate),
        endDate: toDate(decoded.ed, entry?.attributes?.endDate),
      };
    })
    .filter(Boolean);
}

function decodePriceId(encodedId) {
  try {
    const raw = String(encodedId || "");
    const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function toDate(epochOrZero, isoDate) {
  const epoch = Number(epochOrZero);
  if (!Number.isNaN(epoch) && epoch > 0) {
    return new Date(epoch * 1000);
  }
  if (!isBlank(isoDate)) {
    return new Date(`${isoDate}T00:00:00Z`);
  }
  return null;
}

function classifyPriceFromEntries(entries) {
  const codes = entries.map((entry) => entry.priceCode).filter(Boolean);
  if (codes.length === 0) {
    return "";
  }
  const allFree = codes.every((code) => code === "10000");
  return allFree ? "Free" : "Paid";
}

function resolvePriceValue(lookupPrice, ascPriceHint, existingPrice) {
  const cleanLookup = isBlank(lookupPrice) ? "" : lookupPrice;
  const cleanAsc = isBlank(ascPriceHint) ? "" : ascPriceHint;
  const cleanExisting = isBlank(existingPrice) ? "" : existingPrice;

  if (cleanAsc === "Paid" && (cleanLookup === "" || cleanLookup === "Free")) {
    return "Paid";
  }
  if (!isBlank(cleanLookup)) {
    return cleanLookup;
  }
  if (!isBlank(cleanAsc)) {
    return cleanAsc;
  }
  return cleanExisting;
}

function isBlank(value) {
  return String(value ?? "").trim() === "";
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
