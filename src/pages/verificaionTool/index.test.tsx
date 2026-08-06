import type { GetReceiptVerifyPubKeysRes } from "@/api/response";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerificationTool from "./index";

// The public key list is what a receipt is checked against, so the two things
// that must hold are that every published key is shown once, and that a
// retired key is visibly retired. Without the label an old receipt looks like
// it is being verified against the wrong key, when it is being verified
// against the right one.
//
// The rest of this page is static prose, deliberately untested: asserting on
// copy only produces a test that breaks whenever the copy is improved.

const pubKeys = vi.hoisted(() => ({ value: [] as GetReceiptVerifyPubKeysRes[] }));

vi.mock("@/api/index", () => ({
  API: {
    getReceiptVerifyPubKeys: () => Promise.resolve({ data: pubKeys.value }),
  },
}));

// Resolve against the real English file rather than returning the fallback,
// so the command comparison below is checking the strings that actually ship.
vi.mock("react-i18next", async () => {
  const en = (await import("@/locals/en.json")).default as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslation: () => ({
      t: (key: string, fallback: string) => {
        const [namespace, name] = key.split(".");
        return en[namespace]?.[name] ?? fallback;
      },
    }),
  };
});

const copyText = (
  (await import("@/locals/en.json")).default as {
    verificationTool: Record<string, string>;
  }
).verificationTool.codeBlockContentForCopy;

const showToast = vi.hoisted(() => vi.fn());

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast }),
}));

vi.mock("@/hooks/useBack", () => ({
  useBackIfInternal: () => vi.fn(),
}));

function key(overrides: Partial<GetReceiptVerifyPubKeysRes> = {}) {
  return {
    kid: "kvpub_1",
    public_key: "ED/kBYrzVcJp07jrGCMvRMvgSeJjdgidkiLF1TWVMyo=",
    alg: "ed25519",
    active: true,
    created_at: "2026-02-01T08:29:22Z",
    ...overrides,
  };
}

function setClipboard(value: { writeText: (t: string) => Promise<void> } | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("VerificationTool commands", () => {
  beforeEach(() => {
    pubKeys.value = [];
    showToast.mockClear();
  });

  it("copies exactly the commands it displays", async () => {
    // The two live in different places - plain text for the clipboard,
    // coloured JSX for the screen - so they drift the moment one is edited
    // alone. Whitespace is ignored because <br> carries no text content;
    // what must match is the sequence of characters a reader would paste.
    // Queried through the DOM rather than by text, because the commands are
    // broken across nested spans for colouring and no text query spans them.
    const { container } = render(<VerificationTool />);

    const shown = container.querySelector("pre");
    const strip = (s: string) => s.replace(/\s+/g, "");

    expect(shown).not.toBeNull();
    expect(strip(shown!.textContent ?? "")).toBe(strip(copyText));
  });

  // Announcing a copy that did not happen is the worst outcome here: the
  // reader walks away believing they hold the commands. Both ways it can
  // fail have to reach the error toast.
  it("reports failure when the browser exposes no clipboard", async () => {
    setClipboard(undefined);
    render(<VerificationTool />);

    await userEvent.click(screen.getByRole("button", { name: /copy code/i }));

    expect(showToast).toHaveBeenCalledWith("error", expect.any(String));
    expect(showToast).not.toHaveBeenCalledWith("success", expect.any(String));
  });

  it("reports failure when the copy is rejected", async () => {
    setClipboard({ writeText: () => Promise.reject(new Error("denied")) });
    render(<VerificationTool />);

    await userEvent.click(screen.getByRole("button", { name: /copy code/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("error", expect.any(String));
    });
    expect(showToast).not.toHaveBeenCalledWith("success", expect.any(String));
  });

  it("reports success when the copy goes through", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    render(<VerificationTool />);

    await userEvent.click(screen.getByRole("button", { name: /copy code/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("success", expect.any(String));
    });
    expect(writeText).toHaveBeenCalledWith(copyText);
  });
});

describe("VerificationTool public key list", () => {
  beforeEach(() => {
    pubKeys.value = [];
  });

  it("renders the list without React complaining about missing keys", async () => {
    // Asserting on the warning rather than on the output, because that is
    // where the defect showed: a list item without a key renders correctly
    // and only warns. Delete key={item.kid} from the component and this
    // fails, which is the point of it.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    pubKeys.value = [key(), key({ kid: "kvpub_2", public_key: "MCowBQYDK2VwAyEAAU6pF7U4" })];

    render(<VerificationTool />);

    await waitFor(() => {
      expect(screen.getByText(/kid \(kvpub_1\)/)).toBeInTheDocument();
    });
    expect(screen.getByText(/kid \(kvpub_2\)/)).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("unique \"key\" prop"),
      expect.anything(),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  // This is the case in production today: the backend sets active on first
  // sight and never clears it, so a badge on every row would be a column of
  // identical decoration.
  it("shows no status labels while every key is in use", async () => {
    pubKeys.value = [key(), key({ kid: "kvpub_2", public_key: "MCowBQYDK2Vw" })];

    render(<VerificationTool />);

    await waitFor(() => {
      expect(screen.getByText(/kid \(kvpub_2\)/)).toBeInTheDocument();
    });
    expect(screen.queryByText("In use")).not.toBeInTheDocument();
    expect(screen.queryByText("Retired")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/still correct for receipts signed/),
    ).not.toBeInTheDocument();
  });

  it("marks a retired key as retired and a current one as in use", async () => {
    pubKeys.value = [
      key({ kid: "kvpub_current", active: true }),
      key({ kid: "kvpub_old", active: false, public_key: "MCowBQYDK2VwAyEAAU6pF7U4" }),
    ];

    render(<VerificationTool />);

    await waitFor(() => {
      expect(screen.getByText("Retired")).toBeInTheDocument();
    });
    expect(screen.getByText("In use")).toBeInTheDocument();
    expect(
      screen.getByText(/still correct for receipts signed/),
    ).toBeInTheDocument();
  });
});
