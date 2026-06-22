export function Privacy() {
  return (
    <main className="page legal">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: 2026-06-22</p>

      <p>
        RiceLayer is built privacy-first. Our core promise is that we change how
        a website <em>looks</em>, never how it works, and never by reading your
        private data.
      </p>

      <h2>What RiceLayer does NOT do</h2>
      <ul>
        <li>RiceLayer does not read passwords.</li>
        <li>RiceLayer does not read form input values.</li>
        <li>RiceLayer does not read payment field values.</li>
        <li>RiceLayer does not collect or sell browsing data.</li>
        <li>RiceLayer does not capture full page text or private messages.</li>
      </ul>

      <h2>What RiceLayer analyzes</h2>
      <p>
        Page structure is analyzed locally in your browser: element counts,
        detected roles (nav, card, form…), the existing color palette, a
        typography summary, and layout density.
      </p>

      <h2>What is sent for AI theme generation</h2>
      <p>When you request an AI-generated theme, RiceLayer sends only:</p>
      <ul>
        <li>A minimized structural summary (counts, roles, colors, typography, density)</li>
        <li>The site hostname</li>
        <li>Safety flags (whether password/payment/sensitive forms exist)</li>
        <li>Your natural-language prompt</li>
      </ul>
      <p>
        We never send full HTML, page content, or any field values. The AI
        provider returns CSS only. The backend reads its API key from the server
        environment; the key is never exposed to the browser.
      </p>

      <h2>Storage</h2>
      <p>
        Saved themes are stored locally and scoped per domain. You control which
        sites are active and can delete any saved theme at any time.
      </p>

      <h2>Your controls</h2>
      <ul>
        <li>CSS-only transformations.</li>
        <li>One-click reset on every page.</li>
        <li>Per-site enable/disable.</li>
        <li>Sensitive pages (banking/login/health) are protected by default.</li>
      </ul>

      <h2>Third-party services</h2>
      <p>
        AI themes are generated via Google's Gemini API, which receives the
        value-free structural summary and your prompt and returns CSS only. Your
        use of that feature is subject to Google's Privacy Policy. We use no
        analytics, advertising, or tracking third parties.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your data:{" "}
        <a href="mailto:cimmonster1@gmail.com">cimmonster1@gmail.com</a>.
      </p>
    </main>
  );
}
