import { satsToBtc } from "@/utils/formatter";
import type { TopReply } from "@/pages/create-event/types";

interface TopReplyBarProps {
  reply: TopReply;
}

export function TopReplyBar({ reply }: TopReplyBarProps) {
  // Handle both string and number types for amount_satoshi
  const amountSatoshi =
    typeof reply.amount_satoshi === "string"
      ? parseInt(reply.amount_satoshi, 10)
      : reply.amount_satoshi;
  const amountBtc = satsToBtc(amountSatoshi, { suffix: false });
  const weightPercent = reply.weight_percent || 0;
  const weightPercentDisplay = Number(weightPercent.toFixed(2));

  // Calculate bar width based on weight percentage
  const barWidth = `${Math.min(100, Math.max(0, weightPercent))}%`;

  return (
    <div className="relative w-full h-12 rounded-lg border border-border bg-bg overflow-hidden">
      {/* Background bar */}
      <div
        className="absolute inset-0"
        style={{
          width: barWidth,
          backgroundColor: "var(--color-orange-btc)",
        }}
      />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-4 py-2">
        <span className="text-sm md:text-base text-primary line-clamp-1 flex-1 pr-4">
          {reply.body}
        </span>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
          <span className="text-xs md:text-sm dark:text-white">
            {amountBtc} BTC
          </span>
          <span className="text-xs md:text-sm font-semibold">
            {weightPercentDisplay}%
          </span>
        </div>
      </div>
    </div>
  );
}
