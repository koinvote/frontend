import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/style";

import type { CreateEventFormValues } from "../formTypes";

export function TitleField() {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreateEventFormValues>();
  const title = watch("title");

  return (
    <div>
      <label className="block tx-14 lh-20 fw-m text-primary mb-1">
        {t("createEvent.title")}{" "}
        <span className="text-(--color-orange-500)">*</span>
      </label>
      <input
        {...register("title", {
          required: t(
            "createEvent.alertTitleRequired",
            "Please enter a title.",
          ),
          maxLength: {
            value: 120,
            message: t(
              "createEvent.alertTitleTooLong",
              "Title cannot exceed 120 characters.",
            ),
          },
        })}
        autoComplete="one-time-code"
        type="text"
        maxLength={120}
        placeholder={t("createEvent.titlePlaceholder")}
        className={cn(
          "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2",
          errors.title
            ? "border-red-500 focus:ring-red-500"
            : "border-border focus:ring-(--color-orange-500)",
        )}
      />
      <div className="flex justify-between mt-1">
        {errors.title && (
          <span className="tx-12 lh-18 text-red-500">
            {errors.title.message}
          </span>
        )}
        <span
          className={cn(
            "tx-12 lh-18 ml-auto",
            title.length >= 120 ? "text-red-500" : "text-secondary",
          )}
        >
          {120 - title.length}{" "}
          {t("createEvent.characterLeft", "characters left")}
        </span>
      </div>
    </div>
  );
}
