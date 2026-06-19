import { queryKeys } from "@/lib/query-keys";

/**
 * Push-related query keys. Thin re-export over the central key factory so the
 * notifications feature has a local, discoverable entry point without forking
 * key definitions.
 */
export const pushKeys = {
  all: ["push"] as const,
  status: () => queryKeys.pushStatus(),
};
