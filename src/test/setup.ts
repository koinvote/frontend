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
