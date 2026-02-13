import CopyIcon from "@/assets/icons/copy.svg?react";
import { toast } from "@/components/base/Toast/toast";

export function DisplayField({
  label,
  value,
  variant = "default",
  copyable = false,
}: {
  label: string;
  value: string;
  variant?: "default" | "highlight";
  copyable?: boolean;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast("success", `${label} 已複製到剪貼簿`);
    } catch {
      toast("error", `${label} 複製失敗`);
    }
  };

  const bgClass = variant === "highlight" ? "bg-admin-surface" : "bg-admin-bg";

  return (
    <div>
      <label className="fw-m text-primary mb-1 block text-sm">{label}</label>
      <div
        className={`flex items-center justify-between rounded-lg border border-neutral-200 ${bgClass} px-3 py-4`}
      >
        <span className="text-secondary min-w-0 font-mono text-sm break-all">
          {value}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-secondary hover:text-primary ml-2 shrink-0 cursor-pointer"
          >
            <CopyIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
