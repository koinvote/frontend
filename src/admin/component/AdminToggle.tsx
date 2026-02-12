interface AdminToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

export function AdminToggle({
  value,
  onChange,
  disabled = false,
  leftLabel = "關",
  rightLabel = "開",
}: AdminToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => !disabled && onChange(false)}
        disabled={disabled}
        className={`tx-14 transition-colors ${
          !value
            ? "text-admin-text-main fw-m"
            : "text-admin-text-sub"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          ${value ? "bg-[var(--color-orange-500)]" : "bg-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${value ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      <button
        type="button"
        onClick={() => !disabled && onChange(true)}
        disabled={disabled}
        className={`tx-14 transition-colors ${
          value
            ? "text-admin-text-main fw-m"
            : "text-admin-text-sub"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {rightLabel}
      </button>
    </div>
  );
}

