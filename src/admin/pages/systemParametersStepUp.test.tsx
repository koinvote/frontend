import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminRefundPage from "./refund/index";
import AdminRewardRulesPage from "./rewardRules/index";

// Three pages write to PUT /admin/system-parameters, and the same two-step save
// was applied to each. The fee page has its own tests; these cover the other
// two, because the wiring was repeated rather than shared and a repeated edit
// is exactly where one copy silently differs.
//
// Only the security-relevant half is asserted here: pressing save must not
// write anything on its own, and the challenge must be scoped to the purpose
// the backend will accept. The field mapping of each page is its own concern.

const getSystemParameters = vi.fn();
const updateSystemParameters = vi.fn();
const stepUpWalletChallenge = vi.fn();
const showToast = vi.fn();

vi.mock("@/api", () => ({
  AdminAPI: {
    getSystemParameters: () => getSystemParameters(),
    updateSystemParameters: (body: unknown) => updateSystemParameters(body),
    stepUpWalletChallenge: (body: unknown) => stepUpWalletChallenge(body),
  },
}));

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast }),
}));

// jsdom has no authenticator, so these drive the wallet path — the one that is
// always available.
vi.mock("@/admin/hooks/usePasskeySupport", () => ({
  usePasskeySupport: () => false,
}));

const STEP_UP_PLAINTEXT =
  "koinvote.com | type:system_parameters | bc1qadmin | 1753000000000-a1b2c3d4 | 8f14e45f";

const savedSettings = {
  satoshi_per_extra_winner: 6250,
  satoshi_per_duration_hour: 500,
  platform_fee_percentage: 10,
  dust_threshold_satoshi: 600,
  free_hours: 24,
  refund_service_fee_percentage: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  getSystemParameters.mockResolvedValue({ success: true, data: savedSettings });
  updateSystemParameters.mockResolvedValue({ success: true });
  stepUpWalletChallenge.mockResolvedValue({
    success: true,
    data: {
      plaintext: STEP_UP_PLAINTEXT,
      nonce_timestamp: "1753000000000-a1b2c3d4",
      expires_at: "2026-08-05T09:10:00Z",
    },
  });
});

const pages = [
  { name: "refund", Page: AdminRefundPage },
  { name: "rewardRules", Page: AdminRewardRulesPage },
];

describe.each(pages)("$name page step-up", ({ Page }) => {
  async function renderAndSave() {
    const user = userEvent.setup();
    render(<Page />);
    await waitFor(() => expect(getSystemParameters).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "儲存" }));
    return user;
  }

  it("writes nothing until the step-up is completed", async () => {
    const user = await renderAndSave();

    await waitFor(() => expect(stepUpWalletChallenge).toHaveBeenCalled());
    expect(updateSystemParameters).not.toHaveBeenCalled();

    // antd puts a space between two CJK characters, so the accessible name is
    // "取 消" rather than "取消".
    await user.click(screen.getByRole("button", { name: /取\s*消/ }));
    expect(updateSystemParameters).not.toHaveBeenCalled();
  });

  it("asks for a step-up scoped to the system parameters", async () => {
    // A proof is spendable only on the purpose it was issued for. Asking for
    // the wrong one would produce a signature the backend refuses.
    await renderAndSave();

    await waitFor(() =>
      expect(stepUpWalletChallenge).toHaveBeenCalledWith({
        purpose: "system_parameters",
      }),
    );
  });

  it("sends the proof together with the change once it is signed", async () => {
    const user = await renderAndSave();

    await waitFor(() =>
      expect(screen.getByDisplayValue(STEP_UP_PLAINTEXT)).toBeInTheDocument(),
    );
    await user.type(
      screen.getByPlaceholderText("貼上錢包簽章"),
      "IPffff/base64signature=",
    );
    await user.click(screen.getByRole("button", { name: "以錢包簽章確認" }));

    await waitFor(() => expect(updateSystemParameters).toHaveBeenCalledTimes(1));

    const body = updateSystemParameters.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(body.step_up).toEqual({
      plaintext: STEP_UP_PLAINTEXT,
      nonce_timestamp: "1753000000000-a1b2c3d4",
      signature: "IPffff/base64signature=",
    });
  });
});
