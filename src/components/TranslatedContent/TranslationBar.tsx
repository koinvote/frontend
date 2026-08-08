import { useTranslation } from "react-i18next";

import { cn } from "@/utils/style";

import { sourceLanguageLabel } from "./languageLabel";

interface TranslationBarProps {
  /** Detected source language of the original (BCP-47), if known. */
  sourceLocale?: string;
  /** Whether the translation is currently the rendered text. */
  showingTranslation: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * The low-key attribution + toggle line under translated content:
 *
 *   Translated from English · Show original
 *
 * While the original is shown, only the "Show translation" control remains —
 * labelling the author's own words as "translated from…" would be wrong.
 * One line in both states, so toggling never shifts the layout.
 */
export function TranslationBar({
  sourceLocale,
  showingTranslation,
  onToggle,
  className,
}: TranslationBarProps) {
  const { t } = useTranslation();

  const language = sourceLanguageLabel(t, sourceLocale);
  const attribution = language
    ? t("contentTranslation.translatedFrom", "Translated from {{language}}", {
        language,
      })
    : t("contentTranslation.machineTranslated", "Machine translated");

  return (
    <div
      className={cn(
        // space-x rather than gap: the fleet still includes iOS 14.0 Safari,
        // which ignores flex gap and would run the words together.
        "text-secondary flex min-w-0 flex-wrap items-center space-x-1 text-[11px] md:text-xs",
        className,
      )}
    >
      {showingTranslation && (
        <>
          <span>{attribution}</span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <button
        type="button"
        onClick={(e) => {
          // Cards navigate on click and descriptions expand on click; the
          // toggle must never leak into either.
          e.stopPropagation();
          onToggle();
        }}
        className="cursor-pointer underline-offset-2 hover:underline"
      >
        {showingTranslation
          ? t("contentTranslation.showOriginal", "Show original")
          : t("contentTranslation.showTranslation", "Show translation")}
      </button>
    </div>
  );
}
