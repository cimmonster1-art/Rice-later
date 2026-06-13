import type { ReactNode } from "react";

export function Landing() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Rice any website without breaking it.</h1>
        <p className="sub">
          Tell RiceLayer to make a page cyberpunk, readable, dark academic,
          terminal, or whatever aesthetic you want. It safely injects CSS,
          preserves functionality, and remembers your preferences per site.
        </p>
        <div className="cta-row">
          <a className="btn primary" href="#/pricing">Get RiceLayer</a>
          <a className="btn ghost" href="#install">Install unpacked dev build</a>
        </div>
        <p className="micro">Chrome Web Store: coming soon · Load unpacked today.</p>
      </section>

      <section className="features">
        <Feature title="Prompt-to-rice demo" icon="⌨">
          Type “make this a green hacker terminal” and watch the page restyle —
          buttons, forms, and links keep working.
        </Feature>
        <Feature title="Function-safe styling engine" icon="🛡">
          Every theme is validated before/after: if it would hide a button or
          break scrolling, RiceLayer rolls it back automatically.
        </Feature>
        <Feature title="CSS-only trust architecture" icon="🔒">
          The AI returns strict JSON containing CSS only. No JavaScript is ever
          generated or injected. The backend and extension both sanitize it.
        </Feature>
        <Feature title="Saved per-site preferences" icon="💾">
          Themes are domain-scoped. Re-apply automatically on the sites you
          choose, leave everything else untouched.
        </Feature>
        <Feature title="Rescue mode for readability" icon="👁">
          High Contrast Rescue and Low-Stimulation Study Mode make hostile
          interfaces usable.
        </Feature>
        <Feature title="Preset gallery" icon="🎨">
          Cyberpunk Neon, Hacker Terminal, NASA Mission Control, Dark Academia,
          Glass SaaS, Brutalist Mono, and more — no AI required.
        </Feature>
      </section>

      <section className="beforeafter">
        <h2>Before / After</h2>
        <div className="cards">
          <div className="ba-card before">
            <div className="ba-label">before</div>
            <div className="mock-site plain">
              <div className="mock-nav" />
              <div className="mock-row" />
              <div className="mock-row short" />
              <button className="mock-btn">Sign in</button>
            </div>
          </div>
          <div className="ba-card after">
            <div className="ba-label">after · cyberpunk neon</div>
            <div className="mock-site neon">
              <div className="mock-nav" />
              <div className="mock-row" />
              <div className="mock-row short" />
              <button className="mock-btn neon">Sign in</button>
            </div>
          </div>
        </div>
        <p className="micro">Same buttons. Same links. Same logins. New look.</p>
      </section>

      <section id="install" className="install">
        <h2>Install the dev build</h2>
        <ol>
          <li><code>npm install &amp;&amp; npm run build:extension</code></li>
          <li>Open <code>chrome://extensions</code> and enable Developer mode.</li>
          <li>Click “Load unpacked” and select <code>dist/extension</code>.</li>
          <li>Open any site, click the RiceLayer icon, pick a preset.</li>
        </ol>
      </section>

      <section className="faq">
        <h2>Privacy-first FAQ</h2>
        <FAQ q="Does RiceLayer read my passwords or form values?">
          No. It never reads input values, passwords, or payment fields. It only
          inspects page structure (counts, roles, colors) locally.
        </FAQ>
        <FAQ q="What gets sent to the AI?">
          Only a minimized structural summary, the hostname, and your prompt —
          never full HTML or page content.
        </FAQ>
        <FAQ q="Can it break a website?">
          A safety validator checks the page before and after. If function would
          be lost, the theme is rolled back automatically.
        </FAQ>
        <FAQ q="Can I undo it?">
          One-click reset, anytime. Themes only apply on sites you choose.
        </FAQ>
      </section>
    </main>
  );
}

function Feature({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="faq-item">
      <summary>{q}</summary>
      <p>{children}</p>
    </details>
  );
}
