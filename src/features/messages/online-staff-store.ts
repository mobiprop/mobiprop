import { useSyncExternalStore } from "react";

/**
 * Module-level external store for "which staff Profile ids are currently
 * online" — populated by StaffPresenceRealtime, read by useIsStaffOnline.
 * No Context/Provider needed: this mirrors how NotificationRealtime is a
 * side-effect-only component with TanStack Query's cache as the "store";
 * here the store is this tiny module instead, since presence isn't
 * server-cacheable data.
 */
type Listener = () => void;

let onlineIds = new Set<string>();
const listeners = new Set<Listener>();
const emptySet = new Set<string>();

export const onlineStaffStore = {
  setOnlineIds(next: Set<string>) {
    onlineIds = next;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return onlineIds;
  },
};

export function useOnlineStaff(): Set<string> {
  return useSyncExternalStore(onlineStaffStore.subscribe, onlineStaffStore.getSnapshot, () => emptySet);
}

export function useIsStaffOnline(profileId: string | null | undefined): boolean {
  const online = useOnlineStaff();
  return !!profileId && online.has(profileId);
}
