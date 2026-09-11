import type { ReactNode } from "react";

export function PageBackdrop() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <img src="/listings/hero.jpg" alt="" className="absolute -top-20 h-[537px] w-full object-cover" />
    <div className="absolute -left-[9%] top-[-56px] h-[517px] w-[118%] bg-[#f1f9ff] mix-blend-screen blur-[96px]" />
    <img src="/pages/page-blur.svg" alt="" className="absolute inset-0 h-full w-full object-cover" />
  </div>;
}

export function PageHero({ badge, title, subtitle, children }: { badge?: string; title: ReactNode; subtitle?: string; children?: ReactNode }) {
  return <section className="relative isolate flex min-h-[330px] items-center justify-center overflow-hidden px-6 py-16 lg:h-[386px]" style={{ fontFamily: "Poppins, sans-serif" }}>
    <PageBackdrop />
    <div className="relative mx-auto flex w-full max-w-[767px] flex-col items-center gap-3.5 text-center">
      {badge && <span className="flex items-center gap-2 rounded-full border border-[#ccdeef] bg-[#f0f6fa] px-3 py-1.5 text-xs font-medium uppercase leading-4 tracking-[1px] text-[#191919]"><span className="h-1.5 w-1.5 rounded-full bg-[#005089]" />{badge}</span>}
      <h1 className="text-[34px] font-medium leading-[1.2] tracking-[-1px] text-[#101010] sm:text-[42px] lg:text-[52px] lg:tracking-[-1.5px]">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-[730px] text-base leading-[1.5] text-[#4f4f4f] lg:text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>{subtitle}</p>}
      {children}
    </div>
  </section>;
}
