# Contributing to RiceLayer

Thanks for your interest in RiceLayer — a free, open-source browser utility for
ricing the web. RiceLayer is free for everyone, with no subscriptions, no
monetization, and no account required for local use. Contributions of all kinds
are welcome: bug reports, feature ideas, presets, docs, and code.

## Code of conduct

Be respectful and constructive. Assume good intent. Harassment of any kind is
not tolerated.

## Project layout

```
apps/
  extension/   MV3 extension (React popup/options, content + background)
  server/      Express API: Gemini provider, budget guard, CSS sanitizer
  web/         Landing + Privacy + Terms (Vite/React)
scripts/       package-extension.mjs, smoke-test.mjs
tests/         cross-cutting security tests
```

## Development setup

Requirements: Node ≥ 18.18.

```bash
npm install
cp .env.example .env        # optional; mock AI provider works with no key
npm run dev:server          # backend on http://localhost:8787
npm run dev:web             # landing site
npm run build:extension     # then load dist/extension unpacked in Chrome
```

## Before you open a pull request

```bash
npm run test     # unit + security tests must pass
npm run lint     # TypeScript project build
npm run smoke    # builds extension + safety/permission/sanitizer checks
```

Please:

- Keep modules small and single-purpose — **no god files**.
- Never weaken the safety model: CSS-only output, no injected JavaScript, no
  reading of form/password/payment values, minimal extension permissions.
- Never commit secrets. `.env` is git-ignored; only `.env.example` (with empty
  values) is committed.
- Add or update tests for behavior you change.
- Keep RiceLayer free: do not add billing, paywalls, account tiers, or
  feature-gating. Cost controls (the monthly AI budget cap) must bound spend
  only — never gate features.

## Reporting bugs and requesting features

Use the issue templates:

- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)

## Security

If you find a security or privacy issue (for example, a way to exfiltrate page
data or inject executable code), please report it privately to the maintainer
rather than opening a public issue.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
