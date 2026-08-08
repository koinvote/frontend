import { afterAll, describe, expect, it } from "vitest";

import en from "@/locals/en.json";
import ja from "@/locals/ja.json";
import ko from "@/locals/ko.json";
import zh from "@/locals/zh.json";
import i18n, { SUPPORTED_LANGUAGES } from "@/i18n";

// The switcher renders whatever SUPPORTED_LANGUAGES holds, so a language can
// reach the menu with its file half-written and nothing would fail. i18next
// does not throw on a missing key either - it falls back to English, or renders
// the dotted key path when English has not got it either. These checks compare
// each file against English key by key.

type Tree = { [key: string]: unknown };

const leafPaths = (node: unknown, prefix = ""): string[] => {
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => leafPaths(item, `${prefix}[${i}]`));
  }
  if (node && typeof node === "object") {
    return Object.entries(node as Tree).flatMap(([key, value]) =>
      leafPaths(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
};

const leafAt = (node: unknown, path: string): unknown =>
  path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc as Tree | undefined)?.[key] as unknown,
      node,
    );

const placeholdersOf = (value: unknown): string =>
  typeof value === "string"
    ? [...value.matchAll(/\{\{(\w+)\}\}/g)]
        .map((m) => m[1])
        .sort()
        .join(",")
    : "";

// The policy pages carry their own markup, which the page parses out of the
// string: <bold> for emphasis and <a>/<a1>/<a2> for the links between
// policies. The two are held to different standards below. Which phrase a
// translator emphasises is theirs to decide - the Chinese pages bold more
// than the English ones do, deliberately - but a link that goes missing in
// one language leaves that page with no route to the policy it cites.
const linksOf = (value: unknown): string =>
  typeof value === "string" ? (value.match(/<\/?a\d*>/g) ?? []).join("") : "";

const isUnbalanced = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const open: string[] = [];
  for (const tag of value.match(/<\/?[a-z0-9]+>/g) ?? []) {
    if (tag.startsWith("</")) {
      if (open.pop() !== tag.slice(2, -1)) return true;
    } else {
      open.push(tag.slice(1, -1));
    }
  }
  return open.length > 0;
};

const enPaths = leafPaths(en);
const translations: Record<string, unknown> = { zh, ja, ko };

describe("the locale files", () => {
  it("ships one file per language the switcher offers", () => {
    expect(["en", ...Object.keys(translations)].sort()).toEqual(
      SUPPORTED_LANGUAGES.map((lang) => lang.code).sort(),
    );
  });

  it.each(Object.keys(translations))(
    "translates every English key into %s",
    (code) => {
      expect(leafPaths(translations[code]).sort()).toEqual(enPaths.sort());
    },
  );

  it.each(Object.keys(translations))(
    "keeps the %s placeholders identical to English",
    (code) => {
      const drifted = enPaths.filter(
        (path) =>
          placeholdersOf(leafAt(translations[code], path)) !==
          placeholdersOf(leafAt(en, path)),
      );

      // A renamed or dropped {{name}} interpolates to an empty string, so the
      // sentence still renders - just with the number missing from it.
      expect(drifted).toEqual([]);
    },
  );

  it.each(Object.keys(translations))(
    "keeps every %s cross-policy link that English has",
    (code) => {
      const drifted = enPaths.filter(
        (path) =>
          linksOf(leafAt(translations[code], path)) !==
          linksOf(leafAt(en, path)),
      );

      expect(drifted).toEqual([]);
    },
  );

  it.each(["en", ...Object.keys(translations)])(
    "closes every %s markup tag it opens",
    (code) => {
      const file = code === "en" ? en : translations[code];

      // An unclosed <bold> does not throw; the page renders the rest of the
      // paragraph inside it, or prints the tag as text.
      expect(enPaths.filter((path) => isUnbalanced(leafAt(file, path)))).toEqual(
        [],
      );
    },
  );

  it.each(Object.keys(translations))("leaves no %s string empty", (code) => {
    const blankIn = (file: unknown) =>
      enPaths.filter((path) => {
        const value = leafAt(file, path);
        return typeof value === "string" && value.trim() === "";
      });

    // en.json has a couple of deliberately empty placeholders; those paths are
    // the only ones allowed to be blank here too.
    expect(blankIn(translations[code])).toEqual(blankIn(en));
  });
});

// Each full translation, with the strings the interface check pins: how the
// language names the language menu, and its create-event button label (both
// deliberately shortened to fit their boxes - see the PR descriptions).
const fullLocales: [string, string, string][] = [
  ["ja", "言語", "イベント作成"],
  ["ko", "언어", "이벤트 생성"],
];

describe.each(fullLocales)(
  "reading the site in %s",
  (lang, languageLabel, createEventLabel) => {
    afterAll(async () => {
      await i18n.changeLanguage("en");
    });

    it("translates the interface", async () => {
      await i18n.changeLanguage(lang);

      expect(i18n.t("menu.language")).toBe(languageLabel);
      expect(i18n.t("layout.createEventFull")).toBe(createEventLabel);
    });

    it("translates the policy pages rather than falling back to English", async () => {
      await i18n.changeLanguage(lang);

      for (const key of [
        "terms.title",
        "privacy.title",
        "charges.title",
        "rewardTerms.title",
      ]) {
        expect(i18n.t(key)).not.toBe(i18n.getFixedT("en")(key));
      }
    });

    it("states the worked examples with the same figures as the English terms", async () => {
      await i18n.changeLanguage(lang);

      // The examples have to add up in every language: these are the sums the
      // English page is checked against in legalPages.test.tsx.
      expect(i18n.t("rewardTerms.ex1_distribution_net")).toContain("8,987,999");
      expect(i18n.t("rewardTerms.ex1_final_a")).toContain("5,992,000");
      expect(i18n.t("rewardTerms.ex1_final_b")).toContain("2,995,999");
      expect(i18n.t("rewardTerms.ex2_net_reward")).toContain("34,000");
      expect(i18n.t("rewardTerms.ex2_final_a")).toContain("22,668");
      expect(i18n.t("rewardTerms.ex2_final_b")).toContain("11,332");
    });
  },
);
