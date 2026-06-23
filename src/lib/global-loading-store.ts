// Tracks in-flight browser `fetch` calls so a single global UI element (the
// top loading bar) can reflect "the app is talking to the server" for ANY
// request — TanStack Query, raw fetch, and Next.js Server Actions invoked
// directly from Client Components (those compile down to a fetch POST too).
"use client";

const listeners = new Set<() => void>();
let inFlight = 0;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): boolean {
  return inFlight > 0;
}

declare global {
  interface Window {
    __fetchPatchedForGlobalLoading?: boolean;
  }
}

// Wraps window.fetch exactly once. Safe to call from multiple component
// mounts/Fast Refresh — the flag on window survives remounts within the
// same page session.
export function patchFetchOnce(): void {
  if (typeof window === "undefined" || window.__fetchPatchedForGlobalLoading) return;
  window.__fetchPatchedForGlobalLoading = true;

  const originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    inFlight += 1;
    emit();
    try {
      return await originalFetch(...args);
    } finally {
      inFlight = Math.max(0, inFlight - 1);
      emit();
    }
  };
}
