"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Toggle } from "./Toggle";
import { SearchableSelect } from "../SearchableSelect";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

const VISIBILITY_OPTIONS = [
  "Everyone",
  "Team Only",
  "Private",
] as const;

type VisibilityOption =
  (typeof VISIBILITY_OPTIONS)[number];

const VISIBILITY_I18N_KEY: Record<VisibilityOption, string> = {
  Everyone: "everyone",
  "Team Only": "teamOnly",
  Private: "private",
};

export function PrivacyTab() {
  const { t } = useTranslation("dashboardSettings");
  const [visibility, setVisibility] =
    useState<VisibilityOption>("Everyone");

  const [dataSharing, setDataSharing] =
    useState(true);

  const [activityTracking, setActivityTracking] =
    useState(true);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2
          className="text-[14px] font-semibold leading-7 text-[#0d2138] sm:text-[16px]"
          style={mont}
        >
          {t("privacy.title")}
        </h2>

      </div>

      {/* Privacy options */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Profile visibility */}
        <section className="flex min-w-0 flex-col gap-4 rounded-[12px] border border-[#d1d5dc] bg-white p-4 sm:min-h-[76px] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 flex-1">
            <h3
              className="text-[14px] font-semibold leading-5 text-[#0d2138]"
              style={mont}
            >
              {t("privacy.profileVisibility.title")}
            </h3>

            <p
              className="mt-1 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              {t("privacy.profileVisibility.description")}
            </p>
          </div>

          <SearchableSelect
            id="profile-visibility"
            searchable={false}
            value={visibility}
            onChange={(next) => setVisibility(next as VisibilityOption)}
            options={VISIBILITY_OPTIONS.map((option) => ({
              value: option,
              label: t(`privacy.visibilityOptions.${VISIBILITY_I18N_KEY[option]}`),
            }))}
            placeholder={t("privacy.profileVisibility.selectPlaceholder")}
            ariaLabel={t("privacy.profileVisibility.ariaLabel")}
            className="shrink-0 sm:w-[150px]"
          />
        </section>

        {/* Data sharing */}
        <section className="flex min-h-[84px] min-w-0 items-center justify-between gap-4 rounded-[12px] border border-[#d1d5dc] bg-white p-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <h3
              className="text-[14px] font-semibold leading-5 text-[#0d2138]"
              style={mont}
            >
              {t("privacy.dataSharing.title")}
            </h3>

            <p
              className="mt-1 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              {t("privacy.dataSharing.description")}
            </p>
          </div>

          <Toggle
            checked={dataSharing}
            onChange={setDataSharing}
            label={t("privacy.dataSharing.toggleLabel")}
          />
        </section>

        {/* Activity tracking */}
        <section className="flex min-h-[84px] min-w-0 items-center justify-between gap-4 rounded-[12px] border border-[#d1d5dc] bg-white p-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <h3
              className="text-[14px] font-semibold leading-5 text-[#0d2138]"
              style={mont}
            >
              {t("privacy.activityTracking.title")}
            </h3>

            <p
              className="mt-1 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              {t("privacy.activityTracking.description")}
            </p>
          </div>

          <Toggle
            checked={activityTracking}
            onChange={setActivityTracking}
            label={t("privacy.activityTracking.toggleLabel")}
          />
        </section>
      </div>

      {/* Delete account */}
      <section className="rounded-[12px] border border-[#fecaca] bg-[#ffe2e2] p-4 sm:p-5">
        <div className="flex min-w-0 flex-col">
          <h3
            className="text-[14px] font-semibold leading-5 text-[#9f0712]"
            style={mont}
          >
            {t("privacy.deleteAccount.title")}
          </h3>

          <p
            className="mt-2 max-w-[760px] text-[14px] leading-6 text-[#9f0712]"
            style={mont}
          >
            {t("privacy.deleteAccount.description")}
          </p>
        </div>

        <button
          type="button"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#e7000b] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#c5000a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7000b]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={mont}
        >
          {t("privacy.deleteAccount.button")}
        </button>
      </section>
    </div>
  );
}