import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for Tooltip with click and hover interactions
 *
 * Features:
 * - Hover to show, hover away to hide (if opened by hover)
 * - Click to toggle (show/hide)
 * - Click outside to close (if opened by click)
 * - Click-opened tooltip stays open even when hover away
 *
 * @returns Object containing tooltip state and event handlers
 */
export function useTooltipWithClick() {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipOpenedByClick, setTooltipOpenedByClick] = useState(false);

  // 点击外部关闭 tooltip（如果是因为点击打开的）
  useEffect(() => {
    if (!tooltipOpenedByClick) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const triggerElement = document.querySelector("[data-tooltip-trigger]");

      // 如果点击的是触发区域本身，不在这里处理（由 onClick 处理）
      if (triggerElement && triggerElement.contains(target)) {
        return;
      }

      // 如果点击的是 tooltip 内容区域，不关闭
      if (target.closest(".ant-tooltip-inner")) {
        return;
      }

      // 其他情况都关闭 tooltip
      setTooltipOpenedByClick(false);
      setTooltipOpen(false);
    };

    // 使用 click 事件，在捕获阶段处理，确保在其他点击处理之前
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [tooltipOpenedByClick]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // 阻止点击事件冒泡
      e.stopPropagation();
      // 如果已经打开且是点击打开的，则关闭；否则打开
      if (tooltipOpenedByClick && tooltipOpen) {
        setTooltipOpenedByClick(false);
        setTooltipOpen(false);
      } else {
        setTooltipOpenedByClick(true);
        setTooltipOpen(true);
      }
    },
    [tooltipOpenedByClick, tooltipOpen]
  );

  const handleMouseEnter = useCallback(() => {
    // hover 进入时，如果不是点击打开的，可以打开
    if (!tooltipOpenedByClick) {
      setTooltipOpen(true);
    }
  }, [tooltipOpenedByClick]);

  const handleMouseLeave = useCallback(() => {
    // 鼠标离开时，如果 tooltip 是因为点击打开的，保持打开
    if (tooltipOpenedByClick) {
      setTooltipOpen(true);
    } else {
      // hover 打开的，可以关闭
      setTooltipOpen(false);
    }
  }, [tooltipOpenedByClick]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // 关闭时：如果是点击打开的，不关闭；如果是 hover 打开的，可以关闭
      if (!open && tooltipOpenedByClick) {
        // 点击打开的，保持打开
        setTooltipOpen(true);
      } else {
        setTooltipOpen(open);
      }
    },
    [tooltipOpenedByClick]
  );

  return {
    tooltipProps: {
      trigger: [] as ("hover" | "focus" | "click" | "contextMenu")[],
      open: tooltipOpen,
      onOpenChange: handleOpenChange,
    },
    triggerProps: {
      "data-tooltip-trigger": true,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
