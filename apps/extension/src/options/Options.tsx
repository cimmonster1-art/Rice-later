import { useEffect, useState } from "react";
import { APP_NAME, TAGLINE } from "../shared/constants";
import {
  getState,
  setState,
  removeSiteTheme,
  setSiteEnabled,
  type RiceLayerState,
} from "../shared/storage";
import "../popup/Popup.css";

export default function Options() {
  const [state, setLocalState] = useState<RiceLayerState | null>(null);

  async function load() {
    setLocalState(await getState());
  }
  useEffect(() => {
    void load();
  }, []);

  async function update(mut: (s: RiceLayerState) => void) {
    const s = await getState();
    mut(s);
    await setState(s);
    setLocalState({ ...s });
  }

  if (!state) return <div className="rl-root">Loading…</div>;

  const sites = Object.entries(state.sites);

  return (
    <div className="rl-root" style={{ width: 560, maxWidth: "100%" }}>
      <header className="rl-header">
        <div className="rl-brand">
          <span className="rl-logo">◢◤</span>
          <span className="rl-name">{APP_NAME} — Options</span>
        </div>
        <span className="rl-badge free">FREE</span>
      </header>
      <p className="rl-mono" style={{ marginTop: 0 }}>{TAGLINE}</p>

      <h3 style={{ color: "var(--cyan)" }}>Preferences</h3>
      <div className="rl-options" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={state.preferences.reducedMotion}
            onChange={(e) => update((s) => (s.preferences.reducedMotion = e.target.checked))}
          />
          Prefer reduced motion in themes
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preferences.autoApplySavedThemes}
            onChange={(e) => update((s) => (s.preferences.autoApplySavedThemes = e.target.checked))}
          />
          Auto-apply saved themes on page load
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preferences.denySensitiveSites}
            onChange={(e) => update((s) => (s.preferences.denySensitiveSites = e.target.checked))}
          />
          Don&apos;t auto-apply on sensitive (banking/login/health) sites
        </label>
      </div>

      <h3 style={{ color: "var(--cyan)" }}>Saved sites ({sites.length})</h3>
      {sites.length === 0 && <p className="rl-mono">no saved sites yet</p>}
      {sites.map(([host, rec]) => (
        <div
          key={host}
          className="rl-domainbar"
          style={{ justifyContent: "space-between" }}
        >
          <span className="rl-domain" style={{ flex: 2 }}>{host}</span>
          <span className="rl-mono" style={{ flex: 1 }}>{rec.themeName}</span>
          <label className="rl-switch">
            <input
              type="checkbox"
              checked={rec.enabled}
              onChange={async (e) => {
                await setSiteEnabled(host, e.target.checked);
                await load();
              }}
            />
            <span className="rl-slider" />
          </label>
          <button
            className="rl-reset"
            style={{ flex: "0 0 auto", marginLeft: 8 }}
            onClick={async () => {
              await removeSiteTheme(host);
              await load();
            }}
          >
            Delete
          </button>
        </div>
      ))}

      <footer className="rl-trust rl-mono">
        CSS-only · No form values read · Domain-scoped storage
      </footer>
    </div>
  );
}
