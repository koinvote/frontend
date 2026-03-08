import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import MinusIcon from "@/assets/icons/minus.svg?react";
import PlusIcon from "@/assets/icons/plus.svg?react";
import { cn } from "@/utils/style";

import type { CreateEventFormValues } from "../formTypes";

interface OptionsFieldProps {
  optionsError: string | null;
  setOptionsError: React.Dispatch<React.SetStateAction<string | null>>;
  setOptionsTouched: React.Dispatch<React.SetStateAction<boolean>>;
  validateOptions: (fields: { value: string }[]) => string | null;
}

export function OptionsField({
  optionsError,
  setOptionsError,
  setOptionsTouched,
  validateOptions,
}: OptionsFieldProps) {
  const { t } = useTranslation();
  const { register, watch, control } = useFormContext<CreateEventFormValues>();

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  const eventType = watch("eventType");

  if (eventType !== "single_choice") return null;

  return (
    <div>
      <label className="text-primary mb-1 block text-sm leading-5 font-medium">
        {t("createEvent.options")}
        <span className="ml-1 text-(--color-orange-500)">*</span>
      </label>

      <div className="space-y-2">
        {optionFields.map((field, index) => {
          const isLast = index === optionFields.length - 1;
          const canRemove = optionFields.length > 1;
          const optValue = watch(`options.${index}.value`) ?? "";

          return (
            <div key={field.id} className="flex items-center gap-2">
              <div className="relative w-full">
                <input
                  {...register(`options.${index}.value`, {
                    maxLength: 20,
                  })}
                  autoComplete="one-time-code"
                  type="text"
                  maxLength={20}
                  onBlur={() => {
                    setOptionsTouched(true);
                    setOptionsError(validateOptions(watch("options")));
                  }}
                  placeholder={t(
                    "createEvent.optionPlaceholder",
                    "Option {{n}}",
                    { n: index + 1 },
                  )}
                  className="border-border bg-form-bg tx-14 text-primary w-full rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600"
                />
                <span
                  className={`tx-12 lh-18 absolute top-1/2 right-3 -translate-y-1/2 text-neutral-300 dark:text-neutral-600 ${
                    optValue.length >= 20 ? "text-red-500" : "text-secondary"
                  }`}
                >
                  {optValue.length}/20
                </span>
              </div>

              {canRemove && (
                <div
                  className={cn(
                    "border-border bg-form-bg text-primary flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border",
                  )}
                  onClick={() => removeOption(index)}
                >
                  <MinusIcon className="fill-current" />
                </div>
              )}

              {isLast && optionFields.length < 5 && (
                <div
                  className={cn(
                    "border-border bg-form-bg flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border",
                  )}
                  onClick={() => appendOption({ value: "" })}
                >
                  <PlusIcon />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {optionsError && (
        <p className="tx-12 lh-18 mt-1 text-red-500">{optionsError}</p>
      )}
    </div>
  );
}
