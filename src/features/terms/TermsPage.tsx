import { PageHero } from "@/components/common/PageHero";
import { LegalLayout } from "@/components/common/LegalLayout";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import sections from "./site-content.json";

export function TermsPageContent() {
  return <>
    <PageHero badge="Legal" title="Términos de Servicio" subtitle="Guías legales para el uso de nuestra plataforma y servicios" />
    <LegalLayout updated="Versión 1.0 — Última actualización: 07 de enero de 2025" sections={sections.map((s, i) => ({id: `legal-section-${i}`, label: s.title}))}>
      <div lang="es" className="flex flex-col gap-[50px]" style={{fontFamily: "Montserrat, sans-serif"}}>
        {sections.map((section, i) => <section id={`legal-section-${i}`} key={section.title} className="scroll-mt-28">
          <h2 className="mb-3 tracking-[-0.5px] text-[#232323]" style={{fontFamily: "Poppins, sans-serif"}}>{section.title}</h2>
          <div className="flex flex-col gap-4 text-base leading-7">{section.paragraphs.map((p, j) => p.heading
            ? <h3 key={j} className="!text-base !leading-7 -mb-2.5 text-[#232323]" style={{fontFamily: "Poppins, sans-serif"}}>{p.text}</h3>
            : <p key={j}>{p.text}</p>)}</div>
        </section>)}
      </div>
    </LegalLayout>
    <ConsultationBanner />
  </>;
}
