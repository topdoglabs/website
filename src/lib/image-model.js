export const getScreenshotImageProps = (source, sizes) => {
  const base = source.replace(/^\/assets\//, "/assets/optimized/").replace(/\.[^.]+$/, "");
  return {
    src: `${base}-960.webp`,
    srcSet: `${base}-480.webp 480w, ${base}-960.webp 960w`,
    sizes,
    width: 1320,
    height: 2868,
    decoding: "async",
  };
};
