import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiLanguage = "es" | "en";
export type ThemePreference = "light" | "dark" | "system";
export type TableDensity = "comfortable" | "compact";

type UserPreferenceState = {
  language: UiLanguage;
  theme: ThemePreference;
  tableDensity: TableDensity;

  setLanguage: (language: UiLanguage) => void;
  setTheme: (theme: ThemePreference) => void;
  setTableDensity: (density: TableDensity) => void;
};

/**
 * Temporary client UI preferences only.
 *
 * If a preference must persist long-term per user, save it to the database
 * through an API mutation and hydrate this store from backend data.
 */
export const useUserPreferenceStore = create<UserPreferenceState>()(
  persist(
    (set) => ({
      language: "es",
      theme: "system",
      tableDensity: "comfortable",

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setTableDensity: (tableDensity) => set({ tableDensity }),
    }),
    {
      name: "ulrich-ui-preferences",
    }
  )
);
