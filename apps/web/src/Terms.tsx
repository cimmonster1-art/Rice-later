export function Terms() {
  return (
    <main className="page legal">
      <h1>Terms of Service</h1>
      <p className="muted">Last updated: 2026-06-13</p>

      <p>
        By using RiceLayer you agree to these terms. RiceLayer is free and open
        source, and modifies the presentation of third-party websites in your
        own browser using CSS only. There is no account, subscription, or
        payment of any kind.
      </p>

      <h2>Third-party websites</h2>
      <p>
        RiceLayer is not affiliated with the websites you restyle and is not
        responsible for their behavior, content, or availability. RiceLayer
        changes presentation, not site logic.
      </p>

      <h2>Sensitive pages</h2>
      <p>
        You should disable RiceLayer on sensitive pages (banking, checkout,
        payment, medical, or login flows) if you have any concern. RiceLayer
        protects these pages by default but you remain in control.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>No illegal use.</li>
        <li>No use to deceive, impersonate, or defraud.</li>
        <li>No attempt to inject executable code via RiceLayer.</li>
      </ul>

      <h2>No guarantee</h2>
      <p>
        We do not guarantee that every website can be safely or fully restyled.
        Some sites use Shadow DOM, iframes, or highly dynamic rendering that may
        limit results. AI-generated themes are CSS-only and may need manual
        adjustment.
      </p>

      <h2>Disclaimer of warranty</h2>
      <p>
        RiceLayer is provided “as is” without warranties of any kind. To the
        maximum extent permitted by law, we are not liable for any damages
        arising from use of the extension.
      </p>
    </main>
  );
}
