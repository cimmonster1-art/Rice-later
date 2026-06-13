export function Pricing() {
  return (
    <main className="page">
      <section className="pricing">
        <h1>Simple pricing</h1>
        <div className="plans">
          <div className="plan">
            <h2>Free</h2>
            <div className="price">$0</div>
            <ul>
              <li>All local preset themes</li>
              <li>One saved website</li>
              <li>One AI theme trial</li>
              <li>Manual apply / reset</li>
              <li>Function-safety validator</li>
            </ul>
            <a className="btn ghost" href="#install">Load unpacked</a>
          </div>
          <div className="plan featured">
            <div className="ribbon">Most popular</div>
            <h2>Pro</h2>
            <div className="price">$2.99<span>/mo</span></div>
            <ul>
              <li>Unlimited AI prompt-to-theme</li>
              <li>Unlimited saved websites</li>
              <li>Per-site auto-apply</li>
              <li>Generated CSS editor</li>
              <li>Theme import / export</li>
              <li>Accessibility / rescue modes</li>
              <li>Sync-ready storage</li>
            </ul>
            <a className="btn primary" href="#/pricing">Upgrade to Pro</a>
            <p className="micro">Billed monthly. Cancel anytime via the billing portal.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
