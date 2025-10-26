import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ToastProvider } from "./components/ToastContext.jsx";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
        <ToastProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>
);

// Registrar el service worker PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        console.log("✅ Service worker registrado");
      })
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}
