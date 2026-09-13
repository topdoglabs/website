import { useEffect, useSyncExternalStore } from "react";

// Ship a build-time snapshot so navigation and content survive failed refreshes.
// Each resource is shared by every consumer, including the header and footer.
export const createJsonResource = (url, fallback, normalize, validate) => {
  const initial = normalize(fallback);
  let data = initial;
  let request;
  const listeners = new Set();
  const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
  const load = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Content unavailable");
      const result = await response.json();
      if (!validate(result)) throw new Error("Invalid content");
      data = normalize(result);
      listeners.forEach((listener) => listener());
    } catch {
      // Retain the usable build snapshot. Never erase labels or navigation.
    }
  };
  return () => {
    const snapshot = useSyncExternalStore(subscribe, () => data, () => initial);
    useEffect(() => { request ??= load(); }, []);
    return snapshot;
  };
};
