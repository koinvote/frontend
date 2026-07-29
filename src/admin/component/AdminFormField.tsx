import type { ReactNode } from "react";

import { cn } from "@/utils/style";

export interface SelectOption {
  value: string;
  label: string;
}

interface AdminFormFieldBaseProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  suffix?: ReactNode;
  className?: string;
  error?: string;
}

interface AdminFormFieldInputProps extends AdminFormFieldBaseProps {
  type: "input";
  inputType?: "text" | "number";
  step?: string;
  placeholder?: string;
}

interface AdminFormFieldSelectProps extends AdminFormFieldBaseProps {
  type: "select";
  options: SelectOption[];
}

export type AdminFormFieldProps =
  | AdminFormFieldInputProps
  | AdminFormFieldSelectProps;

export function AdminFormField(props: AdminFormFieldProps) {
  const {
    label,
    value,
    onChange,
    disabled = false,
    suffix,
    className = "",
    error,
  } = props;

  // w-40 on phones: global.css forces every input to 16px under 767px, so the
  // old w-24 (96px) minus px-3 left room for about 8 digits — and
  // dust_threshold_satoshi is routinely 6-7. py-3 clears the 44px touch floor.
  // Desktop keeps the original 96px / py-2 exactly.
  //
  // cn() rather than template concatenation so a caller-supplied width in
  // `className` actually wins instead of colliding with the built-in one.
  const inputClassName = cn(
    "w-40 md:w-24 rounded-[4px] border bg-white px-3 py-3 md:py-2 tx-14 outline-none focus:border-accent",
    error ? "border-red-500" : "border-neutral-200",
    className,
  );

  return (
    <div className="max-w-xl">
      {/* flex-wrap + gap-3 kept verbatim: it already hits the wrap branch of the
          old-iOS gap fallback. Do not give the input w-full — per the shim's own
          comment, a w-full child inside a shimmed wrap container overflows its
          parent by the emulated margin. */}
      <div className="flex flex-wrap items-center gap-3">
        {label && <label className="text-sm">{label}</label>}
        {props.type === "input" ? (
          <input
            type={props.inputType || "text"}
            step={props.step}
            className={inputClassName}
            placeholder={props.placeholder || "輸入"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        ) : (
          <select
            className={inputClassName}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {suffix && <span className="text-sm">{suffix}</span>}
      </div>

      {/* In normal flow, not absolutely positioned. It used to sit inside a
          96px-wide relative box with whitespace-nowrap, so any message longer
          than the input ran past the enclosing <section> — which global.css
          gives overflow-x:hidden under 767px. The message was cut mid-sentence
          and could not be scrolled to. */}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
