import type { PayoutWinner } from "@/api/response";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WinnerTable } from "./WinnerTable";

// This table is the public account of how a prize was split. Everything in it
// is either a figure someone can check against the chain or a figure they
// cannot — so the tests are about which columns appear for which kind of
// payout, and about not hiding rows without saying so.

vi.mock("react-i18next", () => ({
  // Render the fallback text the component passes as the second argument,
  // which is what the English build shows.
  useTranslation: () => ({
    t: (_key: string, fallback: string, vars?: Record<string, unknown>) =>
      vars
        ? fallback.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(vars[name] ?? ""))
        : fallback,
  }),
}));

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/stores/systemParametersStore", () => ({
  useSystemParametersStore: () => ({ params: { dust_threshold_satoshi: 600 } }),
}));

function winner(overrides: Partial<PayoutWinner> = {}): PayoutWinner {
  return {
    winner_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    holding_score: "337.27822686",
    score_share: "62.50%",
    average_holding_satoshi: 1_280_086,
    join_block_height: 849_500,
    distributable_rate: 62.5,
    final_reward_satoshi: 57_500,
    is_dust: false,
    original_reward_satoshi: 57_500,
    status: "completed",
    win_probability_percent: 62.5,
    ...overrides,
  };
}

function renderTable(props: Partial<Parameters<typeof WinnerTable>[0]> = {}) {
  return render(
    <WinnerTable
      winners={[winner()]}
      redistributedAddressCount={0}
      redistributedSatoshi={0}
      scoringAlgorithm="btc_time_v1"
      {...props}
    />,
  );
}

function columnHeaders() {
  return screen
    .getAllByRole("columnheader")
    .map((h) => h.textContent?.trim() ?? "");
}

beforeEach(() => vi.clearAllMocks());

describe("winner table", () => {
  it("shows the four weight columns for a BTC-Time payout", () => {
    renderTable();

    expect(columnHeaders()).toEqual([
      "Address",
      "Average Holding",
      "Join Height",
      "Holding Score",
      "Score Share",
      "Estimated reward",
      "Paid",
      "State",
    ]);
  });

  it("keeps the old two columns for a payout settled before BTC-Time", () => {
    // Those events were weighted by a plain balance and have no join height
    // and no sat-block score. Showing the new columns would present a balance
    // as something it is not.
    renderTable({
      scoringAlgorithm: undefined,
      winners: [
        winner({
          holding_score: undefined,
          score_share: undefined,
          average_holding_satoshi: undefined,
          join_block_height: undefined,
          balance_at_snapshot_satoshi: 5_000_000_000,
        }),
      ],
    });

    expect(columnHeaders()).toEqual([
      "Address",
      "Snapshot Balance",
      "Distributable",
      "Estimated reward",
      "Paid",
      "State",
    ]);
    expect(screen.queryByText("Holding Score")).toBeNull();
    expect(screen.queryByText("Join Height")).toBeNull();
  });

  it("renders the figures it was given", () => {
    renderTable();
    const row = screen.getAllByRole("row")[1];

    const cells = within(row).getAllByRole("cell").map((c) => c.textContent?.trim());
    expect(cells).toEqual([
      // Truncated to its two ends, which is what makes the column fit.
      "bc1qxy...0wlh",
      "0.01280086 BTC",
      "849,500",
      "337.27822686",
      "62.50%",
      "57,500 sats",
      "57,500 sats",
      "Completed",
    ]);
  });

  it("blanks a cell rather than inventing a number", () => {
    // A missing join height means the scoring window length is unknown, so the
    // average holding cannot be derived. Showing 0 would read as "held
    // nothing", which is a different claim.
    renderTable({
      winners: [
        winner({ average_holding_satoshi: undefined, join_block_height: undefined }),
      ],
    });
    const row = screen.getAllByRole("row")[1];

    expect(within(row).getAllByText("--")).toHaveLength(2);
  });

  it("labels the copy button for screen readers", () => {
    renderTable();
    expect(screen.getByRole("button", { name: "Copy address" })).toBeInTheDocument();
  });
});

describe("winner table with more rows than fit", () => {
  const many = Array.from({ length: 14 }, (_, i) =>
    winner({
      winner_address: `bc1qwinner${i}`,
      final_reward_satoshi: 100_000 - i * 1_000,
      is_dust: i >= 9,
      status: i >= 9 ? "redistribute" : "completed",
    }),
  );

  it("shows ten and offers the rest", () => {
    renderTable({ winners: many });

    // Ten winner rows plus the header row.
    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(
      screen.getByRole("button", { name: "Click to show the full list" }),
    ).toBeInTheDocument();
  });

  it("expands to every row and back", async () => {
    // The count used to be derived from winner_count, which excludes dust
    // winners while the rows include them, so the page could hide rows without
    // saying so - or claim rows were hidden when they were not. Returning all
    // of them and toggling here removes the arithmetic entirely.
    const user = userEvent.setup();
    renderTable({ winners: many });

    await user.click(
      screen.getByRole("button", { name: "Click to show the full list" }),
    );
    expect(screen.getAllByRole("row")).toHaveLength(15);

    await user.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(screen.getAllByRole("row")).toHaveLength(11);
  });

  it("offers no toggle when everything already fits", () => {
    renderTable({ winners: many.slice(0, 10) });

    expect(screen.queryByRole("button", { name: /show/i })).toBeNull();
  });

  it("explains the redistribution on a dust row", async () => {
    const user = userEvent.setup();
    renderTable({
      winners: [winner({ is_dust: true, status: "redistribute", final_reward_satoshi: 0 })],
      redistributedAddressCount: 3,
      redistributedSatoshi: 1_532,
    });

    expect(screen.getByText("Redistribute")).toBeInTheDocument();
    await user.hover(screen.getByRole("img", { name: "info-circle" }));
    expect(
      await screen.findByText(/3 addresses had bonuses below the minimum/),
    ).toBeInTheDocument();
  });
});
