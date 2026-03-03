import { Tooltip } from "antd";
import { useEffect, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/style";

import type { CreateEventFormValues, ResultVisibility } from "../formTypes";

export function ResultVisibilityField() {
  const { t } = useTranslation();
  const {
    control,
    register,
    watch,
    clearErrors,
    setValue,
    formState: { errors },
  } = useFormContext<CreateEventFormValues>();

  const resultVisibility = watch("resultVisibility");
  const durationHours = watch("durationHours");
  const isRewarded = watch("isRewarded");
  const eventType = watch("eventType");

  const resultVisibilityRef = useRef(resultVisibility);
  resultVisibilityRef.current = resultVisibility;

  // When switching to non-rewarded or open-ended, reset restricted visibility selections
  useEffect(() => {
    if (
      (!isRewarded || eventType === "open") &&
      (resultVisibility === "paid_only" || resultVisibility === "creator_only")
    ) {
      setValue("resultVisibility", "public");
      clearErrors("creatorEmail");
      clearErrors("unlockPriceBtc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRewarded, eventType]);

  const rewardedOnlyTooltip = t(
    "createEvent.resultVisibilityRewardedOnly",
    "Available for rewarded events only",
  );
  const openEndedDisabledTooltip = t(
    "createEvent.resultVisibilityOpenEndedDisabled",
    "Not available for open-ended events",
  );

  return (
    <div>
      <p
        id="resultVisibilityTitle"
        className="tx-14 lh-20 fw-m text-primary mb-2"
      >
        {t("createEvent.resultVisibility", "Result visibility")}
        <span className="text-(--color-orange-500)"> *</span>
      </p>
      <Controller
        control={control}
        name="resultVisibility"
        render={({ field }) => (
          <div className="flex gap-6">
            {(["public", "paid_only"] as ResultVisibility[]).map((value) => {
              const isForRestricted =
                value === "paid_only" || value === "creator_only";
              const isDisabledForNonRewarded = !isRewarded && isForRestricted;
              const isDisabledForOpenEnded =
                eventType === "open" && isForRestricted;
              const isDisabled = isDisabledForNonRewarded || isDisabledForOpenEnded;
              const tooltipTitle = isDisabledForOpenEnded
                ? openEndedDisabledTooltip
                : rewardedOnlyTooltip;

              const radioLabel = (
                <label
                  className={cn(
                    "tx-14 lh-20 text-primary flex items-center gap-2",
                    isDisabled
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer",
                  )}
                >
                  <input
                    name="resultVisibility"
                    type="radio"
                    className="radio-orange"
                    checked={field.value === value}
                    disabled={isDisabled}
                    onChange={() => {
                      field.onChange(value);
                      if (value !== "paid_only") {
                        clearErrors("creatorEmail");
                        clearErrors("unlockPriceBtc");
                      }
                    }}
                  />
                  <span>
                    {value === "public" &&
                      t("createEvent.resultVisibilityPublic", "Public")}
                    {value === "paid_only" &&
                      t("createEvent.resultVisibilityPaidOnly", "Paid-only")}
                    {value === "creator_only" &&
                      t(
                        "createEvent.resultVisibilityCreatorOnly",
                        "Creator-only",
                      )}
                  </span>
                </label>
              );

              return isDisabled ? (
                <Tooltip
                  key={value}
                  title={tooltipTitle}
                  color="white"
                  placement="top"
                >
                  {/* span wrapper needed for Tooltip to attach hover events to a non-interactive element */}
                  <span>{radioLabel}</span>
                </Tooltip>
              ) : (
                <span key={value}>{radioLabel}</span>
              );
            })}
          </div>
        )}
      />

      {/* Extra fields shown only when paid_only is selected */}
      {resultVisibility === "paid_only" && (
        <div className="border-border bg-surface mt-4 space-y-4 rounded-xl border p-4">
          {/* Creator email */}
          <div>
            <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
              {t("createEvent.creatorEmail", "Creator email")}
              <span className="text-(--color-orange-500)"> *</span>
            </label>
            <input
              {...register("creatorEmail", {
                validate: (v) => {
                  if (resultVisibilityRef.current !== "paid_only") return true;
                  if (!v || !v.trim())
                    return t(
                      "createEvent.creatorEmailRequired",
                      "Please enter your email.",
                    );
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(v.trim()))
                    return t(
                      "createEvent.creatorEmailInvalid",
                      "Please enter a valid email address.",
                    );
                  return true;
                },
              })}
              type="text"
              name="field_wifjvn1w"
              id="field_wifjvn1w"
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="one-time-code"
              spellCheck="false"
              placeholder={t(
                "createEvent.creatorEmailPlaceholder",
                "Please enter a valid email address",
              )}
              className={cn(
                "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none",
                errors.creatorEmail
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-(--color-orange-500)",
              )}
            />
            <p className="tx-12 lh-18 text-secondary mt-1">
              {t(
                "createEvent.creatorEmailHint",
                "This email will be used by you to unlock this event's results.",
              )}
            </p>
            {errors.creatorEmail && (
              <p className="tx-12 lh-18 mt-1 text-red-500">
                {errors.creatorEmail.message}
              </p>
            )}
          </div>

          {/* Unlock price (BTC) */}
          <div>
            <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
              {t("createEvent.unlockPriceBtc", "Unlock price (BTC)")}
              <span className="text-(--color-orange-500)"> *</span>
            </label>
            <Controller
              control={control}
              name="unlockPriceBtc"
              rules={{
                validate: (v) => {
                  if (resultVisibilityRef.current !== "paid_only") return true;
                  if (!v || v.trim() === "")
                    return t(
                      "createEvent.unlockPriceRequired",
                      "Please enter unlock price.",
                    );
                  const amount = parseFloat(v);
                  if (!Number.isFinite(amount) || amount <= 0)
                    return t(
                      "createEvent.unlockPriceInvalid",
                      "Please enter a valid amount.",
                    );
                  if (amount > 1_000_000)
                    return t(
                      "createEvent.unlockPriceMaxExceeded",
                      "Maximum unlock price is 1,000,000 BTC.",
                    );
                  return true;
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  disabled={Number(durationHours) <= 0}
                  type="text"
                  inputMode="decimal"
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    const parts = v.split(".");
                    const cleaned =
                      parts.length > 0
                        ? parts[0] +
                          (parts.length > 1
                            ? "." + parts.slice(1).join("")
                            : "")
                        : "";
                    field.onChange(cleaned);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData("text");
                    const cleaned = pastedText.replace(/[^0-9.]/g, "");
                    const parts = cleaned.split(".");
                    const numbersOnly =
                      parts.length > 0
                        ? parts[0] +
                          (parts.length > 1
                            ? "." + parts.slice(1).join("")
                            : "")
                        : "";
                    if (numbersOnly) field.onChange(numbersOnly);
                  }}
                  placeholder={
                    Number(durationHours) > 0
                      ? t("createEvent.enterUnlockPrice", "Enter unlock price")
                      : t("createEvent.setDurationFirst", "Set Duration First")
                  }
                  className={cn(
                    "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none disabled:opacity-60",
                    errors.unlockPriceBtc
                      ? "border-red-500 focus:ring-red-500"
                      : "border-border focus:ring-(--color-orange-500)",
                  )}
                />
              )}
            />
            {errors.unlockPriceBtc && (
              <p className="tx-12 lh-18 mt-1 text-red-500">
                {errors.unlockPriceBtc.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
