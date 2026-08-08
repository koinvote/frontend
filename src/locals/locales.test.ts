import { afterAll, describe, expect, it } from "vitest";

import en from "@/locals/en.json";
import ja from "@/locals/ja.json";
import zh from "@/locals/zh.json";
import i18n, { SUPPORTED_LANGUAGES } from "@/i18n";

// The switcher renders whatever SUPPORTED_LANGUAGES holds, so a language can
// reach the menu with its file half-written and no test would fail. These
// checks compare each file against English key by key.
//
// Japanese is deliberately partial: the four policy pages are legal text and
// wait on a human translation. i18next falls back per key, so a *missing* key
// renders the English sentence, while an empty string renders nothing at all.
// That is the difference these tests pin down.
const UNTRANSLATED_IN_JA = ["privacy", "terms", "charges", "rewardTerms"];

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

const placeholdersOf = (value: unknown): string[] =>
  typeof value === "string"
    ? [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()
    : [];

const enPaths = leafPaths(en);
const translatablePaths = enPaths.filter(
  (path) => !UNTRANSLATED_IN_JA.some((section) => path.startsWith(`${section}.`)),
);

const bundles: Record<string, { file: unknown; paths: string[] }> = {
  en: { file: en, paths: enPaths },
  zh: { file: zh, paths: translatablePaths.concat() },
  ja: { file: ja, paths: translatablePaths },
};

describe("the locale files", () => {
  it("ships one file per language the switcher offers", () => {
    expect(Object.keys(bundles).sort()).toEqual(
      SUPPORTED_LANGUAGES.map((lang) => lang.code).sort(),
    );
  });

  it("translates every English key into Chinese", () => {
    expect(leafPaths(zh).sort()).toEqual(enPaths.sort());
  });

  it("translates every English key into Japanese but the policy pages", () => {
    expect(leafPaths(ja).sort()).toEqual(translatablePaths.sort());
  });

  it("leaves the Japanese policy pages absent rather than blank", () => {
    // Present-but-empty is the failure this guards: it would render a policy
    // page of blank paragraphs instead of falling back to the English text.
    for (const section of UNTRANSLATED_IN_JA) {
      expect(ja).not.toHaveProperty(section);
    }
  });

  it.each(["zh", "ja"])("keeps the %s placeholders identical to English", (code) => {
    const { file, paths } = bundles[code];
    const drifted = paths.filter(
      (path) =>
        placeholdersOf(leafAt(file, path)).join(",") !==
        placeholdersOf(leafAt(en, path)).join(","),
    );

    // A renamed or dropped {{name}} interpolates to an empty string, so the
    // sentence still renders - just with the number missing from it.
    expect(drifted).toEqual([]);
  });

  it.each(["zh", "ja"])("leaves no %s string empty", (code) => {
    const { file, paths } = bundles[code];
    const blank = paths.filter((path) => {
      const value = leafAt(file, path);
      return typeof value === "string" && value.trim() === "";
    });

    // en.json has a couple of deliberately empty placeholders; those paths are
    // the only ones allowed to be blank here too.
    const blankInEnglish = paths.filter((path) => {
      const value = leafAt(en, path);
      return typeof value === "string" && value.trim() === "";
    });

    expect(blank).toEqual(blankInEnglish);
  });
});

describe("reading the site in Japanese", () => {
  afterAll(async () => {
    await i18n.changeLanguage("en");
  });

  it("translates the interface", async () => {
    await i18n.changeLanguage("ja");

    expect(i18n.t("menu.language")).toBe("言語");
    expect(i18n.t("layout.createEventFull")).toBe("イベントを作成");
  });

  it("falls back to the English policy text rather than showing nothing", async () => {
    await i18n.changeLanguage("ja");

    // This is what the missing sections buy: a reader gets the English terms,
    // which is the state we can stand behind until a translator reviews them.
    expect(i18n.t("terms.title")).toBe(en.terms.title);
    expect(i18n.t("privacy.title")).toBe(en.privacy.title);
  });
});
