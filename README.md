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
- ✅ Per-site saved preferences, presets that work with no AI, and a Pro tier.
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
│   1 entitlement  2 rate limit  3 promptBuilder (privacy-preserving)    │
│   4 Gemini (strict JSON)  5 zod validate  6 cssSanitizer  7 return     │
│  GEMINI_API_KEY is read ONLY here, from process.env — never in browser │
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
  server/       Express API, Gemini provider, Stripe scaffold, sanitizer
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
- `host_permissions`: only the backend host (e.g. `http://localhost:8787/*`).
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

---

## Build & package

```bash
npm run build               # builds extension, server, web -> dist/
npm run build:extension     # -> dist/extension  (load this unpacked)
npm run package:extension   # -> dist/ricelayer-extension.zip (Web Store upload)
npm run test                # vitest (48 tests)
npm run smoke               # builds + safety/permission/sanitizer checks + zip
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

## Free vs Pro

| | Free | Pro — **$2.99/mo** |
|---|---|---|
| Local presets | ✅ all 8 | ✅ |
| Saved websites | 1 | unlimited |
| AI prompt-to-theme | 1 trial | unlimited |
| Per-site auto-apply | — | ✅ |
| Generated CSS editor | — | ✅ |
| Theme import/export | — | ✅ |
| Accessibility / rescue modes | basic | ✅ |
| Sync-ready storage | — | ✅ |

Billing is a Stripe scaffold (`/api/billing/*`) gated behind
`STRIPE_SECRET_KEY`. Entitlement lives in `services/entitlement.ts` with a clean
seam for a DB; `DEV_FORCE_TIER=pro` unlocks Pro locally without Stripe.

---

## Chrome Web Store release checklist

- [ ] Replace placeholder icons in `apps/extension/icons/` with real 16/48/128 PNGs.
- [ ] Set the production backend URL (`VITE_API_URL`) and update
      `host_permissions` to the deployed API origin.
- [ ] Bump `version` in `apps/extension/manifest.json`.
- [ ] `npm run smoke` must pass (minimal permissions, no `<all_urls>`, no eval,
      no remote scripts, sanitizer catches unsafe CSS).
- [ ] `npm run package:extension` → upload `dist/ricelayer-extension.zip`.
- [ ] Provide a privacy policy URL (host `apps/web`) and justify each permission
      (activeTab/scripting/storage) in the store listing.
- [ ] Confirm no remote code execution; all logic ships in the package.

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
- Generated-CSS editor with live diffing (Pro).
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
