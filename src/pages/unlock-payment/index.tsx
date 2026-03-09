import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import type { ApiResponse } from "@/api";
import { API } from "@/api";
import type { UnlockDepositStatusRes } from "@/api/response";
import { DepositStatus } from "@/api/types";
import BTCIcon from "@/assets/icons/btc.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import WarningIcon from "@/assets/icons/warning.svg?react";
import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { LegalLinks } from "@/components/base/LegalLinks";
import { useToast } from "@/components/base/Toast/useToast";
import CONSTS from "@/consts";
import { formatDepositCountdown, satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { cn } from "@/utils/style";
import { Divider } from "antd";

dayjs.extend(utc);

type UnlockPaymentState = {
  email: string;
  unlockPriceSatoshi?: number;
  eventTitle?: string;
};

export default function UnlockPayment() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const state = location.state as UnlockPaymentState | undefined;
  const email = state?.email ?? "";
  const unlockPriceSatoshi = state?.unlockPriceSatoshi;
  const eventTitle = state?.eventTitle;

  // ── Form state ──────────────────────────────────────────────────────────
  const [confirmEmail, setConfirmEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const confirmEmailRef = useRef<HTMLInputElement>(null);

  // ── Payment flow state ───────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] =
    useState<UnlockDepositStatusRes | null>(null);
  const [countdownDisplay, setCountdownDisplay] = useState("00:00");
  const [showExtendButton, setShowExtendButton] = useState(false);
  const [canExtend, setCanExtend] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const isCheckingStatusRef = useRef(false);
  const statusCheckIntervalRef = useRef<number | null>(null);
  const depositStatusRef = useRef<UnlockDepositStatusRes | null>(null);
  const hasShownUnconfirmedToastRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    depositStatusRef.current = depositStatus;
  }, [depositStatus]);

  // Poll deposit status
  const checkDepositStatus = useCallback(async () => {
    if (!unlockId || isCheckingStatusRef.current) return;

    const current = depositStatusRef.current;
    if (
      current?.deposit_timeout_at &&
      current.status === DepositStatus.EXPIRED &&
      dayjs().isAfter(dayjs.utc(current.deposit_timeout_at))
    ) {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
      return;
    }

    try {
      isCheckingStatusRef.current = true;
      const response = (await API.getUnlockDepositStatus(
        unlockId,
      )()) as unknown as ApiResponse<UnlockDepositStatusRes>;

      if (!response.success || !response.data) return;

      const data = response.data;
      setDepositStatus(data);

      if (
        data.status === DepositStatus.EXPIRED ||
        data.status === DepositStatus.FAILED
      ) {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        return;
      }

      if (data.status === DepositStatus.UNCONFIRMED) {
        if (!hasShownUnconfirmedToastRef.current) {
          showToast(
            "success",
            t(
              "unlockPayment.paymentReceived",
              "Payment received. Please wait for confirmation.",
            ),
          );
          hasShownUnconfirmedToastRef.current = true;
        }
        return;
      }

      if (data.status === DepositStatus.UNLOCKED) {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        showToast(
          "success",
          t(
            "unlockPayment.paymentConfirmed",
            "Payment confirmed! You can now view the results.",
          ),
        );
        navigate(`/event/${eventId}`, {
          state: { unlockEmail: email, fromUnlock: true },
          replace: true,
        });
      }
    } catch (error) {
      console.error("Error checking unlock deposit status:", error);
    } finally {
      isCheckingStatusRef.current = false;
    }
  }, [unlockId, showToast, t, navigate, eventId, email]);

  // Start polling once we have an unlockId
  useEffect(() => {
    if (!unlockId) return;

    checkDepositStatus();
    statusCheckIntervalRef.current = window.setInterval(() => {
      checkDepositStatus();
    }, 10000);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [unlockId, checkDepositStatus]);

  // Countdown timer
  useEffect(() => {
    const timeoutAt = depositStatus?.deposit_timeout_at;
    if (!timeoutAt) return;

    const updateCountdown = () => {
      const formatted = formatDepositCountdown(timeoutAt);
      setCountdownDisplay(formatted);

      const deadline = dayjs.utc(timeoutAt);
      const remainingMinutes = deadline.diff(dayjs(), "minute", true);
      const isUnderThreshold =
        remainingMinutes > 0 &&
        remainingMinutes < CONSTS.EXTEND_BUTTON_THRESHOLD_MINUTES;

      // Show button once remaining < 30 min (and keep it visible)
      if (isUnderThreshold) setShowExtendButton(true);
      setCanExtend(isUnderThreshold);

      if (formatted === "00:00") {
        checkDepositStatus();
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

  const handleCopy = useDebouncedClick(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        "success",
        t("unlockPayment.copied", "{{label}} copied", { label }),
      );
    } catch {
      showToast("error", t("unlockPayment.copyFailed", "Failed to copy"));
    }
  });

  // ── All hooks declared — safe to do early return now ────────────────────
  if (!state?.email) {
    return <Navigate to={`/event/${eventId}`} replace />;
  }

  const emailMatches = confirmEmail === email;
  const canPay = emailMatches && agreedToTerms;
  const paymentInitiated = unlockId !== null;

  const isUnconfirmed = depositStatus?.status === DepositStatus.UNCONFIRMED;
  const isExpired =
    depositStatus?.status === DepositStatus.EXPIRED ||
    depositStatus?.status === DepositStatus.FAILED;

  // Deposit address from API (fallback to placeholder)
  const depositAddress =
    depositStatus?.deposit_address ||
    "bc1qepehnttrs​jeed45kgz3hv79qqeg83m4s6dxjczzl45dls80hpxeq7rsewn";

  const amountBtc = depositStatus?.expected_amount_satoshi
    ? satsToBtc(depositStatus.expected_amount_satoshi, {
        suffix: false,
        trimTrailingZeros: true,
      })
    : (unlockPriceSatoshi ?? "--");

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleConfirmPay = async () => {
    setConfirmTouched(true);
    if (!emailMatches) {
      confirmEmailRef.current?.focus();
      return;
    }
    if (!agreedToTerms) return;
    if (!eventId) return;

    try {
      setIsSubmitting(true);
      const response = (await API.unlockEvent(eventId)({
        email,
      })) as unknown as ApiResponse<{ unlock_id: string }>;

      if (!response.success || !response.data?.unlock_id) {
        showToast(
          "error",
          response.message ||
            t("unlockPayment.unlockFailed", "Failed to initiate payment"),
        );
        return;
      }

      setUnlockId(response.data.unlock_id);
    } catch (error) {
      console.error("Error initiating unlock payment:", error);
      showToast(
        "error",
        t("unlockPayment.unlockFailed", "Failed to initiate payment"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendTimeout = async () => {
    if (!unlockId || isExtending) return;

    try {
      setIsExtending(true);
      const response = (await API.extendUnlockDepositTimeout(
        unlockId,
      )()) as unknown as ApiResponse<UnlockDepositStatusRes>;

      if (!response.success || !response.data) {
        showToast(
          "error",
          response.message ||
            t("confirmPay.extendFailed", "Failed to extend time"),
        );
        return;
      }

      setDepositStatus(response.data);
      setCanExtend(false);
      showToast(
        "success",
        t("confirmPay.extendSuccess", "Time extended by {{minutes}} minutes", {
          minutes: CONSTS.DEPOSIT_EXTEND_TIME,
        }),
      );
    } catch (error) {
      console.error("Error extending unlock timeout:", error);
      showToast("error", t("confirmPay.extendFailed", "Failed to extend time"));
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 md:px-0">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      <div className="border-border bg-bg relative w-full max-w-3xl rounded-3xl border px-6 py-6 md:px-8 md:py-8">
        {/* Extend 30m button (top right, only when UNCONFIRMED + <30min) */}
        {paymentInitiated && isUnconfirmed && showExtendButton && (
          <Button
            type="button"
            appearance="outline"
            tone="primary"
            text="sm"
            className="absolute top-6 right-4 sm:top-8 sm:right-8 sm:w-40"
            onClick={handleExtendTimeout}
            disabled={isExtending || !canExtend}
          >
            {isExtending
              ? t("confirmPay.extending", "Extending...")
              : t("confirmPay.extendTime", "Extend {{minutes}} min", {
                  minutes: CONSTS.DEPOSIT_EXTEND_TIME,
                })}
          </Button>
        )}

        {/* Title */}
        <h1 className="lh-24 fw-m mb-1 text-lg text-orange-500">
          {paymentInitiated
            ? t("confirmPay.title", "Payment Instructions")
            : t("unlockPayment.title", "Unlock Result")}
        </h1>

        {/* Countdown subtitle (payment initiated, not expired) */}
        {paymentInitiated && !isExpired && (
          <p className="tx-14 text-secondary mb-6 leading-5">
            {isUnconfirmed
              ? t(
                  "confirmPay.waitingConfirmation",
                  "Payment received · Waiting for confirmation (0/1)",
                )
              : t(
                  "confirmPay.completePaymentWithin",
                  "Please complete your payment within",
                )}
            <span className="ml-2 font-medium text-(--color-orange-500)">
              {countdownDisplay}
            </span>
          </p>
        )}

        {/* Expired state */}
        {paymentInitiated && isExpired && (
          <div className="mt-4 space-y-4">
            <p className="tx-14 text-primary leading-5">
              {t(
                "confirmPay.sessionExpired",
                "This payment session has expired.",
              )}
            </p>
            <p className="tx-14 text-primary leading-5">
              {t(
                "unlockPayment.expiredNote",
                "Please go back to the event page and try again.",
              )}
            </p>
          </div>
        )}

        {/* Payment instructions (after confirm & pay, not expired) */}
        {paymentInitiated && !isExpired && (
          <div className="mt-6 space-y-4">
            {/* Unlock key */}
            <div className="mb-6 space-y-2">
              <div className="tx-12 lh-18 text-secondary">
                {t("unlockPayment.unlockKey", "Unlock key")}
              </div>
              <div className="tx-14 lh-20 text-primary">{email}</div>
            </div>

            {/* Divider */}
            <Divider className="bg-border" />

            {/* Send exactly */}
            <div className="space-y-4">
              <div className="mb-2 space-y-2">
                <div className="tx-12 lh-18 text-secondary">
                  {t("confirmPay.sendExactly", "Send exactly")}
                </div>
                <div className="tx-20 lh-24 fw-m text-primary flex items-center">
                  {amountBtc} BTC
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        String(amountBtc),
                        t("confirmPay.sendExactly", "Send exactly"),
                      )
                    }
                    className="ml-2 cursor-pointer p-1 hover:opacity-70"
                  >
                    <CopyIcon className="text-primary h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Warning message */}
              <div className="tx-12 lh-18 text-warning mb-6 flex items-start gap-1">
                <WarningIcon />
                <span>
                  {t(
                    "unlockPayment.warning",
                    "Pay the exact amount. Incorrect payment amount will fail to unlock and are non-refundable.",
                  )}
                </span>
              </div>

              {/* To Creator Address */}
              <div className="mb-6 space-y-2">
                <div className="tx-12 lh-18 text-secondary">
                  {t("unlockPayment.toCreatorAddress", "To Creator Address")}
                </div>
                <div className="border-border bg-bg flex items-center gap-2 rounded-lg border p-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <BTCIcon
                      className="h-3 w-3 [&>path]:stroke-[#000000]"
                      style={{ filter: "grayscale(100%) brightness(1.5)" }}
                    />
                  </div>
                  <div className="tx-14 lh-20 text-primary flex-1 font-mono break-all">
                    {depositAddress}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        depositAddress,
                        t(
                          "unlockPayment.toCreatorAddress",
                          "To Creator Address",
                        ),
                      )
                    }
                    className="shrink-0 cursor-pointer p-1 hover:opacity-70"
                  >
                    <CopyIcon className="text-primary h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="mt-4">
                <LegalLinks />
              </div>
            </div>
          </div>
        )}

        {/* Confirm form (before payment initiated) */}
        {!paymentInitiated && (
          <div className="mt-4 space-y-6">
            {/* Event */}
            {eventTitle && (
              <div className="space-y-2">
                <div className="tx-12 lh-18 text-secondary">
                  {t("unlockPayment.event", "Event")}
                </div>
                <div className="lh-24 text-primary fw-m text-xl">
                  {eventTitle}
                </div>
              </div>
            )}

            {/* Unlock email */}
            <div className="space-y-2">
              <div className="tx-12 lh-18 text-secondary">
                {t("unlockPayment.email", "Unlock email")}
              </div>
              <div className="tx-14 text-primary leading-5">{email}</div>
            </div>

            {/* Confirm unlock email */}
            <div className="space-y-2">
              <div className="font-sm lh-18 text-primary flex items-center gap-1">
                {t("unlockPayment.confirmEmail", "Confirm unlock email")}
                <span className="ml-0.5 text-orange-500">*</span>
              </div>
              <input
                ref={confirmEmailRef}
                type="text"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={t(
                  "unlockPayment.confirmEmailPlaceholder",
                  "Confirm unlock email",
                )}
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="one-time-code"
                spellCheck={false}
                className="border-border bg-form-bg text-primary tx-14 w-full rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none"
              />
              {confirmTouched && !emailMatches && (
                <p className="tx-12 lh-18 text-red-500">
                  {t("unlockPayment.emailMismatch", "Email does not match")}
                </p>
              )}
            </div>

            {/* Divider */}
            <Divider />

            {/* Price */}
            <div className="space-y-2">
              <div className="tx-12 lh-18 text-secondary">
                {t("unlockPayment.price", "Price")}
              </div>
              <div className="lh-24 text-primary fw-m text-xl">
                {unlockPriceSatoshi ? unlockPriceSatoshi / 100000000 : "--"} BTC
              </div>
            </div>

            {/* Terms checkbox */}
            <div
              className={cn(
                "-mx-2 rounded-lg p-2",
                confirmTouched && !agreedToTerms
                  ? "border-2 border-red-500"
                  : "border-border",
              )}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="checkbox-form-bg mt-0.5"
                />
                <span className="tx-13 lh-18 text-secondary">
                  {t("common.agreeToThe", "I agree to the")}{" "}
                  <Link
                    to="/terms"
                    className="text-(--color-orange-500) hover:underline"
                  >
                    {t("common.termsOfService", "Terms of Service")}
                  </Link>
                  {", "}
                  <Link
                    to="/terms-reward-distribution"
                    className="text-(--color-orange-500) hover:underline"
                  >
                    {t("common.rewardDistribution", "Reward Distribution")}
                  </Link>
                  {", "}
                  <Link
                    to="/privacy"
                    className="text-(--color-orange-500) hover:underline"
                  >
                    {t("common.privacyPolicy", "Privacy Policy")}
                  </Link>{" "}
                  {t("common.and", "and")}{" "}
                  <Link
                    to="/charges-refunds"
                    className="text-(--color-orange-500) hover:underline"
                  >
                    {t("common.chargesRefunds", "Charges & Refunds")}
                  </Link>
                  {"."}
                </span>
              </label>
              {confirmTouched && !agreedToTerms && (
                <p className="tx-12 lh-18 mt-1 ml-6 text-red-500">
                  {t(
                    "unlockPayment.agreeRequired",
                    "Please agree to the Terms of Service to continue.",
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      {!paymentInitiated && (
        <div className="mt-4 flex w-full max-w-3xl justify-end gap-3 px-1">
          <Button
            type="button"
            appearance="solid"
            tone="surface"
            onClick={() => navigate(`/event/${eventId}`)}
          >
            {t("unlockPayment.backToEvent", "Back to Event")}
          </Button>
          {
            <Button
              type="button"
              appearance="solid"
              tone="primary"
              className={cn(!canPay && "opacity-50")}
              onClick={handleConfirmPay}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("unlockPayment.processing", "Processing...")
                : t("unlockPayment.confirmAndPay", "Confirm & Pay")}
            </Button>
          }
        </div>
      )}
    </div>
  );
}
