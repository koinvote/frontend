import { useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/base/Button";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";
import { API } from "@/api";
import type { EventType } from "@/api/types";
import { DepositStatus } from "@/api/types";
import type { DepositStatusRes } from "@/api/response";
import CopyIcon from "@/assets/icons/copy.svg?react";
import BTCIcon from "@/assets/icons/btc.svg?react";
import { useSystemParametersStore } from "@/stores/systemParametersStore";

const COUNTDOWN_MINUTES = 15;
const POLL_INTERVAL_MS = 10_000; // 10 seconds
const SATS_PER_BTC = 100_000_000;

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

// Thank You for Sponsoring - Underpaid Donation (no refund)
function ThankYouDonation({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-col flex items-center justify-center w-full min-h-screen">
      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500)">
          Thank You for Sponsoring
        </h1>
        <div className="mt-6 space-y-4 text-primary tx-14 lh-20">
          <p>Thank you for your support.</p>
          <p>Your contribution has been successfully received on-chain.</p>
          <p>
            However, the amount does not meet the minimum requirement to create
            this event.
          </p>
          <p>
            If you have any questions, please contact{" "}
            <span className="inline-flex items-center gap-1">
              <a
                href="mailto:support@koinvote.com"
                className="text-(--color-orange-500) underline"
              >
                support@koinvote.com
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("support@koinvote.com");
                }}
                className="p-1 hover:opacity-70"
              >
                <CopyIcon className="w-4 h-4 fill-current" />
              </button>
            </span>
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={onBack}
          >
            Back to Preview
          </Button>
        </div>
      </div>
    </div>
  );
}

// Thank You for Sponsoring - Underpaid with Refund
function ThankYouRefund({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-col flex items-center justify-center w-full min-h-screen">
      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500)">
          Thank You for Sponsoring
        </h1>
        <div className="mt-6 space-y-4 text-primary tx-14 lh-20">
          <p>Thank you for your support.</p>
          <p>Your contribution has been successfully received on-chain.</p>
          <p>
            However, the amount does not meet the minimum requirement to create
            this event.
          </p>
          <p>
            Your payment will be refunded to your refund address after network
            fees and applicable charges are deducted.
          </p>
          <p>
            If you have any questions, please contact{" "}
            <span className="inline-flex items-center gap-1">
              <a
                href="mailto:support@koinvote.com"
                className="text-(--color-orange-500) underline"
              >
                support@koinvote.com
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("support@koinvote.com");
                }}
                className="p-1 hover:opacity-70"
              >
                <CopyIcon className="w-4 h-4 fill-current" />
              </button>
            </span>
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={onBack}
          >
            Back to Preview
          </Button>
        </div>
      </div>
    </div>
  );
}

// Payment Expired
function PaymentExpired({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-col flex items-center justify-center w-full min-h-screen">
      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500)">
          Payment Instructions
        </h1>
        <div className="mt-6 space-y-4 text-primary tx-14 lh-20 text-center">
          <p>This payment session has expired.</p>
          <p>Please return to Preview and submit again.</p>
          <p className="text-secondary">
            If a payment is received after this session expires, it will be
            automatically refunded to your refund address, minus applicable
            network fees.
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={onBack}
          >
            Back to Preview
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams<{ eventId: string }>();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();

  const systemParams = useSystemParametersStore((s) => s.params);
  const sponsorshipThreshold =
    systemParams?.min_reward_amount_satoshi ?? 50_000; // Default 0.0005 BTC

  const [countdown, setCountdown] = useState(COUNTDOWN_MINUTES * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expectedAmountSats, setExpectedAmountSats] = useState(0);
  const [depositAddress, setDepositAddress] = useState("");
  const [receivedAmountSats, setReceivedAmountSats] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [expiredAt, setExpiredAt] = useState<number | null>(null);

  // Calculate amounts from state (for display, will use API amounts when available)
  const { rewardAmountBtc, preheatFeeBtc } = useMemo(() => {
    const reward =
      state?.isRewarded && state?.rewardBtc ? parseFloat(state.rewardBtc) : 0;

    // Preheat fee - TODO: get from API response (preheat_fee_satoshi from event detail)
    const preheat = state?.enablePreheat && state?.preheatHours ? 0.0002 : 0; // Placeholder

    return {
      rewardAmountBtc: reward.toFixed(8),
      preheatFeeBtc: preheat.toFixed(8),
    };
  }, [state]);

  // Calculate total amount from API (expected_amount_satoshi from deposit status)
  const totalAmountBtc = useMemo(() => {
    if (expectedAmountSats > 0) {
      return (expectedAmountSats / SATS_PER_BTC).toFixed(8);
    }
    // Fallback to calculated value if API hasn't returned yet
    const reward =
      state?.isRewarded && state?.rewardBtc ? parseFloat(state.rewardBtc) : 0;
    const rewardSats = Math.round(reward * SATS_PER_BTC);
    const preheat = state?.enablePreheat && state?.preheatHours ? 0.0002 : 0;
    const preheatSats = Math.round(preheat * SATS_PER_BTC);
    const platformFee = !state?.isRewarded ? 0.001 : 0; // Placeholder
    const platformFeeSats = Math.round(platformFee * SATS_PER_BTC);
    const totalSats = rewardSats + preheatSats + platformFeeSats;
    return (totalSats / SATS_PER_BTC).toFixed(8);
  }, [expectedAmountSats, state]);

  // Countdown timer
  useEffect(() => {
    if (isExpired || !expiredAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiredAt - now) / 1000));

      if (remaining <= 0) {
        setIsExpired(true);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isExpired, expiredAt]);

  // Fetch deposit status
  const fetchDepositStatus = useCallback(async () => {
    if (!eventId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await API.getDepositStatus(eventId)()) as any;
      const envelope = res?.success !== undefined ? res : res?.data;

      if (!envelope?.success || !envelope?.data) {
        throw new Error(envelope?.message || "Failed to fetch deposit status");
      }

      const data = envelope.data as DepositStatusRes;
      setDepositAddress(data.deposit_address || "");
      setExpectedAmountSats(data.expected_amount_satoshi || 0);
      setReceivedAmountSats(data.received_amount_satoshi || 0);
      setStatus(data.status || "");

      // Set expiration time from API
      if (data.initial_timeout_at) {
        const timeoutDate = new Date(data.initial_timeout_at).getTime();
        setExpiredAt(timeoutDate);
      }

      // Handle different statuses
      if (data.status === DepositStatus.COMPLETED) {
        // Payment completed - check if amount matches, exceeds, or is less
        const received = data.received_amount_satoshi || 0;
        const expected = data.expected_amount_satoshi || 0;
        const difference = received - expected;

        if (difference === 0) {
          // Exact amount - redirect to home
          navigate("/");
        } else if (difference > 0) {
          // Overpaid
          const excess = difference;
          if (excess > sponsorshipThreshold) {
            // Show toast and redirect
            showToast(
              "success",
              "Payment received. Your event has been successfully created. Any excess amount has been scheduled for refund to your refund address.",
              0 // 0 means user must click to dismiss
            );
            navigate("/");
          } else {
            // No refund, just redirect
            navigate("/");
          }
        } else {
          // Underpaid
          const paidAmount = received;
          if (paidAmount <= sponsorshipThreshold) {
            // Donation - no refund
            // Will show ThankYouDonation component (handled in render)
          } else {
            // Will refund - show ThankYouRefund component (handled in render)
          }
        }
      } else if (data.status === DepositStatus.EXPIRED) {
        setIsExpired(true);
      } else if (
        data.status === DepositStatus.DONATION ||
        data.status === DepositStatus.WAIT_FOR_REFUND
      ) {
        // Handle underpaid cases
        const paidAmount = data.received_amount_satoshi || 0;
        if (paidAmount <= sponsorshipThreshold) {
          // Donation - no refund (will show ThankYouDonation)
        } else {
          // Will refund (will show ThankYouRefund)
        }
      }
    } catch (error) {
      console.error("Error fetching deposit status:", error);
      // Don't show error toast on every poll, only on initial load
      if (isLoading) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorAny = error as any;
        const errorMessage =
          errorAny?.apiMessage ||
          (error instanceof Error
            ? error.message
            : "Failed to fetch deposit status. Please try again.");
        showToast("error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, navigate, showToast, isLoading, sponsorshipThreshold]);

  // Initial fetch and polling
  useEffect(() => {
    if (!eventId) {
      navigate("/create-event");
      return;
    }

    // Fetch immediately
    fetchDepositStatus();

    // Poll every 10 seconds
    const pollInterval = setInterval(() => {
      if (!isExpired && status !== DepositStatus.COMPLETED) {
        fetchDepositStatus();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [eventId, navigate, fetchDepositStatus, isExpired, status]);

  // Handle copy address
  const handleCopyAddress = useCallback(
    (address: string) => {
      if (!address) return;
      try {
        navigator.clipboard.writeText(address);
        showToast("success", "Address copied to clipboard");
      } catch (error) {
        console.error("Failed to copy:", error);
        showToast("error", "Failed to copy address");
      }
    },
    [showToast]
  );

  // Handle back to preview
  const handleBackToPreview = useCallback(() => {
    if (state) {
      navigate("/preview-event", { state });
    } else {
      navigate("/create-event");
    }
  }, [navigate, state]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    handleBackToPreview();
  }, [handleBackToPreview]);

  // Show expired page
  if (isExpired) {
    return <PaymentExpired onBack={handleBackToPreview} />;
  }

  // Show underpaid donation page (no refund)
  if (
    status === DepositStatus.DONATION ||
    (status === DepositStatus.COMPLETED &&
      receivedAmountSats < expectedAmountSats &&
      receivedAmountSats <= sponsorshipThreshold)
  ) {
    return <ThankYouDonation onBack={handleBackToPreview} />;
  }

  // Show underpaid refund page
  if (
    status === DepositStatus.WAIT_FOR_REFUND ||
    (status === DepositStatus.COMPLETED &&
      receivedAmountSats < expectedAmountSats &&
      receivedAmountSats > sponsorshipThreshold)
  ) {
    return <ThankYouRefund onBack={handleBackToPreview} />;
  }

  // Show loading state
  if (isLoading || !depositAddress) {
    return (
      <div className="flex-col flex items-center justify-center w-full min-h-screen">
        <Loading />
      </div>
    );
  }

  const refundAddress = state?.creatorAddress || state?.refundAddress || "";

  return (
    <div className="flex-col flex items-center justify-center w-full min-h-screen">
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
          {/* BTC Address (Refund Address) */}
          <div className="space-y-1">
            <div className="tx-12 lh-18 text-secondary">BTC Address</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 tx-14 lh-20 text-primary break-all font-mono">
                {refundAddress || "--"}
              </div>
              {refundAddress && (
                <button
                  type="button"
                  onClick={() => handleCopyAddress(refundAddress)}
                  className="p-1 hover:opacity-70"
                >
                  <CopyIcon className="w-5 h-5 fill-current text-secondary" />
                </button>
              )}
            </div>
            <p className="tx-12 lh-18 text-secondary">
              Your BTC address is used for refund as well.
            </p>
          </div>

          {/* Reward Amount (only if rewarded) */}
          {state?.isRewarded && parseFloat(rewardAmountBtc) > 0 && (
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Reward Amount</div>
              <div className="tx-14 lh-20 text-primary">
                {formatBtcDisplay(rewardAmountBtc)} BTC
              </div>
            </div>
          )}

          {/* Preheat Fee (only if enabled) */}
          {state?.enablePreheat && parseFloat(preheatFeeBtc) > 0 && (
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Preheat Fee</div>
              <div className="tx-14 lh-20 text-primary">
                {formatBtcDisplay(preheatFeeBtc)} BTC
              </div>
            </div>
          )}

          {/* Platform Fee (only for non-reward events, calculated as total - preheat if any) */}
          {!state?.isRewarded && parseFloat(totalAmountBtc) > 0 && (
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Platform Fee</div>
              <div className="tx-14 lh-20 text-primary">
                {formatBtcDisplay(
                  (
                    parseFloat(totalAmountBtc) -
                    (state?.enablePreheat ? parseFloat(preheatFeeBtc) : 0)
                  ).toFixed(8)
                )}{" "}
                BTC
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

          {/* Divider */}
          <div className="border-t border-border my-4"></div>

          {/* Send exactly */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">Send exactly</div>
              <div className="tx-20 lh-24 fw-m text-primary">
                {formatBtcDisplay(totalAmountBtc)} BTC
              </div>
            </div>

            {/* To this address */}
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">To this address</div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-bg">
                <BTCIcon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 tx-14 lh-20 text-primary break-all font-mono">
                  {depositAddress}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAddress(depositAddress)}
                  className="p-1 hover:opacity-70 flex-shrink-0"
                >
                  <CopyIcon className="w-5 h-5 fill-current text-secondary" />
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
