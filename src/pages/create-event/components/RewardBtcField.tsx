import { useMemo, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/base/Button";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { satsToBtc } from "@/utils/formatter";
import { cn } from "@/utils/style";

import type { CreateEventFormValues } from "../formTypes";

interface RewardBtcFieldProps {
  setLastField: React.Dispatch<React.SetStateAction<string>>;
}

export function RewardBtcField({ setLastField }: RewardBtcFieldProps) {
  const { t } = useTranslation();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateEventFormValues>();
  const params = useSystemParametersStore((s) => s.params);

  const durationHours = watch("durationHours");
  const isRewarded = watch("isRewarded");
  const rewardBtc = watch("rewardBtc");

  const minRewardBtc = useMemo(() => {
    if (!params) {
      return 0.000011;
    }

    const durationHoursNum = Number(durationHours);
    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const minRewardAmountSatoshi = params.min_reward_amount_satoshi ?? 0;

    if (!Number.isFinite(durationHoursNum) || durationHoursNum <= 0) {
      return minRewardAmountSatoshi / 100_000_000;
    }

    let minRewardSatoshi: number;

    if (durationHoursNum <= freeHours) {
      minRewardSatoshi = satoshiPerDurationHour;
    } else {
      minRewardSatoshi =
        minRewardAmountSatoshi +
        (durationHoursNum - freeHours) * satoshiPerDurationHour;
    }

    return minRewardSatoshi / 100_000_000;
  }, [params, durationHours]);

  // Refs for validate closures to avoid stale captures
  const minRewardBtcRef = useRef(minRewardBtc);
  minRewardBtcRef.current = minRewardBtc;
  const isRewardedRef = useRef(isRewarded);
  isRewardedRef.current = isRewarded;

  const rewardBtcPlaceholder =
    Number(durationHours) > 0
      ? t(
          "createEvent.rewardBtcPlaceholderEnabled",
          "Enter reward (Min {{min}})",
          {
            min: Number(minRewardBtc.toFixed(8)),
          },
        )
      : t("createEvent.rewardBtcPlaceholder", "Set Duration First");

  const maxRecipients = useMemo(() => {
    if (!isRewarded || !rewardBtc) return null;

    const rewardAmountSatoshi = Math.round(parseFloat(rewardBtc) * 100_000_000);
    if (!Number.isFinite(rewardAmountSatoshi) || rewardAmountSatoshi <= 0) {
      return null;
    }

    const satoshiPerExtraWinner = params?.satoshi_per_extra_winner ?? 0;
    if (!satoshiPerExtraWinner || satoshiPerExtraWinner <= 0) {
      return null;
    }

    return Math.floor(rewardAmountSatoshi / satoshiPerExtraWinner);
  }, [isRewarded, rewardBtc, params?.satoshi_per_extra_winner]);

  const platformFeeSatoshi = useMemo(() => {
    if (isRewarded) return null;
    if (!params) return null;

    const duration = Number(durationHours);
    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    if (!Number.isFinite(duration) || duration <= 0) return null;

    const billableHours =
      freeHours > 0 ? Math.max(0, duration - freeHours) : duration;

    if (billableHours <= 0) return 0;

    const fee =
      billableHours * satoshiPerDurationHour * (platformFeePercentage / 100);

    return Math.round(fee);
  }, [isRewarded, params, durationHours]);

  const platformFeeDisplay = useMemo(() => {
    return satsToBtc(platformFeeSatoshi, {
      trimTrailingZeros: true,
    });
  }, [platformFeeSatoshi]);

  if (!isRewarded) {
    return (
      <div>
        <p className="text-primary mb-1 text-sm leading-5 font-medium">
          {t("createEvent.platformFee", "Platform fee:")}
        </p>
        <p className="tx-12 lh-18 text-black dark:text-white">
          {platformFeeDisplay}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Reward (BTC) */}
      <div>
        <label className="text-primary mb-1 block text-sm leading-5 font-medium">
          {t("createEvent.rewardBtc", "Reward (BTC)")}
          <span className="ml-1 text-(--color-orange-500)">*</span>
        </label>
        <div className="relative flex items-center gap-2">
          <Controller
            control={control}
            name="rewardBtc"
            rules={{
              validate: (v) => {
                if (!isRewardedRef.current) return true;
                if (!v || v.trim() === "")
                  return t(
                    "createEvent.errorEnterRewardAmount",
                    "Please enter reward amount",
                  );
                const amount = parseFloat(v);
                if (!Number.isFinite(amount) || amount <= 0)
                  return t(
                    "createEvent.errorInvalidRewardAmount",
                    "Please enter a valid reward amount",
                  );
                if (amount < minRewardBtcRef.current)
                  return t(
                    "createEvent.errorMinimumReward",
                    "Minimum {{min}} BTC",
                    { min: minRewardBtcRef.current.toFixed(8) },
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
                        (parts.length > 1 ? "." + parts.slice(1).join("") : "")
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
                        (parts.length > 1 ? "." + parts.slice(1).join("") : "")
                      : "";
                  if (numbersOnly) {
                    field.onChange(numbersOnly);
                  }
                }}
                placeholder={rewardBtcPlaceholder}
                className={cn(
                  "bg-form-bg tx-14 text-primary w-full rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 focus:ring-2 focus:outline-none disabled:opacity-60 dark:placeholder:text-neutral-600",
                  errors.rewardBtc
                    ? "border-red-500 focus:ring-red-500"
                    : "border-border focus:ring-(--color-orange-500)",
                )}
              />
            )}
          />
          <Button
            disabled={Number(durationHours) <= 0}
            type="button"
            appearance="solid"
            tone="white"
            text="sm"
            className="border-border bg-form-bg text-primary absolute right-2 h-6 rounded-md font-normal! placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
            onClick={() => {
              setValue("rewardBtc", minRewardBtc.toString(), {
                shouldValidate: true,
                shouldTouch: true,
              });
              setLastField("rewardBtc");
            }}
          >
            {t("createEvent.minimum", "Min")}
          </Button>
        </div>
        {errors.rewardBtc && (
          <p className="tx-12 lh-18 mt-1 text-red-500">
            {errors.rewardBtc.message}
          </p>
        )}
      </div>

      {/* Number of recipients */}
      <div>
        <p className="text-primary mb-1 text-sm leading-5 font-medium">
          {t("createEvent.numberOfRecipients")}
        </p>
        <p className="tx-12 lh-18 text-black dark:text-white">
          {maxRecipients !== null && maxRecipients > 0
            ? maxRecipients === 1
              ? t(
                  "createEvent.rewardDistributionText",
                  "The reward will be distributed to up to {{count}} address",
                  { count: maxRecipients },
                )
              : t(
                  "createEvent.rewardDistributionTextPlural",
                  "The reward will be distributed to up to {{count}} addresses",
                  { count: maxRecipients },
                )
            : "--"}
        </p>
      </div>
    </>
  );
}
