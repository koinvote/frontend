import { useEffect, useRef, useState } from "react";

import { satsToBtc } from "@/utils/formatter";

export interface ReplyItemProps {
  reply: {
    body: string;
    weight_percent: number;
    amount_satoshi: string;
  };
  t: (key: string, defaultValue: string) => string;
}

export function ReplyItem({ reply, t }: ReplyItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const hasOverflowRef = useRef(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (!textRef.current) return;

      if (isExpanded) {
        setShowToggle(hasOverflowRef.current);
        return;
      }

      // Get computed styles to calculate line height
      const computedStyle = window.getComputedStyle(textRef.current);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.5;

      // Create a clone to measure full height without affecting the original
      const clone = textRef.current.cloneNode(true) as HTMLElement;
      clone.className = "text-primary break-words";
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.width = `${textRef.current.offsetWidth}px`;
      clone.style.whiteSpace = "normal";
      clone.style.wordBreak = "break-word";
      clone.style.overflow = "visible";
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.webkitLineClamp = "none";
      clone.style.display = "block";

      document.body.appendChild(clone);
      const fullHeight = clone.scrollHeight;
      document.body.removeChild(clone);

      const clampedHeight = textRef.current.clientHeight;
      const expectedHeight = lineHeight;
      const TOLERANCE = 2;

      // Check if content exceeds 1 line
      const isOverflowing =
        fullHeight > expectedHeight + TOLERANCE ||
        fullHeight > clampedHeight + TOLERANCE;

      if (isOverflowing) {
        hasOverflowRef.current = true;
      }
      setShowToggle(hasOverflowRef.current || isOverflowing);
    };

    const timer = setTimeout(checkOverflow, 0);
    window.addEventListener("resize", checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [reply.body, isExpanded]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors
        dark:md:hover:bg-[rgba(var(--color-gray-450-rgb),0.8)] md:hover:bg-gray-200`}
    >
      <p
        ref={textRef}
        className={`text-primary break-words pt-1 ${
          isExpanded ? "" : "line-clamp-1"
        } ${showToggle ? "cursor-pointer" : ""}`}
        onClick={showToggle ? handleToggle : undefined}
      >
        {reply.body}
      </p>
      <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-end text-[11px] text-secondary">
        <div className="flex items-center justify-end gap-2 md:gap-2">
          <span>
            {t("eventCard.weight", "Weight:")}{" "}
            {Number(reply.weight_percent.toFixed(2))}%
          </span>
          <span>
            {t("eventCard.amount", "Amount:")}{" "}
            {satsToBtc(parseFloat(reply.amount_satoshi || "0"), {
              suffix: false,
            })}{" "}
            BTC
          </span>
        </div>
      </div>
    </div>
  );
}
