import { Divider } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import type { ApiResponse } from "@/api";
import { API } from "@/api";
import type { DepositStatusRes } from "@/api/response";
import type { EventType } from "@/api/types";
import { DepositStatus } from "@/api/types";
import BTCIcon from "@/assets/icons/btc.svg?react";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { Button } from "@/components/base/Button";
import { useToast } from "@/components/base/Toast/useToast";
import { useHomeStore } from "@/stores/homeStore";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { formatDepositCountdown, satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";

dayjs.extend(utc);

const BTC_TO_SATS = 100_000_000;
const MIN_REFUND_THRESHOLD = 0.0005; // fallback if system param is missing

// For testing: Set to true to use hardcoded countdown
// Set to false to use deposit_timeout_at from API
const USE_HARDCODED_COUNTDOWN = false;
const HARDCODED_COUNTDOWN_SECONDS = 10; // 10 seconds for testing

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

function formatBtcDisplay(btc: string): string {
  // Remove trailing zeros
  return parseFloat(btc).toString();
}

export default function ConfirmPay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams<{ eventId: string }>();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();
  const { setStatus } = useHomeStore();

  const systemParams = useSystemParametersStore((s) => s.params);

  const refundThresholdBtc = useMemo(() => {
    const satoshiPerHour = systemParams?.min_reward_amount_satoshi;
    if (!satoshiPerHour || satoshiPerHour <= 0)
      return MIN_REFUND_THRESHOLD.toString();
    return satsToBtc(satoshiPerHour, {
      suffix: false,
      trimTrailingZeros: true,
    });
  }, [systemParams]);

  const [depositStatus, setDepositStatus] = useState<DepositStatusRes | null>(
    null,
  );

  // console.log("ConfirmPay Render:", {
  //   depositStatus,
  //   status: depositStatus?.status,
  //   isExpired:
  //     depositStatus?.status === DepositStatus.EXPIRED ||
  //     depositStatus?.status?.toUpperCase() === "EXPIRED",
  // });
  const [countdownDisplay, setCountdownDisplay] = useState<string>("00:00");
  const isCheckingStatusRef = useRef(false);
  const statusCheckIntervalRef = useRef<number | null>(null);
  const hasNavigatedRef = useRef(false);
  const depositStatusRef = useRef<DepositStatusRes | null>(null);
  const hardcodedTimeoutRef = useRef<string | null>(null); // Store hardcoded timeout for checkDepositStatus
  const hasShownUnconfirmedToastRef = useRef(false); // Track if unconfirmed toast has been shown

  // Update refs when state changes
  useEffect(() => {
    depositStatusRef.current = depositStatus;
  }, [depositStatus]);

  // Check deposit status
  const checkDepositStatus = useCallback(async () => {
    if (!eventId || isCheckingStatusRef.current || hasNavigatedRef.current)
      return;

    const currentDepositStatus = depositStatusRef.current;

    // Check hardcoded timeout first (for testing)
    if (USE_HARDCODED_COUNTDOWN && hardcodedTimeoutRef.current) {
      const deadline = dayjs.utc(hardcodedTimeoutRef.current);
      const now = dayjs();
      if (now.isAfter(deadline) || now.isSame(deadline)) {
        // If we already have EXPIRED status, stop polling
        if (currentDepositStatus?.status === DepositStatus.EXPIRED) {
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
          }
          return;
        }
        // Otherwise, continue to fetch status (might be EXPIRED)
      }
    }

    // Check API timeout (normal mode)
    if (currentDepositStatus?.deposit_timeout_at) {
      const deadline = dayjs.utc(currentDepositStatus.deposit_timeout_at);
      const now = dayjs();
      if (now.isAfter(deadline) || now.isSame(deadline)) {
        // If we already have EXPIRED status, stop polling
        if (currentDepositStatus.status === DepositStatus.EXPIRED) {
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
          }
          return;
        }
        // Otherwise, continue to fetch status (might be EXPIRED)
        // Don't return here, allow API call to get the latest status
      }
    }

    try {
      isCheckingStatusRef.current = true;
      const response = (await API.getDepositStatus(
        eventId,
      )()) as unknown as ApiResponse<DepositStatusRes>;

      if (!response.success || !response.data) {
        console.error("Failed to get deposit status:", response.message);
        return;
      }

      const statusData = response.data;
      setDepositStatus(statusData);

      // Handle different statuses
      // EXPIRED status will be displayed in the UI, no navigation needed

      // If status is EXPIRED, stop polling
      if (statusData.status === DepositStatus.EXPIRED) {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      }

      // UNCONFIRMED: show toast once, wait for confirmation, keep polling
      if (statusData.status === DepositStatus.UNCONFIRMED) {
        if (!hasShownUnconfirmedToastRef.current) {
          showToast(
            "success",
            t(
              "confirmPay.paymentReceived",
              "Payment received. Please wait for confirmation.",
            ),
          );
          hasShownUnconfirmedToastRef.current = true;
        }
        return;
      }

      if (statusData.status === DepositStatus.RECEIVED) {
        hasNavigatedRef.current = true;
        // Clear create event draft from sessionStorage
        const CREATE_EVENT_DRAFT_KEY = "koinvote:create-event-draft";
        sessionStorage.removeItem(CREATE_EVENT_DRAFT_KEY);

        // Pre-generate OG image for sharing
        API.preGenerateOgImage(eventId);

        // Reset home page status to "ongoing" before navigating
        setStatus("ongoing");
        // Navigate to event detail page
        navigate(`/event/${eventId}`, { state: { fromPayment: true } });
        return;
      }

      // No need to set expirationTime anymore, we use deposit_timeout_at directly
    } catch (error) {
      console.error("Error checking deposit status:", error);
    } finally {
      isCheckingStatusRef.current = false;
    }
  }, [eventId, navigate, setStatus, showToast]);

  // Initialize countdown timer
  useEffect(() => {
    // For testing: Use hardcoded countdown if enabled
    let timeoutAt: string;
    if (USE_HARDCODED_COUNTDOWN) {
      // Create a hardcoded timeout: current time + HARDCODED_COUNTDOWN_SECONDS seconds
      const hardcodedTimeout = dayjs()
        .add(HARDCODED_COUNTDOWN_SECONDS, "second")
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss[Z]");
      timeoutAt = hardcodedTimeout;
      // Store it in ref so checkDepositStatus can also check it
      hardcodedTimeoutRef.current = hardcodedTimeout;
    } else {
      // Use deposit_timeout_at from API
      timeoutAt = depositStatus?.deposit_timeout_at || "";
      if (!timeoutAt) {
        return;
      }
      // Clear hardcoded timeout ref when not in hardcode mode
      hardcodedTimeoutRef.current = null;
    }

    const updateCountdown = () => {
      const formatted = formatDepositCountdown(timeoutAt);
      setCountdownDisplay(formatted);

      // Check if countdown has reached 0
      if (formatted === "00:00" && !hasNavigatedRef.current) {
        checkDepositStatus();
        // Stop checking status when countdown reaches 0
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [depositStatus?.deposit_timeout_at, checkDepositStatus]);

  // Check status every 10 seconds
  useEffect(() => {
    if (!eventId || hasNavigatedRef.current) return;

    // Initial check
    checkDepositStatus();

    // Check every 10 seconds
    statusCheckIntervalRef.current = window.setInterval(() => {
      checkDepositStatus();
    }, 10000);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [eventId, checkDepositStatus]);

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
    return Math.round(parseFloat(state.rewardBtc) * BTC_TO_SATS);
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
  const handleCopyAddress = useDebouncedClick(async (address: string) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      showToast(
        "success",
        t("confirmPay.addressCopied", "Address copied to clipboard"),
      );
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast(
        "error",
        t("confirmPay.failedToCopy", "Failed to copy address"),
      );
    }
  });

  const handleCopyAmount = useDebouncedClick(async (amount: string) => {
    if (!amount) return;
    try {
      await navigator.clipboard.writeText(amount);
      showToast(
        "success",
        t("confirmPay.paymentAmountCopied", "Payment amount copied"),
      );
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast(
        "error",
        t(
          "confirmPay.failedToCopyPaymentAmount",
          "Failed to copy payment amount",
        ),
      );
    }
  });

  // Handle cancel - go back to create event
  const handleCancel = () => {
    navigate("/create-event");
  };

  // Handle back to preview
  const handleBackToPreview = () => {
    if (state) {
      navigate("/preview-event", { state });
    } else {
      navigate("/create-event");
    }
  };

  // Redirect if no state
  if (!state) {
    navigate("/create-event");
    return null;
  }

  const refundAddress = state.creatorAddress || state.refundAddress || "";
  const depositAddress =
    depositStatus?.deposit_address ||
    "bc1q333z0tdzpwwt03y8emfpjp78kaqkzuj7ecnmk4";

  // Check if platform fee should be shown
  // Platform fee is shown for non-reward events that have fees (preheat or duration > free_hours)
  const showPlatformFee =
    !state.isRewarded && platformFeeSatoshi !== null && platformFeeSatoshi > 0;

  // Check if we should show donation, wait_for_refund, or expired message
  const isDonation = depositStatus?.status === DepositStatus.DONATION;
  const isWaitForRefund =
    depositStatus?.status === DepositStatus.WAIT_FOR_REFUND;
  // Note: API returns "expired" (lowercase), but DepositStatus.EXPIRED is "EXPIRED" (uppercase)
  // So we check both for compatibility
  const isExpired =
    depositStatus?.status === DepositStatus.EXPIRED ||
    depositStatus?.status?.toUpperCase() === "EXPIRED";
  const isUnconfirmed = depositStatus?.status === DepositStatus.UNCONFIRMED;

  return (
    <div className="flex-col flex items-center justify-center w-full p-2 md:p-0">
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
          {t("confirmPay.title", "Payment Instructions")}
        </h1>
        {!isDonation && !isWaitForRefund && !isExpired && (
          <p className="mt-1 tx-14 lh-20 text-secondary">
            {isUnconfirmed
              ? t(
                  "confirmPay.waitingConfirmation",
                  "Payment received · Waiting for confirmation (0/1)",
                )
              : t(
                  "confirmPay.completePaymentWithin",
                  "Please complete your payment within",
                )}
            <span className="text-(--color-orange-500) font-medium ml-2">
              {countdownDisplay}
            </span>
          </p>
        )}

        {/* Expired Message */}
        {isExpired && (
          <div className="mt-6 space-y-4">
            <div className="tx-14 lh-20 text-primary">
              {t(
                "confirmPay.sessionExpired",
                "This payment session has expired.",
              )}
            </div>
            <div className="tx-14 lh-20 text-primary">
              {t(
                "confirmPay.returnToPreview",
                "Please return to Preview and submit again.",
              )}
            </div>
            <div className="tx-14 lh-20 text-primary">
              {t(
                "confirmPay.expiredRefundNote",
                "If a payment is received after this session expires, it will be automatically refunded to your refund address, minus applicable network fees.",
              )}
            </div>
          </div>
        )}

        {/* Donation or Wait for Refund Message */}
        {(isDonation || isWaitForRefund) && (
          <div className="mt-6 space-y-4">
            <div className="tx-14 lh-20 text-primary">
              {t("confirmPay.thankYou", "Thank you for your support.")}
              <br />
              {t(
                "confirmPay.contributionReceived",
                "Your contribution has been successfully received on-chain.",
              )}
            </div>
            <div className="tx-14 lh-20 text-primary">
              {t(
                "confirmPay.amountNotMeet",
                "However, the amount does not meet the minimum requirement to create this event.",
              )}
            </div>
            {isWaitForRefund && (
              <div className="tx-14 lh-20 text-primary">
                {t(
                  "confirmPay.willBeRefunded",
                  "Your payment will be refunded to your refund address after network fees and applicable charges are deducted.",
                )}
              </div>
            )}
            <div className="tx-14 lh-20 text-primary">
              {t(
                "confirmPay.contactSupport",
                "If you have any questions, please contact",
              )}{" "}
              <span className="flex items-center gap-1 inline-flex">
                support@koinvote.com
                <button
                  type="button"
                  onClick={() => handleCopyAddress("support@koinvote.com")}
                  className="p-1 hover:opacity-70 cursor-pointer"
                >
                  <CopyIcon className="w-4 h-4 text-secondary" />
                </button>
              </span>
            </div>
          </div>
        )}

        {!isDonation && !isWaitForRefund && !isExpired && (
          <div className="mt-6 space-y-4">
            {/* Reward Amount (only if rewarded) */}
            {state.isRewarded && rewardAmountSatoshi > 0 && (
              <div className="space-y-1">
                <div className="tx-12 lh-18 text-secondary">
                  {t("confirmPay.rewardAmount", "Reward Amount")}
                </div>
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
                  <div className="tx-12 lh-18 text-secondary">
                    {t("confirmPay.preheatFee", "Preheat Fee")}
                  </div>
                  <div className="tx-14 lh-20 text-primary">
                    {formatBtcDisplay(preheatFeeBtc)} BTC
                  </div>
                </div>
              )}

            {/* Platform Fee (only for non-reward events with fees) */}
            {showPlatformFee && (
              <div className="space-y-1">
                <div className="tx-12 lh-18 text-secondary">
                  {t("confirmPay.platformFee", "Platform Fee")}
                </div>
                <div className="tx-14 lh-20 text-primary">
                  {formatBtcDisplay(platformFeeBtc)} BTC
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">
                {t("confirmPay.totalAmount", "Total Amount")}
              </div>
              <div className="tx-14 lh-20 text-primary font-medium">
                {formatBtcDisplay(totalAmountBtc)} BTC
              </div>
            </div>

            {/* Refund Address */}
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">
                {t("confirmPay.refundAddress", "Refund Address")}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 tx-14 lh-20 text-primary break-all font-mono">
                  {refundAddress || "--"}
                </div>
              </div>
            </div>

            {/* Divider */}
            <Divider className="bg-border" />

            {/* Send exactly */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="tx-12 lh-18 text-secondary">
                  {t("confirmPay.sendExactly", "Send exactly")}
                </div>
                <div className="tx-20 lh-24 fw-m text-primary">
                  {formatBtcDisplay(totalAmountBtc)} BTC
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyAmount(formatBtcDisplay(totalAmountBtc))
                    }
                    className="ml-2 p-1 hover:opacity-70 cursor-pointer"
                  >
                    <CopyIcon className="w-4 h-4 text-secondary" />
                  </button>
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
                  {t(
                    "confirmPay.warning",
                    "Do NOT split your payment. Transactions below {{threshold}} BTC will NOT trigger a refund.",
                    { threshold: refundThresholdBtc },
                  )}
                </span>
              </div>

              {/* To this address */}
              <div className="space-y-1">
                <div className="tx-12 lh-18 text-secondary">
                  {t("confirmPay.toThisAddress", "To this address")}
                </div>
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
        )}

        {/* Action buttons */}
        <div className="mt-6 flex justify-center">
          {isExpired && (
            <Button
              type="button"
              appearance="solid"
              tone="primary"
              text="sm"
              className="sm:w-[160px]"
              onClick={handleBackToPreview}
            >
              {t("confirmPay.backToPreview", "Back to Preview")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
