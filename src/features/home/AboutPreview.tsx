"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { PublicTeamMember } from "./getPublicTeam";

export function AboutPreview({ members = [] }: { members?: PublicTeamMember[] }) {
  const { t } = useTranslation("home");
  const fallback = t("agents.team", { returnObjects: true }) as { name: string; photo?: string }[];
  const team = (members.length ? members : fallback).filter((member) => member.photo).slice(0, 4);
  return (
    <section className="home-section bg-white">
      <div className="home-container home-about-grid">
        <div className="flex min-w-0 flex-col items-start gap-7">
          <p className="border-l-2 border-[#006fc2] pl-3 text-sm font-medium uppercase text-[#005089]">{t("aboutPreview.badge")}</p>
          <h2 className="home-section-title max-w-[15ch]">{t("aboutPreview.title")}</h2>
          <p className="home-section-description max-w-[606px]">{t("aboutPreview.description")}</p>
          <Link href="/about" className="home-button">{t("aboutPreview.cta")}</Link>
          <div className="flex items-center -space-x-2" aria-hidden="true">
            {team.map((member) => <Image key={member.name} src={member.photo!} alt="" width={40} height={40} className="size-10 rounded-full border-2 border-white object-cover" />)}
          </div>
          <div>
            <p className="text-xl font-medium text-[#005089]">{t("aboutPreview.specialty")}</p>
            <p className="home-section-description mt-2">{t("aboutPreview.specialtyDescription")}</p>
          </div>
        </div>
        <div className="home-about-image relative overflow-hidden rounded-[28px]">
          <Image src="/about/story.webp" alt="" fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001e37]/90 via-[#002846]/10 to-transparent" />
          <div className="absolute inset-x-6 bottom-7 grid grid-cols-2 gap-5 text-white sm:inset-x-8 sm:bottom-8">
            <div><p className="text-2xl font-medium">{t("aboutPreview.areaOne")}</p><p className="mt-3 text-sm leading-relaxed">{t("aboutPreview.areaOneDescription")}</p></div>
            <div><p className="text-2xl font-medium">{t("aboutPreview.areaTwo")}</p><p className="mt-3 text-sm leading-relaxed">{t("aboutPreview.areaTwoDescription")}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
