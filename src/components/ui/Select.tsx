"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

export type SearchableSelectOption = { value: string; label: string; disabled?: boolean };
export type SearchableSelectProps = {
  id?: string; ariaLabel?: string; value: string; onChange: (value: string) => void;
  options: SearchableSelectOption[]; placeholder: string; searchPlaceholder?: string;
  emptyLabel?: string; loading?: boolean; loadingLabel?: string; searchable?: boolean;
  visibleRows?: number; disabled?: boolean; hasError?: boolean; className?: string;
  size?: "default" | "sm"; bare?: boolean; icon?: ReactNode;
  triggerClassName?: string; triggerStyle?: CSSProperties; onBlur?: () => void;
};

/** A shared, downward-opening listbox for public pages and the CRM. */
export function SearchableSelect({ id, ariaLabel, value, onChange, options, placeholder,
  searchPlaceholder = "Buscar...", emptyLabel = "No se encontraron resultados",
  loading = false, loadingLabel = "Cargando...", searchable = true, visibleRows = 6,
  disabled = false, hasError = false, className = "", size = "default", bare = false,
  icon, triggerClassName = "", triggerStyle, onBlur,
}: SearchableSelectProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const positioned = position !== null;
  const filtered = options.filter(o => o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const selected = options.find(o => o.value === value);

  function close(restore = true) {
    setOpen(false); setQuery("");
    if (restore) trigger.current?.focus();
  }
  function choose(option: SearchableSelectOption) {
    if (option.disabled) return;
    onChange(option.value); close();
  }
  function show(last = false) {
    if (disabled) return;
    const rect = trigger.current?.getBoundingClientRect();
    // Make room below controls near the lower edge instead of flipping upward.
    if (rect && innerHeight - rect.bottom < 180) trigger.current?.scrollIntoView({ block: "center" });
    setQuery("");
    const selectedIndex = options.findIndex(o => o.value === value && !o.disabled);
    setActive(last ? options.findLastIndex(o => !o.disabled) : selectedIndex >= 0 ? selectedIndex : options.findIndex(o => !o.disabled));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function update() {
      const element = trigger.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      // Portals must account for the public site's compact scale and the
      // homepage banner's full-size override, including nested CSS zoom.
      const scale = rect.width / element.offsetWidth || 1;
      const bodyScale = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
      const gap = 8 * scale;
      setPosition({ position: "fixed", zoom: scale / bodyScale,
        top: (rect.bottom + gap) / scale,
        left: Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8)) / scale,
        width: rect.width / scale,
        maxHeight: Math.max(44, (innerHeight - rect.bottom - gap - 8) / scale),
      });
    }
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) close(false);
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !positioned) return;
    (searchable ? search.current : list.current)?.focus();
  }, [open, positioned, searchable]);

  useEffect(() => {
    if (open) panel.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function keyboard(event: React.KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === "Tab") { close(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const enabled = filtered.map((o, i) => o.disabled ? -1 : i).filter(i => i >= 0);
      if (!enabled.length) return;
      const current = enabled.indexOf(active);
      setActive(event.key === "Home" ? enabled[0] : event.key === "End" ? enabled[enabled.length - 1] :
        enabled[(current + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]);
    } else if (event.key === "Enter" || (!searchable && event.key === " ")) {
      event.preventDefault(); if (filtered[active]) choose(filtered[active]);
    } else if (!searchable && event.key.length === 1) {
      const next = filtered.findIndex(o => !o.disabled && o.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
      if (next >= 0) setActive(next);
    }
  }

  return <div className={`relative min-w-0 ${className}`}>
    <button ref={trigger} id={id} role="combobox" type="button" disabled={disabled}
      aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open ? uid : undefined} aria-invalid={hasError || undefined}
      onBlur={onBlur} onClick={() => open ? close() : show()}
      onKeyDown={e => { if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); show(e.key === "ArrowUp"); } }}
      className={`${bare ? "mobi-select-bare" : "mobi-select-trigger"} ${size === "sm" ? "mobi-select-small" : ""} ${triggerClassName}`}
      style={triggerStyle}>
      {icon}<span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
      {!bare && <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-[#9a9a9a]" />}
    </button>
    {open && position && createPortal(<div ref={panel} className="mobi-dropdown-menu mobi-select-panel"
      style={position} onKeyDown={keyboard}>
      {searchable && <div className="mobi-select-search"><Search size={15} aria-hidden="true" />
        <input ref={search} value={query} onChange={e => { setQuery(e.target.value); setActive(-1); }}
          aria-label={searchPlaceholder} placeholder={searchPlaceholder} autoComplete="off"
          role="combobox" aria-expanded="true" aria-controls={uid} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${uid}-${active}` : undefined} />
      </div>}
      <div id={uid} role="listbox" aria-label={ariaLabel ?? placeholder} tabIndex={searchable ? undefined : -1}
        ref={list}
        aria-activedescendant={active >= 0 ? `${uid}-${active}` : undefined}
        className="mobi-select-options" style={{maxHeight: visibleRows * 44}}>
        {loading ? <p className="mobi-select-message">{loadingLabel}</p> : !filtered.length ? <p className="mobi-select-message">{emptyLabel}</p> : filtered.map((o, i) =>
          <button id={`${uid}-${i}`} key={o.value} type="button" role="option" tabIndex={-1}
            aria-selected={o.value === value} disabled={o.disabled} data-index={i}
            data-active={active === i || undefined} onClick={() => choose(o)} className="mobi-dropdown-option">{o.label}</button>)}
      </div>
    </div>, document.body)}
  </div>;
}
