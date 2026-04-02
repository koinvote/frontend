import { useQuery } from "@tanstack/react-query";
import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import { getApiMessage } from "@/api/http";
import type { EventDetailDataRes } from "@/api/response";
import ClockIcon from "@/assets/icons/clock.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import WarningIcon from "@/assets/icons/warning.svg?react";
import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";
import { useDebouncedClick } from "@/utils/helper";
import { cn } from "@/utils/style";

type NewVisibility = "paid_only" | "public";

export default function ChangeResultVisibilityPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const goBack = () =>
    navigate(`/event/${eventId}`, {
      state: { unlockEmail: creatorEmail, fromUnlock: true },
      replace: true,
    });

  const locationState = location.state as {
    creatorEmail?: string;
    currentVisibility?: string;
  } | null;
  const creatorEmail = locationState?.creatorEmail ?? "";

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- States ---
  const [selectedVisibility, setSelectedVisibility] =
    useState<NewVisibility | null>(null);
  const [unlockPriceBtc, setUnlockPriceBtc] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [countdown, setCountdown] = useState<number>(0);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const [priceError, setPriceError] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const currentVisibility = event?.result_visibility;

  // Available target visibility options based on current
  const availableOptions: NewVisibility[] = (() => {
    if (currentVisibility === "creator_only") return ["public", "paid_only"];
    if (currentVisibility === "paid_only") return ["public"];
    return [];
  })();

  // Auto-select when there's only one option
  useEffect(() => {
    if (availableOptions.length === 1) {
      setSelectedVisibility(availableOptions[0]);
    }
  }, [availableOptions.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const canGenerate =
    !!selectedVisibility &&
    (selectedVisibility !== "paid_only" ||
      (!!unlockPriceBtc && !validatePrice(unlockPriceBtc)));
  const canSubmit =
    canGenerate && !!plaintext && signature.trim().length > 0 && countdown > 0;

  const handleGeneratePlaintext = async () => {
    if (!eventId || !selectedVisibility) return;
    setIsGenerating(true);
    const minDelay = new Promise((r) => setTimeout(r, 400));
    try {
      const [res] = await Promise.all([
        API.generateChangeVisibilityPlaintext(eventId)({
          email: creatorEmail,
          result_visibility: selectedVisibility,
          unlock_price_satoshi:
            selectedVisibility === "paid_only" && unlockPriceBtc
              ? Math.round(parseFloat(unlockPriceBtc) * 1e8)
              : undefined,
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
      showToast(
        "error",
        getApiMessage(err) ||
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

  const handleVerifyAndOpenModal = async () => {
    setShowErrors(true);
    if (!canSubmit || !eventId || !selectedVisibility || !plaintext) return;
    setIsVerifying(true);
    try {
      const res = await API.verifyChangeVisibilityPlaintext(eventId)({
        email: creatorEmail,
        plaintext,
        signature,
      });
      if (res.success) {
        setSignatureError("");
        setShowConfirmModal(true);
      } else {
        setSignatureError(
          res.message ||
            t(
              "creatorSign.failedToVerifyPlaintext",
              "Plaintext verification failed. Please check your signature.",
            ),
        );
      }
    } catch (err: unknown) {
      setSignatureError(
        getApiMessage(err) ||
          t(
            "creatorSign.failedToVerifyPlaintext",
            "Plaintext verification failed. Please check your signature.",
          ),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmApply = async () => {
    if (!eventId || !selectedVisibility || !plaintext) return;
    setIsSubmitting(true);
    try {
      const res = await API.updateResultVisibility(eventId)({
        email: creatorEmail,
        result_visibility: selectedVisibility,
        unlock_price_satoshi:
          selectedVisibility === "paid_only" && unlockPriceBtc
            ? Math.round(parseFloat(unlockPriceBtc) * 1e8)
            : undefined,
        plaintext,
        signature,
      });
      if (res.success) {
        showToast(
          "success",
          t("changeVisibility.successToast", "Result visibility updated!"),
        );
        setShowConfirmModal(false);
        navigate(`/event/${eventId}`, {
          state: { unlockEmail: creatorEmail, fromUnlock: true },
          replace: true,
        });
      } else {
        showToast(
          "error",
          res.message ||
            t("changeVisibility.failedToUpdate", "Failed to update visibility"),
        );
        setShowConfirmModal(false);
      }
    } catch (err: unknown) {
      showToast(
        "error",
        getApiMessage(err) ||
          t("changeVisibility.failedToUpdate", "Failed to update visibility"),
      );
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityLabel = (v: string) => {
    if (v === "public") return t("reply.resultVisibilityPublic", "Public");
    if (v === "paid_only")
      return t("reply.resultVisibilityPaidOnly", "Paid-only");
    return t("reply.resultVisibilityCreatorOnly", "Creator-only");
  };

  if (isLoading) return <Loading />;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 pb-10 md:px-0">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={goBack} />
      </div>

      <div className="border-border bg-bg w-full max-w-3xl rounded-3xl border px-6 py-6 md:px-8 md:py-8">
        {/* Header */}
        <h1 className="text-accent text-lg font-medium">
          {t("changeVisibility.title", "Change Result Visibility")}
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

      {/* Step 1: Select Result Visibility */}
      <div
        className={cn(
          "border-border bg-bg mt-6 w-full max-w-3xl rounded-xl border p-4 md:p-6",
          showErrors && !selectedVisibility && "border-red-500",
        )}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="border-border bg-primary-lightModeGray flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-medium md:h-6 md:w-6">
            <span className="text-xs text-black md:text-sm">1</span>
          </div>
          <h2 className="text-primary text-base font-medium">
            {t("changeVisibility.step1Title", "Select Result Visibility")}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {availableOptions.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer flex-col rounded-lg`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="visibility-option"
                  className="radio-orange mr-3"
                  checked={selectedVisibility === opt}
                  onChange={() => {
                    setSelectedVisibility(opt);
                    setPlaintext(null);
                    setSignature("");
                    setExpiredAt(null);
                    setCountdown(0);
                  }}
                />
                <span className="text-primary text-sm">
                  {visibilityLabel(opt)}
                </span>
              </div>
              {opt === "paid_only" && selectedVisibility === "paid_only" && (
                <div className="mt-4">
                  <label className="text-primary text-sm font-medium">
                    {t(
                      "changeVisibility.unlockPriceLabel",
                      "Unlock Price (BTC)",
                    )}{" "}
                    <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    min="0"
                    value={unlockPriceBtc}
                    onChange={(e) => {
                      setUnlockPriceBtc(e.target.value);
                      setPriceError(validatePrice(e.target.value));
                      setPlaintext(null);
                      setExpiredAt(null);
                      setCountdown(0);
                    }}
                    placeholder="0.0001"
                    className={cn(
                      "border-border bg-form-bg text-primary mt-1 w-full rounded-xl border px-3 py-2 text-sm leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600",
                      priceError &&
                        (showErrors || !!unlockPriceBtc) &&
                        "border-red-500 focus:ring-red-500",
                    )}
                  />
                  {priceError && (showErrors || !!unlockPriceBtc) && (
                    <p className="mt-1 text-xs text-red-500">{priceError}</p>
                  )}
                </div>
              )}
            </label>
          ))}
        </div>
        {showErrors && !selectedVisibility && (
          <p className="mt-3 text-xs text-red-500">
            {t(
              "changeVisibility.errorSelectVisibility",
              "Please select a result visibility.",
            )}
          </p>
        )}
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
            onChange={(e) => {
              setSignature(e.target.value);
              setSignatureError("");
            }}
            placeholder={t(
              "creatorSign.signaturePlaceholder",
              "Paste the signature generated by your BTC wallet for the plaintext here...",
            )}
            className={cn(
              "border-border bg-form-bg text-primary mt-2 w-full rounded-xl border px-3 py-2 font-mono text-sm leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600",
              (signatureError ||
                (showErrors &&
                  !!plaintext &&
                  countdown > 0 &&
                  !signature.trim())) &&
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
          {signatureError && (
            <p className="mt-1 text-xs text-red-500">{signatureError}</p>
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
          disabled={isSubmitting || isVerifying}
          className={cn(!canSubmit && !isSubmitting && !isVerifying && "opacity-50")}
          onClick={handleVerifyAndOpenModal}
        >
          {isVerifying
            ? t("creatorSign.verifying", "Verifying...")
            : t("creatorSign.confirmAndSign", "Confirm & Sign")}
        </Button>
      </div>

      {/* Confirm Dialog */}
      <Modal
        centered
        open={showConfirmModal}
        onCancel={() => !isSubmitting && setShowConfirmModal(false)}
        footer={null}
        classNames={{ container: "!bg-bg" }}
        styles={{
          container: { padding: 24 },
          header: { padding: 0, marginBottom: 8, background: "transparent" },
          body: { padding: 0 },
        }}
        title={
          <div className="flex items-center" style={{ fontSize: 18 }}>
            {t("changeVisibility.confirmTitle", "Confirm Irreversible Change")}
          </div>
        }
        closable={!isSubmitting}
      >
        <p className="text-secondary mb-4 text-sm">
          {t(
            "changeVisibility.confirmDescription",
            "You are about to change the result visibility for this event.",
          )}
        </p>

        <div className="border-border bg-bg rounded-lg border p-3">
          <div className="text-secondary text-xs">
            {t("creatorSign.eventLabel", "Event")}
          </div>
          <div className="text-primary mt-2 text-sm font-medium">
            {event.title}
          </div>
          <div className="text-secondary mt-4 text-xs">
            {t("changeVisibility.resultVisibility", "Result visibility")}
          </div>
          <div className="text-primary mt-2 text-sm">
            <span className="text-secondary">
              {visibilityLabel(currentVisibility ?? "")}
            </span>
            {" → "}
            {visibilityLabel(selectedVisibility ?? "")}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-amber-500">
          <WarningIcon className="h-4 w-4 shrink-0" />
          <span>
            {t(
              "changeVisibility.irreversibleWarning",
              "This change is irreversible.",
            )}
          </span>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            appearance="outline"
            tone="white"
            className="border-border text-black dark:border-white dark:text-white"
            onClick={() => setShowConfirmModal(false)}
            disabled={isSubmitting}
          >
            {t("general.cancel", "Cancel")}
          </Button>
          <Button
            appearance="solid"
            tone="primary"
            disabled={isSubmitting}
            onClick={handleConfirmApply}
          >
            {isSubmitting
              ? t("creatorSign.applying", "Applying...")
              : t("changeVisibility.confirmAndApply", "Confirm & Apply")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
