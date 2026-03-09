import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { cn } from "@/utils/style";

import type { CreateEventFormValues } from "../formTypes";

export function DurationField() {
  const { t } = useTranslation();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateEventFormValues>();
  const params = useSystemParametersStore((s) => s.params);
  const isRewarded = watch("isRewarded");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-primary text-sm leading-5 font-medium">
          {t("createEvent.durationOfEvent", "Duration of this event")}
          <span className="ml-1 text-(--color-orange-500)">*</span>
        </label>
      </div>
      <Controller
        control={control}
        name="durationHours"
        rules={{
          validate: (v) => {
            const n = Number(v);
            return (
              (Number.isFinite(n) && n > 0) ||
              t(
                "createEvent.alertInvalidDuration",
                "Please enter a valid duration.",
              )
            );
          },
        }}
        render={({ field }) => (
          <input
            {...field}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              field.onChange(v);
              const n = Number(v);
              if (!Number.isFinite(n) || n <= 0) {
                setValue("rewardBtc", "");
                setValue("unlockPriceBtc", "");
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData("text");
              const numbersOnly = pastedText.replace(/[^0-9]/g, "");
              if (numbersOnly) {
                field.onChange(numbersOnly);
                const n = Number(numbersOnly);
                if (!Number.isFinite(n) || n <= 0) {
                  setValue("rewardBtc", "");
                  setValue("unlockPriceBtc", "");
                }
              }
            }}
            placeholder={
              isRewarded
                ? t("createEvent.enterHoursMin", "Enter hours (Min 1)")
                : t("createEvent.freeHours", "First {{hours}} hours are free", {
                    hours: params?.free_hours,
                  })
            }
            className={cn(
              "bg-form-bg tx-14 text-primary w-full rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 focus:ring-2 focus:outline-none dark:placeholder:text-neutral-600",
              errors.durationHours
                ? "border-red-500 focus:ring-red-500"
                : "border-border focus:ring-(--color-orange-500)",
            )}
          />
        )}
      />
      {errors.durationHours && (
        <p className="tx-12 lh-18 mt-1 text-red-500">
          {errors.durationHours.message}
        </p>
      )}
      <div className="text-secondary mt-2 text-xs">
        {t("createEvent.enterHoursHint", "Min. 1 hour")}
      </div>
    </div>
  );
}
