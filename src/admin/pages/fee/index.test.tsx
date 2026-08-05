import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminFeesPage from "./index";

// The fee page decides what every payout, refund and withdrawal pays a miner.
// Its failure mode is silent: a field the page reads but never sends still
// displays, still accepts input, and still reports "已儲存" — the setting just
// never changes. That already happened once on the backend side, so the round
// trip is asserted here rather than assumed.

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

// The passkey button only renders where WebAuthn exists, and jsdom has no
// authenticator. These tests drive the wallet path, which is the one always
// available.
vi.mock("@/admin/hooks/usePasskeySupport", () => ({
  usePasskeySupport: () => false,
}));

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast }),
}));

const STEP_UP_PLAINTEXT =
  "koinvote.com | type:system_parameters | bc1qadmin | 1753000000000-a1b2c3d4 | 8f14e45f";

const savedSettings = {
  payout_fee_target_blocks: 6,
  refund_fee_target_blocks: 12,
  withdrawal_fee_target_blocks: 3,
  max_payout_fee_percentage: 5,
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

// Saving is two steps now. The backend refuses this write without a fresh
// proof that the wallet or a passkey is present, so the page stages the
// payload, collects a signature, and sends both together.
async function completeStepUp(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() =>
    expect(screen.getByDisplayValue(STEP_UP_PLAINTEXT)).toBeInTheDocument(),
  );
  await user.type(
    screen.getByPlaceholderText("貼上錢包簽章"),
    "IPffff/base64signature=",
  );
  await user.click(screen.getByRole("button", { name: "以錢包簽章確認" }));
}

async function renderLoaded() {
  render(<AdminFeesPage />);
  await waitFor(() => expect(getSystemParameters).toHaveBeenCalled());
  // The three selects and the percentage input, in page order.
  await waitFor(() => expect(screen.getAllByRole("combobox")).toHaveLength(3));
  return {
    payout: screen.getAllByRole("combobox")[0],
    refund: screen.getAllByRole("combobox")[1],
    withdrawal: screen.getAllByRole("combobox")[2],
    maxPercentage: screen.getByDisplayValue("5"),
    save: screen.getByRole("button", { name: "儲存" }),
  };
}

describe("admin fee page", () => {
  it("shows the settings the backend has stored", async () => {
    const fields = await renderLoaded();

    expect(fields.payout).toHaveValue("6");
    expect(fields.refund).toHaveValue("12");
    expect(fields.withdrawal).toHaveValue("3");
    // A number input reports a numeric value.
    expect(fields.maxPercentage).toHaveValue(5);
  });

  it("offers confirmation targets, not the multipliers they replaced", async () => {
    // The old options were 0.75X/1X/1.25X applied to a constant in the config
    // file, and two of the three produced the same fee. If those ever come
    // back, the label is lying about what the number does.
    await renderLoaded();

    expect(screen.queryByRole("option", { name: /X$/ })).toBeNull();
    for (const label of [/1 個區塊/, /6 個區塊/, /25 個區塊/]) {
      expect(screen.getAllByRole("option", { name: label }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText(/mempool 建議手續費/)).toBeNull();
  });

  it("sends every changed field under the key the backend reads", async () => {
    const user = userEvent.setup();
    const fields = await renderLoaded();

    await user.selectOptions(fields.payout, "3");
    await user.selectOptions(fields.refund, "25");
    await user.selectOptions(fields.withdrawal, "1");
    await user.clear(fields.maxPercentage);
    await user.type(fields.maxPercentage, "7.5");
    await user.click(fields.save);
    await completeStepUp(user);

    await waitFor(() => expect(updateSystemParameters).toHaveBeenCalledTimes(1));
    expect(updateSystemParameters).toHaveBeenCalledWith({
      payout_fee_target_blocks: 3,
      refund_fee_target_blocks: 25,
      withdrawal_fee_target_blocks: 1,
      max_payout_fee_percentage: 7.5,
      step_up: {
        plaintext: STEP_UP_PLAINTEXT,
        nonce_timestamp: "1753000000000-a1b2c3d4",
        signature: "IPffff/base64signature=",
      },
    });
  });

  it("does not write anything until the step-up is completed", async () => {
    // The property the backend enforces with STEP_UP_REQUIRED, asserted here
    // too: pressing save must not be sufficient on its own. If this ever
    // passes with the dialog dismissed, the page is sending an unauthorised
    // write and finding out from a 403.
    const user = userEvent.setup();
    const fields = await renderLoaded();

    await user.click(fields.save);

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
    const user = userEvent.setup();
    const fields = await renderLoaded();

    await user.click(fields.save);

    await waitFor(() =>
      expect(stepUpWalletChallenge).toHaveBeenCalledWith({
        purpose: "system_parameters",
      }),
    );
  });

  it("sends numbers, not the strings the form holds", async () => {
    // The form stores everything as text because the select does. Sending
    // "6" where the backend binds an int is rejected by ShouldBindJSON, and
    // the page would report a failure with no useful cause.
    const user = userEvent.setup();
    const fields = await renderLoaded();

    await user.click(fields.save);
    await completeStepUp(user);

    await waitFor(() => expect(updateSystemParameters).toHaveBeenCalled());
    const body = updateSystemParameters.mock.calls[0][0] as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
      // step_up is the authorisation for the write, not one of the values
      // being written.
      if (key === "step_up") continue;
      expect(typeof value, `${key} was sent as ${typeof value}`).toBe("number");
    }
  });

  it("refuses a percentage outside the range the backend accepts", async () => {
    // The backend binds min=0.1,max=50. Letting a larger number through would
    // fail server-side with a binding error rather than a usable message.
    const user = userEvent.setup();
    const fields = await renderLoaded();

    await user.clear(fields.maxPercentage);
    await user.type(fields.maxPercentage, "80");
    await user.click(fields.save);

    await waitFor(() =>
      expect(screen.getByText("請輸入 0.1 到 50 之間")).toBeInTheDocument(),
    );
    expect(updateSystemParameters).not.toHaveBeenCalled();
  });
});
