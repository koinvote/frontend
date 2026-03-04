import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { CreateEventFormValues } from "../formTypes";

export function RewardTypeField() {
  const { t } = useTranslation();
  const { control } = useFormContext<CreateEventFormValues>();

  return (
    <div>
      <p
        id="rewardTypeTitle"
        className="text-primary mb-2 text-sm leading-5 font-medium"
      >
        {t("createEvent.rewardType")}
        <span className="ml-1 text-(--color-orange-500)">*</span>
      </p>
      <Controller
        control={control}
        name="isRewarded"
        render={({ field }) => (
          <div className="flex gap-4">
            <label className="tx-14 text-primary flex leading-5">
              <div className="flex cursor-pointer items-center gap-2">
                <input
                  name="rewardType"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                />
                <span>{t("createEvent.rewarded", "Rewarded")}</span>
              </div>
            </label>
            <label className="tx-14 text-primary flex leading-5">
              <div className="flex cursor-pointer items-center gap-2">
                <input
                  name="rewardType"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                />
                <span>{t("createEvent.nonRewarded", "Non-Rewarded")}</span>
              </div>
            </label>
          </div>
        )}
      />
    </div>
  );
}
