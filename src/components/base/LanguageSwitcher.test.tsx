import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n, { LANGUAGE_KEY } from "@/i18n";
import { useLanguagesStore } from "@/stores/languagesStore";
import { LanguageSwitcher } from "./LanguageSwitcher";

// These run against the real i18n instance and the real store: what is worth
// pinning down is that picking a row actually changes the site language and
// survives a reload, not that a mock got called.

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { expanded: false }));
};

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
  useLanguagesStore.setState({ current: "en" });
});

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("the language switcher", () => {
  it("names the language in use, not the one it would switch to", () => {
    render(<LanguageSwitcher />);

    // The old two-language toggle read "中文" while the site was English.
    expect(screen.getByRole("button")).toHaveTextContent("English");
  });

  it("lists every language in its own script", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await openMenu(user);

    const rows = screen.getAllByRole("menuitemradio");
    expect(rows.map((row) => row.textContent)).toEqual([
      "English",
      "中文",
      "日本語",
      "한국어",
    ]);
  });

  it("marks the language in use as checked", async () => {
    const user = userEvent.setup();
    useLanguagesStore.setState({ current: "zh" });
    render(<LanguageSwitcher />);

    await openMenu(user);

    expect(screen.getByRole("menuitemradio", { name: "中文" })).toBeChecked();
    expect(
      screen.getByRole("menuitemradio", { name: "English" }),
    ).not.toBeChecked();
  });

  it("switches the site to the language picked and remembers it", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "日本語" }));

    expect(i18n.language).toBe("ja");
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("ja");
    expect(document.documentElement.lang).toBe("ja");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes without changing anything when the language in use is picked", async () => {
    const user = userEvent.setup();
    const setLanguage = vi.spyOn(useLanguagesStore.getState(), "setLanguage");
    render(<LanguageSwitcher />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));

    expect(setLanguage).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when something outside it is clicked", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <LanguageSwitcher />
        <p>elsewhere</p>
      </div>,
    );

    await openMenu(user);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByText("elsewhere"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps Escape to itself so the drawer around it stays open", async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(
      <div onKeyDown={(e) => e.key === "Escape" && onEscape()}>
        <LanguageSwitcher />
      </div>,
    );

    await openMenu(user);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    // The mobile drawer and the header both close on a window-level Escape.
    // The first Escape belongs to this menu alone.
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("shows the icon alone when the sidebar is collapsed", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher collapsed />);

    const trigger = screen.getByRole("button");
    expect(trigger).not.toHaveTextContent("English");
    // The name still reaches a screen reader, and the menu is the same one.
    expect(trigger).toHaveAccessibleName("Language: English");

    await user.click(trigger);
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(4);
  });
});
