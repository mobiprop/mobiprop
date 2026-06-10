"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Toggle } from "./Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const VISIBILITY_OPTIONS = ["Everyone", "Team Only", "Private"];

export function PrivacyTab() {
  // UI-only for now; wire to a privacy-preferences endpoint when one exists.
  const [visibility, setVisibility] = useState(VISIBILITY_OPTIONS[0]);
  const [dataSharing, setDataSharing] = useState(true);
  const [activityTracking, setActivityTracking] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Privacy Settings</p>

      <div className="flex flex-col gap-4">
        <div className="border border-[#d1d5dc] rounded-[10px] h-[73px] flex items-center justify-between px-4">
          <div className="flex flex-col">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Profile Visibility</p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>Control who can see your profile</p>
          </div>
          <div className="relative">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-9 w-[110px] pl-3 pr-8 bg-white border border-[#d1d5dc] rounded-[10px] text-[12px] text-[#0a0a0a] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
              style={mont}
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>

        <div className="border border-[#d1d5dc] rounded-[10px] h-[73px] flex items-center justify-between px-4">
          <div className="flex flex-col">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Data Sharing</p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>Share analytics data to improve service</p>
          </div>
          <Toggle checked={dataSharing} onChange={setDataSharing} />
        </div>

        <div className="border border-[#d1d5dc] rounded-[10px] h-[73px] flex items-center justify-between px-4">
          <div className="flex flex-col">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Activity Tracking</p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>Allow tracking for personalization</p>
          </div>
          <Toggle checked={activityTracking} onChange={setActivityTracking} />
        </div>
      </div>

      <div className="bg-[#ffe2e2] rounded-[10px] p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium text-[#9f0712]" style={mont}>Delete Account</p>
          <p className="text-[12px] text-[#9f0712]" style={mont}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <button
          type="button"
          className="self-start h-9 px-4 bg-[#e7000b] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#c5000a] transition-colors"
          style={mont}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
