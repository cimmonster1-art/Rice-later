# RiceLayer

**Rice any website without breaking it.**

RiceLayer is "ricing for web interfaces." Click the extension, type a
natural-language command — *"make this cyberpunk,"* *"turn this into a green
hacker terminal,"* *"make this ugly university portal readable"* — and the
current page is restyled with **CSS only**, while every button, link, form,
login, cart, and workflow keeps working.

> Core promise: change how a site **looks**, never how it **works**, and never
> by reading your private data.

---

## What RiceLayer is (and isn't)

- ✅ A Manifest V3 Chrome extension that injects **sanitized, CSS-only** themes.
- ✅ A function-safety engine that validates the page before/after and **rolls
  back automatically** if a theme would break it.
- ✅ A privacy-first backend that talks to **Google Gemini** for AI themes and
  returns **strict JSON** (CSS only — no JavaScript, ever).
- ✅ Per-site saved preferences and presets that work with no AI.
- ✅ **Fully free** — no paid plan, no subscription, no account. AI generation
  is bounded by a **hard $20 Gemini spend cap** on the server; once reached, the
  backend serves a built-in safe theme instead.
- ❌ Not a website builder, not a page rebuilder, not a scraper. It never
  generates or injects JavaScript and never reads form/password/payment values.

---

## Architecture

```
┌─────────────────────────────── Browser ───────────────────────────────┐
│                                                                        │
│  Popup (React)        Content script (per page)                        │
│  ─ prompt box         ─ domAnalyzer    → value-free structural summary │
│  ─ preset chips       ─ themeInjector  → one <style> tag, CSS only     │
│  ─ safety status      ─ safetyValidator→ before/after, auto-rollback   │
│  ─ before/after       ─ mutationWatcher→ re-apply on SPA navigations   │
│        │                      ▲                                        │
│        ▼                      │                                        │
│  Service worker (background) ─┘  (activeTab + scripting, no <all_urls>) │
│        │  fetch (only the backend host is permitted)                   │
└────────┼───────────────────────────────────────────────────────────────┘
         ▼
┌──────────────── Backend (Node + Express, TypeScript) ──────────────────┐
│  POST /api/generate-theme                                              │
│   1 rate limit  2 promptBuilder (privacy-preserving)  3 budget guard   │
│   4 Gemini (strict JSON)  5 zod validate  6 cssSanitizer  7 return     │
│  GEMINI_API_KEY is read ONLY here, from process.env — never in browser │
│  Hard $20 Gemini spend cap (geminiBudget.ts) → safe fallback when hit  │
└────────────────────────────────────────────────────────────────────────┘
```

CSS is sanitized **three times**: backend → service worker → content-script
injector. Defense in depth.

---

## Repo layout

```
apps/
  extension/    MV3 extension (React popup/options, content + background)
    src/
      popup/ options/ background/ content/ shared/
  server/       Express API, Gemini provider, budget cap, sanitizer
    src/
      routes/ services/ schemas/ middleware/
  web/          Landing + Pricing + Privacy + Terms (Vite/React)
scripts/        package-extension.mjs, smoke-test.mjs
tests/          cross-cutting security tests
```

---

## Privacy model

RiceLayer analyzes page **structure** locally and sends a **minimized summary**
to the backend only when you ask for an AI theme. It sends:

- hostname, page-category guess, element counts, detected roles
- existing color palette, typography summary, layout density
- safety flags (`hasPasswordFields` / `hasPaymentFields` / `hasSensitiveForms`)
- your prompt

It **never** sends full HTML, page text, or any field value. It never reads
passwords, inputs, payment fields, or private messages. See `apps/web/src/Privacy.tsx`.

---

## Permission model

- Required: `activeTab`, `scripting`, `storage` — that's it.
- `host_permissions`: only the backend host. This is **generated at build time**
  from `VITE_API_URL` (default `http://localhost:8787/*`; in production it
  becomes your deployed API origin, e.g. `https://api.ricelayer.app/*`). It is
  never permanently pinned to localhost.
- `optional_host_permissions`: `http://*/*`, `https://*/*` — requested **per
  origin, only** when you choose "always apply on this site."
- No `<all_urls>` in required permissions. The content script is injected after
  user activation, not on every page automatically.

---

## Dev setup

Requirements: Node ≥ 18.18.

```bash
npm install
cp .env.example .env        # fill in keys locally (optional for mock mode)
```

Run everything you need:

```bash
npm run dev:server          # backend on http://localhost:8787
npm run dev:web             # landing site on http://localhost:3000
npm run dev:extension       # vite dev server for popup/options UI
```

### Gemini API key (real AI themes)

1. Create a Gemini API key at https://aistudio.google.com/app/apikey
2. Put it in your local `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. **Never commit `.env`.** It is git-ignored; only `.env.example` (empty) is committed.
4. Restart the backend.
5. Flow: the **extension calls the backend, the backend calls Gemini, and the
   extension never sees the key.**

If `GEMINI_API_KEY` is missing, the server prints a startup warning and uses the
**mock provider** (a good cyberpunk theme) so development never blocks.

### Hard $20 Gemini spend cap (fully free, sustainable)

RiceLayer is free for everyone. Real Gemini usage is bounded by a **hard dollar
cap** (`apps/server/src/services/geminiBudget.ts`):

- Default and **maximum** is `$20` (`GEMINI_BUDGET_USD`; any larger value is
  clamped down to the `$20` hard cap).
- Spend is **estimated** from token usage reported by the API, priced via
  `GEMINI_PRICE_INPUT_PER_MTOK` / `GEMINI_PRICE_OUTPUT_PER_MTOK`.
- Once the cap is reached the server **stops calling Gemini** and serves the
  built-in safe fallback theme. Users are never charged and the product keeps
  working. `GET /api/health` reports the live `geminiBudget` status.
- The running total is per-process and resets on restart; back it with a shared
  store (Redis/DB) for multi-instance deployments.

### Backend base URL for the extension (`VITE_API_URL`)

The extension's backend URL is injected at **build time** from `VITE_API_URL`
and is also used to generate the manifest's required host permission:

```bash
# Local development (default — no config needed): http://localhost:8787
npm run build:extension

# Production: point the build at your deployed API BEFORE packaging
VITE_API_URL=https://api.ricelayer.app npm run release:extension
```

---

## Build & package

```bash
npm run build               # builds extension, server, web -> dist/
npm run build:extension     # -> dist/extension  (load this unpacked)
npm run package:extension   # -> dist/ricelayer-extension.zip (Web Store upload)
npm run test                # vitest (77 tests)
npm run smoke               # builds + safety/permission/sanitizer checks + zip
npm run release:extension   # lint + build + test + smoke + package (fails loud)
```

### Load the extension in Chrome

1. `npm run build:extension`
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select `dist/extension`.
4. Open any website, click the RiceLayer icon, choose **Cyberpunk Neon**.
5. The page restyles; buttons/forms still work; the safety panel reports a pass.
6. Tick **Save for this site**, reload — the theme re-applies automatically.

---

## How to test on a real website

1. Start the backend (`npm run dev:server`) — needed only for AI prompts.
2. Build + load the extension (above).
3. Visit e.g. a docs site or dashboard.
4. Try a preset, then a prompt like *"make this dark academia."*
5. Watch the **Safety** panel: if a theme would hide buttons or break scroll,
   it is rolled back and the reason is shown.
6. Use **Show original** to compare before/after; **Reset** to remove entirely.

---

## Pricing — free, forever

RiceLayer is **completely free**. There is no paid plan, no subscription, and no
account. Every feature — all presets, unlimited AI prompt-to-theme, unlimited
saved sites, per-site auto-apply, the function-safety validator — is available
to everyone.

To keep that sustainable, AI generation is bounded by the **hard $20 Gemini
spend cap** described above. When the cap is reached the backend serves built-in
safe themes instead of calling Gemini.

---

## Chrome Web Store packaging

This produces the exact ZIP you upload to the Chrome Web Store.

### Exact commands

```bash
# 1. Set the production backend URL (baked into the build + manifest host perms)
export VITE_API_URL=https://api.your-domain.com

# 2. Run the full release gate (lint → build → test → smoke → package)
npm run release:extension
```

`release:extension` fails loudly if TypeScript, tests, smoke checks, or
packaging fail — nothing is hidden.

### Exact output

```
dist/ricelayer-extension.zip
```

This is the file you upload to the Web Store. The unpacked build (for local
testing) is at `dist/extension/`.

### Checklist before upload

- [ ] **Set production `VITE_API_URL`** — `export VITE_API_URL=https://api.your-domain.com`
      (otherwise the build defaults to `http://localhost:8787` and won't work in production).
- [ ] **Update/generate production manifest host permissions** — these are
      generated automatically from `VITE_API_URL` at build time; confirm
      `dist/extension/manifest.json` → `host_permissions` shows your API origin
      (e.g. `https://api.your-domain.com/*`), not localhost.
- [ ] **Replace placeholder icons** in `apps/extension/icons/` with real
      16/48/128 PNGs (the build generates a cyan placeholder if any are missing).
- [ ] **Bump `version`** in `apps/extension/manifest.json`.
- [ ] **Run the release script** — `npm run release:extension` (must pass green).
- [ ] **Upload `dist/ricelayer-extension.zip`** to the Web Store developer console.
- [ ] **Provide a privacy policy URL** — host `apps/web` (the `#/privacy` route)
      and link it in the listing.
- [ ] **Explain permissions in the store listing** — justify `activeTab`
      (act only on the tab you click), `scripting` (inject the CSS-only theme
      after activation), `storage` (save your per-site preferences). Note that
      broad host access is **optional** and requested per-site only.

### What the store reviewer will see (all enforced by `npm run smoke`)

- Manifest V3, minimal required permissions, **no `<all_urls>`**.
- No remote scripts, no `eval`, no AI-generated JavaScript.
- All logic ships inside the package (no remote code execution).
- AI output is strict JSON / CSS only, sanitized before injection.

---

## Local testing before upload

Before packaging, verify the build in a real browser:

1. **Build the extension:** `npm run build:extension` → output in `dist/extension/`.
2. **Load unpacked:** open `chrome://extensions`, enable **Developer mode**,
   click **Load unpacked**, and select `dist/extension`.
3. **Test a preset theme on a normal website:** open e.g. a docs site or news
   article, click the RiceLayer icon, pick **Cyberpunk Neon**. The page restyles
   and the Safety panel reports a pass; buttons and links still work.
4. **Test an AI theme with the backend running:** start `npm run dev:server`,
   then type a prompt like *"make this dark academia"* and apply. (With no
   `GEMINI_API_KEY` the mock provider returns a safe theme — useful offline.)
5. **Test rollback with unsafe CSS:** the safest way to simulate a dangerous
   theme is the automated test `apps/extension/src/content/themeInjector.test.ts`
   (`npm run test`), which feeds `pointer-events:none` / broad `display:none`
   through the injector and asserts they are stripped and the page is rolled
   back. You can also watch the Safety panel flip to **BLOCKED** on a hostile
   site — RiceLayer removes the theme and shows the reason.
6. **Test save-for-site and reload behavior:** tick **Save for this site**, apply
   a theme, then reload the page — the saved theme re-applies automatically.
   Manage or remove saved sites from the extension's **Options** page.

---

## Known limitations

- Some sites use **Shadow DOM or iframes** that may not be fully restyled.
- Some highly dynamic apps may need **re-application after navigation** (handled
  by the mutation watcher, but edge cases exist).
- **Sensitive pages** (banking/login/checkout/health) are protected/denied by
  default.
- RiceLayer changes **presentation, not site logic**.
- **AI themes are CSS-only** and may need minor user adjustment.

---

## Roadmap

- Shadow DOM piercing for component-heavy apps.
- Generated-CSS editor with live diffing.
- Cloud sync of saved themes (Supabase seam already in the storage abstraction).
- Community preset gallery + import/export.
- Per-element targeted ricing.

---

## Security notes

- The Gemini key is read only by the backend from `process.env.GEMINI_API_KEY`;
  it is never hardcoded, logged, returned to clients, or placed in extension code.
- `.env` is git-ignored; `.env.example` ships with empty values only.
- The AI is constrained to **strict JSON / CSS only** and the output is
  sanitized server-side and twice more on the extension side.
- No AI-generated JavaScript is ever injected.
