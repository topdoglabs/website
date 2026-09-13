#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_APPS_FILE = path.resolve("public/apps.json");

main().catch((error) => {
  console.error(`\napps schema validation failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const appsFile = path.resolve(process.argv[2] || DEFAULT_APPS_FILE);
  const raw = await fs.readFile(appsFile, "utf8");
  const apps = JSON.parse(raw);

  if (!Array.isArray(apps)) {
    throw new Error("root value must be an array");
  }

  const errors = [];
  const warnings = [];
  const slugs = new Set();

  for (const [index, app] of apps.entries()) {
    const label = app?.slug ? `${app.slug}` : `index ${index}`;

    if (!isObject(app)) {
      errors.push(`${label}: app must be an object`);
      continue;
    }

    requiredString(app.slug, `${label}: slug`, errors);
    if (app.slug) {
      if (slugs.has(app.slug)) {
        errors.push(`${label}: duplicate slug "${app.slug}"`);
      }
      slugs.add(app.slug);
    }

    requiredBoolean(app.comingSoon, `${label}: comingSoon`, errors);

    requiredObject(app.identity, `${label}: identity`, errors);
    requiredObject(app.store, `${label}: store`, errors);
    requiredObject(app.distribution, `${label}: distribution`, errors);
    requiredObject(app.presentation, `${label}: presentation`, errors);
    requiredObject(app.content, `${label}: content`, errors);
    requiredObject(app.appStore, `${label}: appStore`, errors);
    requiredObject(app.sync, `${label}: sync`, errors);

    if (isObject(app.identity)) {
      requiredString(app.identity.name, `${label}: identity.name`, errors);
      requiredString(app.identity.tagline, `${label}: identity.tagline`, errors);
    }

    if (isObject(app.store)) {
      requiredString(app.store.category, `${label}: store.category`, errors);
      requiredString(app.store.version, `${label}: store.version`, errors);
      requiredString(app.store.price, `${label}: store.price`, errors);
      requiredString(app.store.rating, `${label}: store.rating`, errors);
      requiredString(app.store.platform, `${label}: store.platform`, errors);
      requiredString(app.store.releaseDate, `${label}: store.releaseDate`, errors);
    }

    if (isObject(app.distribution)) {
      requiredString(app.distribution.appStoreUrl, `${label}: distribution.appStoreUrl`, errors);
      requiredString(app.distribution.website, `${label}: distribution.website`, errors);
      requiredString(app.distribution.supportEmail, `${label}: distribution.supportEmail`, errors);
      optionalString(app.distribution.supportUrl, `${label}: distribution.supportUrl`, errors);
      optionalString(
        app.distribution.privacyPolicyUrl,
        `${label}: distribution.privacyPolicyUrl`,
        errors
      );
    }

    if (isObject(app.presentation)) {
      requiredString(app.presentation.icon, `${label}: presentation.icon`, errors);
      if (!Array.isArray(app.presentation.screenshots)) {
        errors.push(`${label}: presentation.screenshots must be an array`);
      } else if (app.presentation.screenshots.length === 0) {
        warnings.push(`${label}: presentation.screenshots is empty`);
      } else {
        for (const [shotIndex, shot] of app.presentation.screenshots.entries()) {
          requiredString(
            shot,
            `${label}: presentation.screenshots[${shotIndex}]`,
            errors
          );
        }
      }
    }

    const assetPaths = [app.presentation?.icon, ...(Array.isArray(app.presentation?.screenshots) ? app.presentation.screenshots : [])];
    for (const asset of assetPaths) {
      if (typeof asset !== "string" || !asset.startsWith("/assets/")) {
        errors.push(`${label}: assets must use local /assets/ paths`);
        continue;
      }
      const assetRoot = path.dirname(appsFile);
      const resolvedAsset = path.resolve(assetRoot, `.${asset}`);
      if (!resolvedAsset.startsWith(`${assetRoot}${path.sep}`)) {
        errors.push(`${label}: invalid asset path ${asset}`);
        continue;
      }
      try {
        if (!(await fs.stat(resolvedAsset)).isFile()) throw new Error("Not a file");
      } catch {
        errors.push(`${label}: missing asset ${asset}`);
      }
    }

    if (isObject(app.content)) {
      requiredString(app.content.summary, `${label}: content.summary`, errors);
      requiredString(app.content.description, `${label}: content.description`, errors);
      requiredString(app.content.whatsNew, `${label}: content.whatsNew`, errors);

      if (!Array.isArray(app.content.highlights)) {
        errors.push(`${label}: content.highlights must be an array`);
      }
      if (!Array.isArray(app.content.features)) {
        errors.push(`${label}: content.features must be an array`);
      } else {
        for (const [featureIndex, feature] of app.content.features.entries()) {
          if (!isObject(feature)) {
            errors.push(`${label}: content.features[${featureIndex}] must be an object`);
            continue;
          }
          requiredString(
            feature.title,
            `${label}: content.features[${featureIndex}].title`,
            errors
          );
          requiredString(
            feature.description,
            `${label}: content.features[${featureIndex}].description`,
            errors
          );
        }
      }
    }

    if (isObject(app.appStore)) {
      requiredString(app.appStore.promotionalText, `${label}: appStore.promotionalText`, errors);
      requiredString(app.appStore.keywords, `${label}: appStore.keywords`, errors);
      requiredString(app.appStore.description, `${label}: appStore.description`, errors);
    }

    if (isObject(app.sync)) {
      requiredObject(app.sync.asc, `${label}: sync.asc`, errors);
      requiredObject(app.sync.fallback, `${label}: sync.fallback`, errors);
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error("\nValidation errors:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`apps schema valid (${apps.length} apps)`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredObject(value, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
  }
}

function requiredBoolean(value, label, errors) {
  if (typeof value !== "boolean") {
    errors.push(`${label} must be a boolean`);
  }
}

function requiredString(value, label, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string`);
  }
}

function optionalString(value, label, errors) {
  if (value === undefined || value === null) {
    return;
  }
  if (typeof value !== "string") {
    errors.push(`${label} must be a string when present`);
  }
}
