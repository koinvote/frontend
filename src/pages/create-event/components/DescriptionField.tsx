import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { CreateEventFormValues } from "../formTypes";

export function DescriptionField() {
  const { t } = useTranslation();
  const { control, watch } = useFormContext<CreateEventFormValues>();
  const description = watch("description");

  return (
    <div>
      <label className="block tx-14 lh-20 fw-m text-primary mb-1">
        {t("createEvent.description")}
      </label>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <textarea
            {...field}
            maxLength={500}
            rows={3}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                field.onChange(e);
              }
            }}
            placeholder={t("createEvent.descriptionPlaceholder")}
            className={`w-full rounded-xl border border-border bg-white px-3 py-2
                   tx-14 lh-20 text-black placeholder:text-secondary
                   focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
                   resize-none h-auto min-h-[100px]
                   ${
                     field.value.length >= 500
                       ? "border-red-500 focus:ring-red-500"
                       : ""
                   }`}
          />
        )}
      />
      <span
        className={`tx-12 lh-18 block text-right
              ${description.length >= 500 ? "text-red-500" : "text-secondary"}`}
      >
        {500 - description.length}{" "}
        {t("createEvent.characterLeft", "characters left")}
      </span>
    </div>
  );
}
