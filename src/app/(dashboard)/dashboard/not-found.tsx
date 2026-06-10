import Link from "next/link";
import { SearchX } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

export default function DashboardNotFound() {
  return (
    <div className="px-6 py-5">
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="size-12 rounded-[12px] bg-[#eff6ff] flex items-center justify-center">
          <SearchX size={24} className="text-[#1e4f86]" />
        </span>
        <p className="text-[24px] font-semibold text-[#0d2138]" style={poppins}>404</p>
        <p className="text-[14px] text-[#6a7282] max-w-[360px]" style={mont}>
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-1 h-10 px-4 inline-flex items-center bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
          style={mont}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
