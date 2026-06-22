/**
 * Generate Chrome Web Store marketing assets for RiceLayer.
 *
 * Produces, under ./marketing:
 *   screenshots/  1280x800 PNGs ready for the Web Store listing
 *   tiles/        store icon (128) + small (440x280) & marquee (1400x560) tiles
 *   promo/        a screen-recorded promo video (webm + mp4) ready for YouTube
 *
 * All PNGs are flattened to 24-bit RGB (NO alpha) to satisfy the Web Store's
 * "24-bit PNG (no alpha)" requirement. The webm is also transcoded to mp4.
 *
 * Everything is rendered with the *real* extension assets:
 *   - the actual preset CSS from apps/extension/src/shared/presets.ts
 *   - the actual popup markup + apps/extension/src/popup/Popup.css
 * so what you ship matches what the store sees.
 *
 * Usage:  node scripts/generate-store-assets.mjs
 */
import { chromium } from "playwright";
import esbuild from "esbuild";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
} from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const out = resolve(root, "marketing");
const shotsDir = resolve(out, "screenshots");
const tilesDir = resolve(out, "tiles");
const promoDir = resolve(out, "promo");
mkdirSync(shotsDir, { recursive: true });
mkdirSync(tilesDir, { recursive: true });
mkdirSync(promoDir, { recursive: true });

const W = 1280;
const H = 800;

/* ----------------------------------------------------------------------------
 * 1. Load the REAL preset CSS by bundling the extension's presets.ts
 * ------------------------------------------------------------------------- */
async function loadPresets() {
  const tmp = resolve(out, ".presets.bundle.mjs");
  await esbuild.build({
    entryPoints: [resolve(root, "apps/extension/src/shared/presets.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: tmp,
    logLevel: "silent",
  });
  const mod = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
  rmSync(tmp, { force: true });
  return mod.PRESETS;
}

const popupCss = readFileSync(
  resolve(root, "apps/extension/src/popup/Popup.css"),
  "utf8"
);

/* ----------------------------------------------------------------------------
 * 2. A realistic generic web app to "rice" (the before/after subject)
 * ------------------------------------------------------------------------- */
const demoPage = /* html */ `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Acme Console — Projects</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#1f2328; background:#ffffff; }
  a { color:#0a66c2; }
  header { display:flex; align-items:center; gap:16px; padding:12px 24px; border-bottom:1px solid #d0d7de; }
  header .logo { font-weight:700; font-size:18px; color:#24292f; }
  nav { display:flex; gap:18px; flex:1; }
  nav a { text-decoration:none; font-size:14px; }
  header button { font-size:13px; padding:7px 12px; border:1px solid #d0d7de; border-radius:6px; background:#f6f8fa; cursor:pointer; }
  .wrap { display:flex; }
  aside { width:200px; border-right:1px solid #d0d7de; padding:16px; }
  aside h4 { margin:0 0 8px; font-size:12px; text-transform:uppercase; color:#656d76; letter-spacing:.04em; }
  aside ul { list-style:none; margin:0 0 18px; padding:0; }
  aside li { padding:6px 8px; border-radius:6px; font-size:14px; }
  aside li.active { background:#f6f8fa; font-weight:600; }
  main { flex:1; padding:24px; }
  h1 { margin:0 0 4px; font-size:22px; }
  .sub { color:#656d76; margin:0 0 20px; font-size:14px; }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
  .card { border:1px solid #d0d7de; border-radius:8px; padding:14px; }
  .card .k { font-size:12px; color:#656d76; text-transform:uppercase; letter-spacing:.04em; }
  .card .v { font-size:24px; font-weight:700; margin-top:6px; }
  .toolbar { display:flex; gap:10px; align-items:center; margin-bottom:12px; }
  .toolbar input[type=text]{ flex:1; padding:8px 10px; border:1px solid #d0d7de; border-radius:6px; font-size:14px; }
  .btn-primary { background:#1f6feb; color:#fff; border:1px solid #1f6feb; border-radius:6px; padding:8px 14px; font-size:14px; cursor:pointer; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th,td { text-align:left; padding:10px 12px; border-bottom:1px solid #d0d7de; }
  th { color:#656d76; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.03em; }
  .badge { font-size:12px; padding:2px 8px; border-radius:999px; background:#eaeef2; }
  footer { padding:16px 24px; color:#656d76; font-size:12px; border-top:1px solid #d0d7de; }
</style></head>
<body>
  <header>
    <span class="logo">▦ Acme Console</span>
    <nav><a href="#">Projects</a><a href="#">Pipelines</a><a href="#">Insights</a><a href="#">Team</a><a href="#">Docs</a></nav>
    <button>Invite</button>
    <button class="btn-primary" style="background:#1f6feb;color:#fff;border-color:#1f6feb">New project</button>
  </header>
  <div class="wrap">
    <aside>
      <h4>Workspace</h4>
      <ul><li class="active">Overview</li><li>Deployments</li><li>Activity</li><li>Settings</li></ul>
      <h4>Recent</h4>
      <ul><li>web-frontend</li><li>billing-api</li><li>data-pipeline</li></ul>
    </aside>
    <main>
      <h1>Projects</h1>
      <p class="sub">A snapshot of everything running in your workspace.</p>
      <div class="stats">
        <div class="card"><div class="k">Deploys today</div><div class="v">38</div></div>
        <div class="card"><div class="k">Success rate</div><div class="v">99.2%</div></div>
        <div class="card"><div class="k">Open issues</div><div class="v">12</div></div>
        <div class="card"><div class="k">Avg build</div><div class="v">1m 42s</div></div>
      </div>
      <div class="toolbar">
        <input type="text" placeholder="Search projects…">
        <button>Filter</button>
        <button class="btn-primary">Deploy</button>
      </div>
      <table>
        <thead><tr><th>Project</th><th>Status</th><th>Branch</th><th>Owner</th><th>Updated</th></tr></thead>
        <tbody>
          <tr><td>web-frontend</td><td><span class="badge">Live</span></td><td>main</td><td>A. Rivera</td><td>2m ago</td></tr>
          <tr><td>billing-api</td><td><span class="badge">Live</span></td><td>main</td><td>J. Okafor</td><td>11m ago</td></tr>
          <tr><td>data-pipeline</td><td><span class="badge">Building</span></td><td>release</td><td>M. Chen</td><td>18m ago</td></tr>
          <tr><td>auth-service</td><td><span class="badge">Live</span></td><td>main</td><td>S. Patel</td><td>1h ago</td></tr>
          <tr><td>marketing-site</td><td><span class="badge">Queued</span></td><td>staging</td><td>L. Müller</td><td>3h ago</td></tr>
        </tbody>
      </table>
    </main>
  </div>
  <footer>Acme Console · status: operational · you are signed in as you@example.com</footer>
</body></html>`;

/* ----------------------------------------------------------------------------
 * 3. Faithful popup markup (mirrors apps/extension/src/popup/Popup.tsx)
 * ------------------------------------------------------------------------- */
function popupHtml(presets, { hostname, prompt, message, safety }) {
  const chips = presets
    .map(
      (p) =>
        `<button class="rl-chip" title="${p.description}">${p.name}</button>`
    )
    .join("");
  const safetyHtml = safety
    ? `<div class="rl-safety ${safety.severity}">
         <div class="rl-safety-head">Safety: <strong>${safety.severity.toUpperCase()}</strong></div>
         <ul>${safety.checks
           .map(
             (c) =>
               `<li class="${c.passed ? "pass" : "fail"}">${
                 c.passed ? "✓" : "✗"
               } ${c.message}</li>`
           )
           .join("")}</ul>
       </div>`
    : "";
  return /* html */ `<!doctype html><html><head><meta charset="utf-8">
  <style>${popupCss}
  html,body{background:transparent}
  </style></head><body>
  <div class="rl-root">
    <header class="rl-header">
      <div class="rl-brand"><span class="rl-logo">◢◤</span><span class="rl-name">RiceLayer</span></div>
      <span class="rl-badge free" title="RiceLayer is free for everyone">FREE</span>
    </header>
    <div class="rl-domainbar">
      <span class="rl-mono">site</span>
      <span class="rl-domain">${hostname}</span>
      <label class="rl-switch"><input type="checkbox" checked><span class="rl-slider"></span></label>
    </div>
    <div class="rl-section-label rl-mono">describe your interface</div>
    <div class="rl-prompt">
      <div class="rl-chatbox">
        <textarea class="rl-chatinput" rows="2">${prompt}</textarea>
        <span class="rl-charcount">${prompt.length}/50</span>
      </div>
      <button class="rl-primary">Rice this page</button>
    </div>
    <div class="rl-section-label rl-mono">presets</div>
    <div class="rl-chips">${chips}</div>
    <div class="rl-options">
      <label><input type="checkbox"> Save for this site</label>
      <label><input type="checkbox" checked> Show original</label>
    </div>
    ${safetyHtml}
    ${message ? `<div class="rl-message">${message}</div>` : ""}
    <div class="rl-actions"><button class="rl-reset">Reset</button></div>
    <footer class="rl-trust rl-mono">CSS-only · No form values read · One-click reset</footer>
  </div></body></html>`;
}

const DEMO_SAFETY = {
  severity: "safe",
  checks: [
    { id: "buttons", passed: true, message: "All buttons still clickable" },
    { id: "links", passed: true, message: "Links preserved" },
    { id: "forms", passed: true, message: "Inputs & forms intact" },
    { id: "scroll", passed: true, message: "Page scroll unaffected" },
  ],
};

/* A promo "stage": the demo page in an iframe with a floating popup + caption. */
function stageHtml(popupInner) {
  return /* html */ `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box} html,body{margin:0;height:100%;font-family:Inter,system-ui,Segoe UI,sans-serif;background:#05060a}
  #frame{position:absolute;inset:0;border:0;width:100%;height:100%}
  #cursor{position:fixed;width:22px;height:22px;z-index:40;left:640px;top:400px;transition:left .5s cubic-bezier(.4,0,.2,1),top .5s cubic-bezier(.4,0,.2,1);pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
  #popup{position:fixed;top:24px;right:24px;width:360px;z-index:30;border:1px solid #1d2230;border-radius:12px;overflow:hidden;
         box-shadow:0 24px 70px rgba(0,0,0,.6), 0 0 0 1px rgba(0,240,255,.12);background:#08090d;transform:translateY(-6px);opacity:0;transition:opacity .4s,transform .4s}
  #popup.show{opacity:1;transform:translateY(0)}
  #cap{position:fixed;left:0;right:0;bottom:0;z-index:35;padding:18px 26px;color:#eaf6ff;font-size:22px;font-weight:600;
       background:linear-gradient(0deg,rgba(3,5,10,.92),rgba(3,5,10,0));letter-spacing:.01em}
  #cap b{color:#00f0ff}
  #brandtag{position:fixed;left:26px;top:22px;z-index:35;color:#cfeeff;font:700 15px Inter,system-ui;opacity:.0;transition:opacity .4s}
  #brandtag .l{color:#00f0ff;text-shadow:0 0 10px #00f0ff}
  </style></head><body>
  <iframe id="frame"></iframe>
  <div id="brandtag"><span class="l">◢◤</span> RiceLayer</div>
  <div id="popup">${popupInner}</div>
  <svg id="cursor" viewBox="0 0 24 24" fill="#fff"><path d="M4 2l16 9-7 1.6L9.8 20 4 2z" stroke="#000" stroke-width="1"/></svg>
  <div id="cap"></div>
  </body></html>`;
}

/* ----------------------------------------------------------------------------
 * 3b. Branded store icon + promo tiles
 * ------------------------------------------------------------------------- */
const BRAND_BG = `
  radial-gradient(120% 120% at 0% 0%, #10233a 0%, #0a0c12 55%),
  linear-gradient(135deg, #0a0c12, #0c1626)`;

/** Square store icon (128x128 on the canvas, rendered @4x for crispness). */
function iconHtml() {
  return /* html */ `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  html,body{width:512px;height:512px;background:#0a0c12}
  .ic{width:512px;height:512px;display:flex;align-items:center;justify-content:center;
      background:${BRAND_BG};position:relative;overflow:hidden}
  .ic::before{content:"";position:absolute;inset:0;
      background-image:linear-gradient(rgba(0,240,255,.06) 2px,transparent 2px),
        linear-gradient(90deg,rgba(0,240,255,.06) 2px,transparent 2px);
      background-size:64px 64px}
  .glyph{position:relative;font:800 300px/1 "Segoe UI",Inter,system-ui,sans-serif;
      color:#00f0ff;text-shadow:0 0 36px rgba(0,240,255,.65);letter-spacing:-8px}
  .ring{position:absolute;width:340px;height:340px;border-radius:30%;
      border:6px solid rgba(0,240,255,.25);box-shadow:0 0 60px rgba(0,240,255,.25) inset}
  </style></head><body>
  <div class="ic"><div class="ring"></div><div class="glyph">◢◤</div></div>
  </body></html>`;
}

/** Shared promo-tile body. `size`: "small" | "marquee". */
function tileHtml(size) {
  const small = size === "small";
  return /* html */ `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  html,body{width:100%;height:100%;font-family:Inter,system-ui,"Segoe UI",sans-serif;background:#0a0c12}
  .tile{width:100%;height:100%;position:relative;overflow:hidden;background:${BRAND_BG};
        display:flex;align-items:center;color:#eaf6ff;
        padding:${small ? "26px 30px" : "0 70px"}}
  .tile::before{content:"";position:absolute;inset:0;
        background-image:linear-gradient(rgba(0,240,255,.05) 1px,transparent 1px),
          linear-gradient(90deg,rgba(0,240,255,.05) 1px,transparent 1px);
        background-size:${small ? "26px 26px" : "40px 40px"}}
  .glow{position:absolute;border-radius:50%;filter:blur(60px);opacity:.5}
  .g1{width:300px;height:300px;background:#00f0ff;right:-60px;top:-80px}
  .g2{width:260px;height:260px;background:#ff3df0;left:-80px;bottom:-90px;opacity:.35}
  .inner{position:relative;z-index:2;${small ? "" : "max-width:60%"}}
  .brand{display:flex;align-items:center;gap:${small ? "10px" : "16px"};margin-bottom:${small ? "10px" : "20px"}}
  .logo{color:#00f0ff;text-shadow:0 0 18px #00f0ff;font-size:${small ? "26px" : "46px"}}
  .name{font-weight:800;letter-spacing:.04em;font-size:${small ? "26px" : "48px"}}
  .tag{font-weight:700;line-height:1.1;font-size:${small ? "19px" : "44px"};
       margin-bottom:${small ? "8px" : "18px"}}
  .tag b{color:#00f0ff}
  .sub{color:#9fc7d6;font-size:${small ? "12.5px" : "22px"};font-weight:500}
  .chips{display:flex;gap:${small ? "6px" : "12px"};margin-top:${small ? "12px" : "26px"};flex-wrap:wrap}
  .chip{border:1px solid rgba(0,240,255,.4);border-radius:999px;
        padding:${small ? "4px 9px" : "8px 18px"};font-size:${small ? "11px" : "18px"};
        color:#9df0ff;background:rgba(0,240,255,.06)}
  .free{position:absolute;top:${small ? "18px" : "34px"};right:${small ? "20px" : "44px"};z-index:3;
        border:1px solid rgba(157,255,61,.5);color:#9dff3d;border-radius:6px;
        padding:${small ? "3px 8px" : "6px 14px"};font:700 ${small ? "11px" : "18px"} "JetBrains Mono",monospace;
        background:rgba(157,255,61,.07)}
  </style></head><body>
  <div class="tile">
    <div class="glow g1"></div><div class="glow g2"></div>
    <div class="free">FREE</div>
    <div class="inner">
      <div class="brand"><span class="logo">◢◤</span><span class="name">RiceLayer</span></div>
      <div class="tag">Rice any website<br><b>without breaking it.</b></div>
      <div class="sub">CSS-only themes from a prompt or preset · functionality preserved</div>
      ${
        small
          ? ""
          : `<div class="chips"><span class="chip">Cyberpunk Neon</span><span class="chip">Hacker Terminal</span><span class="chip">Dark Academia</span><span class="chip">Glass SaaS</span><span class="chip">High Contrast Rescue</span></div>`
      }
    </div>
  </div></body></html>`;
}

/* ----------------------------------------------------------------------------
 * 4. Render helpers
 * ------------------------------------------------------------------------- */
async function applyThemeInFrame(frame, css) {
  await frame.evaluate(
    ([themeCss]) => {
      document.documentElement.classList.add("ricelayer-active");
      let s = document.getElementById("ricelayer-theme-style");
      if (!s) {
        s = document.createElement("style");
        s.id = "ricelayer-theme-style";
        document.documentElement.appendChild(s);
      }
      s.textContent = themeCss;
    },
    [css]
  );
}
async function clearThemeInFrame(frame) {
  await frame.evaluate(() => {
    document.documentElement.classList.remove("ricelayer-active");
    const s = document.getElementById("ricelayer-theme-style");
    if (s) s.textContent = "";
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const presets = await loadPresets();
  const byId = Object.fromEntries(presets.map((p) => [p.id, p]));
  const browser = await chromium.launch();

  /* ---------- A. Standalone screenshots (no video context) ---------- */
  const page = await browser.newPage({ viewport: { width: W, height: H } });

  // Popup closeup screenshot (transparent → on dark canvas via screenshot of body)
  const popupOnly = await browser.newPage({
    viewport: { width: 360, height: 720 },
    deviceScaleFactor: 2,
  });
  await popupOnly.setContent(
    popupHtml(presets, {
      hostname: "acme.console.app",
      prompt: "green hacker terminal",
      message: "Hacker Terminal applied. Functionality preserved.",
      safety: DEMO_SAFETY,
    })
  );
  await popupOnly.waitForTimeout(300);
  const popupBuf = await popupOnly
    .locator(".rl-root")
    .screenshot({ path: resolve(shotsDir, "popup-closeup.png") });
  await popupOnly.close();

  // Full themed-page screenshots for a few flagship presets (1280x800)
  const flagship = [
    ["cyberpunk-neon", "Cyberpunk Neon"],
    ["hacker-terminal", "Hacker Terminal"],
    ["dark-academia", "Dark Academia"],
    ["glass-saas", "Glass SaaS"],
    ["high-contrast-rescue", "High Contrast Rescue"],
  ];
  for (const [id] of flagship) {
    await page.setContent(demoPage);
    await applyThemeInFrame(page.mainFrame(), byId[id].css);
    await page.waitForTimeout(250);
    await page.screenshot({ path: resolve(shotsDir, `themed-${id}.png`) });
  }

  // "Before" (plain) full-page
  await page.setContent(demoPage);
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(shotsDir, "before-plain.png") });

  /* ---------- B. Composite hero shots (page + popup + caption) ---------- */
  async function heroShot(themeId, caption, file) {
    const stage = await browser.newPage({ viewport: { width: W, height: H } });
    await stage.setContent(
      stageHtml(
        popupHtml(presets, {
          hostname: "acme.console.app",
          prompt: caption.prompt,
          message: caption.msg,
          safety: DEMO_SAFETY,
        })
      )
    );
    await stage.evaluate((html) => {
      document.getElementById("frame").srcdoc = html;
    }, demoPage);
    // Wait until the iframe has actually parsed the demo markup.
    await stage.waitForFunction(() => {
      const d = document.getElementById("frame").contentDocument;
      return d && d.querySelector("header .logo");
    });
    await stage.waitForTimeout(250);
    if (themeId) {
      await stage.evaluate((css) => {
        const doc = document.getElementById("frame").contentDocument;
        doc.documentElement.classList.add("ricelayer-active");
        const s = doc.createElement("style");
        s.textContent = css;
        doc.documentElement.appendChild(s);
      }, byId[themeId].css);
    }
    await stage.evaluate((cap) => {
      document.getElementById("popup").classList.add("show");
      document.getElementById("brandtag").style.opacity = "1";
      document.getElementById("cap").innerHTML = cap;
    }, caption.banner);
    await stage.waitForTimeout(500);
    await stage.screenshot({ path: resolve(shotsDir, file) });
    await stage.close();
  }

  await heroShot(
    "cyberpunk-neon",
    {
      prompt: "make this cyberpunk",
      msg: "Cyberpunk Neon applied. Functionality preserved.",
      banner: 'Type a vibe. <b>Rice any website</b> — without breaking it.',
    },
    "hero-cyberpunk.png"
  );
  await heroShot(
    "hacker-terminal",
    {
      prompt: "green hacker terminal",
      msg: "Hacker Terminal applied. Functionality preserved.",
      banner: 'Presets or AI prompts — <b>CSS only</b>, buttons still work.',
    },
    "hero-hacker.png"
  );

  await page.close();
  await popupOnly?.close?.().catch(() => {});

  /* ---------- C. Promo video (Playwright native recording) ---------- */
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: promoDir, size: { width: W, height: H } },
  });
  const vp = await ctx.newPage();
  await vp.setContent(
    stageHtml(
      popupHtml(presets, {
        hostname: "acme.console.app",
        prompt: "",
        message: null,
        safety: DEMO_SAFETY,
      })
    )
  );
  await vp.evaluate((html) => {
    document.getElementById("frame").srcdoc = html;
  }, demoPage);
  await vp.waitForFunction(() => {
    const d = document.getElementById("frame").contentDocument;
    return d && d.querySelector("header .logo");
  });
  await vp.waitForTimeout(700);

  const setCap = (html) =>
    vp.evaluate((h) => (document.getElementById("cap").innerHTML = h), html);
  const moveCursor = (x, y) =>
    vp.evaluate(
      ([x, y]) => {
        const c = document.getElementById("cursor");
        c.style.left = x + "px";
        c.style.top = y + "px";
      },
      [x, y]
    );
  const setPrompt = (t) =>
    vp.evaluate(
      (t) => (document.querySelector("#popup .rl-chatinput").value = t),
      t
    );
  const setMsg = (t) =>
    vp.evaluate((t) => {
      const m = document.querySelector("#popup .rl-message");
      if (m) m.textContent = t;
    }, t);
  const applyVid = (id) =>
    vp.evaluate(
      ([css, on]) => {
        const doc = document.getElementById("frame").contentDocument;
        if (!on) {
          doc.documentElement.classList.remove("ricelayer-active");
          const ex = doc.getElementById("ricelayer-theme-style");
          if (ex) ex.textContent = "";
          return;
        }
        doc.documentElement.classList.add("ricelayer-active");
        let s = doc.getElementById("ricelayer-theme-style");
        if (!s) {
          s = doc.createElement("style");
          s.id = "ricelayer-theme-style";
          doc.documentElement.appendChild(s);
        }
        s.textContent = css;
      },
      [id ? byId[id].css : "", !!id]
    );

  // --- scene 1: title over plain page ---
  await vp.evaluate(() => (document.getElementById("brandtag").style.opacity = "1"));
  await setCap("<b>RiceLayer</b> — rice any website without breaking it.");
  await sleep(1900);

  // --- scene 2: open popup ---
  await moveCursor(1180, 40);
  await sleep(500);
  await vp.evaluate(() => document.getElementById("popup").classList.add("show"));
  await setCap("One click on the tab you choose. Nothing runs in the background.");
  await sleep(1900);

  // --- scene 3: type a prompt ---
  await moveCursor(1040, 150);
  await setCap("Describe the interface you want…");
  const typed = "make this cyberpunk";
  for (let i = 1; i <= typed.length; i++) {
    await setPrompt(typed.slice(0, i));
    await vp.evaluate(
      (n) => (document.querySelector("#popup .rl-charcount").textContent = n + "/50"),
      i
    );
    await sleep(45);
  }
  await sleep(700);

  // --- scene 4: apply cyberpunk ---
  await moveCursor(1100, 305);
  await sleep(350);
  await applyVid("cyberpunk-neon");
  await setMsg("Cyberpunk Neon applied. Functionality preserved.");
  await setCap("<b>CSS-only theme</b> applied — every button, link and form still works.");
  await sleep(2100);

  // --- scene 5: cycle presets ---
  const tour = [
    ["hacker-terminal", "green hacker terminal", "Hacker Terminal"],
    ["dark-academia", "make this dark academia", "Dark Academia"],
    ["glass-saas", "polished glassy saas", "Glass SaaS"],
    ["high-contrast-rescue", "make this readable", "High Contrast Rescue"],
  ];
  await moveCursor(1090, 540);
  for (const [id, prompt, name] of tour) {
    await setPrompt(prompt);
    await applyVid(id);
    await setMsg(name + " applied. Functionality preserved.");
    await setCap(`Same page, new vibe — <b>${name}</b>.`);
    await sleep(1600);
  }

  // --- scene 6: safety / reset ---
  await applyVid("cyberpunk-neon");
  await setCap("A safety check rolls back anything that would break the page.");
  await sleep(1700);
  await moveCursor(1095, 700);
  await sleep(350);
  await applyVid(null);
  await setMsg("Reset. Original page restored.");
  await setCap("One-click reset. Your data is never read. <b>Free for everyone.</b>");
  await sleep(2100);

  // --- scene 7: closing card ---
  await setCap("<b>RiceLayer</b> — change how a site looks, never how it works.");
  await sleep(1900);

  const videoHandle = vp.video();
  await vp.close();
  await ctx.close(); // finalizes the webm
  const rawVideoPath = videoHandle ? await videoHandle.path() : null;

  /* ---------- D. Store icon + promo tiles ---------- */
  // 128x128 store icon, rendered at 512 then downscaled in the flatten pass.
  const iconPage = await browser.newPage({
    viewport: { width: 512, height: 512 },
  });
  await iconPage.setContent(iconHtml());
  await iconPage.waitForTimeout(150);
  await iconPage.screenshot({ path: resolve(tilesDir, "_store-icon-512.png") });
  await iconPage.close();

  // 440x280 small promo tile
  const smallPage = await browser.newPage({
    viewport: { width: 440, height: 280 },
    deviceScaleFactor: 2,
  });
  await smallPage.setContent(tileHtml("small"));
  await smallPage.waitForTimeout(150);
  await smallPage.screenshot({ path: resolve(tilesDir, "_small-promo-880.png") });
  await smallPage.close();

  // 1400x560 marquee promo tile
  const marqueePage = await browser.newPage({
    viewport: { width: 1400, height: 560 },
  });
  await marqueePage.setContent(tileHtml("marquee"));
  await marqueePage.waitForTimeout(150);
  await marqueePage.screenshot({
    path: resolve(tilesDir, "_marquee-promo-1400.png"),
  });
  await marqueePage.close();

  await browser.close();

  /* ---------- E. ffmpeg post-process: no-alpha PNGs + mp4 ---------- */
  postProcess(rawVideoPath);

  console.log("Marketing assets written to ./marketing");
}

/**
 * Chrome Web Store requires "24-bit PNG (no alpha)" and links a YouTube video.
 * Flatten every PNG onto an opaque background (drops the alpha channel) and
 * resize the oversized icon/tiles to their exact canvas sizes. Also transcode
 * the recorded webm to a widely-compatible mp4 (h264/yuv420p).
 */
function postProcess(rawVideoPath) {
  const ff = (args) =>
    execFileSync(ffmpegPath, ["-y", "-loglevel", "error", ...args], {
      stdio: "inherit",
    });

  // 1) Flatten all listing screenshots in place (24-bit RGB, no alpha).
  for (const f of readdirSync(shotsDir).filter((f) => f.endsWith(".png"))) {
    const p = resolve(shotsDir, f);
    ff(["-i", p, "-pix_fmt", "rgb24", "-frames:v", "1", p + ".tmp.png"]);
    rmSync(p);
    execFileSync("mv", [p + ".tmp.png", p]);
  }

  // 2) Icon + tiles: scale to exact size, flatten over solid bg, drop alpha.
  const tileJobs = [
    ["_store-icon-512.png", "store-icon-128.png", 128, 128],
    ["_small-promo-880.png", "small-promo-tile-440x280.png", 440, 280],
    ["_marquee-promo-1400.png", "marquee-promo-tile-1400x560.png", 1400, 560],
  ];
  for (const [src, dst, w, h] of tileJobs) {
    const s = resolve(tilesDir, src);
    const d = resolve(tilesDir, dst);
    ff([
      "-i",
      s,
      "-vf",
      `scale=${w}:${h}:flags=lanczos,format=rgb24`,
      "-frames:v",
      "1",
      d,
    ]);
    rmSync(s);
  }

  // 3) Transcode the promo webm -> mp4, and keep a clean-named webm copy.
  if (rawVideoPath) {
    const webmOut = resolve(promoDir, "ricelayer-promo.webm");
    const mp4Out = resolve(promoDir, "ricelayer-promo.mp4");
    execFileSync("cp", [rawVideoPath, webmOut]);
    rmSync(rawVideoPath, { force: true });
    ff([
      "-i",
      webmOut,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-crf",
      "20",
      "-movflags",
      "+faststart",
      "-an",
      mp4Out,
    ]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
