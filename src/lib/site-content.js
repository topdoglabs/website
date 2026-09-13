const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export const mergeSiteContent = (fallback, supplied) => {
  if (Array.isArray(fallback)) {
    if (!Array.isArray(supplied) || supplied.length === 0) return fallback;
    if (!fallback.length) return supplied;
    const sample = fallback[0];
    const compatible = supplied.every((item) => isObject(sample) ? isObject(item) && Object.keys(sample).every((key) => typeof item[key] === typeof sample[key]) : typeof item === typeof sample);
    return compatible ? supplied.map((item) => mergeSiteContent(sample, item)) : fallback;
  }
  if (isObject(fallback)) {
    const value = isObject(supplied) ? supplied : {};
    return Object.fromEntries(Object.entries(fallback).map(([key, defaultValue]) => [key, mergeSiteContent(defaultValue, value[key])]));
  }
  return typeof supplied === typeof fallback && (typeof supplied !== "string" || supplied.trim() || !fallback) ? supplied : fallback;
};
