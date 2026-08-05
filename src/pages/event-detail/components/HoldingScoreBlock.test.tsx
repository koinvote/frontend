import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HoldingScoreBlock } from "./HoldingScoreBlock";

// The block has to hold its shape for the whole life of an event. The figure
// is what a participant can recompute from the chain and watches climb while
// the event runs; the share is what it bought them once it settled. Dropping
// the figure at settlement would take away the number they had been reading
// all along, so both are shown - the share qualifies the figure rather than
// replacing it.

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

vi.mock("@/stores/homeStore", () => ({
  useHomeStore: () => ({ isDesktop: true }),
}));

describe("HoldingScoreBlock", () => {
  it("shows the score and its live status while the event runs", () => {
    render(
      <HoldingScoreBlock
        holdingScore="2,423.4"
        currentBalanceSatoshi={600000}
      />,
    );

    expect(screen.getByText("Holding Score")).toBeInTheDocument();
    expect(screen.getByText("2,423.4")).toBeInTheDocument();
    expect(screen.getByText("Accumulating")).toBeInTheDocument();
    expect(screen.queryByText("Score Share")).not.toBeInTheDocument();
  });

  it("reports a spent-down address as paused rather than accumulating", () => {
    render(
      <HoldingScoreBlock holdingScore="2,423.4" currentBalanceSatoshi={0} />,
    );

    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.queryByText("Accumulating")).not.toBeInTheDocument();
  });

  it("keeps the settled score and adds its share once the event has settled", () => {
    render(
      <HoldingScoreBlock
        holdingScore="2,423.4"
        scoreShare="12.84%"
        currentBalanceSatoshi={600000}
      />,
    );

    expect(screen.getByText("Holding Score")).toBeInTheDocument();
    expect(screen.getByText("2,423.4")).toBeInTheDocument();
    expect(screen.getByText("Score Share")).toBeInTheDocument();
    expect(screen.getByText("12.84%")).toBeInTheDocument();
  });

  it("drops the live status once settled, whatever the address now holds", () => {
    // The balance still says "accumulating" - the event is over, so saying so
    // would claim the score is still moving after it was fixed.
    render(
      <HoldingScoreBlock
        holdingScore="2,423.4"
        scoreShare="12.84%"
        currentBalanceSatoshi={600000}
      />,
    );

    expect(screen.queryByText("Accumulating")).not.toBeInTheDocument();
    expect(screen.queryByText("Paused")).not.toBeInTheDocument();
  });

  it("renders nothing at all without a score, rather than a zero", () => {
    const { container } = render(
      <HoldingScoreBlock currentBalanceSatoshi={600000} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
