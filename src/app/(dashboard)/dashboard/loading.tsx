import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[#6a7282]">
      <Loader2 size={18} className="animate-spin" />
      <span
        className="text-[14px]"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Cargando…
      </span>
    </div>
  );
}
