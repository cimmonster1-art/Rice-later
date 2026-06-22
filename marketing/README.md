# RiceLayer marketing & store assets

Generated assets for the Chrome Web Store listing. Regenerate any time with:

```bash
npm run assets        # == node scripts/generate-store-assets.mjs
```

The generator renders the **real** extension UI and the **real** preset CSS
(from `apps/extension/src/shared/presets.ts` and `popup/Popup.css`) against a
realistic demo web app, so the marketing matches what ships.

## Contents

| Path | What it is |
| --- | --- |
| `store-listing.md` | All review answers + exactly where to paste each in the dashboard |
| `screenshots/hero-cyberpunk.png` | 1280×800 lead image: page + popup + tagline |
| `screenshots/hero-hacker.png` | 1280×800 second composition |
| `screenshots/themed-*.png` | 1280×800 full themed pages, one per flagship preset |
| `screenshots/before-plain.png` | 1280×800 unstyled "before" page |
| `screenshots/popup-closeup.png` | High-res popup UI on its own (transparent bg) |
| `promo/ricelayer-promo.webm` | ~30s promo screen-recording (upload to YouTube, link in listing) |

## Requirements to regenerate

- `playwright` + Chromium (`npx playwright install chromium`)
- `esbuild` (already a dependency)

No ffmpeg required — the video is recorded natively by Chromium via Playwright.

## Notes

- Chrome Web Store screenshots must be 1280×800 or 640×400 PNG/JPEG. These are
  1280×800 PNG.
- The store links a **YouTube** promo video (it does not host an uploaded file).
  Upload `ricelayer-promo.webm` to YouTube and paste the watch URL into the
  listing. YouTube accepts `.webm`.
