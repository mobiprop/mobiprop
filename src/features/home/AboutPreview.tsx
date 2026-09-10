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
      <div className="about-container home-about-grid">
        <div className="flex min-w-0 flex-col items-start gap-[30px]">
          <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3.5">
          <p className="border-l-2 border-[#006fc2] pl-3 text-sm font-medium uppercase text-[#005089]">{t("aboutPreview.badge")}</p>
          <h2 className="text-[32px] sm:text-[44px] font-medium leading-[1.2] tracking-[-1px] text-[#00223a] max-w-[469px]">{t("aboutPreview.title")}</h2>
          </div>
          <p className="text-[16px] leading-6 text-[#4f4f4f] max-w-[606px]">{t("aboutPreview.description")}</p>
          </div>
          <Link href="/about" className="home-button">{t("aboutPreview.cta")}</Link>
          <div className="flex items-center" aria-hidden="true">
            {team.map((member) => <Image key={member.name} src={member.photo!} alt="" width={40} height={40} className="size-10 rounded-full border-2 border-white object-cover" />)}
          </div>
          <div>
            <p className="text-xl font-medium text-[#005089]">{t("aboutPreview.specialty")}</p>
            <p className="home-section-description mt-[3px]">{t("aboutPreview.specialtyDescription")}</p>
          </div>
        </div>
        <div className="home-about-image relative overflow-hidden rounded-[28px]">
          <Image src="/about/home-graphic.webp" alt="" fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,40,70,0) 30%, rgba(0,40,70,.2) 52.275%, rgba(0,34,61,.64) 82.5%, rgba(0,30,55,.82) 100%)" }} />
          <div className="absolute inset-x-[30px] bottom-[30px] grid grid-cols-2 gap-6 text-[#fafafa] sm:gap-10">
            {(["customers", "support"] as const).map((key) => <div key={key} className="flex max-w-[183px] flex-col gap-3">
              <p className="text-[36px] font-medium leading-none">{t(`aboutPreview.${key}.value`)}</p>
              <p className="text-[16px] font-medium leading-6">{t(`aboutPreview.${key}.label`)}</p>
              <span aria-hidden="true" className="my-1 h-px w-[18px] rotate-45 bg-white" />
              <p className="text-[14px] leading-[1.5]">{t(`aboutPreview.${key}.description`)}</p>
            </div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
