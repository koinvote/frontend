import { useMemo, useRef } from "react";
import { Tooltip } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { satsToBtc } from "@/utils/formatter";
import { cn } from "@/utils/style";

import type { CreateEventFormValues } from "../formTypes";

const formatTooltipText = (text: string) => {
  const parts = text.split(/(\.\s+)/);
  const result: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part === "") return;

    if (part.match(/^\.\s+$/)) {
      result.push(".");
      if (index < parts.length - 1) {
        result.push(<br key={`br-${index}`} />);
      }
    } else {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
  });

  return <>{result}</>;
};

export function PreheatField() {
  const { t } = useTranslation();
  const {
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<CreateEventFormValues>();
  const params = useSystemParametersStore((s) => s.params);
  const enablePreheatTooltip = useTooltipWithClick();

  const enablePreheat = watch("enablePreheat");
  const preheatHours = watch("preheatHours");

  const enablePreheatRef = useRef(enablePreheat);
  enablePreheatRef.current = enablePreheat;

  const preheatFeeSatoshi = useMemo(() => {
    if (!enablePreheat) return null;
    if (!params) return null;

    const preheatHoursNum = Number(preheatHours);
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    if (
      !Number.isFinite(preheatHoursNum) ||
      preheatHoursNum < 1 ||
      preheatHoursNum > 720
    ) {
      return null;
    }

    const multiplier = 0.2 + 0.8 * (preheatHoursNum / 720);
    const fee =
      preheatHoursNum *
      satoshiPerDurationHour *
      (platformFeePercentage / 100) *
      multiplier;

    return Math.round(fee);
  }, [enablePreheat, params, preheatHours]);

  const preheatFeeDisplay = useMemo(() => {
    return satsToBtc(preheatFeeSatoshi);
  }, [preheatFeeSatoshi]);

  return (
    <>
      {/* Preheat */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 tx-14 lh-20 text-primary">
          <Controller
            control={control}
            name="enablePreheat"
            render={({ field }) => (
              <input
                id="enable-preheat"
                type="checkbox"
                className="accent-(--color-orange-500)"
                checked={field.value}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  if (!e.target.checked) {
                    setValue("preheatHours", "");
                    clearErrors("preheatHours");
                  }
                }}
              />
            )}
          />
          <label
            htmlFor="enable-preheat"
            className="tx-14 lh-20 text-primary cursor-pointer"
          >
            {t("createEvent.enablePreheat")}
          </label>
          <Tooltip
            placement="topLeft"
            title={formatTooltipText(t("createEvent.enablePreheatTooltip"))}
            color="white"
            arrow={{ pointAtCenter: true }}
            {...enablePreheatTooltip.tooltipProps}
          >
            <span
              {...enablePreheatTooltip.triggerProps}
              className="tx-14 text-admin-text-main dark:text-white cursor-pointer"
            >
              ⓘ
            </span>
          </Tooltip>
        </div>
        <Controller
          control={control}
          name="preheatHours"
          rules={{
            validate: (v) => {
              if (!enablePreheatRef.current) return true;
              if (!v || v.trim() === "")
                return t(
                  "createEvent.errorEnterPreheatHours",
                  "Please enter preheat hours",
                );
              const n = Number(v);
              if (!Number.isFinite(n))
                return t(
                  "createEvent.errorInvalidNumber",
                  "Please enter a valid number",
                );
              if (n > 720)
                return t(
                  "createEvent.errorMaxPreheatHours",
                  "Maximum preheat hours is 720",
                );
              if (n < 1)
                return t(
                  "createEvent.errorMinPreheatHours",
                  "Minimum preheat hours is 1",
                );
              return true;
            },
          }}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={!enablePreheat}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                field.onChange(v);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                const numbersOnly = pastedText.replace(/[^0-9]/g, "");
                if (numbersOnly) {
                  field.onChange(numbersOnly);
                }
              }}
              placeholder={t(
                "createEvent.enterHoursMax",
                "Enter hours (max 720)",
              )}
              className={cn(
                "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2 disabled:opacity-60",
                errors.preheatHours
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-(--color-orange-500)",
              )}
            />
          )}
        />
        {enablePreheat && errors.preheatHours && (
          <p className="tx-12 lh-18 text-red-500 mt-1">
            {errors.preheatHours.message}
          </p>
        )}
      </div>

      {/* Preheat fee */}
      <div>
        <p className="tx-14 lh-20 fw-m text-primary mb-1">
          {t("createEvent.preheatFee", "Preheat fee:")}
        </p>
        <p className="tx-12 lh-18 dark:text-white text-black">
          {preheatFeeDisplay}
        </p>
      </div>
    </>
  );
}
