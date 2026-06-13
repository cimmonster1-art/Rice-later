#!/usr/bin/env node
/**
 * Packages dist/extension into a Chrome Web Store-ready zip.
 * Builds first if dist/extension is missing.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import { readdir, stat, readFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createDeflateRaw } from "node:zlib";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const distDir = resolve(root, "dist/extension");
const outDir = resolve(root, "dist");
const outZip = resolve(outDir, "ricelayer-extension.zip");

if (!existsSync(distDir)) {
  console.log("[package] dist/extension missing — building extension…");
  execSync("npm run build:extension", { cwd: root, stdio: "inherit" });
}

// --- Minimal ZIP writer (store + deflate), no external deps. ---
async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function deflate(buf) {
  return new Promise((res, rej) => {
    const chunks = [];
    const z = createDeflateRaw();
    z.on("data", (d) => chunks.push(d));
    z.on("end", () => res(Buffer.concat(chunks)));
    z.on("error", rej);
    z.end(buf);
  });
}

async function run() {
  mkdirSync(outDir, { recursive: true });
  const files = [];
  for await (const f of walk(distDir)) files.push(f);

  const central = [];
  const localParts = [];
  let offset = 0;

  for (const file of files) {
    const data = await readFile(file);
    const name = relative(distDir, file).split("\\").join("/");
    const nameBuf = Buffer.from(name, "utf8");
    const comp = await deflate(data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, comp);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);

    offset += local.length + nameBuf.length + comp.length;
  }

  const centralBuf = Buffer.concat(central);
  const localBuf = Buffer.concat(localParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(localBuf.length, 16);

  const ws = createWriteStream(outZip);
  ws.write(localBuf);
  ws.write(centralBuf);
  ws.write(end);
  ws.end();
  await new Promise((r) => ws.on("close", r));

  console.log(`[package] wrote ${outZip} (${files.length} files)`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
