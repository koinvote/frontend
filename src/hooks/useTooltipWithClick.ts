import { useState, useEffect, useCallback, useRef } from "react";

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
  const triggerRef = useRef<HTMLElement | null>(null);

  // 点击外部关闭 tooltip（如果是因为点击打开的）
  useEffect(() => {
    if (!tooltipOpenedByClick) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 如果点击的是触发区域本身，不在这里处理（由 onClick 处理）
      if (triggerRef.current && triggerRef.current.contains(target)) {
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
      // 阻止点击事件冒泡和默认行为
      e.stopPropagation();
      e.preventDefault();
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
      // 如果 tooltip 是因为点击打开的，我们需要阻止它关闭
      if (!open && tooltipOpenedByClick) {
        // 点击打开的，保持打开 - 使用 setTimeout 确保在下一个事件循环中设置
        setTimeout(() => {
          setTooltipOpen(true);
        }, 0);
        return;
      }
      // hover 打开的，可以正常关闭
      setTooltipOpen(open);
    },
    [tooltipOpenedByClick]
  );

  // 确保当 tooltipOpenedByClick 为 true 时，tooltip 保持打开
  useEffect(() => {
    if (tooltipOpenedByClick && !tooltipOpen) {
      setTooltipOpen(true);
    }
  }, [tooltipOpenedByClick, tooltipOpen]);

  return {
    tooltipProps: {
      trigger: [] as ("hover" | "focus" | "click" | "contextMenu")[],
      open: tooltipOpen,
      onOpenChange: handleOpenChange,
    },
    triggerProps: {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
      },
      "data-tooltip-trigger": true,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
