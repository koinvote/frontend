import { useLocation, useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { Divider } from "antd";
import { Button } from "@/components/base/Button";
import { useToast } from "@/components/base/Toast/useToast";
import type { EventType } from "@/api/types";
import CopyIcon from "@/assets/icons/copy.svg?react";
import BTCIcon from "@/assets/icons/btc.svg?react";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { satsToBtc } from "@/utils/formatter";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";

const COUNTDOWN_MINUTES = 15;
const SATS_PER_BTC = 100_000_000;
const MIN_REFUND_THRESHOLD = 0.0005; // 0.0005 BTC

type PreviewEventState = {
  creatorAddress: string;
  title: string;
  description: string;
  hashtag: string;
  eventType: EventType;
  isRewarded: boolean;
  rewardBtc?: string;
  maxRecipient?: number;
  durationHours: number;
  refundAddress?: string;
  options?: string[];
  enablePreheat: boolean;
  preheatHours?: number;
};

function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function formatBtcDisplay(btc: string): string {
  // Remove trailing zeros
  return parseFloat(btc).toString();
}

export default function ConfirmPay() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();

  const systemParams = useSystemParametersStore((s) => s.params);

  const [countdown, setCountdown] = useState(COUNTDOWN_MINUTES * 60);

  // Initialize countdown timer
  useEffect(() => {
    if (!state) return;

    const expirationTime = Date.now() + COUNTDOWN_MINUTES * 60 * 1000;
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // Calculate platform fee for non-reward events
  // Formula: [Duration - free_hours] × satoshi_per_duration_hour × platform_fee_percentage
  const platformFeeSatoshi = useMemo(() => {
    // Only calculate for non-reward events
    if (state?.isRewarded) return null;

    // Check if system parameters are loaded
    if (!systemParams) return null;

    const duration = state?.durationHours ?? 0;
    const freeHours = systemParams.free_hours ?? 0;
    const satoshiPerDurationHour = systemParams.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = systemParams.platform_fee_percentage ?? 0;

    // If duration is invalid or not provided, return null
    if (!Number.isFinite(duration) || duration <= 0) return null;

    // If free_hours is 0, it means no free hours, calculate for full duration
    // If duration <= free_hours, platform fee is 0
    const billableHours =
      freeHours > 0 ? Math.max(0, duration - freeHours) : duration;

    // If no billable hours, platform fee is 0
    if (billableHours <= 0) return 0;

    // Calculate: billableHours × satoshi_per_duration_hour × platform_fee_percentage
    const fee =
      billableHours * satoshiPerDurationHour * (platformFeePercentage / 100);

    // Round to nearest satoshi
    return Math.round(fee);
  }, [state?.isRewarded, state?.durationHours, systemParams]);

  // Calculate preheat fee
  // Formula: preheatHours × satoshi_per_duration_hour × platform_fee_percentage × (0.2 + 0.8 × preheatHours / 720)
  const preheatFeeSatoshi = useMemo(() => {
    // Only calculate if preheat is enabled
    if (
      !state?.enablePreheat ||
      !state?.preheatHours ||
      state.preheatHours <= 0
    ) {
      return null;
    }

    // Check if system parameters are loaded
    if (!systemParams) return null;

    const preheatHoursNum = state.preheatHours;
    const satoshiPerDurationHour = systemParams.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = systemParams.platform_fee_percentage ?? 0;

    // Validate preheat hours (must be between 1 and 720)
    if (preheatHoursNum < 1 || preheatHoursNum > 720) {
      return null;
    }

    // Calculate: preheatHours × satoshi_per_duration_hour × platform_fee_percentage × (0.2 + 0.8 × preheatHours / 720)
    const multiplier = 0.2 + 0.8 * (preheatHoursNum / 720);
    const fee =
      preheatHoursNum *
      satoshiPerDurationHour *
      (platformFeePercentage / 100) *
      multiplier;

    // Round to nearest satoshi
    return Math.round(fee);
  }, [state?.enablePreheat, state?.preheatHours, systemParams]);

  // Calculate reward amount in satoshi
  const rewardAmountSatoshi = useMemo(() => {
    if (!state?.isRewarded || !state?.rewardBtc) return 0;
    return Math.round(parseFloat(state.rewardBtc) * SATS_PER_BTC);
  }, [state?.isRewarded, state?.rewardBtc]);

  // Calculate total amount
  const totalAmountSatoshi = useMemo(() => {
    const platform = platformFeeSatoshi ?? 0;
    const preheat = preheatFeeSatoshi ?? 0;
    const reward = rewardAmountSatoshi;
    return reward + platform + preheat;
  }, [platformFeeSatoshi, preheatFeeSatoshi, rewardAmountSatoshi]);

  // Format amounts for display
  const rewardAmountBtc = useMemo(() => {
    if (rewardAmountSatoshi === 0) return "0";
    return satsToBtc(rewardAmountSatoshi, { suffix: false });
  }, [rewardAmountSatoshi]);

  const preheatFeeBtc = useMemo(() => {
    return satsToBtc(preheatFeeSatoshi, { suffix: false });
  }, [preheatFeeSatoshi]);

  const platformFeeBtc = useMemo(() => {
    return satsToBtc(platformFeeSatoshi, { suffix: false });
  }, [platformFeeSatoshi]);

  const totalAmountBtc = useMemo(() => {
    return satsToBtc(totalAmountSatoshi, { suffix: false });
  }, [totalAmountSatoshi]);

  // Handle copy address
  const handleCopyAddress = (address: string) => {
    if (!address) return;
    try {
      navigator.clipboard.writeText(address);
      showToast("success", "Address copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", "Failed to copy address");
    }
  };

  // Handle cancel - go back to create event
  const handleCancel = () => {
    navigate("/create-event");
  };

  // Redirect if no state
  if (!state) {
    navigate("/create-event");
    return null;
  }

  const refundAddress = state.creatorAddress || state.refundAddress || "";
  // Placeholder BTC address (will be replaced with API data later)
  const depositAddress = "bc1q333z0tdzpwwt03y8emfpjp78kaqkzuj7ecnmk4";

  // Check if platform fee should be shown
  // Platform fee is shown for non-reward events that have fees (preheat or duration > free_hours)
  const showPlatformFee =
    !state.isRewarded && platformFeeSatoshi !== null && platformFeeSatoshi > 0;

  return (
    <div className="flex-col flex items-center justify-center w-full">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>
      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500)">
          Payment Instructions
        </h1>
        <p className="mt-1 tx-14 lh-20 text-secondary">
          Please complete your payment within{" "}
          <span className="text-(--color-orange-500) font-medium">
            {formatTimeRemaining(countdown)}
          </span>
        </p>

        <div className="mt-6 space-y-4">
          {/* Reward Amount (only if rewarded) */}
          {state.isRewarded && rewardAmountSatoshi > 0 && (
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Reward Amount</div>
              <div className="tx-14 lh-20 text-primary">
                {formatBtcDisplay(rewardAmountBtc)} BTC
              </div>
            </div>
          )}

          {/* Preheat Fee (only if enabled) */}
          {state.enablePreheat &&
            preheatFeeSatoshi !== null &&
            preheatFeeSatoshi > 0 && (
              <div className="space-y-1">
                <div className="tx-12 lh-18 text-secondary">Preheat Fee</div>
                <div className="tx-14 lh-20 text-primary">
                  {formatBtcDisplay(preheatFeeBtc)} BTC
                </div>
              </div>
            )}

          {/* Platform Fee (only for non-reward events with fees) */}
          {showPlatformFee && (
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Platform Fee</div>
              <div className="tx-14 lh-20 text-primary">
                {formatBtcDisplay(platformFeeBtc)} BTC
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="space-y-1">
            <div className="tx-12 lh-18 text-secondary">Total Amount</div>
            <div className="tx-14 lh-20 text-primary font-medium">
              {formatBtcDisplay(totalAmountBtc)} BTC
            </div>
          </div>

          {/* Refund Address */}
          <div className="space-y-1">
            <div className="tx-12 lh-18 text-secondary">Refund Address</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 tx-14 lh-20 text-primary break-all font-mono">
                {refundAddress || "--"}
              </div>
              {refundAddress && (
                <button
                  type="button"
                  onClick={() => handleCopyAddress(refundAddress)}
                  className="p-1 hover:opacity-70 cursor-pointer"
                >
                  <CopyIcon className="w-4 h-4 text-secondary" />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <Divider className="bg-border" />

          {/* Send exactly */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Send exactly</div>
              <div className="tx-20 lh-24 fw-m text-primary">
                {formatBtcDisplay(totalAmountBtc)} BTC
              </div>
            </div>

            {/* Warning message */}
            <div className="flex items-start gap-2 tx-12 lh-18 text-secondary">
              <span
                className="text-secondary inline-block"
                style={{ filter: "grayscale(100%)", opacity: 0.7 }}
              >
                ⚠️
              </span>
              <span>
                Do NOT split your payment. Transactions below{" "}
                {MIN_REFUND_THRESHOLD} BTC will NOT trigger a refund.
              </span>
            </div>

            {/* To this address */}
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">To this address</div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-bg">
                <div className="w-5 h-5 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center">
                  <BTCIcon
                    className="w-3 h-3 [&>path]:stroke-[#A1A1A1]"
                    style={{
                      filter: "grayscale(100%) brightness(1.5)",
                    }}
                  />
                </div>
                <div className="flex-1 tx-14 lh-20 text-primary break-all font-mono">
                  {depositAddress}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAddress(depositAddress)}
                  className="p-1 hover:opacity-70 flex-shrink-0 cursor-pointer"
                >
                  <CopyIcon className="w-4 h-4 text-secondary" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel button */}
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            appearance="outline"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
