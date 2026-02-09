import { useEffect, useRef, useState } from "react";
import styles from "./CustomSegmented.module.css";

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  block?: boolean;
  size?: "small" | "middle" | "large";
  loading?: boolean;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  block = false,
  size = "middle",
  loading = false,
  className = "",
}: SegmentedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumbStyle, setThumbStyle] = useState<{
    width: number;
    transform: string;
  }>({ width: 0, transform: "translateX(0)" });

  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Calculate thumb position based on actual button dimensions
  useEffect(() => {
    const updateThumbStyle = () => {
      const selectedButton = itemRefs.current[selectedIndex];
      const container = containerRef.current;

      if (selectedButton && container) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        const containerPadding = size === "small" ? 2 : 4;

        setThumbStyle({
          width: buttonRect.width,
          transform: `translateX(${buttonRect.left - containerRect.left - containerPadding}px)`,
        });
      }
    };

    updateThumbStyle();

    const observer = new ResizeObserver(updateThumbStyle);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [selectedIndex, options, size]);

  const handleClick = (optionValue: T, optionDisabled?: boolean) => {
    if (loading || optionDisabled) return;
    onChange(optionValue);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.segmented} ${styles[size]} ${block ? styles.block : ""} ${loading ? styles.loading : ""} ${className}`}
    >
      {/* Sliding thumb */}
      <div
        className={styles.thumb}
        style={{
          width: thumbStyle.width,
          transform: thumbStyle.transform,
        }}
      />

      {/* Options */}
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          type="button"
          className={`${styles.item} ${option.value === value ? styles.selected : ""} ${option.disabled ? styles.itemDisabled : ""}`}
          onClick={() => handleClick(option.value, option.disabled)}
        >
          <span className={styles.label}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
