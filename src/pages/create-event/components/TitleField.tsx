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
      <label className="text-primary mb-1 block text-sm leading-5 font-medium">
        {t("createEvent.title")}
        <span className="ml-1 text-(--color-orange-500)">*</span>
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
          "bg-form-bg tx-14 text-primary w-full rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 focus:ring-2 focus:outline-none dark:placeholder:text-neutral-600",
          errors.title
            ? "border-red-500 focus:ring-red-500"
            : "border-border focus:ring-(--color-orange-500)",
        )}
      />
      <div className="mt-1 flex justify-between">
        {errors.title && (
          <span className="tx-12 lh-18 text-red-500">
            {errors.title.message}
          </span>
        )}
      </div>
      <div
        className={cn(
          "lh-18 mt-1 ml-auto text-xs",
          title.length >= 120 ? "text-red-500" : "text-secondary",
        )}
      >
        {120 - title.length} {t("createEvent.characterLeft", "characters left")}
      </div>
    </div>
  );
}
