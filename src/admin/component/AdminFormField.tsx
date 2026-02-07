import type { ReactNode } from "react";

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

  const baseInputClassName = `w-24 border rounded-[4px] px-3 py-2 bg-white tx-14 ${className}`;
  const inputClassName = error
    ? `${baseInputClassName} border-red-500`
    : `${baseInputClassName} border-admin-border`;

  return (
    <div className="flex flex-wrap items-center gap-3 max-w-xl">
      {label && <label className="tx-14 text-admin-text-sub">{label}</label>}
      <div className="relative pb-2">
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
        {error && (
          <span className="absolute left-0 -bottom-3 mt-1 text-red-500 text-xs whitespace-nowrap">
            {error}
          </span>
        )}
      </div>
      {suffix && <span className="tx-14">{suffix}</span>}
    </div>
  );
}
