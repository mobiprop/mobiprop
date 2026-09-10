"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { PublicTeamMember } from "./getPublicTeam";
import { SectionHeading } from "./SectionHeading";

type Agent = { name: string; role: string; photo?: string | null };

export function Agents({ members = [] }: { members?: PublicTeamMember[] }) {
  const { t, i18n } = useTranslation("home");
  const isSpanish = i18n.language?.startsWith("es");
  const agents: Agent[] = members.length
    ? members.map((member) => ({ name: member.name, role: isSpanish ? member.titleEs : member.titleEn, photo: member.photo }))
    : t("agents.team", { returnObjects: true }) as Agent[];

  return (
    <section className="home-section bg-white">
      <div className="home-container flex flex-col items-center gap-10">
        <SectionHeading badge={t("agents.badge")} title={t("agents.title")} subtitle={t("agents.subtitle")} />
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => (
            <article key={agent.name} className="flex min-w-0 flex-col items-center gap-6 rounded-2xl border border-[#f4f9ff] bg-[#f0f6fa] px-3 py-6 text-center">
              <div className="relative flex size-[164px] items-center justify-center overflow-hidden rounded-full bg-[#ccdeef]">
                {agent.photo ? <Image src={agent.photo} alt={agent.name} fill sizes="164px" className="object-cover" /> : <span aria-hidden="true" className="text-4xl text-[#005089]">{agent.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[22px] font-medium leading-snug tracking-[-0.12px] text-[#00223a] lg:text-2xl">{agent.name}</h3>
                <p className="text-base leading-relaxed text-[#4f4f4f]" style={{ fontFamily: "Montserrat, sans-serif" }}>{agent.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
