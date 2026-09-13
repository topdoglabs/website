import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApps } from "../hooks/use-apps.js";
import { useSiteContent } from "../hooks/use-site-content.js";
import { getPageMetadata } from "../lib/page-metadata.js";

export const PageMetadata = () => {
  const { pathname } = useLocation();
  const { apps } = useApps();
  const { content } = useSiteContent();
  useEffect(() => {
    const meta = getPageMetadata(pathname, apps, content);
    document.title = meta.title;
    const setMeta = (attribute, name, value) => {
      const node = document.head.querySelector(`meta[${attribute}="${name}"]`) || document.createElement("meta");
      node.setAttribute(attribute, name);
      node.content = value;
      if (!node.isConnected) document.head.append(node);
    };
    setMeta("name", "description", meta.description);
    setMeta("name", "robots", meta.noindex ? "noindex, follow" : "index, follow");
    for (const [name, value] of Object.entries({ title: meta.title, description: meta.description, image: meta.image, url: meta.canonical, type: "website" })) setMeta("property", `og:${name}`, value);
    setMeta("name", "twitter:card", "summary_large_image");
    for (const [name, value] of Object.entries({ title: meta.title, description: meta.description, image: meta.image })) setMeta("name", `twitter:${name}`, value);
    const canonical = document.head.querySelector('link[rel="canonical"]') || document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = meta.canonical;
    if (!canonical.isConnected) document.head.append(canonical);
  }, [pathname, apps, content]);
  return null;
};
