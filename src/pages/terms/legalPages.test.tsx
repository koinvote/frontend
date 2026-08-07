import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { afterAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import ChargesnRefunds from "@/pages/chargesnrefunds";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import TermsOfRewardDistribution from "@/pages/terms/TermsOfRewardDistribution";

// The four public policy pages pull every sentence from the locale files. A key
// that exists in one language and not the other, or a key the page asks for and
// neither file defines, does not throw - i18next renders the key itself, so the
// page quietly shows "rewardTerms.s3_4" to a user. Rendering each page in both
// languages and looking for that shape is the only check that catches it.

const pages: [string, ReactElement][] = [
  ["Terms of Service", <Terms />],
  ["Terms of Reward Distribution", <TermsOfRewardDistribution />],
  ["Charges and Refunds", <ChargesnRefunds />],
  ["Privacy Policy", <Privacy />],
];

const textOf = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>).container.textContent ?? "";

afterAll(async () => {
  await i18n.changeLanguage("en");
});

describe.each(["en", "zh"])("the policy pages in %s", (lang) => {
  it.each(pages)("renders %s with every key resolved", async (_name, ui) => {
    await i18n.changeLanguage(lang);

    const text = textOf(ui);

    // An unresolved key renders as its own dotted path.
    expect(text).not.toMatch(/\b(terms|rewardTerms|charges|privacy)\.[a-z]/i);
    expect(text.length).toBeGreaterThan(500);
  });

  it("dates every policy page", async () => {
    await i18n.changeLanguage(lang);

    for (const [, ui] of pages) {
      expect(textOf(ui)).toMatch(lang === "en" ? /Last updated/ : /最後更新/);
    }
  });
});

describe("what the reward terms state", () => {
  it("weights the draw by holding score, not by a balance snapshot", async () => {
    await i18n.changeLanguage("en");

    const text = textOf(<TermsOfRewardDistribution />);

    expect(text).toContain("holding score");
    expect(text).toContain("hash of the seed block");
    expect(text).not.toMatch(/balance snapshot/i);
    expect(text).not.toMatch(/snapshot block/i);
  });

  // Every figure below is checked against the settlement code; the examples
  // have to add up, because the previous pair did not - one step called the
  // dust 472 sats and the next redistributed 514.
  it("keeps the worked examples balanced", async () => {
    await i18n.changeLanguage("en");

    const text = textOf(<TermsOfRewardDistribution />);

    // Example 1: 5,991,999 + 2,995,999 + the 1 sat remainder = 8,987,999.
    expect(text).toContain("8,987,999");
    expect(text).toContain("5,992,000");
    expect(text).toContain("2,995,999");

    // Example 2: 22,668 + 11,332 = 34,000, with C's 775 sats of dust
    // redistributed as 516 + 258 and never restated as another figure.
    expect(text).toContain("34,000");
    expect(text).toContain("22,668");
    expect(text).toContain("11,332");
    expect(text).not.toContain("514");
  });
});
