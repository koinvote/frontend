import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventSummary } from "@/pages/create-event/types";

import { TranslationBar } from "./TranslationBar";
import { useContentTranslation } from "./useContentTranslation";
import { useTranslatedEvent } from "./useTranslatedEvent";

// t() resolves language names from a tiny dictionary (the real files carry
// them per locale) and everything else from the inline English fallback the
// call sites provide.
vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, fallback: string, vars?: Record<string, unknown>) => {
      if (key.startsWith("contentTranslation.languageNames.")) {
        const names: Record<string, string> = {
          en: "English",
          zh: "Chinese",
          ja: "Japanese",
        };
        return names[key.split(".").pop() ?? ""] ?? "";
      }
      return vars
        ? fallback.replace(/\{\{(\w+)\}\}/g, (_m, name) =>
            String(vars[name] ?? ""),
          )
        : fallback;
    },
  }),
}));

// A minimal content block the way pages use the pieces: text follows the
// toggle, the bar appears only when a translation exists.
function DemoBlock({
  original,
  translation,
  sourceLocale,
}: {
  original: string;
  translation?: string;
  sourceLocale?: string;
}) {
  const { hasTranslation, showingTranslation, toggle } = useContentTranslation(
    translation !== undefined,
  );
  return (
    <div>
      <p data-testid="content">
        {showingTranslation && translation !== undefined
          ? translation
          : original}
      </p>
      {hasTranslation && (
        <TranslationBar
          sourceLocale={sourceLocale}
          showingTranslation={showingTranslation}
          onToggle={toggle}
        />
      )}
    </div>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("translated content block", () => {
  it("shows the translation by default, with attribution and Show original", () => {
    render(
      <DemoBlock
        original="Should X be adopted?"
        translation="Xを採用すべきか？"
        sourceLocale="en"
      />,
    );
    expect(screen.getByTestId("content")).toHaveTextContent(
      "Xを採用すべきか？",
    );
    expect(screen.getByText("Translated from English")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show original" }),
    ).toBeInTheDocument();
  });

  it("toggles to the exact canonical original in place, and back", async () => {
    // Deliberately awkward original: leading spaces, inner newline, trailing
    // whitespace. "Show original" must reproduce it verbatim — the text is
    // committed to inside a Bitcoin-signed plaintext, nothing may tidy it.
    const original = "  two  spaces\nand a newline  ";
    render(
      <DemoBlock original={original} translation="翻訳" sourceLocale="en" />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Show original" }));
    expect(screen.getByTestId("content").textContent).toBe(original);
    // While the original is showing, no "translated from" claim remains —
    // only the way back.
    expect(screen.queryByText("Translated from English")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Show translation" }),
    );
    expect(screen.getByTestId("content").textContent).toBe("翻訳");
    expect(screen.getByText("Translated from English")).toBeInTheDocument();
  });

  it("touches neither the global language, stored preference, nor the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const langBefore = document.documentElement.lang;

    render(<DemoBlock original="orig" translation="übersetzt" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Show original" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Show translation" }),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(document.documentElement.lang).toBe(langBefore);
    vi.unstubAllGlobals();
  });

  it("shows the original with no affordance when no translation exists", () => {
    render(<DemoBlock original="plain original" />);
    expect(screen.getByTestId("content")).toHaveTextContent("plain original");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("falls back to a generic machine-translated label for unknown sources", () => {
    render(
      <DemoBlock original="o" translation="t" sourceLocale="tlh" />,
    );
    expect(screen.getByText("Machine translated")).toBeInTheDocument();
    expect(screen.queryByText(/Translated from/)).toBeNull();
  });

  it("names regional Chinese sources as Chinese", () => {
    render(<DemoBlock original="o" translation="t" sourceLocale="zh-TW" />);
    expect(screen.getByText("Translated from Chinese")).toBeInTheDocument();
  });

  it("renders hostile translation output as inert text, exactly like originals", () => {
    const hostile = '<img src=x onerror="window.pwned=1"><script>bad</script>';
    render(<DemoBlock original="safe" translation={hostile} />);
    const content = screen.getByTestId("content");
    expect(content.textContent).toBe(hostile);
    expect(content.querySelector("img")).toBeNull();
    expect(content.querySelector("script")).toBeNull();
    expect(
      (window as unknown as Record<string, unknown>).pwned,
    ).toBeUndefined();
  });
});

describe("useTranslatedEvent", () => {
  const baseEvent = () =>
    ({
      title: "Should X be adopted?",
      description: "Original description",
      event_type: "single_choice",
      options: [
        {
          id: 11,
          option_text: "Support",
          order: 1,
          weight_percent: 60,
          total_stake_satoshi: 100,
        },
        {
          id: 12,
          option_text: "Oppose",
          order: 2,
          weight_percent: 40,
          total_stake_satoshi: 50,
        },
      ],
      top_replies: [
        { id: "11", body: "Support", weight_percent: 60, amount_satoshi: "100" },
      ],
      translation: {
        target_locale: "ja",
        source_locale: "en",
        title: "Xを採用すべきか？",
        description: "翻訳された説明",
        options: { "11": "賛成", "12": "反対" },
      },
    }) as unknown as EventSummary;

  it("substitutes title, description, options and option previews as one unit", () => {
    const { result } = renderHook(() => useTranslatedEvent(baseEvent()));

    const view = result.current.viewEvent;
    expect(view.title).toBe("Xを採用すべきか？");
    expect(view.description).toBe("翻訳された説明");
    const options = view.options as { id: number; option_text: string }[];
    expect(options.map((o) => o.option_text)).toEqual(["賛成", "反対"]);
    // Single-choice previews are option texts and follow the unit.
    expect(view.top_replies[0].body).toBe("賛成");
    expect(result.current.sourceLocale).toBe("en");
  });

  it("returns the untouched canonical object when the toggle shows the original", () => {
    const event = baseEvent();
    const { result } = renderHook(() => useTranslatedEvent(event));

    act(() => result.current.toggle());
    expect(result.current.showingTranslation).toBe(false);
    expect(result.current.viewEvent.title).toBe("Should X be adopted?");
    const options = result.current.viewEvent.options as {
      option_text: string;
    }[];
    expect(options.map((o) => o.option_text)).toEqual(["Support", "Oppose"]);
    expect(result.current.viewEvent.top_replies[0].body).toBe("Support");

    act(() => result.current.toggle());
    expect(result.current.viewEvent.title).toBe("Xを採用すべきか？");
  });

  it("keeps fields without a translation on their originals", () => {
    const event = baseEvent();
    event.translation = {
      target_locale: "ja",
      source_locale: "en",
      title: "Xを採用すべきか？",
      // no description, and only option 11 translated
      options: { "11": "賛成" },
    };
    const { result } = renderHook(() => useTranslatedEvent(event));
    const view = result.current.viewEvent;
    expect(view.title).toBe("Xを採用すべきか？");
    expect(view.description).toBe("Original description");
    const options = view.options as { option_text: string }[];
    expect(options.map((o) => o.option_text)).toEqual(["賛成", "Oppose"]);
  });

  it("translates open-event reply previews independently of the unit toggle", () => {
    const event = baseEvent();
    event.event_type = "open";
    event.top_replies = [
      {
        id: "7",
        body: "I agree with this",
        body_translation: "これに賛成します",
        weight_percent: 10,
        amount_satoshi: "5",
      },
    ];
    const { result } = renderHook(() => useTranslatedEvent(event));
    expect(result.current.viewEvent.top_replies[0].body).toBe(
      "これに賛成します",
    );

    // Event unit toggled to original: another author's reply preview keeps
    // its own translation — it is not part of this unit.
    act(() => result.current.toggle());
    expect(result.current.viewEvent.top_replies[0].body).toBe(
      "これに賛成します",
    );
  });

  it("reports no translation for an event without one", () => {
    const event = baseEvent();
    delete (event as { translation?: unknown }).translation;
    const { result } = renderHook(() => useTranslatedEvent(event));
    expect(result.current.hasTranslation).toBe(false);
    expect(result.current.viewEvent.title).toBe("Should X be adopted?");
  });
});
