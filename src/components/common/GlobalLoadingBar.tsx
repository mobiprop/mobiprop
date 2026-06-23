"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getSnapshot, patchFetchOnce, subscribe } from "@/lib/global-loading-store";

export function GlobalLoadingBar() {
  useEffect(() => {
    patchFetchOnce();
  }, []);

  const isLoading = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-300"
      style={{ opacity: isLoading ? 1 : 0 }}
    >
      <div
        className="h-full w-1/3 animate-global-loading-bar"
        style={{
          background: "linear-gradient(90deg, #0d2138, #1e4f86, #0d2138)",
        }}
      />
    </div>
  );
}
