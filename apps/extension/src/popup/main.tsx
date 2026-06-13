import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./Popup.css";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
