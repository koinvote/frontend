import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { CreateEventFormValues } from "../formTypes";

export function DescriptionField() {
  const { t } = useTranslation();
  const { control, watch } = useFormContext<CreateEventFormValues>();
  const description = watch("description");

  return (
    <div>
      <label className="text-primary mb-1 block text-sm leading-5 font-medium">
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
            className={`border-border bg-form-bg tx-14 text-primary h-auto min-h-[100px] w-full resize-none rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600 ${
              field.value.length >= 500
                ? "border-red-500 focus:ring-red-500"
                : ""
            }`}
          />
        )}
      />
      <div
        className={`tx-12 lh-18 mt-1 block ${description.length >= 500 ? "text-red-500" : "text-secondary"}`}
      >
        {500 - description.length}{" "}
        {t("createEvent.characterLeft", "characters left")}
      </div>
    </div>
  );
}
