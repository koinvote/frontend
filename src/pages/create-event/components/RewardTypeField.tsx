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
        className="tx-14 lh-20 fw-m text-primary mb-2"
      >
        {t("createEvent.rewardType")}
        <span className="text-(--color-orange-500)">*</span>
      </p>
      <Controller
        control={control}
        name="isRewarded"
        render={({ field }) => (
          <div className="space-y-2">
            <label className="flex tx-14 lh-20 text-primary">
              <div className="flex items-center gap-2 cursor-pointer">
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
            <label className="flex tx-14 lh-20 text-primary">
              <div className="flex items-center gap-2 cursor-pointer">
                <input
                  name="rewardType"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                />
                <span>
                  {t("createEvent.nonRewarded", "Non-Rewarded")}
                </span>
              </div>
            </label>
          </div>
        )}
      />
    </div>
  );
}
