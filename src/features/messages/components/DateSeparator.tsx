const mont = { fontFamily: "'Montserrat', sans-serif" };

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator" aria-label={label}>
      <div className="h-px flex-1 bg-[#e5e7eb]" />
      <span
        className="shrink-0 rounded-full bg-[#f8fafc] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#6a7282] sm:text-[11px]"
        style={mont}
      >
        {label}
      </span>
      <div className="h-px flex-1 bg-[#e5e7eb]" />
    </div>
  );
}
