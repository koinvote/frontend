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
      <label className="block tx-14 lh-20 fw-m text-primary mb-1">
        {t("createEvent.options")}
        <span className="text-(--color-orange-500)">*</span>
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
                  className="w-full rounded-xl border border-border bg-white px-3 py-2
                           tx-14 lh-20 text-black placeholder:text-secondary
                           focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)"
                />
                <span
                  className={`tx-12 lh-18 absolute right-3 bottom-1 ${
                    optValue.length >= 20 ? "text-red-500" : "text-secondary"
                  }`}
                >
                  {optValue.length}/20
                </span>
              </div>

              {canRemove && (
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center cursor-pointer",
                  )}
                  onClick={() => removeOption(index)}
                >
                  <MinusIcon />
                </div>
              )}

              {isLast && optionFields.length < 5 && (
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center cursor-pointer",
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
        <p className="tx-12 lh-18 text-red-500 mt-1">{optionsError}</p>
      )}
    </div>
  );
}
