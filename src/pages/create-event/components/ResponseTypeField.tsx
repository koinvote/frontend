import { Tooltip } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import InfoIcon from "@/assets/icons/info.svg?react";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useHomeStore } from "@/stores/homeStore";

import type { CreateEventFormValues } from "../formTypes";

export function ResponseTypeField() {
  const { t } = useTranslation();
  const { control } = useFormContext<CreateEventFormValues>();
  const { isDesktop } = useHomeStore();
  const singleChoiceTooltip = useTooltipWithClick({ singleLine: isDesktop });
  const openEndedTooltip = useTooltipWithClick({ singleLine: isDesktop });

  return (
    <div>
      <p
        id="responseTypeTitle"
        className="text-primary mb-2 text-sm leading-5 font-medium"
      >
        {t("createEvent.responseType", "Response Type")}
        <span className="ml-1 text-(--color-orange-500)">*</span>
      </p>
      <Controller
        control={control}
        name="eventType"
        render={({ field }) => (
          <div className="flex gap-4">
            <label className="tx-14 text-primary flex leading-5">
              <div className="flex cursor-pointer items-center gap-2">
                <input
                  name="responseType"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === "single_choice"}
                  onChange={() => field.onChange("single_choice")}
                />
                <span>
                  {t(
                    "createEvent.responseTypeOptions.1.label",
                    "Single-choice",
                  )}
                </span>
                <Tooltip
                  title={t(
                    "createEvent.singleChoiceTooltip",
                    "Participants choose one option from a list you create.",
                  )}
                  placement="top"
                  color="white"
                  {...singleChoiceTooltip.tooltipProps}
                >
                  <span
                    {...singleChoiceTooltip.triggerProps}
                    className="cursor-pointer"
                  >
                    <InfoIcon />
                  </span>
                </Tooltip>
              </div>
            </label>
            <label className="tx-14 text-primary flex leading-5">
              <div className="flex cursor-pointer items-center gap-2">
                <input
                  name="responseType"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === "open"}
                  onChange={() => field.onChange("open")}
                />
                <span>
                  {t("createEvent.responseTypeOptions.0.label", "Open-ended")}
                </span>
                <Tooltip
                  title={t(
                    "createEvent.openEndedTooltip",
                    "Participants can submit their own responses.",
                  )}
                  placement="top"
                  color="white"
                  {...openEndedTooltip.tooltipProps}
                >
                  <span
                    {...openEndedTooltip.triggerProps}
                    className="cursor-pointer"
                  >
                    <InfoIcon />
                  </span>
                </Tooltip>
              </div>
            </label>
          </div>
        )}
      />
    </div>
  );
}
