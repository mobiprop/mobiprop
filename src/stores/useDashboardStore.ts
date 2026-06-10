import { create } from "zustand";

export type DashboardDateRange = "LAST_WEEK" | "60_DAYS" | "90_DAYS" | "CUSTOM";

type DashboardState = {
  isSidebarCollapsed: boolean;
  dateRange: DashboardDateRange;
  customDateRange: {
    from: string | null;
    to: string | null;
  };

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDateRange: (dateRange: DashboardDateRange) => void;
  setCustomDateRange: (from: string | null, to: string | null) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  isSidebarCollapsed: false,
  dateRange: "60_DAYS",
  customDateRange: {
    from: null,
    to: null,
  },

  toggleSidebar: () =>
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed,
    })),

  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),

  setDateRange: (dateRange) => set({ dateRange }),

  setCustomDateRange: (from, to) =>
    set({
      dateRange: "CUSTOM",
      customDateRange: { from, to },
    }),
}));
