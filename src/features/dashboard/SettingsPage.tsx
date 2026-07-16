"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Lock, Bell, Shield, Globe, type LucideIcon } from "lucide-react";

import type { Profile } from "@/generated/prisma/client";
import { ProfileTab } from "./components/settings/ProfileTab";
import { SecurityTab } from "./components/settings/SecurityTab";
import { NotificationsTab } from "./components/settings/NotificationsTab";
import { PrivacyTab } from "./components/settings/PrivacyTab";
import { PreferencesTab } from "./components/settings/PreferencesTab";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type SettingsTab = "profile" | "security" | "notifications" | "privacy" | "preferences";

const TABS: { id: SettingsTab; icon: LucideIcon }[] = [
  { id: "profile", icon: User },
  { id: "security", icon: Lock },
  { id: "notifications", icon: Bell },
  { id: "privacy", icon: Shield },
  { id: "preferences", icon: Globe },
];

type SettingsPageProps = {
  profile: Profile;
};

export function SettingsPage({ profile }: SettingsPageProps) {
  const { t } = useTranslation("dashboardSettings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

 return (
  <main className="min-h-full bg-[#f8fafc] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
    <div className="flex min-w-0 flex-col gap-5">
      {/* Page heading */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-[20px] font-semibold leading-8 text-[#0d2138]"
          style={poppins}
        >
          {t("pageTitle")}
        </h1>

        <p
          className="text-[14px] leading-5 text-[#6a7282]"
          style={mont}
        >
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Settings layout */}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
        {/* Settings navigation */}
        <nav
          role="tablist"
          aria-label={t("navAria")}
          className="
            flex w-full min-w-0 gap-2 overflow-x-auto
            rounded-[14px] border border-[#e5e7eb]
            bg-white p-3
            shadow-[0_1px_2px_rgba(15,23,42,0.02)]

            sm:grid sm:grid-cols-2 sm:overflow-visible
            md:grid-cols-3

            lg:sticky lg:top-5 lg:flex
            lg:w-[274px] lg:shrink-0
            lg:flex-col lg:gap-1.5
            lg:p-3
          "
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`settings-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex h-11 min-w-[145px] shrink-0
                  items-center justify-center gap-3
                  whitespace-nowrap rounded-[11px]
                  border px-4 text-[14px]
                  transition-all duration-200

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#1e4f86]/25

                  sm:min-w-0 sm:w-full
                  lg:h-[52px] lg:justify-start

                  ${
                    isActive
                      ? "border-[#b9cde5] bg-[#eff6ff] font-semibold text-[#1e4f86]"
                      : "border-transparent bg-white font-medium text-[#6a7282] hover:bg-[#f8fafc] hover:text-[#0d2138]"
                  }
                `}
                style={mont}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.1 : 1.8}
                  className="shrink-0"
                />

                <span>{t(`tabs.${tab.id}`)}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings content */}
        <section
          id={`settings-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`settings-tab-${activeTab}`}
          className="
            min-w-0 flex-1
            rounded-[14px]
            border border-[#e5e7eb]
            bg-white
            p-4
            shadow-[0_1px_2px_rgba(15,23,42,0.02)]
            sm:p-5
            md:p-6
            lg:px-7
            lg:py-7
          "
        >
          <div className="min-w-0">
            {activeTab === "profile" && (
              <ProfileTab profile={profile} />
            )}

            {activeTab === "security" && (
              <SecurityTab profile={profile} />
            )}

            {activeTab === "notifications" && (
              <NotificationsTab profile={profile} />
            )}

            {activeTab === "privacy" && <PrivacyTab />}

            {activeTab === "preferences" && (
              <PreferencesTab profile={profile} />
            )}
          </div>
        </section>
      </div>
    </div>
  </main>
);
}
