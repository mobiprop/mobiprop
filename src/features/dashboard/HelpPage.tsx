import { HelpCircle } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

export function HelpPage() {
  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Help Center</h1>
        <p className="text-[14px] text-[#6a7282]" style={mont}>Guides and support for the dashboard</p>
      </div>

      <div className="flex-1 bg-white border border-[#e5e7eb] rounded-[14px] flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="size-12 rounded-[12px] bg-[#eff6ff] flex items-center justify-center">
          <HelpCircle size={24} className="text-[#1e4f86]" />
        </span>
        <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Help Center coming soon</p>
        <p className="text-[14px] text-[#6a7282] max-w-[360px]" style={mont}>
          We&apos;re putting together guides, FAQs, and support resources for the dashboard. Check back soon.
        </p>
      </div>
    </div>
  );
}
