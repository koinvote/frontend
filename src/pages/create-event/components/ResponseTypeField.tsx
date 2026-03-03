import { Tooltip } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

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
        className="tx-14 lh-20 fw-m text-primary mb-2"
      >
        {t("createEvent.responseType", "Response Type")}
        <span className="text-(--color-orange-500)">*</span>
      </p>
      <Controller
        control={control}
        name="eventType"
        render={({ field }) => (
          <div className="space-y-2">
            <label className="flex tx-14 lh-20 text-primary">
              <div className="flex items-center gap-2 cursor-pointer">
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
                    ⓘ
                  </span>
                </Tooltip>
              </div>
            </label>
            <label className="flex tx-14 lh-20 text-primary">
              <div className="flex items-center gap-2 cursor-pointer">
                <input
                  name="responseType"
                  type="radio"
                  className="radio-orange"
                  checked={field.value === "open"}
                  onChange={() => field.onChange("open")}
                />
                <span>
                  {t(
                    "createEvent.responseTypeOptions.0.label",
                    "Open-ended",
                  )}
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
                    ⓘ
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
