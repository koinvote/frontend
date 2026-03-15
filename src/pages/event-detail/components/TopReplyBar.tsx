import type { TopReply } from "@/pages/create-event/types";
import { satsToBtc } from "@/utils/formatter";
import { useEffect, useState } from "react";

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

  const targetWidth = `${Math.min(100, Math.max(0, weightPercent))}%`;
  const [barWidth, setBarWidth] = useState("0%");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarWidth(targetWidth));
    });
    return () => cancelAnimationFrame(raf);
  }, [targetWidth]);

  return (
    <div className="border-border bg-bg relative h-14 w-full overflow-hidden rounded-lg border">
      {/* Background bar */}
      <div
        className="absolute inset-0"
        style={{
          width: barWidth,
          backgroundColor: "var(--color-orange-btc)",
          transition: "width 0.5s ease-in-out",
        }}
      />

      {/* Content */}
      <div className="relative flex h-full items-center justify-between px-4 py-2">
        <span className="text-primary line-clamp-1 flex-1 pr-4 text-sm md:text-base">
          {reply.body}
        </span>
        <div className="ml-1 flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs md:text-sm dark:text-white">
            {amountBtc} BTC
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {weightPercentDisplay}%
          </span>
        </div>
      </div>
    </div>
  );
}
