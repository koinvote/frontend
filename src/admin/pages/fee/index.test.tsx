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
const showToast = vi.fn();

vi.mock("@/api", () => ({
  AdminAPI: {
    getSystemParameters: () => getSystemParameters(),
    updateSystemParameters: (body: unknown) => updateSystemParameters(body),
  },
}));

vi.mock("@/components/base/Toast/useToast", () => ({
  useToast: () => ({ showToast }),
}));

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
});

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

    await waitFor(() => expect(updateSystemParameters).toHaveBeenCalledTimes(1));
    expect(updateSystemParameters).toHaveBeenCalledWith({
      payout_fee_target_blocks: 3,
      refund_fee_target_blocks: 25,
      withdrawal_fee_target_blocks: 1,
      max_payout_fee_percentage: 7.5,
    });
  });

  it("sends numbers, not the strings the form holds", async () => {
    // The form stores everything as text because the select does. Sending
    // "6" where the backend binds an int is rejected by ShouldBindJSON, and
    // the page would report a failure with no useful cause.
    const user = userEvent.setup();
    const fields = await renderLoaded();

    await user.click(fields.save);

    await waitFor(() => expect(updateSystemParameters).toHaveBeenCalled());
    const body = updateSystemParameters.mock.calls[0][0] as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
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
