import { Tooltip } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/style";

import type { CreateEventFormValues } from "../formTypes";

export function RewardTypeField() {
  const { t } = useTranslation();
  const { control, watch } = useFormContext<CreateEventFormValues>();

  const resultVisibility = watch("resultVisibility");
  const isNonRewardedDisabled =
    resultVisibility === "paid_only" || resultVisibility === "creator_only";
  const mustBePublicTooltip = t(
    "createEvent.resultVisibilityMustBePublic",
    "Result visibility must be public",
  );

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

            {/* Non-rewarded — disabled when result visibility is restricted */}
            {isNonRewardedDisabled ? (
              <Tooltip
                title={mustBePublicTooltip}
                color="white"
                placement="top"
              >
                <span>
                  <label
                    className={cn(
                      "tx-14 text-primary flex leading-5",
                      "cursor-not-allowed opacity-40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        name="rewardType"
                        type="radio"
                        className="radio-orange"
                        checked={field.value === false}
                        disabled
                        onChange={() => {}}
                      />
                      <span>{t("createEvent.nonRewarded", "Non-Rewarded")}</span>
                    </div>
                  </label>
                </span>
              </Tooltip>
            ) : (
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
            )}
          </div>
        )}
      />
    </div>
  );
}
