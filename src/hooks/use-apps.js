import fallback from "../../public/apps.json";
import { normalizeApps } from "../lib/app-model.js";
import { createJsonResource } from "./use-json-resource.js";

const useAppData = createJsonResource("/apps.json", fallback, normalizeApps,
  (data) => Array.isArray(data) && data.length > 0 && data.every((app) => app?.slug && app?.identity?.name));

export const useApps = () => ({ apps: useAppData(), isLoading: false, error: null });
