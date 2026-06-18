"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
};

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label = "Toggle setting",
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-12 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#1e4f86]" : "bg-[#d1d5db]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}