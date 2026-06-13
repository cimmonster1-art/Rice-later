import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const repoRoot = resolve(__dirname, "..");
const extSrc = resolve(repoRoot, "apps/extension/src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

describe("security: secrets never reach the extension", () => {
  const files = walk(extSrc).filter((f) => /\.(ts|tsx)$/.test(f));

  it("GEMINI_API_KEY is never referenced in apps/extension/src", () => {
    const hits = files.filter((f) => /GEMINI_API_KEY/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("no process.env secret access in extension src", () => {
    const hits = files.filter((f) =>
      /process\.env\.(GEMINI|STRIPE|SECRET)/.test(readFileSync(f, "utf8"))
    );
    expect(hits).toEqual([]);
  });

  it("no eval( in extension src", () => {
    const hits = files.filter((f) => /\beval\s*\(/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});

describe("security: .env is git-ignored", () => {
  it(".gitignore lists .env", () => {
    const gi = readFileSync(resolve(repoRoot, ".gitignore"), "utf8");
    expect(gi).toMatch(/^\.env\s*$/m);
  });

  it("git check-ignore confirms .env is ignored", () => {
    let ignored = false;
    try {
      const out = execSync("git check-ignore .env", {
        cwd: repoRoot,
        encoding: "utf8",
      }).trim();
      ignored = out === ".env";
    } catch {
      ignored = false;
    }
    expect(ignored).toBe(true);
  });

  it("no real .env file is committed", () => {
    // .env.example is fine; a real .env should not be tracked.
    const tracked = (() => {
      try {
        return execSync("git ls-files .env", { cwd: repoRoot, encoding: "utf8" }).trim();
      } catch {
        return "";
      }
    })();
    expect(tracked).toBe("");
  });

  it(".env.example contains only an empty GEMINI_API_KEY", () => {
    const example = readFileSync(resolve(repoRoot, ".env.example"), "utf8");
    expect(example).toMatch(/^GEMINI_API_KEY=\s*$/m);
    // Ensure the actual assignment line has no committed value.
    expect(example).not.toMatch(/^GEMINI_API_KEY=.+\S/m);
    void existsSync;
  });
});
