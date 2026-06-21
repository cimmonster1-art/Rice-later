import { useEffect, useMemo, useState, useCallback } from "react";
import { PRESETS, getPreset } from "../shared/presets";
import { APP_NAME } from "../shared/constants";
import { isSensitiveHost } from "../shared/permissions";
import type {
  RiceMessage,
  RiceResponse,
  PageStatus,
  ApplyThemeResponse,
  GenerateThemeResponse,
} from "../shared/messages";
import type { SafetyResult } from "../shared/themeSchema";
import { getState, setState } from "../shared/storage";

function send<T = unknown>(msg: RiceMessage): Promise<RiceResponse<T>> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (resp) =>
        resolve((resp as RiceResponse<T>) ?? { ok: false, error: "No response" })
      );
    } catch (e) {
      resolve({ ok: false, error: String(e) });
    }
  });
}

export default function Popup() {
  const [status, setStatus] = useState<PageStatus | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [safety, setSafety] = useState<SafetyResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [saveForSite, setSaveForSite] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(true);

  const hostname = status?.hostname ?? "—";
  const sensitive = useMemo(() => isSensitiveHost(hostname), [hostname]);

  const refresh = useCallback(async () => {
    const resp = await send<PageStatus>({ type: "GET_PAGE_STATUS" });
    if (resp.ok && resp.data) {
      setStatus(resp.data);
      setShowOriginal(resp.data.showingOriginal);
    }
    const state = await getState();
    setGlobalEnabled(state.globalEnabled);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleApplyResult = (data: ApplyThemeResponse, label: string) => {
    setSafety(data.safety);
    if (data.rolledBack) {
      setMessage(`⚠ ${label} rolled back: it would have broken the page.`);
    } else if (data.safety.severity === "warning") {
      setMessage(`${label} applied with warnings.`);
    } else {
      setMessage(`${label} applied. Functionality preserved.`);
    }
  };

  async function applyPreset(presetId: string, name: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const resp = await send<ApplyThemeResponse>({ type: "APPLY_PRESET", presetId });
    if (resp.ok && resp.data) {
      handleApplyResult(resp.data, name);
      if (saveForSite && !resp.data.rolledBack) {
        const preset = getPreset(presetId);
        await saveCurrent(name, presetId, preset?.css ?? "");
      }
    } else {
      setMessage(`Error: ${resp.error}`);
    }
    await refresh();
    setBusy(false);
  }

  async function generate() {
    if (busy || !prompt.trim()) return;
    setBusy(true);
    setMessage("Generating theme…");
    const resp = await send<GenerateThemeResponse>({
      type: "GENERATE_AND_APPLY_THEME",
      prompt: prompt.trim(),
    });
    if (resp.ok && resp.data) {
      handleApplyResult(resp.data, resp.data.result.themeName);
      if (resp.data.sanitizedRemovals.length) {
        setMessage(
          (m) => `${m ?? ""} (sanitizer removed: ${resp.data!.sanitizedRemovals.join(", ")})`
        );
      }
      if (saveForSite && !resp.data.rolledBack) {
        await saveCurrent(resp.data.result.themeName, undefined, resp.data.result.css, prompt);
      }
    } else {
      setMessage(`Error: ${resp.error}`);
    }
    await refresh();
    setBusy(false);
  }

  async function saveCurrent(
    themeName: string,
    _presetId?: string,
    css?: string,
    p?: string
  ) {
    // Presets are reconstructed from id on apply; for AI themes we pass css.
    const resp = await send({
      type: "SAVE_SITE_THEME",
      themeName,
      css: css ?? "",
      prompt: p,
    });
    if (!resp.ok) setMessage(`Save failed: ${resp.error}`);
  }

  async function reset() {
    setBusy(true);
    await send({ type: "REMOVE_THEME" });
    setSafety(null);
    setMessage("Reset. Original page restored.");
    await refresh();
    setBusy(false);
  }

  async function toggleBeforeAfter() {
    const next = !showOriginal;
    setShowOriginal(next);
    await send({ type: "TOGGLE_THEME", showOriginal: next });
  }

  async function toggleGlobal() {
    const next = !globalEnabled;
    setGlobalEnabled(next);
    const state = await getState();
    state.globalEnabled = next;
    await setState(state);
    if (!next) await reset();
  }

  return (
    <div className="rl-root">
      <header className="rl-header">
        <div className="rl-brand">
          <span className="rl-logo">◢◤</span>
          <span className="rl-name">{APP_NAME}</span>
        </div>
        <span className="rl-badge free" title="RiceLayer is free for everyone">
          FREE
        </span>
      </header>

      <div className="rl-domainbar">
        <span className="rl-mono">site</span>
        <span className="rl-domain">{hostname}</span>
        <label className="rl-switch" title="Enable RiceLayer globally">
          <input type="checkbox" checked={globalEnabled} onChange={toggleGlobal} />
          <span className="rl-slider" />
        </label>
      </div>

      {sensitive && (
        <div className="rl-warn">
          ⚠ Sensitive site detected (login/payment/health). RiceLayer is
          extra-cautious here — review before saving.
        </div>
      )}

      <div className="rl-prompt">
        <textarea
          placeholder='e.g. "make this a green hacker terminal"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
        />
        <button className="rl-primary" disabled={busy || !prompt.trim()} onClick={generate}>
          {busy ? "…" : "Rice this page"}
        </button>
      </div>

      <div className="rl-section-label rl-mono">presets</div>
      <div className="rl-chips">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className="rl-chip"
            disabled={busy}
            title={p.description}
            onClick={() => applyPreset(p.id, p.name)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="rl-options">
        <label>
          <input
            type="checkbox"
            checked={saveForSite}
            onChange={(e) => setSaveForSite(e.target.checked)}
          />
          Save for this site
        </label>
        <label>
          <input
            type="checkbox"
            checked={showOriginal}
            onChange={toggleBeforeAfter}
            disabled={!status?.themed}
          />
          Show original
        </label>
      </div>

      {safety && (
        <div className={`rl-safety ${safety.severity}`}>
          <div className="rl-safety-head">
            Safety: <strong>{safety.severity.toUpperCase()}</strong>
          </div>
          <ul>
            {safety.checks.map((c) => (
              <li key={c.id} className={c.passed ? "pass" : "fail"}>
                {c.passed ? "✓" : "✗"} {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <div className="rl-message">{message}</div>}

      <div className="rl-actions">
        <button className="rl-reset" onClick={reset} disabled={busy}>
          Reset
        </button>
      </div>

      <footer className="rl-trust rl-mono">
        CSS-only · No form values read · One-click reset
      </footer>
    </div>
  );
}
