import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { Button } from "@/components/base/Button";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";
import { API } from "@/api";
import type { EventType } from "@/api/types";
import ClockIcon from "@/assets/icons/clock.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { useHomeStore } from "@/stores/homeStore";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();
  const { setStatus } = useHomeStore();

  const [btcAddress, setBtcAddress] = useState<string>("");
  const [plaintext, setPlaintext] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signatureError, setSignatureError] = useState<string>("");
  const [signatureSuccess, setSignatureSuccess] = useState<string>("");
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
      showToast("success", t("confirmSign.plaintextCopied", "Plaintext copied to clipboard"));
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", t("confirmSign.failedToCopyPlaintext", "Failed to copy plaintext"));
    }
  }, [plaintext, showToast, t]);

  const handleSubmit = useCallback(async () => {
    if (!signature.trim()) {
      showToast("error", t("confirmSign.pleaseEnterSignature", "Please enter a signature"));
      return;
    }

    if (!eventId) {
      showToast("error", t("confirmSign.eventNotInitialized", "Event not initialized. Please refresh the page."));
      return;
    }

    if (countdown <= 0) {
      showToast(
        "error",
        t("confirmSign.plaintextExpiredToast", "Plaintext has expired. Please go back and try again.")
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
      // Status can be: 1 (number) or "activated" (string)
      const isSuccess =
        verifyData?.status === 1 || verifyData?.status === "activated";

      if (isSuccess) {
        // Clear any previous errors
        setSignatureError("");

        // Show success message in green
        // TODO: 示範 後端 message
        const successMessage =
          t(verifyData.message, "Event successfully activated");

        // Set success message (green)
        setSignatureSuccess(successMessage);

        // Show success toast
        showToast("success", successMessage);

        // Clear create event draft from sessionStorage
        const CREATE_EVENT_DRAFT_KEY = "koinvote:create-event-draft";
        sessionStorage.removeItem(CREATE_EVENT_DRAFT_KEY);

        // Pre-generate OG image for sharing
        API.preGenerateOgImage(eventId);

        // Reset home page status to "ongoing" before navigating
        setStatus("ongoing");

        // Navigate to homepage after a delay to ensure toast is visible
        setTimeout(() => {
          navigate(`/event/${eventId}`);
        }, 2000);
      } else {
        // Not success - show error
        const errorMessage =
          verifyData?.message || "Signature verification failed";
        setSignatureError(errorMessage);
        setSignatureSuccess(""); // Clear success message
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
  }, [signature, eventId, countdown, showToast, setStatus, navigate, t]);

  // Handle Enter key to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Enter key is pressed
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // Check if button is not disabled
        const isDisabled =
          !signature.trim() ||
          isLoading ||
          !plaintext ||
          countdown <= 0 ||
          isLoadingPlaintext;

        // Allow Enter in input fields, but prevent in textarea (for multi-line input)
        const target = e.target as HTMLElement;
        const isTextarea = target.tagName === "TEXTAREA";

        if (!isDisabled && !isTextarea) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    signature,
    isLoading,
    plaintext,
    countdown,
    isLoadingPlaintext,
    handleSubmit,
  ]);

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
          {t("confirmSign.title", "Confirm & Sign")}
        </h1>
        <p className="mt-1 tx-14 lh-20 text-white">{t("confirmSign.subtitle", "Sign to submit your event")}</p>
        <p className="mt-1 tx-12 lh-18 text-secondary">
          {t("confirmSign.verifyBitcoiner", "This step verifies you are a Bitcoiner")}
        </p>

        <div className="mt-6 space-y-6">
          {/* Section 1: Enter BTC Address */}
          <div className="rounded-xl border border-admin-bg bg-surface p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-admin-bg border border-border flex items-center justify-center shrink-0">
                <span className="tx-12 lh-18 fw-m text-black">1</span>
              </div>
              <h2 className="tx-16 lh-20 fw-m text-primary">
                {t("confirmSign.yourBtcAddress", "Your BTC Address")}
              </h2>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-primary tx-14 lh-20 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder={t("confirmSign.enterBtcAddress", "Enter your BTC address")}
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
                {t("confirmSign.signPlaintext", "Please Sign the Plaintext")}
              </h2>
            </div>

            {isLoadingPlaintext ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" />
                <span className="ml-2 tx-14 text-secondary">
                  {t("confirmSign.generatingPlaintext", "Generating plaintext...")}
                </span>
              </div>
            ) : plaintext ? (
              <div className="space-y-3">
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
                    <span>{t("confirmSign.expiredIn", "Expired in {{time}}", { time: formatTimeRemaining(countdown) })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 tx-12 lh-18">
                    <ClockIcon className="w-4 h-4" />
                    <span>
                      {t("confirmSign.plaintextExpired", "This plaintext has expired. Please generate a new one.")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="tx-14 text-secondary">
                {t("confirmSign.failedPlaintext", "Failed to generate plaintext. Please try again.")}
              </div>
            )}
          </div>

          {/* Section 3: Enter Signature */}
          <div className="rounded-xl border border-admin-bg bg-surface p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-admin-bg border border-border flex items-center justify-center shrink-0">
                <span className="tx-12 lh-18 fw-m text-black">3</span>
              </div>
              <h2 className="tx-16 lh-20 fw-m text-primary">{t("confirmSign.enterSignatureTitle", "Enter Signature")}</h2>
            </div>
            <div className="space-y-2">
              <label className="tx-12 lh-18 text-secondary">{t("confirmSign.signatureLabel", "Signature")} *</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  // Clear error and success when user starts typing
                  if (signatureError) {
                    setSignatureError("");
                  }
                  if (signatureSuccess) {
                    setSignatureSuccess("");
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-primary tx-14 lh-20
                focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                placeholder={t("confirmSign.enterSignature", "Enter your signature")}
                disabled={!plaintext || countdown <= 0}
              />
              {signatureError && (
                <div className="tx-12 lh-18 text-red-500">{signatureError}</div>
              )}
              {signatureSuccess && (
                <div className="tx-12 lh-18 text-green-500">
                  {signatureSuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="tx-12 lh-18 text-secondary">
            {t("confirmSign.byProceeding", "By proceeding, you agree to the")}{" "}
            <Link to="/terms" className="text-(--color-orange-500) underline">
              {t("confirmSign.termsOfService", "Terms of Service")}
            </Link>
            ,{" "}
            <Link
              to="/terms-reward-distribution"
              className="text-(--color-orange-500) underline"
            >
              {t("confirmSign.rewardDistribution", "Reward Distribution")}
            </Link>
            ,{" "}
            <Link to="/privacy" className="text-(--color-orange-500) underline">
              {t("confirmSign.privacyPolicy", "Privacy Policy")}
            </Link>{" "}
            {t("confirmSign.and", "and")}{" "}
            <Link
              to="/charges-refunds"
              className="text-(--color-orange-500) underline"
            >
              {t("confirmSign.chargesRefunds", "Charges & Refunds")}
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
            {t("confirmSign.backToPreview", "Back to Preview")}
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
                {t("confirmSign.submitting", "Submitting...")}
              </span>
            ) : (
              t("confirmSign.submitEvent", "Submit Event")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
