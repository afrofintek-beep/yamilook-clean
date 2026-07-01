import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import App from "./App.tsx";
import "./index.css";


// Prevent the service worker from interfering when the app is embedded in an iframe (e.g. dev previews)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();

if (isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Deploy-safe recovery for occasional chunk load failures.
function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;
  const KEY = "__yamilook_chunk_reload_count__";
  const MAX_RELOADS = 2;

  const reloadLimited = (reason: string) => {
    try {
      const current = Number(window.sessionStorage.getItem(KEY) ?? "0") || 0;
      if (current >= MAX_RELOADS) return;
      window.sessionStorage.setItem(KEY, String(current + 1));

      const url = new URL(window.location.href);
      url.searchParams.set("__cr", String(Date.now()));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  };

  window.addEventListener(
    "error",
    (event) => {
      const target = (event as unknown as { target?: any }).target;
      const src: string | undefined = target?.src || target?.href;

      if (!src) {
        const message = (event as unknown as ErrorEvent).message ?? "";
        if (
          message.includes("Invalid hook call") ||
          message.includes("dispatcher.useEffect") ||
          message.includes("Importing a module script failed") ||
          message.includes("Failed to fetch dynamically imported module")
        ) {
          reloadLimited(`runtime_error:${message}`);
        }
        return;
      }

      if (
        src.includes("/assets/") ||
        src.includes("/node_modules/.vite/") ||
        src.endsWith(".js") ||
        src.endsWith(".mjs")
      ) {
        reloadLimited(`script_error:${src}`);
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    const reason: any = (event as PromiseRejectionEvent).reason;
    const message =
      typeof reason?.message === "string"
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "";

    if (
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("Loading chunk") ||
      message.includes("chunk-") ||
      message.includes(".vite/deps/") ||
      message.includes("import.meta") ||
      // Safari-specific
      (message.includes("Load failed") && (reason?.stack ?? "").includes("import"))
    ) {
      event.preventDefault();
      reloadLimited(`dynamic_import:${message}`);
    }
  });
}

installChunkLoadRecovery();

// Render immediately for instant first paint
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
