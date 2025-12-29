import { satsToBtc } from "@/utils/formatter";
import type { ReplyPreview } from "@/pages/create-event/types";

interface TopReplyBarProps {
  reply: ReplyPreview;
}

export function TopReplyBar({ reply }: TopReplyBarProps) {
  // Handle both string and number types for amount_satoshi
  const amountSatoshi =
    typeof reply.amount_satoshi === "string"
      ? parseInt(reply.amount_satoshi, 10)
      : reply.amount_satoshi;
  const amountBtc = satsToBtc(amountSatoshi, { suffix: false });
  const weightPercent = reply.weight_percent || 0;

  // Calculate bar width based on weight percentage
  const barWidth = `${Math.min(100, Math.max(0, weightPercent))}%`;

  return (
    <div className="relative w-full h-12 rounded-xl border border-border bg-bg overflow-hidden">
      {/* Background bar */}
      <div
        className="absolute inset-0 bg-accent opacity-20"
        style={{ width: barWidth }}
      />
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-4">
        <span className="text-sm md:text-base text-primary line-clamp-1 flex-1 pr-4">
          {reply.body}
        </span>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs md:text-sm text-secondary">
            {amountBtc} BTC
          </span>
          <span className="text-xs md:text-sm font-semibold text-accent">
            {weightPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

