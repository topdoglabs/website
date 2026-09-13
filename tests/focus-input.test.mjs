import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("focus styling follows input through dialog focus transfers and mixed input", () => {
  const listeners = new Map();
  const document = {
    documentElement: { dataset: {} },
    addEventListener: (name, handler, capture) => {
      assert.equal(capture, true);
      listeners.set(name, handler);
    },
  };
  const window = { addEventListener: (name, handler) => listeners.set(`window:${name}`, handler) };
  runInNewContext(readFileSync(new URL("../public/assets/focus-input.js", import.meta.url), "utf8"), { document, window });
  const mode = () => document.documentElement.dataset.focusInput;
  const dispatch = (name, event = {}) => listeners.get(name)?.(event);

  assert.equal(mode(), undefined, "keyboard entry from browser controls must retain native focus detection");
  dispatch("keydown", { key: "Tab" });
  assert.equal(mode(), "keyboard");
  dispatch("focusin");
  assert.equal(mode(), "keyboard", "dialog autofocus must preserve keyboard navigation");
  for (const pointerType of ["touch", "mouse", "pen"]) {
    dispatch("pointerdown", { pointerType });
    dispatch("focusin");
    assert.equal(mode(), "pointer", "autofocus after a pointer action must stay unhighlighted");
    dispatch("keydown", { key: "Tab", shiftKey: true });
    assert.equal(mode(), "keyboard", "keyboard navigation must resume after a tap");
  }
  dispatch("pointerdown", { pointerType: "touch" });
  dispatch("keydown", { key: "c", metaKey: true });
  assert.equal(mode(), "pointer", "browser shortcuts should not enable focus rings");
  dispatch("keydown", { key: "Enter" });
  assert.equal(mode(), "keyboard");
  dispatch("pointerdown", { pointerType: "mouse" });
  dispatch("window:blur");
  assert.equal(mode(), undefined, "returning from browser controls must not keep stale pointer mode");
});

test("React and static support production pages both load the input tracker", () => {
  for (const page of ["index.html", "apps/pattern-lock/index.html", "support.html"]) {
    const html = readFileSync(new URL(`../dist/${page}`, import.meta.url), "utf8");
    assert.match(html, /<script\b[^>]*src="\/assets\/focus-input\.js"[^>]*defer/);
  }
});
