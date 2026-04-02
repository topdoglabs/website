import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, "..");

test("screenshot sync dry-run works with the current asc CLI", async () => {
  await assert.doesNotReject(async () => {
    const { stdout } = await execFileAsync(
      "node",
      [
        "scripts/sync-appstore-screenshots.mjs",
        "--slug",
        "businesscard",
        "--dry-run",
      ],
      {
        cwd: repoRoot,
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    assert.match(stdout, /Synced screenshots|No screenshot changes detected/);
  });
});
