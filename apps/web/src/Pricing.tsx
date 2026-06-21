export function Pricing() {
  return (
    <main className="page">
      <section className="pricing">
        <h1>Free, forever</h1>
        <p className="sub">
          RiceLayer is completely free. No paid plan, no subscription, no
          account. Every feature is available to everyone.
        </p>
        <div className="plans">
          <div className="plan featured">
            <div className="ribbon">Free</div>
            <h2>Everything</h2>
            <div className="price">$0</div>
            <ul>
              <li>All local preset themes</li>
              <li>Unlimited AI prompt-to-theme</li>
              <li>Unlimited saved websites</li>
              <li>Per-site auto-apply</li>
              <li>Function-safety validator + auto-rollback</li>
              <li>Before/after compare and one-click reset</li>
            </ul>
            <a className="btn primary" href="#install">Load unpacked</a>
            <p className="micro">
              AI generation is free and bounded by a hard server-side usage cap.
              If the cap is reached, RiceLayer serves its built-in safe themes.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
