import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import "@/i18n";
import ChargesnRefunds from "@/pages/chargesnrefunds";
import TermsOfRewardDistribution from "@/pages/terms/TermsOfRewardDistribution";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import type { SystemConfigRes } from "@/api/response";

// The service fee, the free allowance, the hourly rate and the dust threshold
// are fetched, not compiled in - an admin can change any of them. That leaves a
// window on every first render, and forever if the request fails, where the
// pages have no figure to show. They used to fall back to 0 and print "a
// platform service fee of 0%" and "a minimum payout threshold of 0 sats". These
// are the two pages that state what the platform charges, so a placeholder that
// reads as "we do not know yet" is the only honest stand-in for a number we do
// not have; "--" is what satsToBtc already renders for an unknown amount.

const params = {
  platform_fee_percentage: 10,
  dust_threshold_satoshi: 600,
  free_hours: 72,
  satoshi_per_duration_hour: 50000,
} as SystemConfigRes;

const textOf = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>).container.textContent ?? "";

describe("fee figures on the pages that state what the platform charges", () => {
  beforeEach(() => {
    useSystemParametersStore.setState({ params: null });
  });

  it("does not claim a zero service fee before the parameters arrive", () => {
    const text = textOf(<ChargesnRefunds />);

    expect(text).not.toMatch(/service fee of 0%/i);
    expect(text).toContain("service fee of --%");
  });

  it("does not claim a zero payout threshold before the parameters arrive", () => {
    const text = textOf(<TermsOfRewardDistribution />);

    expect(text).not.toMatch(/threshold of 0 sats/i);
    expect(text).toContain("threshold of -- sats");
  });

  it("states the configured figures once they arrive", () => {
    useSystemParametersStore.setState({ params });

    expect(textOf(<ChargesnRefunds />)).toContain("service fee of 10%");
    expect(textOf(<TermsOfRewardDistribution />)).toContain(
      "threshold of 600 sats",
    );
  });

  // satsToBtc appends " BTC" unless told not to, and the sentence ends in
  // " BTC per hour" of its own, so the hourly rate rendered as
  // "0.00050000 BTC BTC per hour".
  it("names the currency once in the hourly rate, and drops dead zeros", () => {
    useSystemParametersStore.setState({ params });

    const text = textOf(<ChargesnRefunds />);

    expect(text).not.toContain("BTC BTC");
    expect(text).not.toContain("0.00050000");
    expect(text).toContain("0.0005 BTC per hour");
  });
});
