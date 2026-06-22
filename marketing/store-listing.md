# RiceLayer — Chrome Web Store listing & review answers

Everything you need to paste into the Chrome Web Store developer dashboard to
clear review. Copy each block into the field named in **bold**. Nothing here is
"broken" — this is the standard CWS review asking you to justify permissions and
finish the listing.

> Assets to upload live next to this file:
> - `screenshots/` — 1280×800 PNGs (the store accepts 1280×800 or 640×400)
> - `promo/ricelayer-promo.webm` — upload to YouTube, then paste the YouTube URL
>   into the listing's **Promotional video** field (the store links a YouTube
>   video; it does not host an uploaded file)

---

## Where each item goes in the dashboard

| Dashboard location | What to paste |
| --- | --- |
| **Store listing → Description** | Long description (below) |
| **Store listing → Single purpose** | Single purpose description |
| **Store listing → Screenshots** | PNGs from `screenshots/` (see picks below) |
| **Store listing → Promotional video** | YouTube URL of `promo/ricelayer-promo.webm` |
| **Store listing → Category** | Productivity (or Developer Tools) |
| **Privacy → Single purpose** | Single purpose description |
| **Privacy → Permission justification (activeTab / scripting / storage)** | The matching justification block |
| **Privacy → Host permission justification** | Host permission justification |
| **Privacy → Remote code** | Choose **"No, I am not using remote code"** + paste the remote-code block |
| **Privacy → Data usage** | Tick the disclosures in "Data usage" below, then certify |
| **Account → Settings → Contact email** | `cimmonster1@gmail.com`, then click the verification email |
| **Store listing → Privacy policy URL** | Your hosted `apps/web` `#/privacy` route |

---

## Single purpose description

```
RiceLayer lets users restyle the currently active webpage with safe CSS-only
themes generated from a short text prompt or selected preset, while preserving
the page's existing functionality.
```

## activeTab justification

```
RiceLayer uses activeTab so the extension can act only on the tab the user
explicitly clicks the extension on. It is required to analyze the current page
structure and apply the selected CSS-only theme to that active page. RiceLayer
does not run automatically across all browsing activity.
```

## scripting justification

```
RiceLayer uses scripting to inject its content script and CSS-only theme layer
into the active tab after the user activates the extension. This is necessary to
visually restyle the current webpage. The extension does not inject remote
JavaScript or change website functionality.
```

## storage justification

```
RiceLayer uses storage to save user preferences, selected presets, per-site
theme settings, and whether a theme should automatically reapply on a specific
site. This data is stored so users do not need to reconfigure the same site
every time.
```

## Host permission justification

```
RiceLayer uses host permissions only to communicate with its backend API for AI
theme generation and, when the user chooses to save a theme for a site, to
reapply that theme on that specific origin. Broad host access is optional and
requested per-site only. RiceLayer does not read page text, form values,
passwords, payment information, or private messages.
```

## Remote code use justification

Answer the "Are you using remote code?" question as **No** (RiceLayer ships all
executable logic inside the package; it only fetches CSS *data*). Paste this as
the explanation:

```
RiceLayer does not load or execute remote JavaScript, remote WebAssembly, or
remote executable code. The extension contacts a backend API only to receive
strict JSON containing CSS theme data. That CSS is sanitized before injection
and is used only to change page appearance. All extension logic ships inside the
extension package.
```

## Data usage certification

In **Privacy → Data usage**, disclose only what RiceLayer actually sends and
certify the three checkboxes (no selling, no unrelated use, no creditworthiness
use). RiceLayer transmits a **minimized, value-free** page summary to its own
backend solely to generate a theme:

```
When (and only when) the user requests an AI theme, RiceLayer sends a minimized,
value-free summary of the current page to its backend: hostname, a page-category
guess, element counts, detected structural roles, an existing color/typography/
layout summary, safety flags (whether password/payment/sensitive forms are
present), and the user's short prompt. RiceLayer does NOT send full HTML, page
text, form values, passwords, payment information, or private messages. Stored
data (preferences, presets, per-site settings) stays in the browser via
chrome.storage. No data is sold or used for advertising, creditworthiness, or
any purpose unrelated to restyling the page.
```

Suggested category selections to tick: **"Website content"** is *not* sent in
full — only the structural summary above. If the form forces a category, the
closest accurate one is "Website content" limited to the structural metadata
described, with the explicit note that no field values or page text are
transmitted.

---

## Long description (Store listing → Description)

```
Rice any website without breaking it.

RiceLayer is "ricing for web interfaces." Click the extension, type a short
description — "make this cyberpunk," "green hacker terminal," "make this ugly
portal readable" — or pick a preset, and the current page is restyled with CSS
only. Every button, link, form, login, cart, and workflow keeps working.

Core promise: change how a site LOOKS, never how it WORKS — and never by reading
your private data.

WHAT YOU GET
• One-click presets: Cyberpunk Neon, Hacker Terminal, NASA Mission Control,
  Dark Academia, Glass SaaS, Brutalist Mono, Low-Stimulation Study Mode, and
  High Contrast Rescue.
• AI prompt-to-theme: describe a vibe in 50 characters and get a custom
  CSS-only theme.
• A function-safety engine that checks the page before and after and rolls the
  theme back automatically if it would hide a button or break scrolling.
• Per-site saved themes that re-apply on the sites you choose.
• One-click reset and a before/after toggle.

PRIVACY FIRST
RiceLayer analyzes page STRUCTURE locally and, only when you ask for an AI
theme, sends a minimized, value-free summary to its backend. It never sends full
HTML, page text, form values, passwords, or payment data. It never injects
JavaScript and never changes site logic.

FREE FOR EVERYONE
No account, no subscription. AI generation is bounded by a hard server-side
spend cap; when it's reached, RiceLayer serves built-in safe themes so the
product keeps working.
```

---

## Screenshots — which to upload (in order)

Upload from `marketing/screenshots/` (all 1280×800 unless noted):

1. `hero-cyberpunk.png` — page + popup + tagline (lead image)
2. `hero-hacker.png` — second composition, presets + CSS-only message
3. `themed-cyberpunk-neon.png` — full themed page
4. `themed-high-contrast-rescue.png` — shows the accessibility/legibility use case
5. `themed-glass-saas.png` — shows a polished, very different look

Extra options if you want to swap any: `themed-hacker-terminal.png`,
`themed-dark-academia.png`, `before-plain.png` (the "before"), and
`popup-closeup.png` (the UI by itself — high-res, transparent background).

---

## Promo video

`promo/ricelayer-promo.webm` is a ~30s screen recording walking through: opening
the popup, typing a prompt, applying Cyberpunk Neon, cycling presets, the safety
panel, and reset. Chrome Web Store links a **YouTube** video rather than hosting
a file, so:

1. Upload `ricelayer-promo.webm` to YouTube (Unlisted is fine). YouTube accepts
   `.webm` directly.
2. Paste the YouTube watch URL into **Store listing → Promotional video**.

---

## Contact email (the other thing review flagged)

1. Dashboard → **Account → Settings** (publisher) → **Contact email**.
2. Enter `cimmonster1@gmail.com`.
3. Click the verification link Google emails you. Review will not pass until this
   shows verified.

---

## Final pre-submit checklist

- [ ] Set production `VITE_API_URL` and run `npm run release:extension`, then
      upload `dist/ricelayer-extension.zip`.
- [ ] Confirm `dist/extension/manifest.json` host_permissions = your API origin,
      not localhost.
- [ ] Privacy policy URL points at your hosted `apps/web` `#/privacy`.
- [ ] All permission justifications pasted (activeTab, scripting, storage, host).
- [ ] Remote code = "No" + justification pasted.
- [ ] Data usage disclosed + 3 certifications ticked.
- [ ] 3–5 screenshots uploaded.
- [ ] Promo video uploaded to YouTube and linked.
- [ ] Contact email verified.
```
