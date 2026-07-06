import type { ReactNode } from "react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

/** Icon-only action button with a branded hover/focus tooltip (native `title` stays as the a11y fallback). */
export function IconButton({
  icon,
  label,
  onClick,
  tone = "default",
  active = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "star";
  active?: boolean;
}) {
  const toneClasses =
    tone === "danger"
      ? "text-[#6a7282] hover:bg-red-50 hover:text-[#e7000b] focus-visible:ring-red-200"
      : tone === "star"
        ? "hover:bg-[#fff7e6] focus-visible:ring-amber-200"
        : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] focus-visible:ring-[#1e4f86]/30";

  return (
    <div className="group/tip relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className={`flex size-9 items-center justify-center rounded-[9px] outline-none transition-colors focus-visible:ring-2 lg:size-9 ${toneClasses}`}
        style={tone === "star" ? { color: active ? "#f59e0b" : "#6a7282" } : undefined}
      >
        {icon}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#0d2138] px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity delay-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
        style={mont}
      >
        {label}
      </span>
    </div>
  );
}
