import { getAppBody, getAppIcon, getAppName } from "./app-model.js";

export const getPageMetadata = (pathname, apps, content) => {
  const path = pathname.replace(/\/$/, "") || "/";
  const { seo } = content;
  const app = path.startsWith("/apps/") ? apps.find((item) => `/apps/${item.slug}` === path) : null;
  const page = content.pages[path.slice(1)];
  const known = app || page || ["/", "/apps", "/privacy", "/support", "/support-form"].includes(path);
  const name = app ? getAppName(app) : page?.title || ({ "/apps": "Apps", "/privacy": "Privacy Policy", "/support": "Support", "/support-form": "Support" })[path];
  return {
    title: !known ? `Page not found | ${seo.title}` : name ? `${name} | ${seo.title}` : seo.title,
    description: app ? getAppBody(app) : page?.subtitle || ({ "/apps": content.appsPage.heroSubtitle, "/privacy": content.privacy.heroSubtitle, "/support": content.support.heroSubtitle, "/support-form": content.support.heroSubtitle })[path] || seo.description,
    canonical: `${seo.siteUrl}${path === '/support-form' ? '/support' : path === '/' ? '' : path}`,
    image: new URL((app && getAppIcon(app)) || seo.image, seo.siteUrl).href,
    noindex: !known || path === '/support-form',
  };
};
