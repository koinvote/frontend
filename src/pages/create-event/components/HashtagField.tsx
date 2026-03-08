import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/style";

const MAX_TAGS = 3;
const MAX_TAG_LENGTH = 20;

const normalizeTag = (raw: string) => {
  const v = raw.trim();
  if (!v) return null;
  const lowerCased = v.toLowerCase();

  const noHash = lowerCased.replace(/^#+/, "");

  const cleaned = noHash.replace(/[^\w]/g, "");

  if (!cleaned) return null;
  return cleaned.slice(0, 20);
};

interface HashtagFieldProps {
  hashtagList: string[];
  hashtagInput: string;
  setHashtagList: React.Dispatch<React.SetStateAction<string[]>>;
  setHashtagInput: React.Dispatch<React.SetStateAction<string>>;
  setLastField: React.Dispatch<React.SetStateAction<string>>;
}

export function HashtagField({
  hashtagList,
  hashtagInput,
  setHashtagList,
  setHashtagInput,
  setLastField,
}: HashtagFieldProps) {
  const { t } = useTranslation();

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag) return;

    setHashtagList((prev) => {
      if (prev.length >= MAX_TAGS) return prev;
      if (prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  };

  const removeTag = (tag: string) => {
    setHashtagList((prev) => prev.filter((t) => t !== tag));
  };

  const commitByDelimiters = (value: string) => {
    const parts = value.split(/[,\s]+/g).filter(Boolean);
    if (!parts.length) return;
    parts.forEach(addTag);
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent?.isComposing) return;

    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitByDelimiters(hashtagInput);
      setHashtagInput("");
      return;
    }

    if (e.key === "Backspace" && !hashtagInput) {
      setHashtagList((prev) => prev.slice(0, -1));
    }
  };

  const handleHashtagBlur = () => {
    if (hashtagInput.trim()) {
      commitByDelimiters(hashtagInput);
      setHashtagInput("");
    }
  };

  const handleHashtagChange = (v: string) => {
    if (hashtagList.length >= MAX_TAGS) {
      setHashtagInput("");
      return;
    }

    if (/[,\s]/.test(v)) {
      commitByDelimiters(v);
      setHashtagInput("");
      return;
    }

    const cleaned = v.replace(/^#+/g, "").replace(/[^\w]/g, "");
    const truncated = cleaned.slice(0, MAX_TAG_LENGTH);
    const prefix = v.startsWith("#") ? "#" : "";
    setHashtagInput(prefix + truncated);
  };

  const currentInputCleaned = useMemo(() => {
    return hashtagInput.replace(/^#+/g, "").replace(/[^\w]/g, "");
  }, [hashtagInput]);

  const hashtagCharsLeft = useMemo(() => {
    return Math.max(0, MAX_TAG_LENGTH - currentInputCleaned.length);
  }, [currentInputCleaned]);

  return (
    <div>
      <label className="text-primary mb-1 block text-sm leading-5 font-medium">
        {t("createEvent.hashtags", "Hashtags")}
      </label>

      <div
        className={cn(
          "border-border bg-form-bg w-full rounded-xl border px-3 py-2",
          "flex flex-wrap items-center gap-2",
          "focus-within:ring-2 focus-within:ring-(--color-orange-500)",
        )}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-chip-remove]")) return;
          (
            e.currentTarget.querySelector("input") as HTMLInputElement | null
          )?.focus();
        }}
      >
        {hashtagList.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-2 rounded-full",
              "bg-surface text-primary border-border border",
              "tx-12 lh-18 px-3 py-1",
            )}
          >
            <span className="select-none">#{tag}</span>
            <button
              type="button"
              data-chip-remove
              aria-label={`Remove ${tag}`}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/10"
              onClick={() => {
                removeTag(tag);
                setLastField("hashtags");
              }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          name="hashtags"
          autoComplete="one-time-code"
          type="text"
          value={hashtagInput}
          onChange={(e) => handleHashtagChange(e.target.value)}
          onKeyDown={handleHashtagKeyDown}
          onBlur={handleHashtagBlur}
          className={cn(
            "min-w-[120px] flex-1",
            "bg-transparent outline-none",
            "text-primary text-sm leading-5 placeholder:text-neutral-300 dark:placeholder:text-neutral-600",
          )}
        />
      </div>

      <span className={cn("lh-18 mt-1 block text-xs", "text-secondary")}>
        {hashtagList.length >= MAX_TAGS
          ? t("createEvent.maxHashtags", "Max 3 hashtags")
          : `${hashtagCharsLeft} ${t("createEvent.characterLeft", "characters left")}`}
      </span>
    </div>
  );
}
