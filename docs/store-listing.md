# RiceLayer — Chrome Web Store Listing

## Name

RiceLayer — Rice any website without breaking it

## Short description

Free, open-source utility that restyles any website with prompt-to-theme AI and
safe presets — CSS only, functionality preserved, privacy-first.

## Detailed description

RiceLayer is a free and open-source browser utility that gives you control over
the visual interfaces you use every day. Type a natural-language prompt — "make
this a green hacker terminal," "turn this into dark academia," "make this portal
readable" — and the current page is restyled with **CSS only**, while every
button, link, form, login, and workflow keeps working.

No subscriptions. No ads. No paywalls. No account required for local use.

## Features

- Unlimited AI-generated themes
- Unlimited saved websites
- Per-site auto-apply
- Theme editing / export
- Accessibility and rescue modes
- Function safety validation
- Before/after comparison
- Prompt-to-theme website ricing
- Local preset themes
- One-click reset
- Privacy-first structural analysis

Every feature is available to every user, for free.

## Privacy practices

**What RiceLayer analyzes:** page structure locally in your browser — element
counts, detected roles, the existing color palette, a typography summary, and
layout density. It never reads passwords, input values, payment fields, or full
page text.

**What is sent for AI theme generation:** only a minimized structural summary,
the site hostname, safety flags, and your prompt. Never full HTML, page content,
or any field value. The AI returns CSS only.

**Purpose:**

- Extension functionality
- Safe AI-generated theme creation
- Abuse prevention / rate limiting if the backend is used

## Permissions justification

- `activeTab` — apply themes to the page you are currently viewing, only after
  you click the extension.
- `scripting` — inject the content script that applies sanitized CSS on demand.
- `storage` — save your per-site themes and preferences locally.
- Optional host permissions are requested per origin only when you choose
  "always apply on this site." No `<all_urls>` is required.

## Cost and pricing

RiceLayer is free and open source (MIT). There is no paid tier. The hosted AI
backend is protected by a monthly budget cap to keep shared costs sustainable;
this bounds cost only and never gates features.
