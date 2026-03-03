import { useRef } from "react";
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
    formState: { errors },
  } = useFormContext<CreateEventFormValues>();

  const resultVisibility = watch("resultVisibility");
  const durationHours = watch("durationHours");

  const resultVisibilityRef = useRef(resultVisibility);
  resultVisibilityRef.current = resultVisibility;

  return (
    <div>
      <p className="tx-14 lh-20 fw-m text-primary mb-2">
        {t("createEvent.resultVisibility", "Result visibility")}
        <span className="text-(--color-orange-500)"> *</span>
      </p>
      <Controller
        control={control}
        name="resultVisibility"
        render={({ field }) => (
          <div className="flex gap-6">
            {(
              [
                "public",
                "paid_only",
                "creator_only",
              ] as ResultVisibility[]
            ).map((value) => (
              <label
                key={value}
                className="flex items-center gap-2 tx-14 lh-20 text-primary cursor-pointer"
              >
                <input
                  name="resultVisibility"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === value}
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
                    t(
                      "createEvent.resultVisibilityPublic",
                      "Public",
                    )}
                  {value === "paid_only" &&
                    t(
                      "createEvent.resultVisibilityPaidOnly",
                      "Paid-only",
                    )}
                  {value === "creator_only" &&
                    t(
                      "createEvent.resultVisibilityCreatorOnly",
                      "Creator-only",
                    )}
                </span>
              </label>
            ))}
          </div>
        )}
      />

      {/* Extra fields shown only when paid_only is selected */}
      {resultVisibility === "paid_only" && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4 space-y-4">
          {/* Creator email */}
          <div>
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.creatorEmail", "Creator email")}
              <span className="text-(--color-orange-500)"> *</span>
            </label>
            <input
              {...register("creatorEmail", {
                validate: (v) => {
                  if (resultVisibilityRef.current !== "paid_only")
                    return true;
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
              autoComplete="one-time-code"
              placeholder={t(
                "createEvent.creatorEmailPlaceholder",
                "Please enter a valid email address",
              )}
              className={cn(
                "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2",
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
              <p className="tx-12 lh-18 text-red-500 mt-1">
                {errors.creatorEmail.message}
              </p>
            )}
          </div>

          {/* Unlock price (BTC) */}
          <div>
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.unlockPriceBtc", "Unlock price (BTC)")}
              <span className="text-(--color-orange-500)"> *</span>
            </label>
            <Controller
              control={control}
              name="unlockPriceBtc"
              rules={{
                validate: (v) => {
                  if (resultVisibilityRef.current !== "paid_only")
                    return true;
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
                      ? t(
                          "createEvent.enterUnlockPrice",
                          "Enter unlock price",
                        )
                      : t(
                          "createEvent.setDurationFirst",
                          "Set Duration First",
                        )
                  }
                  className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2 disabled:opacity-60",
                    errors.unlockPriceBtc
                      ? "border-red-500 focus:ring-red-500"
                      : "border-border focus:ring-(--color-orange-500)",
                  )}
                />
              )}
            />
            {errors.unlockPriceBtc && (
              <p className="tx-12 lh-18 text-red-500 mt-1">
                {errors.unlockPriceBtc.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
