"use client";

import { useState } from "react";
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

const TABS: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Globe },
];

type SettingsPageProps = {
  profile: Profile;
};

export function SettingsPage({ profile }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Settings</h1>
        <p className="text-[14px] text-[#6a7282]" style={mont}>Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3.5">
        <nav className="bg-white border border-[#e5e7eb] rounded-[12px] p-3 flex flex-row lg:flex-col flex-wrap gap-1 lg:w-[242px] lg:shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 h-[45px] px-4 rounded-[10px] text-[14px] transition-colors ${
                  isActive
                    ? "bg-[#eff6ff] border border-[#b9c8d9] text-[#1e4f86] font-medium"
                    : "border border-transparent text-[#6a7282] hover:bg-[#f8fafc]"
                }`}
                style={mont}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 bg-white border border-[#e5e5e5] rounded-[12px] p-6">
          {activeTab === "profile" && <ProfileTab profile={profile} />}
          {activeTab === "security" && <SecurityTab profile={profile} />}
          {activeTab === "notifications" && <NotificationsTab profile={profile} />}
          {activeTab === "privacy" && <PrivacyTab />}
          {activeTab === "preferences" && <PreferencesTab profile={profile} />}
        </div>
      </div>
    </div>
  );
}
