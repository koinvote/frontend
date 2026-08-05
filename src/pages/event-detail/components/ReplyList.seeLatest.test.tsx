import type { GetListRepliesRes, Reply } from "@/api/response";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReplyList } from "./ReplyList";

// A BTC-Time score belongs to an address for a whole event, not to a single
// reply, so re-voting leaves it untouched. The reply list shows the voided
// card alongside the current one, and both carry the same address-level
// score - which reads as if the score had been counted twice. These tests
// cover the voided card pointing at the current one instead of repeating it.

const showToast = vi.fn();
const fetchNextPage = vi.fn();
let queryState: {
  pages: (GetListRepliesRes | null)[];
  hasNextPage: boolean;
};

vi.mock("react-i18next", () => ({
  // src/i18n.ts is pulled in through the api module and calls this on import.
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (_key: string, fallback: string, vars?: Record<string, unknown>) =>
      vars
        ? fallback.replace(/\{\{(\w+)\}\}/g, (_m, name) =>
            String(vars[name] ?? ""),
          )
        : fallback,
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
    fetchNextPage,
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
    holding_score: "1,284.5",
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

function renderList() {
  return render(<ReplyList eventId="evt_1" eventStatus={1} />);
}

// The voided card is collapsed until the eye toggle is used, which is where
// the score block (and now the link) lives.
async function expandCard(replyId: number) {
  const card = document.getElementById(`reply-card-${replyId}`);
  if (!card) throw new Error(`card ${replyId} not rendered`);
  const toggle = within(card as HTMLElement)
    .getAllByRole("button")
    .find((b) => b.querySelector("svg") && !b.textContent?.trim());
  if (!toggle) throw new Error(`no expand toggle on card ${replyId}`);
  await userEvent.click(toggle);
  return card as HTMLElement;
}

// Records which element was scrolled to, not just that something was: the
// whole point of the link is that it lands on the right card.
let scrolledInto: Element[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  queryState = { pages: [], hasNextPage: false };
  scrolledInto = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolledInto.push(this);
  };
});

describe("voided reply card", () => {
  it("links to the current reply instead of repeating the address's score", async () => {
    queryState.pages = [
      page([
        reply({ id: 11, is_reply_valid: false }),
        reply({ id: 12, is_reply_valid: true }),
      ]),
    ];
    renderList();

    const voided = await expandCard(11);
    expect(
      within(voided).getByRole("button", {
        name: "See this address's latest reply",
      }),
    ).toBeInTheDocument();
    expect(within(voided).queryByText("1,284.5")).not.toBeInTheDocument();
    // The label stays so the card keeps its shape; only the figure and the
    // Accumulating/Paused status - both statements about the address, not
    // about this card - give way to the link.
    expect(within(voided).getByText("Holding Score")).toBeInTheDocument();
    expect(within(voided).queryByText("Accumulating")).not.toBeInTheDocument();
    expect(within(voided).queryByText("Paused")).not.toBeInTheDocument();
  });

  it("still shows the score on the address's current reply", () => {
    queryState.pages = [page([reply({ id: 12, is_reply_valid: true })])];
    renderList();

    const current = document.getElementById("reply-card-12") as HTMLElement;
    expect(within(current).getByText("1,284.5")).toBeInTheDocument();
    expect(
      within(current).queryByRole("button", {
        name: "See this address's latest reply",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows no link on events that never had a holding score", async () => {
    queryState.pages = [
      page([
        reply({ id: 11, is_reply_valid: false, holding_score: undefined }),
        reply({ id: 12, holding_score: undefined }),
      ]),
    ];
    renderList();

    const voided = await expandCard(11);
    expect(
      within(voided).queryByRole("button", {
        name: "See this address's latest reply",
      }),
    ).not.toBeInTheDocument();
  });

  it("scrolls to the current reply of the same address", async () => {
    queryState.pages = [
      page([
        reply({ id: 11, is_reply_valid: false }),
        reply({ id: 12, btc_address: "bc1qother", is_reply_valid: true }),
        reply({ id: 13, is_reply_valid: true }),
      ]),
    ];
    renderList();

    const voided = await expandCard(11);
    await userEvent.click(
      within(voided).getByRole("button", {
        name: "See this address's latest reply",
      }),
    );

    const target = document.getElementById("reply-card-13") as HTMLElement;
    await waitFor(() => expect(scrolledInto).toContain(target));
    // The card it skipped past belongs to a different address.
    const other = document.getElementById("reply-card-12") as HTMLElement;
    expect(scrolledInto).not.toContain(other);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("rings the card it landed on, then drops the ring", async () => {
    queryState.pages = [
      page([
        reply({ id: 11, is_reply_valid: false }),
        reply({ id: 13, is_reply_valid: true }),
      ]),
    ];
    renderList();

    const voided = await expandCard(11);
    await userEvent.click(
      within(voided).getByRole("button", {
        name: "See this address's latest reply",
      }),
    );

    const target = document.getElementById("reply-card-13") as HTMLElement;
    await waitFor(() => expect(target.className).toContain("ring-accent"));
    // Not a permanent state - it marks where the scroll landed and goes away.
    await waitFor(() => expect(target.className).not.toContain("ring-accent"), {
      timeout: 4000,
    });
  });

  it("pages in the current reply when it is not loaded yet, then scrolls", async () => {
    queryState.pages = [page([reply({ id: 11, is_reply_valid: false })])];
    queryState.hasNextPage = true;
    fetchNextPage.mockImplementation(async () => {
      const next = page([reply({ id: 40, is_reply_valid: true })]);
      queryState.pages = [...queryState.pages, next];
      queryState.hasNextPage = false;
      return { data: { pages: queryState.pages }, hasNextPage: false };
    });
    renderList();

    const voided = await expandCard(11);
    await userEvent.click(
      within(voided).getByRole("button", {
        name: "See this address's latest reply",
      }),
    );

    await waitFor(() => expect(fetchNextPage).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(scrolledInto.map((el) => el.id)).toContain("reply-card-40"),
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it("says so rather than scrolling nowhere when the current reply is filtered out", async () => {
    queryState.pages = [page([reply({ id: 11, is_reply_valid: false })])];
    renderList();

    const voided = await expandCard(11);
    await userEvent.click(
      within(voided).getByRole("button", {
        name: "See this address's latest reply",
      }),
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "warn",
        "The latest reply is not in the current results.",
      ),
    );
  });
});

describe("re-vote scoring", () => {
  it("shows the same score before and after a re-vote - the score is the address's, not the reply's", () => {
    queryState.pages = [
      page([reply({ id: 11, is_reply_valid: false }), reply({ id: 12 })]),
    ];
    renderList();

    // Only one card states the figure, and it is the current one: the score
    // carried across the re-vote untouched rather than restarting.
    expect(screen.getAllByText("1,284.5")).toHaveLength(1);
  });
});
