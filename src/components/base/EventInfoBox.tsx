import { ReactNode } from "react";
import { cn } from "@/utils/style";

interface EventInfoBoxProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EventInfoBox({
  label,
  value,
  icon,
  className,
}: EventInfoBoxProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface border border-border p-3 md:p-4 flex flex-col gap-1 min-w-[120px]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-secondary">
        {icon && <span className="w-3 h-3 flex items-center">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-sm md:text-base font-semibold text-primary truncate">
        {value}
      </div>
    </div>
  );
}

