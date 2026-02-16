const EMPTY_ARRAY = [];

const valueOr = (primary, fallback) => {
  if (primary === null || primary === undefined) {
    return fallback;
  }
  if (typeof primary === "string" && primary.trim() === "") {
    return fallback;
  }
  return primary;
};

const toArray = (value) => (Array.isArray(value) ? value : EMPTY_ARRAY);
const LIVE_STATES = new Set(["READY_FOR_SALE"]);

export const normalizeApp = (raw) => {
  const app = raw && typeof raw === "object" ? raw : {};

  return {
    slug: valueOr(app.slug, ""),
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
      isLive:
        app.distribution?.isLive ??
        app.sync?.asc?.isLive ??
        false,
    },
    presentation: {
      icon: valueOr(app.presentation?.icon, app.icon),
      screenshots: toArray(valueOr(app.presentation?.screenshots, app.screenshots)),
    },
    content: {
      summary: valueOr(app.content?.summary, app.summary),
      description: valueOr(app.content?.description, app.description),
      whatsNew: valueOr(app.content?.whatsNew, app.whatsNew),
      highlights: toArray(valueOr(app.content?.highlights, app.highlights)),
      features: toArray(valueOr(app.content?.features, app.features)),
      copy: app.content?.copy || app.copy || null,
    },
    appStore: {
      promotionalText: valueOr(app.appStore?.promotionalText, ""),
      keywords: valueOr(app.appStore?.keywords, ""),
      description: valueOr(app.appStore?.description, ""),
    },
    sync: {
      asc: app.sync?.asc || app.asc || {},
      fallback: app.sync?.fallback || app.uiFallback || {},
    },
  };
};

export const normalizeApps = (apps) => toArray(apps).map(normalizeApp);

export const getAppName = (app) => app.identity?.name || "Untitled app";
export const getAppSubline = (app) =>
  app.store?.releaseDate || app.store?.category || "Coming soon";
export const getAppBody = (app) =>
  app.content?.summary || app.identity?.tagline || "Details for this app are coming soon.";
export const getAppIcon = (app) => app.presentation?.icon || "";
export const getAppScreenshots = (app) => toArray(app.presentation?.screenshots);
export const getAppStoreUrl = (app) => app.distribution?.appStoreUrl || "";
export const isAppLive = (app) => {
  if (app.distribution?.isLive === true || app.sync?.asc?.isLive === true) {
    return true;
  }

  if (app.comingSoon) {
    return false;
  }

  if (typeof app.distribution?.isLive === "boolean") {
    return app.distribution.isLive;
  }

  if (typeof app.sync?.asc?.isLive === "boolean") {
    return app.sync.asc.isLive;
  }

  const state = app.sync?.asc?.appStoreState || "";
  if (state) {
    return LIVE_STATES.has(state);
  }

  return Boolean(getAppStoreUrl(app).trim());
};

export const isAppComingSoon = (app) => !isAppLive(app);
