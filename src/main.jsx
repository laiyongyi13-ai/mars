import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../css/style.css";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
