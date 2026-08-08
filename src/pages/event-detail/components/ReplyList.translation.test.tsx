import type { GetListRepliesRes, Reply } from "@/api/response";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReplyList } from "./ReplyList";

// The reply list is where per-content translation matters most: every reply
// is its own author and its own toggle. These tests run the real component
// with the query layer mocked, so what is asserted is exactly what a reader
// sees — including that toggling one reply leaves its neighbours alone.

const showToast = vi.fn();
let queryState: {
  pages: (GetListRepliesRes | null)[];
  hasNextPage: boolean;
};

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, fallback: string, vars?: Record<string, unknown>) => {
      if (key.startsWith("contentTranslation.languageNames.")) {
        const names: Record<string, string> = { en: "English", ja: "Japanese" };
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

vi.mock("react-router", () => ({ useNavigate: () => vi.fn() }));

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast }),
}));

vi.mock("@/stores/homeStore", () => ({
  useHomeStore: () => ({ isDesktop: true }),
}));

vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: () => ({
    data: { pages: queryState.pages },
    isLoading: false,
    isFetching: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: queryState.hasNextPage,
    isFetchingNextPage: false,
  }),
}));

function reply(overrides: Partial<Reply> = {}): Reply {
  return {
    id: 1,
    event_id: "evt_1",
    btc_address: "bc1qual0ccnxd8k40efvcrz4dhxguvl5zw9ledyejr",
    option_id: undefined,
    option_hash: null,
    content: "Lightning for everyday payments",
    content_hash: null,
    plaintext: "koinvote.com | type:open | evt_1 | 1772900001 | aa01bb",
    signature: "H10dD01122334455",
    nonce_timestamp: "1772900001",
    random_code: "aa01bb",
    is_reply_valid: true,
    balance_at_reply_satoshi: 600000,
    balance_at_snapshot_satoshi: 600000,
    balance_at_current_satoshi: 600000,
    balance_last_updated_at: "2026-03-08T05:47:16.461805Z",
    is_hidden: false,
    created_at: "2026-03-02T11:00:00Z",
    updated_at: "2026-03-02T11:00:00Z",
    ...overrides,
  } as Reply;
}

function page(replies: Reply[]): GetListRepliesRes {
  return { replies, page: 1, limit: 20, is_creator: 0 } as GetListRepliesRes;
}

function card(replyId: number): HTMLElement {
  const el = document.getElementById(`reply-card-${replyId}`);
  if (!el) throw new Error(`card ${replyId} not rendered`);
  return el as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  queryState = { pages: [], hasNextPage: false };
});

describe("reply translations in the list", () => {
  it("renders the translation by default and restores the exact original on demand", async () => {
    const original = "Lightning for everyday payments";
    queryState.pages = [
      page([
        reply({
          id: 21,
          content: original,
          translation: {
            target_locale: "ja",
            source_locale: "en",
            content: "日常の支払いにはライトニングを",
          },
        }),
      ]),
    ];
    render(<ReplyList eventId="evt_1" eventStatus={3} />);

    const c = card(21);
    expect(c).toHaveTextContent("日常の支払いにはライトニングを");
    expect(c).not.toHaveTextContent(original);
    expect(within(c).getByText("Translated from English")).toBeInTheDocument();

    await userEvent.click(
      within(c).getByRole("button", { name: "Show original" }),
    );
    expect(c).toHaveTextContent(original);
    expect(c).not.toHaveTextContent("日常の支払いにはライトニングを");

    await userEvent.click(
      within(c).getByRole("button", { name: "Show translation" }),
    );
    expect(c).toHaveTextContent("日常の支払いにはライトニングを");
  });

  it("keeps each reply's toggle independent", async () => {
    queryState.pages = [
      page([
        reply({
          id: 31,
          content: "first original",
          translation: {
            target_locale: "ja",
            source_locale: "en",
            content: "最初の翻訳",
          },
        }),
        reply({
          id: 32,
          btc_address: "bc1qsecondaddressxxxxxxxxxxxxxxxxxxxxxxxxx",
          content: "second original",
          translation: {
            target_locale: "ja",
            source_locale: "en",
            content: "二つ目の翻訳",
          },
        }),
      ]),
    ];
    render(<ReplyList eventId="evt_1" eventStatus={3} />);

    await userEvent.click(
      within(card(31)).getByRole("button", { name: "Show original" }),
    );

    expect(card(31)).toHaveTextContent("first original");
    // The neighbour still shows its translation.
    expect(card(32)).toHaveTextContent("二つ目の翻訳");
    expect(card(32)).not.toHaveTextContent("second original");
  });

  it("shows untranslated replies as-is, with no translation affordance", () => {
    queryState.pages = [page([reply({ id: 41, content: "same language" })])];
    render(<ReplyList eventId="evt_1" eventStatus={3} />);

    const c = card(41);
    expect(c).toHaveTextContent("same language");
    expect(within(c).queryByText(/Show original|Show translation/)).toBeNull();
  });

  it("never sends a network request when toggling", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    queryState.pages = [
      page([
        reply({
          id: 51,
          content: "orig",
          translation: {
            target_locale: "ja",
            source_locale: "en",
            content: "訳",
          },
        }),
      ]),
    ];
    render(<ReplyList eventId="evt_1" eventStatus={3} />);

    const c = card(51);
    await userEvent.click(
      within(c).getByRole("button", { name: "Show original" }),
    );
    await userEvent.click(
      within(c).getByRole("button", { name: "Show translation" }),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
