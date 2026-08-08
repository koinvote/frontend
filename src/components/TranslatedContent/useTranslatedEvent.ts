import { useMemo } from "react";

import type { EventOption, EventTranslationRes } from "@/api/response";

import { useContentTranslation } from "./useContentTranslation";

/**
 * The structural slice of an event this hook cares about. Both EventSummary
 * (home cards) and EventDetailDataRes (detail page) satisfy it.
 */
interface TranslatableEventShape {
  title: string;
  description?: string;
  event_type?: string;
  options?: EventOption[] | string[];
  top_replies?: TranslatableTopReply[];
  translation?: EventTranslationRes;
}

interface TranslatableTopReply {
  id: string | number;
  body: string;
  body_translation?: string;
}

/**
 * One event = one translation unit: title, description and options were
 * translated together and toggle together. The hook returns a view of the
 * event with those texts substituted while the translation is showing, and
 * the untouched original object otherwise — so "Show original" is exactly
 * the canonical text, not a re-derivation of it.
 *
 * Top-reply previews are other authors' content, not part of the event unit:
 * for open events their translated bodies (when present) are substituted
 * regardless of the unit toggle. For single-choice events the previews ARE
 * option texts, so they follow the unit toggle via the options map.
 */
interface TranslatedEventResult<V> {
  /** Render this instead of the raw event; texts follow the toggle. */
  viewEvent: V;
  hasTranslation: boolean;
  showingTranslation: boolean;
  toggle: () => void;
  sourceLocale: string | undefined;
}

export function useTranslatedEvent<T extends TranslatableEventShape>(
  event: T,
): TranslatedEventResult<T>;
export function useTranslatedEvent<T extends TranslatableEventShape>(
  event: T | undefined,
): TranslatedEventResult<T | undefined>;
export function useTranslatedEvent<T extends TranslatableEventShape>(
  event: T | undefined,
): TranslatedEventResult<T | undefined> {
  const tr = event?.translation;
  const hasTranslation = !!(
    tr &&
    (tr.title !== undefined ||
      tr.description !== undefined ||
      (tr.options && Object.keys(tr.options).length > 0))
  );

  const { showingTranslation, toggle } = useContentTranslation(hasTranslation);

  const viewEvent = useMemo((): T | undefined => {
    if (!event) return event;

    const isOpen = event.event_type === "open";
    const optionText = (id: string | number): string | undefined =>
      showingTranslation ? tr?.options?.[String(id)] : undefined;

    const topReplies = event.top_replies?.map((reply) => {
      const translated = isOpen
        ? reply.body_translation
        : (optionText(reply.id) ?? reply.body_translation);
      if (!translated) return reply;
      if (!isOpen && !showingTranslation) return reply;
      return { ...reply, body: translated };
    });

    if (!showingTranslation) {
      if (topReplies === event.top_replies) return event;
      return { ...event, top_replies: topReplies };
    }

    const options = event.options?.map((opt) => {
      if (typeof opt === "string") return opt;
      const translated = tr?.options?.[String(opt.id)];
      return translated ? { ...opt, option_text: translated } : opt;
    });

    return {
      ...event,
      title: tr?.title ?? event.title,
      description:
        event.description !== undefined
          ? (tr?.description ?? event.description)
          : event.description,
      options: options as T["options"],
      top_replies: topReplies,
    };
  }, [event, tr, showingTranslation]);

  return {
    viewEvent,
    hasTranslation,
    showingTranslation,
    toggle,
    sourceLocale: tr?.source_locale,
  };
}
