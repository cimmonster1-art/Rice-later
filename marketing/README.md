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
| `tiles/store-icon-128.png` | 128×128 store icon |
| `tiles/small-promo-tile-440x280.png` | 440×280 small promo tile |
| `tiles/marquee-promo-tile-1400x560.png` | 1400×560 marquee promo tile |
| `screenshots/hero-cyberpunk.png` | 1280×800 lead image: page + popup + tagline |
| `screenshots/hero-hacker.png` | 1280×800 second composition |
| `screenshots/themed-*.png` | 1280×800 full themed pages, one per flagship preset |
| `screenshots/before-plain.png` | 1280×800 unstyled "before" page |
| `screenshots/popup-closeup.png` | High-res popup UI on its own |
| `promo/ricelayer-promo.mp4` | ~22s promo (H.264/yuv420p) — upload to YouTube, link in listing |
| `promo/ricelayer-promo.webm` | Same promo, webm source |

All PNGs are flattened to **24-bit RGB (no alpha)** to satisfy the store's
"24-bit PNG (no alpha)" requirement.

## Requirements to regenerate

- `playwright` + Chromium (`npx playwright install chromium`)
- `esbuild` (already a dependency)
- `ffmpeg-static` (already a dependency) — flattens PNGs to no-alpha and
  transcodes the promo webm to mp4. No system ffmpeg needed.

## Notes

- Chrome Web Store screenshots must be 1280×800 or 640×400 PNG/JPEG. These are
  1280×800 PNG.
- The store links a **YouTube** promo video (it does not host an uploaded file).
  Upload `ricelayer-promo.webm` to YouTube and paste the watch URL into the
  listing. YouTube accepts `.webm`.
