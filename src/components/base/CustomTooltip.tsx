import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface CustomTooltipProps {
  title: string;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight";
  color?: string;
  children: ReactNode;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  align?: {
    offset?: [number, number];
  };
  overlayClassName?: string;
  overlayInnerStyle?: React.CSSProperties;
  autoAdjustOverflow?: boolean;
  arrowOffset?: number;
}

export function CustomTooltip({
  title,
  placement = "top",
  color = "white",
  children,
  getPopupContainer,
  align,
  overlayClassName = "",
  overlayInnerStyle,
  autoAdjustOverflow = true,
  arrowOffset = 0,
}: CustomTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenedByClick, setIsOpenedByClick] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // 计算 Tooltip 位置
  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const container = containerRef.current || document.body;
    const containerRect = container.getBoundingClientRect();

    let top = 0;
    let left = 0;
    const offset = align?.offset || [0, 0];

    switch (placement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - 8 + offset[1];
        left =
          triggerRect.left +
          triggerRect.width / 2 -
          tooltipRect.width / 2 +
          offset[0];
        break;
      case "topLeft":
        top = triggerRect.top - tooltipRect.height - 8 + offset[1];
        left = triggerRect.left + offset[0];
        break;
      case "topRight":
        top = triggerRect.top - tooltipRect.height - 8 + offset[1];
        left = triggerRect.right - tooltipRect.width + offset[0];
        break;
      case "bottom":
        top = triggerRect.bottom + 8 + offset[1];
        left =
          triggerRect.left +
          triggerRect.width / 2 -
          tooltipRect.width / 2 +
          offset[0];
        break;
      case "bottomLeft":
        top = triggerRect.bottom + 8 + offset[1];
        left = triggerRect.left + offset[0];
        break;
      case "bottomRight":
        top = triggerRect.bottom + 8 + offset[1];
        left = triggerRect.right - tooltipRect.width + offset[0];
        break;
      case "left":
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 +
          offset[1];
        left = triggerRect.left - tooltipRect.width - 8 + offset[0];
        break;
      case "right":
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 +
          offset[1];
        left = triggerRect.right + 8 + offset[0];
        break;
    }

    // 边界调整
    if (autoAdjustOverflow) {
      const padding = 8;
      if (left < containerRect.left + padding) {
        left = containerRect.left + padding;
      }
      if (left + tooltipRect.width > containerRect.right - padding) {
        left = containerRect.right - tooltipRect.width - padding;
      }
      if (top < containerRect.top + padding) {
        top = containerRect.top + padding;
      }
      if (top + tooltipRect.height > containerRect.bottom - padding) {
        top = containerRect.bottom - tooltipRect.height - padding;
      }
    }

    setPosition({ top, left });
  };

  // 当 Tooltip 打开时更新位置
  useEffect(() => {
    if (isOpen) {
      // 使用 setTimeout 确保 DOM 已渲染
      const timer = setTimeout(() => {
        updatePosition();
      }, 0);
      const handleResize = () => updatePosition();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize, true);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, placement]);

  // 点击外部关闭（如果是由点击打开的）
  useEffect(() => {
    if (!isOpenedByClick) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 如果点击的是触发区域或 Tooltip 本身，不关闭
      if (
        triggerRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }

      // 其他情况都关闭
      setIsOpenedByClick(false);
      setIsOpen(false);
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isOpenedByClick]);

  // 设置容器
  useEffect(() => {
    if (triggerRef.current && getPopupContainer) {
      containerRef.current = getPopupContainer(triggerRef.current);
    } else {
      containerRef.current = document.body;
    }
  }, [getPopupContainer]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpenedByClick && isOpen) {
      setIsOpenedByClick(false);
      setIsOpen(false);
    } else {
      setIsOpenedByClick(true);
      setIsOpen(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isOpenedByClick) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isOpenedByClick) {
      setIsOpen(false);
    }
    // 如果是由点击打开的，保持打开（不执行任何操作）
  };

  if (!containerRef.current) {
    containerRef.current = document.body;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: "inline-block" }}
      >
        {children}
      </div>
      {isOpen &&
        containerRef.current &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`absolute z-[9999] px-3 py-2 rounded-lg text-sm shadow-lg ${overlayClassName}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              backgroundColor: color,
              color: color === "white" ? "#000" : "#fff",
              pointerEvents: "none",
              ...overlayInnerStyle,
            }}
            onMouseEnter={() => {
              // 鼠标在 Tooltip 上时保持打开
              if (isOpenedByClick) {
                setIsOpen(true);
              }
            }}
            onMouseLeave={() => {
              // 鼠标离开 Tooltip 时，如果是由点击打开的，保持打开
              if (!isOpenedByClick) {
                setIsOpen(false);
              }
            }}
          >
            {title}
            {/* Tooltip 箭头 */}
            <div
              className="absolute w-0 h-0"
              style={{
                ...(placement.startsWith("top")
                  ? {
                      bottom: "-6px",
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: `6px solid ${color}`,
                      ...(placement === "topLeft"
                        ? { left: "16px" }
                        : placement === "topRight"
                        ? { right: "16px" }
                        : {
                            left: `calc(50% + ${arrowOffset}px)`,
                            transform: "translateX(-50%)",
                          }),
                    }
                  : placement.startsWith("bottom")
                  ? {
                      top: "-6px",
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: `6px solid ${color}`,
                      ...(placement === "bottomLeft"
                        ? { left: "16px" }
                        : placement === "bottomRight"
                        ? { right: "16px" }
                        : {
                            left: `calc(50% + ${arrowOffset}px)`,
                            transform: "translateX(-50%)",
                          }),
                    }
                  : placement === "left"
                  ? {
                      right: "-6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: `6px solid ${color}`,
                    }
                  : {
                      left: "-6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderRight: `6px solid ${color}`,
                    }),
              }}
            />
          </div>,
          containerRef.current
        )}
    </>
  );
}
