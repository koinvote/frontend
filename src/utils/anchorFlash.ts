type AnchorFlashOptions = {
  hash: string;
  elementId?: string;
  durationMs?: number;
  color?: string;
};

const STYLE_ID = "anchor-flash-style";

function getHeaderOffset() {
  if (typeof window === "undefined") return 0;
  const header = document.querySelector("header");
  if (!header) return 0;
  const style = window.getComputedStyle(header);
  if (style.position !== "fixed" && style.position !== "sticky") return 0;
  return Math.ceil(header.getBoundingClientRect().height);
}

function ensureStyle(color: string, durationMs: number) {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes anchorFlash {
      0% { color: ${color}; }
      100% { color: var(--anchor-original-color); }
    }
    .anchor-flash-text {
      animation: anchorFlash ${durationMs}ms ease-in-out;
    }
    .anchor-flash-text *[data-anchor-flash] {
      animation: anchorFlash ${durationMs}ms ease-in-out;
    }
    .anchor-flash-text::marker {
      color: ${color};
      animation: anchorFlash ${durationMs}ms ease-in-out;
    }
    .anchor-flash-text li::marker {
      color: ${color};
      animation: anchorFlash ${durationMs}ms ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

export function setupAnchorFlash(options: AnchorFlashOptions) {
  const {
    hash,
    elementId = hash,
    durationMs = 1500,
    color = "#f97316",
  } = options;

  if (typeof window === "undefined") return () => {};
  ensureStyle(color, durationMs);

  const className = "anchor-flash-text";
  let timer: number | undefined;

  const setOriginalColors = (el: HTMLElement) => {
    const originalColor = window.getComputedStyle(el).color;
    el.style.setProperty("--anchor-original-color", originalColor);
    el.setAttribute("data-anchor-flash", "");

    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        setOriginalColors(child);
      }
    });
  };

  const clearOriginalColors = (el: HTMLElement) => {
    el.style.removeProperty("--anchor-original-color");
    el.removeAttribute("data-anchor-flash");

    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        clearOriginalColors(child);
      }
    });
  };

  const highlight = (attempt = 0) => {
    if (!window.location.hash.includes(hash)) return;
    const target = document.getElementById(elementId);
    if (!target) return;

    const offset = getHeaderOffset();
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top) });

    // Set original color for each element
    setOriginalColors(target);

    target.classList.remove(className);
    void target.offsetWidth;
    target.classList.add(className);

    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      target.classList.remove(className);
      clearOriginalColors(target);
    }, durationMs);

    if (offset === 0 && attempt < 2 && document.querySelector("header")) {
      window.setTimeout(() => highlight(attempt + 1), 120);
    }
  };

  const triggerHighlight = () => highlight();

  if (document.readyState === "complete") {
    window.requestAnimationFrame(triggerHighlight);
  } else {
    window.addEventListener("load", triggerHighlight, { once: true });
  }

  window.addEventListener("hashchange", triggerHighlight);

  return () => {
    window.removeEventListener("load", triggerHighlight);
    window.removeEventListener("hashchange", triggerHighlight);
    if (timer) window.clearTimeout(timer);
  };
}
