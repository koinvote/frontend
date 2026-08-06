import type { GetReceiptVerifyPubKeysRes } from "@/api/response";
import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
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
  });
});
