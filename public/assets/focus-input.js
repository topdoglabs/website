// WebKit can keep :focus-visible after touch-triggered programmatic focus.
// Track input before default focus handling, including native dialog autofocus.
(() => {
  const root = document.documentElement;
  // Leave native focus detection in charge until input occurs on this page.
  // Keyboard entry from browser controls may not send this document a keydown.
  window.addEventListener("blur", () => {
    delete root.dataset.focusInput;
  });
  document.addEventListener("pointerdown", () => {
    root.dataset.focusInput = "pointer";
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.altKey || event.ctrlKey ||
        ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    root.dataset.focusInput = "keyboard";
  }, true);
})();
