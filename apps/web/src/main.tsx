import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Landing } from "./Landing";
import { Pricing } from "./Pricing";
import { Privacy } from "./Privacy";
import { Terms } from "./Terms";
import "./styles.css";

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function App() {
  const hash = useHashRoute();
  let page = <Landing />;
  if (hash.startsWith("#/pricing")) page = <Pricing />;
  else if (hash.startsWith("#/privacy")) page = <Privacy />;
  else if (hash.startsWith("#/terms")) page = <Terms />;

  return (
    <>
      <nav className="site-nav">
        <a href="#/" className="brand">◢◤ RiceLayer</a>
        <div className="links">
          <a href="#/pricing">Pricing</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
        </div>
      </nav>
      {page}
      <footer className="site-footer">
        <span>RiceLayer · Rice any website without breaking it.</span>
        <span className="muted">CSS-only · Privacy-first · © {new Date().getFullYear()}</span>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
