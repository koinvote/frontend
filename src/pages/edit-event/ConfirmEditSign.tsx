import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import { getApiMessage } from "@/api/http";
import type { GetEditPlaintextRes } from "@/api/response";
import ClockIcon from "@/assets/icons/clock.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";

import type { EditEventState } from "./types";

const COUNTDOWN_MINUTES = 15;

function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function ConfirmEditSign() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as EditEventState | null;
  const { showToast } = useToast();

  const [plaintext, setPlaintext] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signatureError, setSignatureError] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_MINUTES * 60);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no state
  useEffect(() => {
    if (!state) {
      navigate(`/event/${eventId}/edit`, { replace: true });
    }
  }, [state, eventId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!expiredAt) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiredAt - now;
      setCountdown(remaining <= 0 ? 0 : remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  const handleGeneratePlaintext = async () => {
    if (!state) return;
    setIsGenerating(true);
    setSignature("");
    setSignatureError("");

    try {
      const hashtags = state.hashtag
        ? state.hashtag.split(",").filter(Boolean)
        : undefined;

      const res = (await API.generateEditPlaintext(eventId!)({
        title: state.title,
        description: state.description,
        event_type: state.eventType,
        options: state.options,
        hashtags: hashtags?.length ? hashtags : undefined,
      })) as unknown as ApiResponse<GetEditPlaintextRes>;

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to generate plaintext");
      }

      setPlaintext(res.data.plaintext);
      setExpiredAt(res.data.timestamp + COUNTDOWN_MINUTES * 60);
      setCountdown(COUNTDOWN_MINUTES * 60);
    } catch (err) {
      showToast(
        "error",
        getApiMessage(err) ??
          (err instanceof Error ? err.message : "Failed to generate plaintext"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPlaintext = useCallback(() => {
    if (!plaintext) return;
    navigator.clipboard
      .writeText(plaintext)
      .then(() => {
        showToast(
          "success",
          t("confirmSign.plaintextCopied", "Plaintext copied to clipboard"),
        );
      })
      .catch(() => {
        showToast(
          "error",
          t("confirmSign.failedToCopyPlaintext", "Failed to copy plaintext"),
        );
      });
  }, [plaintext, showToast, t]);

  const handleSubmit = useCallback(async () => {
    if (!state) return;

    if (!signature.trim()) {
      showToast(
        "error",
        t("confirmSign.pleaseEnterSignature", "Please enter a signature"),
      );
      return;
    }
    if (countdown <= 0) {
      showToast(
        "error",
        t(
          "confirmSign.plaintextExpiredToast",
          "Plaintext has expired. Please go back and try again.",
        ),
      );
      return;
    }

    setIsSubmitting(true);
    setSignatureError("");

    try {
      const hashtags = state.hashtag
        ? state.hashtag.split(",").filter(Boolean)
        : undefined;

      const res = (await API.updateEvent(eventId!)({
        title: state.title,
        description: state.description,
        event_type: state.eventType,
        options: state.options,
        hashtags: hashtags?.length ? hashtags : undefined,
        plaintext,
        signature: signature.trim(),
      })) as unknown as ApiResponse<unknown>;

      if (!res.success) {
        throw new Error(res.message || "Failed to update event");
      }

      showToast(
        "success",
        t("editEvent.updateSuccess", "Event updated successfully"),
      );
      navigate(`/event/${eventId}`, { replace: true });
    } catch (err) {
      setSignatureError(
        getApiMessage(err) ??
          (err instanceof Error ? err.message : "Failed to update event"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [state, signature, countdown, plaintext, eventId, navigate, showToast, t]);

  // Enter key to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      const isDisabled =
        !signature.trim() ||
        isSubmitting ||
        !plaintext ||
        countdown <= 0 ||
        isGenerating;
      if (!isDisabled) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    signature,
    isSubmitting,
    plaintext,
    countdown,
    isGenerating,
    handleSubmit,
  ]);

  if (!state) return null;

  const isPlaintextExpired = plaintext && countdown <= 0;
  const canSubmit =
    !!signature.trim() &&
    !!plaintext &&
    countdown > 0 &&
    !isSubmitting &&
    !isGenerating;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      <div className="border-border bg-bg mb-6 w-full max-w-3xl space-y-6 rounded-3xl border px-4 py-6 md:px-8 md:py-8">
        <div>
          <h1 className="tx-20 lh-24 fw-m text-accent">
            {t("editEvent.confirmSignTitle", "Change event details")}
          </h1>
          <p className="tx-14 lh-20 text-secondary mt-1">
            {t("editEvent.confirmSignSubtitle", "Sign to confirm the changes")}
          </p>
        </div>

        <Field label={t("common.event", "Event")}>
          <span className="lh-20 text-xl">{state.title || "--"}</span>
        </Field>

        {/* Creator address */}
        <Field label={t("preview.creatorAddress", "Creator address")}>
          {state.creatorAddress || "--"}
        </Field>
      </div>

      {/* Section 1: Generate Plaintext */}
      <div className="border-border bg-bg mb-6 w-full max-w-3xl space-y-6 rounded-3xl border px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-admin-bg border-border flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
              <span className="tx-12 lh-18 fw-m text-black">1</span>
            </div>
            <h2 className="tx-16 lh-20 fw-m text-primary">
              {t("creatorSign.step2Title", "Generate the Plaintext")}
            </h2>
          </div>

          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="w-full"
            disabled={isGenerating}
            onClick={handleGeneratePlaintext}
          >
            {isGenerating
              ? t("confirmSign.generatingPlaintext", "Generating plaintext...")
              : t("common.generatePlaintext", "Generate Plaintext")}
          </Button>

          {plaintext && (
            <div className="space-y-3">
              <div className="border-border bg-bg rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="tx-14 lh-20 text-success flex-1 font-mono break-all">
                    {plaintext}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPlaintext}
                    className="text-secondary hover:text-primary flex-shrink-0 cursor-pointer transition-colors"
                    aria-label="Copy plaintext"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!isPlaintextExpired ? (
                <div className="tx-12 lh-18 text-success flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    {t("confirmSign.expiredIn", "Expired in {{time}}", {
                      time: formatTimeRemaining(countdown),
                    })}
                  </span>
                </div>
              ) : (
                <div className="tx-12 lh-18 flex items-center gap-2 text-red-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    {t(
                      "confirmSign.plaintextExpired",
                      "This plaintext has expired. Please generate a new one.",
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Enter Signature */}
      <div className="border-border bg-bg w-full max-w-3xl space-y-6 rounded-3xl border px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-admin-bg border-border flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
            <span className="tx-12 lh-18 fw-m text-black">2</span>
          </div>
          <h2 className="tx-16 lh-20 fw-m text-primary">
            {t("confirmSign.enterSignatureTitle", "Enter Signature")}
          </h2>
        </div>
        <div className="space-y-2">
          <label className="lh-18 text-primary text-sm">
            {t("confirmSign.signatureLabel", "Signature")}{" "}
            <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => {
              setSignature(e.target.value);
              if (signatureError) setSignatureError("");
            }}
            className="border-border bg-bg text-primary tx-14 lh-20 mt-2 w-full rounded-lg border px-3 py-2 font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
            placeholder={t(
              "confirmSign.enterSignature",
              "Enter your signature",
            )}
            disabled={!plaintext || countdown <= 0}
          />
          {signatureError && (
            <div className="tx-12 lh-18 text-red-500">{signatureError}</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          appearance="outline"
          tone="primary"
          text="sm"
          className="sm:w-40"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          {t("confirmSign.backToPreview", "Back to Preview")}
        </Button>
        <Button
          type="button"
          appearance="solid"
          tone="primary"
          text="sm"
          className="sm:w-40"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loading size="sm" className="mr-2" />
              {t("createEvent.submitting", "Submitting…")}
            </span>
          ) : (
            t("confirmSign.title", "Confirm & Sign")
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="tx-12 lh-18 text-secondary">{label}</div>
      <div className="tx-14 lh-20 text-primary wrap-break-word whitespace-pre-line">
        {children}
      </div>
    </div>
  );
}
