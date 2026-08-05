import "@testing-library/jest-dom/vitest";

// jsdom implements no layout, so it ships no ResizeObserver. antd's tooltips
// and dropdowns observe their trigger to position themselves and throw without
// it. A no-op is enough: nothing here asserts on where a popup landed.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver =
    NoopResizeObserver as unknown as typeof ResizeObserver;
}

// Also absent for want of layout: infinite-scroll lists watch a sentinel
// element to decide when to fetch the next page. Nothing here scrolls, so a
// no-op that never reports an intersection is the honest stand-in.
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!("IntersectionObserver" in globalThis)) {
  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}

// Same reason: antd measures scrollbar width on first render.
if (!("matchMedia" in window)) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
