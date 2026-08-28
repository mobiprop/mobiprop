"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { SaveWebsiteTeamInput, WebsiteTeamMemberDto } from "@/features/agents/agent-actions";

export function useSaveWebsiteTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (members: SaveWebsiteTeamInput[]): Promise<{ members: WebsiteTeamMemberDto[] }> => {
      const res = await fetch("/api/dashboard/agents/website-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "SAVE_FAILED");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.websiteTeam() }),
  });
}
