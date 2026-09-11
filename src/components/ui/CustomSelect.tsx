"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { SearchableSelect, type SearchableSelectOption } from "./Select";

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  return Children.toArray(node).map(child => isValidElement<{children?: ReactNode}>(child) ? text(child.props.children) : typeof child === "string" || typeof child === "number" ? String(child) : "").join("");
}
function collect(children: ReactNode): SearchableSelectOption[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{value?: string | number; children?: ReactNode; disabled?: boolean}>(child)) return [];
    return child.type === "option" ? [{value: String(child.props.value ?? text(child.props.children)), label: text(child.props.children), disabled: child.props.disabled}] : collect(child.props.children);
  });
}

/** Keeps native form submission, reset and change events while displaying
 * the same custom listbox used everywhere else. */
export function CustomSelect({children, className, style, id, onChange, onInvalid, defaultValue, value: controlledValue, ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  const native = useRef<HTMLSelectElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const options = collect(children);
  const initialValue = String(defaultValue ?? options.find(o => !o.disabled)?.value ?? "");
  const [localValue, setLocalValue] = useState(initialValue);
  const value = String(controlledValue ?? localValue);
  useEffect(() => {
    const form = native.current?.form;
    const reset = () => setLocalValue(initialValue);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [initialValue]);
  return <div ref={wrapper} className="mobi-native-select">
    <select {...props} ref={native} value={value} tabIndex={-1} aria-hidden="true" className="sr-only"
      onChange={e => { setLocalValue(e.target.value); onChange?.(e); }}
      onInvalid={e => { e.preventDefault(); wrapper.current?.querySelector("button")?.focus(); onInvalid?.(e); }}>
      {children}
    </select>
    <SearchableSelect id={id} ariaLabel={props["aria-label"] ?? options[0]?.label ?? props.name}
      value={value} options={options} placeholder={options[0]?.label ?? "Seleccionar"}
      searchable={false} disabled={props.disabled} hasError={props["aria-invalid"] === true}
      triggerClassName={className} triggerStyle={style}
      onChange={next => {
        if (!native.current) return;
        native.current.value = next;
        native.current.dispatchEvent(new Event("change", {bubbles: true}));
      }} />
  </div>;
}
