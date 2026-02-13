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
    ? `${baseInputClassName} border-red-500 focus:border-accent outline-none`
    : `${baseInputClassName} border-neutral-200 focus:border-accent outline-none`;

  return (
    <div className="flex max-w-xl flex-wrap items-center gap-3">
      {label && <label className="text-sm">{label}</label>}
      <div className="relative">
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
          <span className="absolute -bottom-5 left-0 mt-1 text-xs whitespace-nowrap text-red-500">
            {error}
          </span>
        )}
      </div>
      {suffix && <span className="text-sm">{suffix}</span>}
    </div>
  );
}
