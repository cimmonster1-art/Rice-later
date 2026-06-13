/**
 * Local, AI-free preset themes.
 *
 * Each preset is pure CSS, designed to restyle arbitrary sites while
 * preserving function: no display:none on functional elements, no global
 * pointer-events:none, no full-screen overlays, reduced-motion guards.
 *
 * Themes lean on CSS variables plus broad-but-safe element styling. They use
 * `!important` deliberately to win specificity battles against site CSS, while
 * never hiding interactive controls.
 */

export interface Preset {
  id: string;
  name: string;
  description: string;
  css: string;
}

/** Shared reduced-motion guard appended to every preset. */
const REDUCED_MOTION = `
@media (prefers-reduced-motion: reduce) {
  html.ricelayer-active *,
  html.ricelayer-active *::before,
  html.ricelayer-active *::after {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}`;

/** Common safe base applied by most presets via CSS variables. */
function base(vars: string, extra = ""): string {
  return `
html.ricelayer-active {
${vars}
}
html.ricelayer-active body {
  background: var(--rl-bg) !important;
  color: var(--rl-fg) !important;
  font-family: var(--rl-font-body) !important;
}
html.ricelayer-active h1,
html.ricelayer-active h2,
html.ricelayer-active h3,
html.ricelayer-active h4,
html.ricelayer-active h5,
html.ricelayer-active h6 {
  color: var(--rl-heading) !important;
  font-family: var(--rl-font-head) !important;
}
html.ricelayer-active a {
  color: var(--rl-link) !important;
}
html.ricelayer-active a:hover {
  color: var(--rl-link-hover) !important;
}
html.ricelayer-active button,
html.ricelayer-active [role="button"],
html.ricelayer-active input[type="button"],
html.ricelayer-active input[type="submit"] {
  background: var(--rl-btn-bg) !important;
  color: var(--rl-btn-fg) !important;
  border: var(--rl-btn-border) !important;
  border-radius: var(--rl-radius) !important;
  transition: filter 0.15s ease, box-shadow 0.15s ease;
}
html.ricelayer-active button:hover,
html.ricelayer-active [role="button"]:hover {
  filter: brightness(1.12);
  box-shadow: var(--rl-glow);
}
html.ricelayer-active input,
html.ricelayer-active textarea,
html.ricelayer-active select {
  background: var(--rl-field-bg) !important;
  color: var(--rl-fg) !important;
  border: var(--rl-field-border) !important;
  border-radius: var(--rl-radius) !important;
}
html.ricelayer-active [data-ricelayer-role="card"],
html.ricelayer-active .card,
html.ricelayer-active article {
  background: var(--rl-card-bg) !important;
  border: var(--rl-card-border) !important;
  border-radius: var(--rl-radius) !important;
}
html.ricelayer-active nav,
html.ricelayer-active [role="navigation"],
html.ricelayer-active header {
  background: var(--rl-nav-bg) !important;
  border-color: var(--rl-accent) !important;
}
html.ricelayer-active table {
  border-color: var(--rl-accent) !important;
}
html.ricelayer-active th,
html.ricelayer-active td {
  border: 1px solid var(--rl-card-border) !important;
}
${extra}
${REDUCED_MOTION}`;
}

export const PRESETS: Preset[] = [
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    description: "Deep graphite with neon cyan/magenta accents and soft glow.",
    css: base(
      `  --rl-bg: #0a0c12;
  --rl-fg: #d6f7ff;
  --rl-heading: #00f0ff;
  --rl-link: #ff3df0;
  --rl-link-hover: #ff9bf6;
  --rl-accent: #00f0ff;
  --rl-btn-bg: linear-gradient(135deg,#10131c,#161b2b);
  --rl-btn-fg: #00f0ff;
  --rl-btn-border: 1px solid #00f0ff;
  --rl-field-bg: #0d1018;
  --rl-field-border: 1px solid #2a3550;
  --rl-card-bg: rgba(16,20,32,0.85);
  --rl-card-border: 1px solid #1d2740;
  --rl-nav-bg: #070910;
  --rl-radius: 4px;
  --rl-font-body: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --rl-font-head: "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  --rl-glow: 0 0 12px rgba(0,240,255,0.45);`,
      `html.ricelayer-active body { background-image:
        linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px) !important;
        background-size: 28px 28px !important; }`
    ),
  },
  {
    id: "hacker-terminal",
    name: "Hacker Terminal",
    description: "Black background, phosphor-green monospace, terminal vibes.",
    css: base(
      `  --rl-bg: #000600;
  --rl-fg: #33ff66;
  --rl-heading: #66ff99;
  --rl-link: #00ff7f;
  --rl-link-hover: #b6ffcf;
  --rl-accent: #00ff7f;
  --rl-btn-bg: #021a08;
  --rl-btn-fg: #66ff99;
  --rl-btn-border: 1px solid #00ff7f;
  --rl-field-bg: #001203;
  --rl-field-border: 1px solid #0a5a25;
  --rl-card-bg: #010a03;
  --rl-card-border: 1px solid #0c5e2a;
  --rl-nav-bg: #000600;
  --rl-radius: 2px;
  --rl-font-body: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
  --rl-font-head: "JetBrains Mono", Menlo, Consolas, monospace;
  --rl-glow: 0 0 8px rgba(0,255,127,0.5);`,
      `html.ricelayer-active * { text-shadow: 0 0 1px rgba(51,255,102,0.25); }`
    ),
  },
  {
    id: "nasa-mission-control",
    name: "NASA Mission Control",
    description: "Dark console blues, amber data accents, dense-grid friendly.",
    css: base(
      `  --rl-bg: #06090f;
  --rl-fg: #c3d4e8;
  --rl-heading: #ffb347;
  --rl-link: #4ea3ff;
  --rl-link-hover: #9cc8ff;
  --rl-accent: #1e3a5f;
  --rl-btn-bg: #0e1828;
  --rl-btn-fg: #ffb347;
  --rl-btn-border: 1px solid #2a4a72;
  --rl-field-bg: #0a121e;
  --rl-field-border: 1px solid #20344f;
  --rl-card-bg: #0a1320;
  --rl-card-border: 1px solid #1c2f49;
  --rl-nav-bg: #050810;
  --rl-radius: 3px;
  --rl-font-body: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --rl-font-head: "IBM Plex Mono", ui-monospace, monospace;
  --rl-glow: 0 0 10px rgba(255,179,71,0.35);`
    ),
  },
  {
    id: "dark-academia",
    name: "Dark Academia",
    description: "Warm parchment-on-charcoal, serif headings, library mood.",
    css: base(
      `  --rl-bg: #1c1813;
  --rl-fg: #e8ddc7;
  --rl-heading: #d4b483;
  --rl-link: #c08552;
  --rl-link-hover: #e0b07a;
  --rl-accent: #5c4a32;
  --rl-btn-bg: #2a231a;
  --rl-btn-fg: #e8ddc7;
  --rl-btn-border: 1px solid #6b5640;
  --rl-field-bg: #241e16;
  --rl-field-border: 1px solid #4a3c2a;
  --rl-card-bg: #221d15;
  --rl-card-border: 1px solid #3d3122;
  --rl-nav-bg: #15110c;
  --rl-radius: 3px;
  --rl-font-body: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --rl-font-head: "Playfair Display", Georgia, serif;
  --rl-glow: 0 0 6px rgba(212,180,131,0.3);`
    ),
  },
  {
    id: "glass-saas",
    name: "Glass SaaS",
    description: "Polished glassmorphism: frosted cards, soft blur, indigo accents.",
    css: base(
      `  --rl-bg: linear-gradient(160deg,#0f1226,#1a1f3a 60%,#10142b);
  --rl-fg: #e7ecff;
  --rl-heading: #ffffff;
  --rl-link: #8aa6ff;
  --rl-link-hover: #b9c8ff;
  --rl-accent: #6d7cff;
  --rl-btn-bg: linear-gradient(135deg,#5b6cff,#7d5bff);
  --rl-btn-fg: #ffffff;
  --rl-btn-border: 1px solid rgba(255,255,255,0.18);
  --rl-field-bg: rgba(255,255,255,0.06);
  --rl-field-border: 1px solid rgba(255,255,255,0.14);
  --rl-card-bg: rgba(255,255,255,0.07);
  --rl-card-border: 1px solid rgba(255,255,255,0.14);
  --rl-nav-bg: rgba(15,18,38,0.6);
  --rl-radius: 14px;
  --rl-font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --rl-font-head: "Inter", ui-sans-serif, system-ui, sans-serif;
  --rl-glow: 0 8px 32px rgba(109,124,255,0.35);`,
      `html.ricelayer-active [data-ricelayer-role="card"],
       html.ricelayer-active .card,
       html.ricelayer-active nav,
       html.ricelayer-active header {
         backdrop-filter: blur(12px) saturate(1.2) !important;
         box-shadow: var(--rl-glow) !important;
       }`
    ),
  },
  {
    id: "brutalist-mono",
    name: "Brutalist Mono",
    description: "Stark white, hard black borders, monospace, zero gloss.",
    css: base(
      `  --rl-bg: #f4f4f0;
  --rl-fg: #111111;
  --rl-heading: #000000;
  --rl-link: #0000ee;
  --rl-link-hover: #6a0dad;
  --rl-accent: #000000;
  --rl-btn-bg: #ffffff;
  --rl-btn-fg: #000000;
  --rl-btn-border: 2px solid #000000;
  --rl-field-bg: #ffffff;
  --rl-field-border: 2px solid #000000;
  --rl-card-bg: #ffffff;
  --rl-card-border: 2px solid #000000;
  --rl-nav-bg: #ffffff;
  --rl-radius: 0px;
  --rl-font-body: "Courier New", ui-monospace, monospace;
  --rl-font-head: "Courier New", ui-monospace, monospace;
  --rl-glow: 4px 4px 0 #000000;`,
      `html.ricelayer-active button,
       html.ricelayer-active [data-ricelayer-role="card"] {
         box-shadow: var(--rl-glow) !important;
       }`
    ),
  },
  {
    id: "low-stim-study",
    name: "Low-Stimulation Study Mode",
    description: "Muted, flat, low-contrast-noise palette for focus. Calms busy pages.",
    css: base(
      `  --rl-bg: #f3f1ea;
  --rl-fg: #3a3a38;
  --rl-heading: #2c2c2a;
  --rl-link: #4a6b8a;
  --rl-link-hover: #35506b;
  --rl-accent: #cfc9ba;
  --rl-btn-bg: #e7e3d8;
  --rl-btn-fg: #3a3a38;
  --rl-btn-border: 1px solid #cfc9ba;
  --rl-field-bg: #ffffff;
  --rl-field-border: 1px solid #d8d2c4;
  --rl-card-bg: #faf8f2;
  --rl-card-border: 1px solid #e2dccd;
  --rl-nav-bg: #eeebe2;
  --rl-radius: 6px;
  --rl-font-body: "Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif;
  --rl-font-head: "Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif;
  --rl-glow: none;`,
      `html.ricelayer-active * {
         animation: none !important;
         text-shadow: none !important;
       }
       html.ricelayer-active img,
       html.ricelayer-active video {
         filter: saturate(0.85) contrast(0.95);
       }`
    ),
  },
  {
    id: "high-contrast-rescue",
    name: "High Contrast Rescue",
    description: "Maximum legibility: black/white/yellow, large hit targets, clear focus.",
    css: base(
      `  --rl-bg: #000000;
  --rl-fg: #ffffff;
  --rl-heading: #ffff00;
  --rl-link: #66e0ff;
  --rl-link-hover: #ffff00;
  --rl-accent: #ffff00;
  --rl-btn-bg: #ffff00;
  --rl-btn-fg: #000000;
  --rl-btn-border: 2px solid #ffffff;
  --rl-field-bg: #000000;
  --rl-field-border: 2px solid #ffff00;
  --rl-card-bg: #0a0a0a;
  --rl-card-border: 2px solid #ffffff;
  --rl-nav-bg: #000000;
  --rl-radius: 4px;
  --rl-font-body: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --rl-font-head: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --rl-glow: none;`,
      `html.ricelayer-active *:focus,
       html.ricelayer-active *:focus-visible {
         outline: 3px solid #ffff00 !important;
         outline-offset: 2px !important;
       }
       html.ricelayer-active a { text-decoration: underline !important; }
       html.ricelayer-active button,
       html.ricelayer-active [role="button"] {
         min-height: 40px !important;
       }`
    ),
  },
];

/** Lookup a preset by id. */
export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** A safe, always-available fallback theme (Cyberpunk Neon). */
export const FALLBACK_PRESET_ID = "cyberpunk-neon";
