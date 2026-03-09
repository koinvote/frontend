import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import type { EventDetailDataRes } from "@/api/response";
import ClockIcon from "@/assets/icons/clock.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";
import { satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { cn } from "@/utils/style";

export default function ChangeUnlockPricePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const locationState = location.state as {
    creatorEmail?: string;
  } | null;
  const creatorEmail = locationState?.creatorEmail ?? "";

  const goBack = () =>
    navigate(`/event/${eventId}`, {
      state: { unlockEmail: creatorEmail, fromUnlock: true },
      replace: true,
    });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- States ---
  const [newPriceBtc, setNewPriceBtc] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [countdown, setCountdown] = useState<number>(0);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const [priceError, setPriceError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Fetch event detail ---
  const { data: event, isLoading } = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = (await API.getEventDetail(
        eventId,
      )()) as unknown as ApiResponse<EventDetailDataRes>;
      if (!response.success) throw new Error(response.message || "Failed");
      return response.data;
    },
    enabled: !!eventId,
  });

  const validatePrice = (val: string): string => {
    const num = parseFloat(val);
    if (!val || isNaN(num) || num <= 0)
      return t("creatorSign.priceMin", "Unlock price must be greater than 0.");
    if (num >= 1000000)
      return t(
        "creatorSign.priceMax",
        "Unlock price must be less than 1,000,000 BTC.",
      );
    return "";
  };

  const canGenerate = !!newPriceBtc && !validatePrice(newPriceBtc);
  const canSubmit =
    canGenerate && !!plaintext && signature.trim().length > 0 && countdown > 0;

  const handleGeneratePlaintext = async () => {
    if (!eventId || !newPriceBtc) return;
    setIsGenerating(true);
    const minDelay = new Promise((r) => setTimeout(r, 400));
    try {
      const [res] = await Promise.all([
        API.generateUnlockPricePlaintext(eventId)({
          email: creatorEmail,
          unlock_price_satoshi: Math.round(parseFloat(newPriceBtc) * 1e8),
        }),
        minDelay,
      ]);
      if (res.success) {
        setPlaintext(res.data.plaintext);
        const now = Math.floor(Date.now() / 1000);
        setExpiredAt(now + 15 * 60);
        setCountdown(15 * 60);
        showToast(
          "success",
          t("creatorSign.plaintextGenerated", "Plaintext generated"),
        );
      } else {
        showToast(
          "error",
          res.message ||
            t("creatorSign.failedToGenerate", "Failed to generate plaintext"),
        );
      }
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          t("creatorSign.failedToGenerate", "Failed to generate plaintext"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPlaintext = useDebouncedClick(async () => {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      showToast(
        "success",
        t("creatorSign.plaintextCopied", "Plaintext copied"),
      );
    } catch {
      showToast("error", t("creatorSign.failedToCopy", "Failed to copy"));
    }
  });

  const handleSubmit = async () => {
    if (!eventId || !plaintext) return;
    setIsSubmitting(true);
    try {
      const res = await API.updateUnlockPrice(eventId)({
        email: creatorEmail,
        unlock_price_satoshi: Math.round(parseFloat(newPriceBtc) * 1e8),
        plaintext,
        signature,
      });
      if (res.success) {
        showToast(
          "success",
          t("changeUnlockPrice.successToast", "Unlock price updated!"),
        );
        navigate(`/event/${eventId}`, {
          state: { unlockEmail: creatorEmail, fromUnlock: true },
          replace: true,
        });
      } else {
        showToast(
          "error",
          res.message ||
            t(
              "changeUnlockPrice.failedToUpdate",
              "Failed to update unlock price",
            ),
        );
      }
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          t(
            "changeUnlockPrice.failedToUpdate",
            "Failed to update unlock price",
          ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading />;
  if (!event) return <div>Event not found</div>;

  const currentPriceBtc = event.unlock_price_satoshi
    ? satsToBtc(event.unlock_price_satoshi, { suffix: false })
    : null;

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 pb-10 md:px-0">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={goBack} />
      </div>

      {/* Header card */}
      <div className="border-border bg-bg w-full max-w-3xl rounded-3xl border px-6 py-6 md:px-8 md:py-8">
        <h1 className="text-accent text-lg font-medium">
          {t("changeUnlockPrice.title", "Change Unlock Price")}
        </h1>
        <p className="text-secondary mt-1 text-sm">
          {t(
            "creatorSign.subtitle",
            "Sign with your creator address to apply this change",
          )}
        </p>

        <div className="text-secondary mt-6 text-xs">
          {t("creatorSign.eventLabel", "Event")}
        </div>
        <div className="text-primary mt-2 text-xl font-medium">
          {event.title}
        </div>
        {event.creator_address && (
          <>
            <div className="text-secondary mt-6 text-xs">
              {t(
                "creatorSign.creatorAddressLabel",
                "Creator address (read-only)",
              )}
            </div>
            <div className="text-primary mt-2 font-mono text-sm break-all">
              {event.creator_address}
            </div>
          </>
        )}
      </div>

      {/* Step 1: Enter New Unlock Price */}
      <div
        className={cn(
          "border-border bg-bg mt-6 w-full max-w-3xl rounded-xl border p-4 md:p-6",
          showErrors && !canGenerate && "border-red-500",
        )}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="border-border bg-primary-lightModeGray flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-medium md:h-6 md:w-6">
            <span className="text-xs text-black md:text-sm">1</span>
          </div>
          <h2 className="text-primary text-base font-medium">
            {t("changeUnlockPrice.step1Title", "Enter new price")}
          </h2>
        </div>

        <label className="text-primary text-sm font-medium">
          {t("changeUnlockPrice.newPriceLabel", "New price (BTC)")}{" "}
          <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={newPriceBtc}
          onChange={(e) => {
            setNewPriceBtc(e.target.value);
            setPriceError(validatePrice(e.target.value));
            setPlaintext(null);
            setExpiredAt(null);
            setCountdown(0);
          }}
          placeholder={t("changeUnlockPrice.newPriceLabel", "New price (BTC)")}
          className={cn(
            "border-border bg-form-bg text-primary mt-2 w-full rounded-xl border px-3 py-2 text-sm leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600",
            priceError &&
              (showErrors || !!newPriceBtc) &&
              "border-red-500 focus:ring-red-500",
          )}
        />
        {priceError && (showErrors || !!newPriceBtc) && (
          <p className="mt-1 text-xs text-red-500">{priceError}</p>
        )}
        {showErrors && !canGenerate && !priceError && (
          <p className="mt-1 text-xs text-red-500">
            {t(
              "changeUnlockPrice.errorEnterPrice",
              "Please enter a valid unlock price.",
            )}
          </p>
        )}
        {currentPriceBtc &&
          (newPriceBtc === "" || priceError ? (
            <div className="text-secondary mt-6 text-xs">
              {t("changeUnlockPrice.currentPriceLabel", "Current: ")}
              {currentPriceBtc} BTC
            </div>
          ) : (
            <div className="text-primary mt-6 text-xs">
              <span className="text-secondary">
                {t("changeUnlockPrice.currentPriceLabel", "Current: ")}
                {currentPriceBtc}
              </span>
              {" → "}
              {newPriceBtc} BTC
            </div>
          ))}
      </div>

      {/* Step 2: Generate Plaintext */}
      <div
        className={cn(
          "border-border bg-bg mt-6 w-full max-w-3xl rounded-xl border p-4 md:p-6",
          showErrors && canGenerate && !plaintext && "border-red-500",
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="border-border bg-primary-lightModeGray flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-medium md:h-6 md:w-6">
            <span className="text-xs text-black md:text-sm">2</span>
          </div>
          <h2 className="text-primary text-base font-medium">
            {t("creatorSign.step2Title", "Generate the Plaintext")}
          </h2>
        </div>

        <Button
          appearance="solid"
          tone={canGenerate ? "primary" : "white"}
          disabled={!canGenerate || isGenerating}
          onClick={handleGeneratePlaintext}
          className="w-full"
        >
          {isGenerating
            ? t("creatorSign.generating", "Generating...")
            : t("creatorSign.generateBtn", "Generate Plaintext")}
        </Button>

        {showErrors && canGenerate && !plaintext && (
          <p className="mt-3 text-xs text-red-500">
            {t(
              "creatorSign.errorGeneratePlaintext",
              "Please generate the plaintext first.",
            )}
          </p>
        )}
        {plaintext && (
          <div className="mt-6 flex flex-col gap-2">
            <div className="border-border bg-surface rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-success flex-1 font-mono text-xs break-all">
                  {plaintext}
                </p>
                <button
                  type="button"
                  onClick={handleCopyPlaintext}
                  className="text-secondary hover:text-primary shrink-0 cursor-pointer transition-colors"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            {countdown > 0 ? (
              <div className="text-success mt-2 flex items-center gap-2 text-xs">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {t("reply.expiredIn", "Expired in {{time}}", {
                    time: formatTimeRemaining(countdown),
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {t(
                    "reply.plaintextExpired",
                    "This plaintext has expired. Please generate a new one.",
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Enter Signature */}
      <div
        className={cn(
          "border-border bg-bg mt-6 w-full max-w-3xl rounded-xl border p-4 md:p-6",
          showErrors &&
            !!plaintext &&
            countdown > 0 &&
            !signature.trim() &&
            "border-red-500",
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="border-border bg-primary-lightModeGray flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-medium md:h-6 md:w-6">
            <span className="text-xs text-black md:text-sm">3</span>
          </div>
          <h2 className="text-primary text-base font-medium">
            {t("creatorSign.step3Title", "Enter Signature")}
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-primary text-sm font-medium">
            {t("creatorSign.signatureLabel", "Signature")}{" "}
            <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={t(
              "creatorSign.signaturePlaceholder",
              "Paste the signature generated by your BTC wallet for the plaintext here...",
            )}
            className={cn(
              "border-border bg-form-bg text-primary mt-2 w-full rounded-xl border px-3 py-2 font-mono text-sm leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600",
              showErrors &&
                !!plaintext &&
                countdown > 0 &&
                !signature.trim() &&
                "border-red-500 focus:ring-red-500",
            )}
          />
          {showErrors && !!plaintext && countdown > 0 && !signature.trim() && (
            <p className="mt-1 text-xs text-red-500">
              {t(
                "creatorSign.errorEnterSignature",
                "Please enter your signature.",
              )}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="mt-6 flex w-full max-w-3xl justify-end gap-4">
        <Button
          type="button"
          appearance="outline"
          tone="white"
          className="border-border! text-black hover:bg-white/5 dark:border-white dark:text-white"
          onClick={goBack}
        >
          {t("creatorSign.backToEvent", "Back to Event")}
        </Button>
        <Button
          type="button"
          appearance="solid"
          tone="primary"
          disabled={isSubmitting}
          className={cn(!canSubmit && !isSubmitting && "opacity-50")}
          onClick={() => {
            setShowErrors(true);
            if (!canSubmit) return;
            handleSubmit();
          }}
        >
          {isSubmitting
            ? t("creatorSign.applying", "Applying...")
            : t("creatorSign.confirmAndSign", "Confirm & Sign")}
        </Button>
      </div>
    </div>
  );
}
