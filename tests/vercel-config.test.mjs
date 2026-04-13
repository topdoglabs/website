import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

test("vercel config serves robots.txt as plain text outside the SPA rewrite", async () => {
  const vercelConfigPath = path.join(repoRoot, "vercel.json");
  const robotsPath = path.join(repoRoot, "public", "robots.txt");

  const vercelConfig = JSON.parse(await fs.readFile(vercelConfigPath, "utf8"));
  const robotsContents = await fs.readFile(robotsPath, "utf8");

  const robotsHeader = vercelConfig.headers.find((header) => header.source === "/robots.txt");
  const robotsRewrite = vercelConfig.rewrites.find((rewrite) => rewrite.source === "/robots.txt");

  assert.ok(robotsHeader, "expected a dedicated robots.txt header");
  assert.ok(
    robotsHeader.headers.some(
      (header) =>
        header.key === "Content-Type" && header.value === "text/plain; charset=utf-8"
    ),
    "expected robots.txt to be served as text/plain"
  );
  assert.deepEqual(robotsRewrite, {
    source: "/robots.txt",
    destination: "/robots.txt",
  });
  assert.match(
    robotsContents,
    /^User-agent: Google-adstxt\nDisallow:\n\nUser-agent: Mediapartners-Google\nDisallow:\n\nUser-agent: Googlebot\nDisallow:\n\nUser-agent: \*\nAllow: \/\n?$/
  );
});
