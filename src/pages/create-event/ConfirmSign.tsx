import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback } from "react";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { Button } from "@/components/base/Button";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";
import { API } from "@/api";
import type { EventType } from "@/api/types";
import ClockIcon from "@/assets/icons/clock.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";




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

const COUNTDOWN_MINUTES = 15;

function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function ConfirmSign() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();

  const [btcAddress, setBtcAddress] = useState<string>("");
  const [plaintext, setPlaintext] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signatureError, setSignatureError] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_MINUTES * 60);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaintext, setIsLoadingPlaintext] = useState(false);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);

  const eventId = eventIdParam || "";

  // Initialize BTC address from state
  useEffect(() => {
    if (state?.creatorAddress) {
      setBtcAddress(state.creatorAddress);
    }
  }, [state]);

  // Countdown timer
  useEffect(() => {
    if (!expiredAt) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiredAt - now;

      if (remaining <= 0) {
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiredAt]);

  // Get plaintext on mount using eventId from URL
  useEffect(() => {
    if (!eventId) {
      // If no eventId in URL, redirect to create-event
      navigate("/create-event");
      return;
    }

    // Initialize BTC address from state if available
    if (state?.creatorAddress) {
      setBtcAddress(state.creatorAddress);
    }

    const getPlaintext = async () => {
      try {
        setIsLoadingPlaintext(true);

        // Get signature plaintext using eventId from URL
        const plaintextRes = (await API.getSignaturePlainText(
          eventId
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        )()) as any;
        const plaintextEnvelope =
          plaintextRes?.success !== undefined
            ? plaintextRes
            : plaintextRes?.data;

        if (!plaintextEnvelope?.success || !plaintextEnvelope?.data) {
          throw new Error(
            plaintextEnvelope?.message || "Failed to get plaintext"
          );
        }

        const plaintextData = plaintextEnvelope.data;
        setPlaintext(plaintextData.plaintext);

        // Calculate expiration time (15 minutes from timestamp)
        const expirationTimestamp =
          plaintextData.timestamp + COUNTDOWN_MINUTES * 60;
        setExpiredAt(expirationTimestamp);
        setCountdown(COUNTDOWN_MINUTES * 60);
      } catch (error) {
        console.error("Error getting plaintext:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorAny = error as any;
        const errorMessage =
          errorAny?.apiMessage ||
          (error instanceof Error
            ? error.message
            : "Failed to get plaintext. Please try again.");

        showToast("error", errorMessage);
        // Redirect back to preview if we have state, otherwise to create-event
        if (state) {
          navigate("/preview-event", { state });
        } else {
          navigate("/create-event");
        }
      } finally {
        setIsLoadingPlaintext(false);
      }
    };

    getPlaintext();
  }, [eventId, state, navigate, showToast]);

  const handleCopyPlaintext = useCallback(() => {
    if (!plaintext) return;

    try {
      navigator.clipboard.writeText(plaintext);
      showToast("success", "Plaintext copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", "Failed to copy plaintext");
    }
  }, [plaintext, showToast]);

  const handleRegeneratePlaintext = useCallback(async () => {
    if (!eventId || countdown > 0) return;

    try {
      setIsLoadingPlaintext(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plaintextRes = (await API.getSignaturePlainText(eventId)()) as any;
      const plaintextEnvelope =
        plaintextRes?.success !== undefined ? plaintextRes : plaintextRes?.data;

      if (!plaintextEnvelope?.success || !plaintextEnvelope?.data) {
        throw new Error(
          plaintextEnvelope?.message || "Failed to get plaintext"
        );
      }

      const plaintextData = plaintextEnvelope.data;
      setPlaintext(plaintextData.plaintext);

      // Calculate expiration time (15 minutes from timestamp)
      const expirationTimestamp =
        plaintextData.timestamp + COUNTDOWN_MINUTES * 60;
      setExpiredAt(expirationTimestamp);
      setCountdown(COUNTDOWN_MINUTES * 60);
    } catch (error) {
      console.error("Error regenerating plaintext:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorAny = error as any;
      const errorMessage =
        errorAny?.apiMessage ||
        (error instanceof Error
          ? error.message
          : "Failed to regenerate plaintext");
      showToast("error", errorMessage);
    } finally {
      setIsLoadingPlaintext(false);
    }
  }, [eventId, countdown, showToast]);

  const handleSubmit = async () => {
    if (!signature.trim()) {
      showToast("error", "Please enter a signature");
      return;
    }

    if (!eventId) {
      showToast("error", "Event not initialized. Please refresh the page.");
      return;
    }

    if (countdown <= 0) {
      showToast(
        "error",
        "Plaintext has expired. Please go back and try again."
      );
      return;
    }

    try {
      setIsLoading(true);

      // Note: axios interceptor returns response.data at runtime, but types may still reflect AxiosResponse
      const verifyRes = (await API.verifySignature(eventId)({
        signature,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;
      const verifyEnvelope =
        verifyRes?.success !== undefined ? verifyRes : verifyRes?.data;

      if (!verifyEnvelope?.success) {
        const errorMessage =
          verifyEnvelope?.message || "Signature verification failed";
        setSignatureError(errorMessage);
        setIsLoading(false);
        return;
      }

      const verifyData = verifyEnvelope.data;

      // Check if verification passed
      // The message field will indicate if verification passed or failed
      // Status 1 typically means success, but we also check the message
      if (verifyData.status === 1) {
        showToast(
          "success",
          verifyData.message || "Event submitted successfully!"
        );
        // TODO: Navigate to success page or event detail page
        navigate("/");
      } else {
        const errorMessage =
          verifyData.message || "Signature verification failed";
        setSignatureError(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorAny = error as any;
      const errorMessage =
        errorAny?.apiMessage ||
        (error instanceof Error
          ? error.message
          : "Signature verification failed");

      setSignatureError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If no state, redirect
  if (!state) {
    return null;
  }

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
          Confirm & Sign
        </h1>
        <p className="mt-1 tx-14 lh-20 text-secondary">
          Sign to submit your event
        </p>
        <p className="mt-1 tx-12 lh-18 text-secondary">
          This step verifies you are a Bitcoiner
        </p>

        <div className="mt-6 space-y-6">
          {/* Section 1: Enter BTC Address */}
          <div className="rounded-xl border border-admin-bg bg-surface p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-admin-bg border border-border flex items-center justify-center shrink-0">
                <span className="tx-12 lh-18 fw-m text-black">1</span>
              </div>
              <h2 className="tx-16 lh-20 fw-m text-primary">
                Your BTC Address
              </h2>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-primary tx-14 lh-20 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Enter your BTC address"
                disabled={true}
              />
            </div>
          </div>

          {/* Section 2: Generate the Plaintext */}
          <div className="rounded-xl border border-admin-bg bg-surface p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-admin-bg border border-border flex items-center justify-center shrink-0">
                <span className="tx-12 lh-18 fw-m text-black">2</span>
              </div>
              <h2 className="tx-16 lh-20 fw-m text-primary">
                Generate the Plaintext
              </h2>
            </div>

            {isLoadingPlaintext ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" />
                <span className="ml-2 tx-14 text-secondary">
                  Generating plaintext...
                </span>
              </div>
            ) : plaintext ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  appearance="solid"
                  tone="white"
                  text="sm"
                  className="w-full"
                  disabled={countdown > 0}
                  onClick={handleRegeneratePlaintext}
                >
                  Generate Plaintext
                </Button>
                <div className="relative">
                  <div className="px-3 py-2 rounded-lg border border-border bg-bg">
                    <div className="flex items-center justify-between gap-2">
                      <p className="tx-14 lh-20 text-green-500 break-all font-mono flex-1">
                        {plaintext}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPlaintext}
                        className="flex-shrink-0 text-secondary hover:text-primary transition-colors cursor-pointer"
                        aria-label="Copy plaintext"
                      >
                        <CopyIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {countdown > 0 ? (
                  <div className="flex items-center gap-2 text-green-500 tx-12 lh-18">
                    <ClockIcon className="w-4 h-4" />
                    <span>Expired in {formatTimeRemaining(countdown)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 tx-12 lh-18">
                    <ClockIcon className="w-4 h-4" />
                    <span>
                      This plaintext has expired. Please generate a new one.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="tx-14 text-secondary">
                Failed to generate plaintext. Please try again.
              </div>
            )}
          </div>

          {/* Section 3: Enter Signature */}
          <div className="rounded-xl border border-admin-bg bg-surface p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-admin-bg border border-border flex items-center justify-center shrink-0">
                <span className="tx-12 lh-18 fw-m text-black">3</span>
              </div>
              <h2 className="tx-16 lh-20 fw-m text-primary">Enter Signature</h2>
            </div>
            <div className="space-y-2">
              <label className="tx-12 lh-18 text-secondary">Signature *</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  // Clear error when user starts typing
                  if (signatureError) {
                    setSignatureError("");
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-primary tx-14 lh-20 
                focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                placeholder="Enter your signature"
                disabled={!plaintext || countdown <= 0}
              />
              {signatureError && (
                <div className="tx-12 lh-18 text-red-500">{signatureError}</div>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="tx-12 lh-18 text-secondary">
            By proceeding, you agree to the{" "}
            <Link to="/terms" className="text-(--color-orange-500) underline">
              Terms of Service
            </Link>
            ,{" "}
            <Link
              to="/terms-reward-distribution"
              className="text-(--color-orange-500) underline"
            >
              Reward Distribution
            </Link>
            ,{" "}
            <Link to="/privacy" className="text-(--color-orange-500) underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              to="/charges-refunds"
              className="text-(--color-orange-500) underline"
            >
              Charges & Refunds
            </Link>
            .
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            appearance="outline"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={() => navigate("/preview-event", { state })}
            disabled={isLoading}
          >
            Back to Preview
          </Button>
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            disabled={
              !signature.trim() ||
              isLoading ||
              !plaintext ||
              countdown <= 0 ||
              isLoadingPlaintext
            }
            onClick={handleSubmit}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loading size="sm" className="mr-2" />
                Submitting...
              </span>
            ) : (
              "Submit Event"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
