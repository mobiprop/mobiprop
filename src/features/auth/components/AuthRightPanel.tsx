import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

function IconArrow({ left = false }: { left?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={left ? "rotate-180" : ""}>
      <path d="M4.167 10h11.666M10.833 5l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

type AuthRightPanelProps = {
  variant?: "client" | "staff";
};

export function AuthRightPanel({ variant = "client" }: AuthRightPanelProps) {
  const { t } = useTranslation("auth");
  const copy = {
    title: t(`rightPanel.${variant}.title`),
    body: t(`rightPanel.${variant}.body`),
    cta: t(`rightPanel.${variant}.cta`),
  };
  return (
    <div
      className="hidden lg:flex shrink-0 w-[735px] m-[16px] rounded-[12px] overflow-hidden relative bg-[#f4f4f4] border border-[#e6e6e6] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)]"
      style={{ minHeight: "calc(100vh - 32px)" }}
    >
      <Image
        src="/assets/figma-temp/SignUp/hero-bg.png"
        alt="White Mediterranean architecture"
        fill
        sizes="735px"
        className="object-cover"
        priority
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-20 pb-[60px] px-[39px]">
        <div className="flex flex-col gap-5 max-w-[495px]">
          <div className="flex flex-col gap-3">
            <h2
              className="text-[32px] leading-[44px] tracking-[-0.32px] text-white"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
            >
              {copy.title}
            </h2>
            <p
              className="text-[16px] leading-[24px] tracking-[-0.16px] text-white"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
            >
              {copy.body}
            </p>
          </div>
         <Link
              href="/privacy-policy"
              className="text-[16px] leading-[24px] tracking-[-0.16px] font-medium text-white no-underline"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {copy.cta}
            </Link>
        </div>
        <div className="absolute bottom-7 right-7 flex items-center gap-5">
          <button type="button" className="flex items-center justify-center size-6 opacity-80 hover:opacity-100 transition-opacity">
            <IconArrow left />
          </button>
          <button type="button" className="flex items-center justify-center size-6 opacity-80 hover:opacity-100 transition-opacity">
            <IconArrow />
          </button>
        </div>
      </div>
    </div>
  );
}
