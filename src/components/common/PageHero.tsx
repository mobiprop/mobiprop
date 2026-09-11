import type { ReactNode } from "react";

export function PageBackdrop() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
     <img src="/listings/hero.jpg" alt="" className="absolute max-w-none" style={{left: 0, top: -80, width: "100%", height: 537, objectFit: "cover"}} />
     <div className="absolute rounded-[50%]" style={{left: "-15.995%", top: 245, width: "131.92%", height: 887.292, background: "rgba(211,233,255,.9)", filter: "blur(236.104px)"}} />
     <div className="absolute rounded-[50%]" style={{left: "-8.579%", top: 366.669, width: "117.142%", height: 792.331, background: "rgba(71,169,255,.9)", filter: "blur(236.104px)"}} />
     <div className="absolute rounded-[50%]" style={{left: "7.715%", top: 474.687, width: "84.555%", height: 652.857, background: "rgba(0,55,134,.9)", filter: "blur(236.104px)"}} />
     <div className="absolute" style={{left: "-8.75%", top: -56, width: "117.847%", height: 543, background: "rgba(241,249,255,.95)", filter: "blur(192px)"}} />
   </div>;
}

export function PageHero({ badge, title, subtitle, children }: { badge?: string; title: ReactNode; subtitle?: string; children?: ReactNode }) {
  return <section className="relative isolate flex min-h-[457px] items-center justify-center overflow-hidden px-6 py-16 lg:min-h-[457px]" style={{ fontFamily: "Poppins, sans-serif" }}>
    <PageBackdrop />
    <div className="relative mx-auto flex w-full max-w-[767px] flex-col items-center gap-3.5 text-center">
      {badge && <span className="flex items-center gap-2 rounded-full border border-[#ccdeef] bg-[#f0f6fa] px-3 py-1.5 text-xs font-medium uppercase leading-4 tracking-[1px] text-[#191919]"><span className="h-1.5 w-1.5 rounded-full bg-[#005089]" />{badge}</span>}
      <h1 className="text-[34px] font-medium leading-[1.2] tracking-[-1px] text-[#101010] sm:text-[42px] lg:text-[52px] lg:tracking-[-1.5px]">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-[730px] text-base leading-[1.5] text-[#4f4f4f] lg:text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>{subtitle}</p>}
      {children}
    </div>
  </section>;
}
