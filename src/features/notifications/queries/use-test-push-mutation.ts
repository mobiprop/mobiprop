"use client";

import { useMutation } from "@tanstack/react-query";

export type TestPushResult = { sent: number; failed: number; skipped: number; lastError?: string };

async function sendTest(): Promise<TestPushResult> {
  const res = await fetch("/api/push/test", { method: "POST" });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "Failed to send test notification.");
  }
  return {
    sent: Number(body?.sent ?? 0),
    failed: Number(body?.failed ?? 0),
    skipped: Number(body?.skipped ?? 0),
    lastError: body?.lastError ?? undefined,
  };
}

/**
 * The test push is a pure browser-push connectivity check — it does NOT create
 * an in-app notification row, so there are no in-app caches to invalidate here.
 */
export function useTestPushMutation() {
  return useMutation({ mutationFn: sendTest });
}
