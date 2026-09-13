import { mergeSiteContent } from "../lib/site-content.js";
import fallback from "../../public/site.json";
import { createJsonResource } from "./use-json-resource.js";

const useContentData = createJsonResource("/site.json", fallback, (data) => mergeSiteContent(fallback, data),
  (data) => Boolean(data?.home?.heroTitle && data?.ui && data?.pages && Array.isArray(data?.navigation?.headerLinks) && Array.isArray(data?.footerColumns)));

export const useSiteContent = () => ({ content: useContentData(), isLoading: false, error: null });
