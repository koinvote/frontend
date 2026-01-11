import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface CustomTooltipProps {
  title: string;
  trigger?: "hover" | "click" | "both";
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
  trigger = "both",
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
  void autoAdjustOverflow; // Keep for API compatibility
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenedByClick, setIsOpenedByClick] = useState(false);
  const [, setTick] = useState(0); // 用于强制重新渲染以更新位置
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // 当 Tooltip 打开时设置容器并监听滚动
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      if (getPopupContainer) {
        containerRef.current = getPopupContainer(triggerRef.current);
      } else {
        containerRef.current = document.body;
      }

      // 监听滚动和窗口大小变化，强制重新渲染以更新位置
      const handleUpdate = () => {
        setTick((t) => t + 1); // 触发重新渲染，让 getPositionStyle 重新执行
      };

      window.addEventListener("scroll", handleUpdate, true); // 使用 capture phase 确保捕获所有滚动
      window.addEventListener("resize", handleUpdate);

      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
      };
    }
  }, [isOpen, getPopupContainer]);

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

  const handleClick = (e: React.MouseEvent) => {
    if (trigger === "hover") {
      return;
    }
    e.stopPropagation();
    e.preventDefault(); // 阻止默认行为，防止触发 label 的点击
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

  // 计算位置样式
  const getPositionStyle = () => {
    if (!triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const offset = align?.offset || [0, 0];

    const baseStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
    };

    switch (placement) {
      case "top":
        return {
          ...baseStyle,
          bottom: `${window.innerHeight - triggerRect.top + 8}px`,
          left: `${triggerRect.left + triggerRect.width / 2}px`,
          transform: `translateX(-50%) translateY(0)`,
        };
      case "topLeft":
        return {
          ...baseStyle,
          bottom: `${window.innerHeight - triggerRect.top + 8}px`,
          left: `${triggerRect.left + offset[0]}px`,
        };
      case "topRight":
        return {
          ...baseStyle,
          bottom: `${window.innerHeight - triggerRect.top + 8}px`,
          right: `${window.innerWidth - triggerRect.right + offset[0]}px`,
        };
      case "bottom":
        return {
          ...baseStyle,
          top: `${triggerRect.bottom + 8}px`,
          left: `${triggerRect.left + triggerRect.width / 2}px`,
          transform: `translateX(-50%)`,
        };
      case "bottomLeft":
        return {
          ...baseStyle,
          top: `${triggerRect.bottom + 8}px`,
          left: `${triggerRect.left + offset[0]}px`,
        };
      case "bottomRight":
        return {
          ...baseStyle,
          top: `${triggerRect.bottom + 8}px`,
          right: `${window.innerWidth - triggerRect.right + offset[0]}px`,
        };
      case "left":
        return {
          ...baseStyle,
          top: `${triggerRect.top + triggerRect.height / 2}px`,
          right: `${window.innerWidth - triggerRect.left + 8}px`,
          transform: `translateY(-50%)`,
        };
      case "right":
        return {
          ...baseStyle,
          top: `${triggerRect.top + triggerRect.height / 2}px`,
          left: `${triggerRect.right + 8}px`,
          transform: `translateY(-50%)`,
        };
      default:
        return baseStyle;
    }
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
        style={{ display: "inline-block", cursor: "pointer" }}
        role={trigger === "hover" ? undefined : "button"}
        tabIndex={trigger === "hover" ? -1 : 0}
        onKeyDown={(e) => {
          if (trigger !== "hover" && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        {children}
      </div>
      {isOpen &&
        containerRef.current &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`px-3 py-2 rounded-lg text-sm shadow-lg ${overlayClassName}`}
            style={{
              ...getPositionStyle(),
              backgroundColor: color,
              color: color === "white" ? "#000" : "#fff",
              pointerEvents: "none",
              overflow: "visible",
              maxHeight: "none",
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
            <div style={{ position: "relative", zIndex: 1 }}>{title}</div>
            {/* Tooltip 箭头 */}
            <div
              className="absolute w-0 h-0"
              style={{
                zIndex: 2,
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
