"use client";

import { useEffect } from "react";

// After a deploy, a browser tab left open from before the deploy is still
// running the OLD build's JS in memory. A client-side navigation in that tab
// tries to fetch that old build's chunk/manifest files, which no longer exist
// on the server (this app only ships the current build's `_next/static/<id>/`
// assets) — surfacing as a 404 instead of the page the user clicked.
//
// This detects that specific failure signature and forces exactly one full
// reload, which fetches fresh HTML/JS for the current build and self-heals
// the tab. A sessionStorage flag prevents a reload loop if reloading doesn't
// actually fix it (e.g. a real network outage).
const STALE_BUILD_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\d\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /_buildManifest/i,
];

const RELOAD_FLAG = "__stale_build_reload_attempted";

const isStaleBuildFailure = (message: unknown): boolean => {
  const text = typeof message === "string" ? message : String(message ?? "");
  return STALE_BUILD_PATTERNS.some((pattern) => pattern.test(text));
};

const recoverFromStaleBuild = () => {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — reload once anyway.
  }
  window.location.reload();
};

export const StaleBuildRecovery = () => {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isStaleBuildFailure(event.message) || isStaleBuildFailure(event.error?.message)) {
        recoverFromStaleBuild();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : reason;
      if (isStaleBuildFailure(message)) {
        recoverFromStaleBuild();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
};
