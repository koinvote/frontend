import { Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";

import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import MinusIcon from "@/assets/icons/minus.svg?react";
import PlusIcon from "@/assets/icons/plus.svg?react";
import { Button } from "@/components/base/Button";
import { useBackIfInternal } from "@/hooks/useBack";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { cn } from "@/utils/style";

import type { EventType } from "@/api/types";

import {
  getAddressInfo,
  Network,
  validate,
  type AddressInfo,
} from "bitcoin-address-validation";

import type { AddressValidationStatus } from "./types/index";

import { useHomeStore } from "@/stores/homeStore";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { satsToBtc } from "@/utils/formatter";
import { useTranslation } from "react-i18next";

type ResultVisibility = "public" | "paid_only" | "creator_only";

type PreviewEventState = {
  creatorAddress: string;
  title: string;
  description: string;
  hashtag: string;
  eventType: EventType;
  isRewarded: boolean;
  rewardBtc?: string;
  maxRecipient?: number;
  durationHours: number;
  options?: string[];
  enablePreheat: boolean;
  preheatHours?: number;
  resultVisibility: ResultVisibility;
  creatorEmail?: string;
  unlockPriceBtc?: string;
};

type CreateEventDraft = {
  creatorAddress: string;
  title: string;
  description: string;
  hashtags: string;
  eventType: EventType;
  isRewarded: boolean;
  rewardBtc: string;
  options: string[];
  durationHours: string;
  enablePreheat: boolean;
  preheatHours: string;
  agree: boolean;
  resultVisibility: ResultVisibility;
  creatorEmail: string;
  unlockPriceBtc: string;
};

type CreateEventFormValues = {
  creatorAddress: string;
  title: string;
  description: string;
  eventType: EventType;
  options: { value: string }[];
  isRewarded: boolean;
  durationHours: string;
  rewardBtc: string;
  enablePreheat: boolean;
  preheatHours: string;
  agree: boolean;
  resultVisibility: ResultVisibility;
  creatorEmail: string;
  unlockPriceBtc: string;
};

const CREATE_EVENT_DRAFT_KEY = "koinvote:create-event-draft";

const DEFAULT_VALUES: CreateEventFormValues = {
  creatorAddress: "",
  title: "",
  description: "",
  eventType: "single_choice",
  options: [{ value: "" }],
  isRewarded: true,
  durationHours: "",
  rewardBtc: "",
  enablePreheat: false,
  preheatHours: "",
  agree: false,
  resultVisibility: "public",
  creatorEmail: "",
  unlockPriceBtc: "",
};

const normalizeTag = (raw: string) => {
  const v = raw.trim();
  if (!v) return null;
  const lowerCased = v.toLowerCase();

  const noHash = lowerCased.replace(/^#+/, "");

  const cleaned = noHash.replace(/[^\w]/g, "");

  if (!cleaned) return null;
  return cleaned.slice(0, 20);
};

const formatTooltipText = (text: string) => {
  const parts = text.split(/(\.\s+)/);
  const result: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part === "") return;

    if (part.match(/^\.\s+$/)) {
      result.push(".");
      if (index < parts.length - 1) {
        result.push(<br key={`br-${index}`} />);
      }
    } else {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
  });

  return <>{result}</>;
};

export default function CreateEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isFromCreateEventRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isProgrammaticRef = useRef(false);
  const goBack = useBackIfInternal("/");

  const { isDesktop } = useHomeStore();

  const singleChoiceTooltip = useTooltipWithClick({ singleLine: isDesktop });
  const openEndedTooltip = useTooltipWithClick({ singleLine: isDesktop });
  const creatorAddressTooltip = useTooltipWithClick({
    singleLine: isDesktop,
  });
  const enablePreheatTooltip = useTooltipWithClick();

  const ACTIVE_BTC_NETWORK = Network.mainnet;

  const networkLabel =
    ACTIVE_BTC_NETWORK === Network.mainnet ? "mainnet" : "testnet";

  // Address validation state (kept as local state due to async debounce logic)
  const [addrStatus, setAddrStatus] = useState<AddressValidationStatus>("idle");
  const [addrInfo, setAddrInfo] = useState<AddressInfo | null>(null);
  const [addrError, setAddrError] = useState<string>("");

  // Hashtag chip state (kept as local state — complex keydown/blur logic)
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagList, setHashtagList] = useState<string[]>([]);

  // Last field tracking for draft highlight
  const [lastField, setLastField] = useState<string>(
    sessionStorage.getItem("create-event-last-field") || "",
  );

  // Options error (array-level: at-least-one + duplicate check)
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsTouched, setOptionsTouched] = useState(false);

  // -------- React Hook Form --------
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    setFocus,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<CreateEventFormValues>({
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  // Reactive watched values (replace individual useState)
  const creatorAddress = watch("creatorAddress");
  const durationHours = watch("durationHours");
  const rewardBtc = watch("rewardBtc");
  const isRewarded = watch("isRewarded");
  const enablePreheat = watch("enablePreheat");
  const eventType = watch("eventType");
  const title = watch("title");
  const description = watch("description");
  const preheatHours = watch("preheatHours");
  const agree = watch("agree");
  const resultVisibility = watch("resultVisibility");

  // Refs for current values used inside validate closures to avoid stale captures
  const addrStatusRef = useRef(addrStatus);
  addrStatusRef.current = addrStatus;
  const addrErrorRef = useRef(addrError);
  addrErrorRef.current = addrError;
  const isRewardedRef = useRef(isRewarded);
  isRewardedRef.current = isRewarded;
  const enablePreheatRef = useRef(enablePreheat);
  enablePreheatRef.current = enablePreheat;
  const minRewardBtcRef = useRef(0);
  const hashtagListRef = useRef(hashtagList);
  hashtagListRef.current = hashtagList;
  const resultVisibilityRef = useRef(resultVisibility);
  resultVisibilityRef.current = resultVisibility;

  // -------- Effects --------

  useEffect(() => {
    const fromCreateEvent = sessionStorage.getItem("fromCreateEvent");
    if (fromCreateEvent === "true") {
      isFromCreateEventRef.current = true;
      sessionStorage.removeItem("fromCreateEvent");
    } else {
      isFromCreateEventRef.current = false;
    }
  }, [location.pathname]);

  const highlightLastField = useCallback(() => {
    const lastField = sessionStorage.getItem("create-event-last-field");
    if (!lastField) return;

    // Delay until after React commits DOM updates so dynamically rendered fields
    // (e.g. useFieldArray options added by reset()) are present in the DOM.
    requestAnimationFrame(() => {
      if (!formRef.current) return;

      const el = formRef.current.querySelector<
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | HTMLButtonElement
      >(`[name="${CSS.escape(lastField)}"]`);

      if (!el) return;

      if (
        el instanceof HTMLInputElement &&
        (el.type === "radio" || el.type === "checkbox")
      ) {
        let highLightEl: HTMLElement | null = el.closest("label");

        if (lastField === "responseType" || lastField === "rewardType") {
          highLightEl = formRef.current.querySelector<HTMLElement>(
            `#${CSS.escape(lastField)}Title`,
          );
        }

        if (!highLightEl) return;

        highLightEl.classList.add("border-flash", "py-2");
        setTimeout(() => {
          highLightEl!.classList.remove("border-flash", "py-2");
        }, 3000);
        return;
      }

      el.focus();
    });
  }, []);

  useEffect(() => {
    sessionStorage.setItem("create-event-last-field", lastField);
  }, [lastField]);

  // Address validation debounce
  useEffect(() => {
    const raw = creatorAddress.trim();

    if (!raw) {
      setAddrStatus("idle");
      setAddrInfo(null);
      setAddrError("");
      clearErrors("creatorAddress");
      return;
    }

    setAddrStatus("checking");
    setAddrError("");

    const timer = window.setTimeout(() => {
      const ok = validate(raw, ACTIVE_BTC_NETWORK);

      if (!ok) {
        const msg = t(
          "createEvent.invalidBitcoinAddress",
          "Invalid Bitcoin address.",
        );
        setAddrStatus("invalid");
        setAddrInfo(null);
        setAddrError(msg);
        setError("creatorAddress", { type: "manual", message: msg });
        return;
      }

      try {
        const info = getAddressInfo(raw);

        if (info.network !== ACTIVE_BTC_NETWORK) {
          const msg = t(
            "createEvent.addressWrongNetwork",
            "Address is for {{network}}, not {{expected}}.",
            {
              network: info.network,
              expected: networkLabel,
            },
          );
          setAddrStatus("invalid");
          setAddrInfo(null);
          setAddrError(msg);
          setError("creatorAddress", { type: "manual", message: msg });
          return;
        }

        setAddrStatus("valid");
        setAddrInfo(info);
        setAddrError("");
        clearErrors("creatorAddress");
      } catch {
        const msg = t(
          "createEvent.invalidBitcoinAddressNetwork",
          "Invalid Bitcoin address ({{network}}).",
          {
            network: networkLabel,
          },
        );
        setAddrStatus("invalid");
        setAddrInfo(null);
        setAddrError(msg);
        setError("creatorAddress", { type: "manual", message: msg });
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    creatorAddress,
    ACTIVE_BTC_NETWORK,
    networkLabel,
    t,
    clearErrors,
    setError,
  ]);

  // Draft restore on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(CREATE_EVENT_DRAFT_KEY);
    if (!saved) return;

    isProgrammaticRef.current = true;

    try {
      const draft: CreateEventDraft = JSON.parse(saved);

      reset({
        creatorAddress: draft.creatorAddress ?? "",
        title: draft.title ?? "",
        description: draft.description ?? "",
        eventType: draft.eventType ?? "single_choice",
        isRewarded: draft.isRewarded ?? true,
        rewardBtc: draft.rewardBtc ?? "",
        options:
          draft.options && draft.options.length
            ? draft.options.map((v) => ({ value: v }))
            : [{ value: "" }],
        durationHours: draft.durationHours ?? "",
        enablePreheat: draft.enablePreheat ?? false,
        preheatHours: draft.preheatHours ?? "",
        agree: draft.agree ?? false,
        resultVisibility: draft.resultVisibility ?? "public",
        creatorEmail: draft.creatorEmail ?? "",
        unlockPriceBtc: draft.unlockPriceBtc ?? "",
      });

      setHashtagList(
        (draft.hashtags ?? "")
          .split(/[,\s]+/g)
          .map((s) => s.trim())
          .filter(Boolean),
      );

      if (draft.rewardBtc) {
        // Mark rewardBtc as touched so isPreviewDisabled sees it
        trigger("rewardBtc");
      }
      if (draft.unlockPriceBtc) {
        trigger("unlockPriceBtc");
      }

      highlightLastField();
      isProgrammaticRef.current = false;
    } catch (e) {
      console.error("Failed to parse create-event draft", e);
      isProgrammaticRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draft save via watch subscription.
  // Reads hashtagList through a ref so the subscription is set up once and never
  // re-subscribes just because the user added/removed a hashtag.
  useEffect(() => {
    const subscription = watch((values) => {
      const draft: CreateEventDraft = {
        creatorAddress: values.creatorAddress ?? "",
        title: values.title ?? "",
        description: values.description ?? "",
        hashtags: hashtagListRef.current.join(","),
        eventType: values.eventType ?? "single_choice",
        isRewarded: values.isRewarded ?? true,
        rewardBtc: values.rewardBtc ?? "",
        options: values.options?.map((o) => o?.value ?? "") ?? [],
        durationHours: values.durationHours ?? "",
        enablePreheat: values.enablePreheat ?? false,
        preheatHours: values.preheatHours ?? "",
        agree: values.agree ?? false,
        resultVisibility: values.resultVisibility ?? "public",
        creatorEmail: values.creatorEmail ?? "",
        unlockPriceBtc: values.unlockPriceBtc ?? "",
      };
      sessionStorage.setItem(CREATE_EVENT_DRAFT_KEY, JSON.stringify(draft));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Also save immediately when hashtagList changes because the watch subscription above
  // only fires on form-field changes, so hashtag-only changes would otherwise be lost.
  useEffect(() => {
    const values = watch();
    const draft: CreateEventDraft = {
      creatorAddress: values.creatorAddress ?? "",
      title: values.title ?? "",
      description: values.description ?? "",
      hashtags: hashtagList.join(","),
      eventType: values.eventType ?? "single_choice",
      isRewarded: values.isRewarded ?? true,
      rewardBtc: values.rewardBtc ?? "",
      options: values.options?.map((o) => o?.value ?? "") ?? [],
      durationHours: values.durationHours ?? "",
      enablePreheat: values.enablePreheat ?? false,
      preheatHours: values.preheatHours ?? "",
      agree: values.agree ?? false,
      resultVisibility: values.resultVisibility ?? "public",
      creatorEmail: values.creatorEmail ?? "",
      unlockPriceBtc: values.unlockPriceBtc ?? "",
    };
    sessionStorage.setItem(CREATE_EVENT_DRAFT_KEY, JSON.stringify(draft));
  }, [hashtagList, watch]);

  // Re-validate rewardBtc / unlockPriceBtc when minRewardBtc changes (durationHours changed)
  useEffect(() => {
    if (touchedFields.rewardBtc) {
      trigger("rewardBtc");
    }
    if (touchedFields.unlockPriceBtc) {
      trigger("unlockPriceBtc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationHours]);

  // Re-validate preheatHours when enablePreheat changes
  useEffect(() => {
    if (touchedFields.preheatHours) {
      trigger("preheatHours");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enablePreheat]);

  // When switching away from paid_only, clear those errors; switching to paid_only,
  // re-validate if already touched so errors appear immediately.
  useEffect(() => {
    if (resultVisibility !== "paid_only") {
      clearErrors("creatorEmail");
      clearErrors("unlockPriceBtc");
    } else {
      if (touchedFields.creatorEmail) trigger("creatorEmail");
      if (touchedFields.unlockPriceBtc) trigger("unlockPriceBtc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultVisibility]);

  // -------- System parameters --------
  const params = useSystemParametersStore((s) => s.params);

  // -------- Computed values --------

  const minRewardBtc = useMemo(() => {
    if (!params) {
      return 0.000011;
    }

    const durationHoursNum = Number(durationHours);
    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const minRewardAmountSatoshi = params.min_reward_amount_satoshi ?? 0;

    if (!Number.isFinite(durationHoursNum) || durationHoursNum <= 0) {
      return minRewardAmountSatoshi / 100_000_000;
    }

    let minRewardSatoshi: number;

    if (durationHoursNum <= freeHours) {
      minRewardSatoshi = satoshiPerDurationHour;
    } else {
      minRewardSatoshi =
        minRewardAmountSatoshi +
        (durationHoursNum - freeHours) * satoshiPerDurationHour;
    }

    return minRewardSatoshi / 100_000_000;
  }, [params, durationHours]);

  // Keep ref in sync for validate closures
  minRewardBtcRef.current = minRewardBtc;

  const rewardBtcPlaceholder =
    Number(durationHours) > 0
      ? t(
          "createEvent.rewardBtcPlaceholderEnabled",
          "Enter reward (Min {{min}})",
          {
            min: minRewardBtc.toFixed(8),
          },
        )
      : t("createEvent.rewardBtcPlaceholder", "Set Duration First");

  const maxRecipients = useMemo(() => {
    if (!isRewarded || !rewardBtc) return null;

    const rewardAmountSatoshi = Math.round(parseFloat(rewardBtc) * 100_000_000);
    if (!Number.isFinite(rewardAmountSatoshi) || rewardAmountSatoshi <= 0) {
      return null;
    }

    const satoshiPerExtraWinner = params?.satoshi_per_extra_winner ?? 0;
    if (!satoshiPerExtraWinner || satoshiPerExtraWinner <= 0) {
      return null;
    }

    return Math.floor(rewardAmountSatoshi / satoshiPerExtraWinner);
  }, [isRewarded, rewardBtc, params?.satoshi_per_extra_winner]);

  const platformFeeSatoshi = useMemo(() => {
    if (isRewarded) return null;
    if (!params) return null;

    const duration = Number(durationHours);
    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    if (!Number.isFinite(duration) || duration <= 0) return null;

    const billableHours =
      freeHours > 0 ? Math.max(0, duration - freeHours) : duration;

    if (billableHours <= 0) return 0;

    const fee =
      billableHours * satoshiPerDurationHour * (platformFeePercentage / 100);

    return Math.round(fee);
  }, [isRewarded, params, durationHours]);

  const platformFeeDisplay = useMemo(() => {
    return satsToBtc(platformFeeSatoshi);
  }, [platformFeeSatoshi]);

  const preheatFeeSatoshi = useMemo(() => {
    if (!enablePreheat) return null;
    if (!params) return null;

    const preheatHoursNum = Number(preheatHours);
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    if (
      !Number.isFinite(preheatHoursNum) ||
      preheatHoursNum < 1 ||
      preheatHoursNum > 720
    ) {
      return null;
    }

    const multiplier = 0.2 + 0.8 * (preheatHoursNum / 720);
    const fee =
      preheatHoursNum *
      satoshiPerDurationHour *
      (platformFeePercentage / 100) *
      multiplier;

    return Math.round(fee);
  }, [enablePreheat, params, preheatHours]);

  const preheatFeeDisplay = useMemo(() => {
    return satsToBtc(preheatFeeSatoshi);
  }, [preheatFeeSatoshi]);

  // Options validation (array-level error)
  const validateOptions = useCallback(
    (fields: { value: string }[]): string | null => {
      if (eventType !== "single_choice") return null;
      const valid = fields.map((o) => o.value.trim()).filter(Boolean);
      if (valid.length === 0)
        return t(
          "createEvent.errorAtLeastOneOption",
          "At least one option is required",
        );
      const unique = new Set(valid);
      if (unique.size !== valid.length)
        return t(
          "createEvent.errorDuplicateOption",
          "Duplicate option already exists",
        );
      return null;
    },
    [eventType, t],
  );

  // Update options error when fields change (and touched)
  const optionValues = watch("options");
  useEffect(() => {
    if (optionsTouched) {
      setOptionsError(validateOptions(optionValues));
    }
  }, [optionValues, optionsTouched, validateOptions]);

  // -------- isPreviewDisabled --------
  const isPreviewDisabled = useMemo(() => {
    const duration = Number(durationHours);
    const hasOptionsError = !!validateOptions(optionValues);
    return (
      isSubmitting ||
      addrStatus !== "valid" ||
      !title.trim() ||
      !duration ||
      duration <= 0 ||
      (isRewarded && !touchedFields.rewardBtc) ||
      !!errors.rewardBtc ||
      (eventType === "single_choice" && hasOptionsError) ||
      (enablePreheat && !!errors.preheatHours) ||
      (resultVisibility === "paid_only" &&
        (!touchedFields.creatorEmail || !!errors.creatorEmail)) ||
      (resultVisibility === "paid_only" &&
        (!touchedFields.unlockPriceBtc || !!errors.unlockPriceBtc)) ||
      !agree
    );
  }, [
    agree,
    isSubmitting,
    title,
    durationHours,
    errors.preheatHours,
    isRewarded,
    touchedFields.rewardBtc,
    errors.rewardBtc,
    optionValues,
    eventType,
    addrStatus,
    enablePreheat,
    validateOptions,
    resultVisibility,
    touchedFields.creatorEmail,
    errors.creatorEmail,
    touchedFields.unlockPriceBtc,
    errors.unlockPriceBtc,
  ]);

  // -------- Hashtag handlers --------
  const MAX_TAGS = 3;
  const MAX_TAG_LENGTH = 20;

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

  // -------- Clear handler --------
  const handleClear = () => {
    reset(DEFAULT_VALUES);
    setHashtagList([]);
    setHashtagInput("");
    setAddrStatus("idle");
    setAddrInfo(null);
    setAddrError("");
    setOptionsError(null);
    setOptionsTouched(false);
    setLastField("");
  };

  // -------- Submit handler --------
  const onSubmit = handleSubmit((data) => {
    // Address must be valid (setError handles live display; this is the final guard)
    if (addrStatusRef.current !== "valid") {
      setFocus("creatorAddress");
      return;
    }

    // Validate options
    let cleanedOptions: string[] | undefined;
    if (data.eventType === "single_choice") {
      const list = data.options.map((o) => o.value.trim()).filter(Boolean);
      const error = validateOptions(data.options);
      if (error) {
        setOptionsError(error);
        setOptionsTouched(true);
        return;
      }
      cleanedOptions = list;
    }

    const duration = Number(data.durationHours);
    let preheat = 0;
    if (data.enablePreheat) {
      preheat = Number(data.preheatHours || 0);
    }

    const previewData: PreviewEventState = {
      creatorAddress: data.creatorAddress,
      title: data.title.trim(),
      description: data.description.trim(),
      hashtag: hashtagList.join(","),
      eventType: data.eventType,
      isRewarded: data.isRewarded,
      rewardBtc: data.isRewarded ? data.rewardBtc : undefined,
      durationHours: duration,
      options: cleanedOptions,
      enablePreheat: data.enablePreheat,
      preheatHours: data.enablePreheat && preheat > 0 ? preheat : undefined,
      resultVisibility: data.resultVisibility,
      creatorEmail:
        data.resultVisibility === "paid_only" ? data.creatorEmail : undefined,
      unlockPriceBtc:
        data.resultVisibility === "paid_only" ? data.unlockPriceBtc : undefined,
    };

    navigate("/preview-event", { state: previewData });
  });

  // -------- Form focus tracking (lastField) --------
  const handleFormItemFocus = (e: React.FocusEvent<HTMLFormElement>) => {
    if (isProgrammaticRef.current) return;
    const target = e.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      const name = target.name;
      if (!name) return;
      setLastField(name);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 md:px-0">
      <div className="relative h-[50px] w-full">
        <button
          type="button"
          className="hover:text-admin-text-sub absolute left-0 cursor-pointer text-black dark:text-white"
          onClick={goBack}
        >
          <CircleLeftIcon className="h-8 w-8 fill-current" />
        </button>
      </div>

      <div className="border-admin-bg bg-bg w-full max-w-3xl rounded-3xl border px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m mb-6 text-(--color-orange-500)">
          {t("createEvent.formTitle")}
        </h1>

        <form
          ref={formRef}
          className="space-y-6"
          onSubmit={onSubmit}
          autoComplete="off"
          onFocus={handleFormItemFocus}
        >
          {/* Creator address */}
          <div>
            <div className="mb-1 flex items-center gap-1">
              <label className="tx-14 lh-20 fw-m text-primary mr-1">
                {t("createEvent.creatorAddress")}
              </label>
              <Tooltip
                placement="topLeft"
                title={t("createEvent.creatorAddressTooltip")}
                color="white"
                arrow={{ pointAtCenter: true }}
                {...creatorAddressTooltip.tooltipProps}
                overlayInnerStyle={{
                  ...creatorAddressTooltip.tooltipProps.overlayInnerStyle,
                }}
              >
                <span
                  {...creatorAddressTooltip.triggerProps}
                  className="tx-14 text-admin-text-main flex cursor-pointer items-center dark:text-white"
                >
                  ⓘ
                </span>
              </Tooltip>
              <span className={`ml-1 text-(--color-orange-500)`}>*</span>
            </div>
            <Controller
              control={control}
              name="creatorAddress"
              rules={{
                validate: () =>
                  addrStatusRef.current === "valid" ||
                  addrErrorRef.current ||
                  t("createEvent.addressInvalid", "Invalid address."),
              }}
              render={({ field }) => (
                <input
                  {...field}
                  // Override DOM name/id to avoid browser autofill
                  name="field_7x9abtca"
                  id="field_7x9abtca"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="one-time-code"
                  spellCheck="false"
                  placeholder={t("createEvent.creatorAddressPlaceholder")}
                  className={`border-border tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none ${addrStatus === "invalid" ? "border-red-500 focus:ring-red-500" : ""} ${addrStatus === "valid" ? "border-green-500 focus:ring-green-500" : ""} `}
                />
              )}
            />
            <div className="tx-12 lh-18 mt-1">
              {addrStatus === "checking" && (
                <span className="text-secondary">
                  {t("createEvent.addressChecking", "Checking…")}
                </span>
              )}
              {addrStatus === "valid" && addrInfo && (
                <span className="text-green-600">
                  {t("createEvent.addressValid", "Valid ({{type}})", {
                    type: addrInfo.type.toUpperCase(),
                  })}
                </span>
              )}
              {addrStatus === "invalid" && (
                <span className="text-red-500">
                  {addrError ||
                    t("createEvent.addressInvalid", "Invalid address.")}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
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
                "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none",
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

          {/* Description */}
          <div>
            <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
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
                  className={`border-border tx-14 lh-20 placeholder:text-secondary h-auto min-h-[100px] w-full resize-none rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none ${
                    field.value.length >= 500
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
              )}
            />
            <span
              className={`tx-12 lh-18 block text-right ${description.length >= 500 ? "text-red-500" : "text-secondary"}`}
            >
              {500 - description.length}{" "}
              {t("createEvent.characterLeft", "characters left")}
            </span>
          </div>

          {/* Hashtags */}
          <div>
            <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
              {t("createEvent.hashtags", "Hashtags")}
            </label>

            <div
              className={cn(
                "border-border w-full rounded-xl border bg-white px-3 py-2",
                "flex flex-wrap items-center gap-2",
                "focus-within:ring-2 focus-within:ring-(--color-orange-500)",
              )}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("[data-chip-remove]")) return;
                (
                  e.currentTarget.querySelector(
                    "input",
                  ) as HTMLInputElement | null
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
                  "tx-14 lh-20 placeholder:text-secondary text-black",
                )}
              />
            </div>

            <span
              className={cn("tx-12 lh-18 block text-right", "text-secondary")}
            >
              {hashtagList.length >= MAX_TAGS
                ? t("createEvent.maxHashtags", "Max 3 hashtags")
                : `${hashtagCharsLeft} ${t("createEvent.characterLeft", "characters left")}`}
            </span>
          </div>

          {/* Response type */}
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
                  <label className="tx-14 lh-20 text-primary flex">
                    <div className="flex cursor-pointer items-center gap-2">
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
                  <label className="tx-14 lh-20 text-primary flex">
                    <div className="flex cursor-pointer items-center gap-2">
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

          {/* Options（只有 single_choice 時顯示） */}
          {eventType === "single_choice" && (
            <div>
              <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
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
                          className="border-border tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none"
                        />
                        <span
                          className={`tx-12 lh-18 absolute right-3 bottom-1 ${
                            optValue.length >= 20
                              ? "text-red-500"
                              : "text-secondary"
                          }`}
                        >
                          {optValue.length}/20
                        </span>
                      </div>

                      {canRemove && (
                        <div
                          className={cn(
                            "border-border flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border bg-white",
                          )}
                          onClick={() => removeOption(index)}
                        >
                          <MinusIcon />
                        </div>
                      )}

                      {isLast && optionFields.length < 5 && (
                        <div
                          className={cn(
                            "border-border flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border bg-white",
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
          )}

          {/* Reward type */}
          <div>
            <p
              id="rewardTypeTitle"
              className="tx-14 lh-20 fw-m text-primary mb-2"
            >
              {t("createEvent.rewardType")}
              <span className="text-(--color-orange-500)">*</span>
            </p>
            <Controller
              control={control}
              name="isRewarded"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="tx-14 lh-20 text-primary flex">
                    <div className="flex cursor-pointer items-center gap-2">
                      <input
                        name="rewardType"
                        type="radio"
                        className="radio-orange"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                      />
                      <span>{t("createEvent.rewarded", "Rewarded")}</span>
                    </div>
                  </label>
                  <label className="tx-14 lh-20 text-primary flex">
                    <div className="flex cursor-pointer items-center gap-2">
                      <input
                        name="rewardType"
                        type="radio"
                        className="radio-orange"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                      />
                      <span>
                        {t("createEvent.nonRewarded", "Non-Rewarded")}
                      </span>
                    </div>
                  </label>
                </div>
              )}
            />
          </div>

          {/* Duration */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="tx-14 lh-20 fw-m text-primary">
                {t("createEvent.durationOfEvent", "Duration of this event")}
                <span className="text-(--color-orange-500)">*</span>
              </label>
            </div>
            <Controller
              control={control}
              name="durationHours"
              rules={{
                validate: (v) => {
                  const n = Number(v);
                  return (
                    (Number.isFinite(n) && n > 0) ||
                    t(
                      "createEvent.alertInvalidDuration",
                      "Please enter a valid duration.",
                    )
                  );
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    field.onChange(v);
                    const n = Number(v);
                    if (!Number.isFinite(n) || n <= 0) {
                      setValue("rewardBtc", "");
                      setValue("unlockPriceBtc", "");
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData("text");
                    const numbersOnly = pastedText.replace(/[^0-9]/g, "");
                    if (numbersOnly) {
                      field.onChange(numbersOnly);
                      const n = Number(numbersOnly);
                      if (!Number.isFinite(n) || n <= 0) {
                        setValue("rewardBtc", "");
                        setValue("unlockPriceBtc", "");
                      }
                    }
                  }}
                  placeholder={
                    isRewarded
                      ? t("createEvent.enterHoursMin", "Enter hours (Min 1)")
                      : t(
                          "createEvent.freeHours",
                          "First {{hours}} hours are free",
                          { hours: params?.free_hours },
                        )
                  }
                  className={cn(
                    "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none",
                    errors.durationHours
                      ? "border-red-500 focus:ring-red-500"
                      : "border-border focus:ring-(--color-orange-500)",
                  )}
                />
              )}
            />
            {errors.durationHours && (
              <p className="tx-12 lh-18 mt-1 text-red-500">
                {errors.durationHours.message}
              </p>
            )}
          </div>

          {/* Reward (BTC) */}
          {isRewarded && (
            <div>
              <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
                {t("createEvent.rewardBtc", "Reward (BTC)")}{" "}
                <span className="text-(--color-orange-500)">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="rewardBtc"
                  rules={{
                    validate: (v) => {
                      if (!isRewardedRef.current) return true;
                      if (!v || v.trim() === "")
                        return t(
                          "createEvent.errorEnterRewardAmount",
                          "Please enter reward amount",
                        );
                      const amount = parseFloat(v);
                      if (!Number.isFinite(amount) || amount <= 0)
                        return t(
                          "createEvent.errorInvalidRewardAmount",
                          "Please enter a valid reward amount",
                        );
                      if (amount < minRewardBtcRef.current)
                        return t(
                          "createEvent.errorMinimumReward",
                          "Minimum {{min}} BTC",
                          { min: minRewardBtcRef.current.toFixed(8) },
                        );
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={Number(durationHours) <= 0}
                      type="text"
                      inputMode="decimal"
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        const parts = v.split(".");
                        const cleaned =
                          parts.length > 0
                            ? parts[0] +
                              (parts.length > 1
                                ? "." + parts.slice(1).join("")
                                : "")
                            : "";
                        field.onChange(cleaned);
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData("text");
                        const cleaned = pastedText.replace(/[^0-9.]/g, "");
                        const parts = cleaned.split(".");
                        const numbersOnly =
                          parts.length > 0
                            ? parts[0] +
                              (parts.length > 1
                                ? "." + parts.slice(1).join("")
                                : "")
                            : "";
                        if (numbersOnly) {
                          field.onChange(numbersOnly);
                        }
                      }}
                      placeholder={rewardBtcPlaceholder}
                      className={cn(
                        "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none disabled:opacity-60",
                        errors.rewardBtc
                          ? "border-red-500 focus:ring-red-500"
                          : "border-border focus:ring-(--color-orange-500)",
                      )}
                    />
                  )}
                />
                <Button
                  disabled={Number(durationHours) <= 0}
                  type="button"
                  appearance="solid"
                  tone="white"
                  text="sm"
                  className="border-border w-[125px] rounded-xl"
                  onClick={() => {
                    setValue("rewardBtc", minRewardBtc.toString(), {
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                    setLastField("rewardBtc");
                  }}
                >
                  {t("createEvent.minimum")}
                </Button>
              </div>
              {errors.rewardBtc && (
                <p className="tx-12 lh-18 mt-1 text-red-500">
                  {errors.rewardBtc.message}
                </p>
              )}
            </div>
          )}

          {/* Number of recipients */}
          {isRewarded && (
            <div>
              <p className="tx-14 lh-20 fw-m text-primary mb-1">
                {t("createEvent.numberOfRecipients")}
              </p>
              <p className="tx-12 lh-18 text-black dark:text-white">
                {maxRecipients !== null && maxRecipients > 0
                  ? maxRecipients === 1
                    ? t(
                        "createEvent.rewardDistributionText",
                        "The reward will be distributed to up to {{count}} address",
                        { count: maxRecipients },
                      )
                    : t(
                        "createEvent.rewardDistributionTextPlural",
                        "The reward will be distributed to up to {{count}} addresses",
                        { count: maxRecipients },
                      )
                  : "--"}
              </p>
            </div>
          )}

          {/* Platform fee（只有 no reward 時顯示） */}
          {!isRewarded && (
            <div>
              <p className="tx-14 lh-20 fw-m text-primary mb-1">
                {t("createEvent.platformFee", "Platform fee:")}
              </p>
              <p className="tx-12 lh-18 text-black dark:text-white">
                {platformFeeDisplay}
              </p>
            </div>
          )}

          {/* Result visibility */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-2">
              {t("createEvent.resultVisibility", "Result visibility")}
              <span className="text-(--color-orange-500)"> *</span>
            </p>
            <Controller
              control={control}
              name="resultVisibility"
              render={({ field }) => (
                <div className="flex gap-6">
                  {(
                    [
                      "public",
                      "paid_only",
                      "creator_only",
                    ] as ResultVisibility[]
                  ).map((value) => (
                    <label
                      key={value}
                      className="tx-14 lh-20 text-primary flex cursor-pointer items-center gap-2"
                    >
                      <input
                        name="resultVisibility"
                        type="radio"
                        className="radio-orange"
                        checked={field.value === value}
                        onChange={() => {
                          field.onChange(value);
                          if (value !== "paid_only") {
                            clearErrors("creatorEmail");
                            clearErrors("unlockPriceBtc");
                          }
                        }}
                      />
                      <span>
                        {value === "public" &&
                          t("createEvent.resultVisibilityPublic", "Public")}
                        {value === "paid_only" &&
                          t(
                            "createEvent.resultVisibilityPaidOnly",
                            "Paid-only",
                          )}
                        {value === "creator_only" &&
                          t(
                            "createEvent.resultVisibilityCreatorOnly",
                            "Creator-only",
                          )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />

            {/* Extra fields shown only when paid_only is selected */}
            {resultVisibility === "paid_only" && (
              <div className="border-border bg-surface mt-4 space-y-4 rounded-xl border p-4">
                {/* Creator email */}
                <div>
                  <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
                    {t("createEvent.creatorEmail", "Creator email")}
                    <span className="text-(--color-orange-500)"> *</span>
                  </label>
                  <input
                    {...register("creatorEmail", {
                      validate: (v) => {
                        if (resultVisibilityRef.current !== "paid_only")
                          return true;
                        if (!v || !v.trim())
                          return t(
                            "createEvent.creatorEmailRequired",
                            "Please enter your email.",
                          );
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(v.trim()))
                          return t(
                            "createEvent.creatorEmailInvalid",
                            "Please enter a valid email address.",
                          );
                        return true;
                      },
                    })}
                    type="text"
                    autoComplete="one-time-code"
                    placeholder={t(
                      "createEvent.creatorEmailPlaceholder",
                      "Please enter a valid email address",
                    )}
                    className={cn(
                      "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none",
                      errors.creatorEmail
                        ? "border-red-500 focus:ring-red-500"
                        : "border-border focus:ring-(--color-orange-500)",
                    )}
                  />
                  <p className="tx-12 lh-18 text-secondary mt-1">
                    {t(
                      "createEvent.creatorEmailHint",
                      "This email will be used by you to unlock this event's results.",
                    )}
                  </p>
                  {errors.creatorEmail && (
                    <p className="tx-12 lh-18 mt-1 text-red-500">
                      {errors.creatorEmail.message}
                    </p>
                  )}
                </div>

                {/* Unlock price (BTC) */}
                <div>
                  <label className="tx-14 lh-20 fw-m text-primary mb-1 block">
                    {t("createEvent.unlockPriceBtc", "Unlock price (BTC)")}
                    <span className="text-(--color-orange-500)"> *</span>
                  </label>
                  <Controller
                    control={control}
                    name="unlockPriceBtc"
                    rules={{
                      validate: (v) => {
                        if (resultVisibilityRef.current !== "paid_only")
                          return true;
                        if (!v || v.trim() === "")
                          return t(
                            "createEvent.unlockPriceRequired",
                            "Please enter unlock price.",
                          );
                        const amount = parseFloat(v);
                        if (!Number.isFinite(amount) || amount <= 0)
                          return t(
                            "createEvent.unlockPriceInvalid",
                            "Please enter a valid amount.",
                          );
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        disabled={Number(durationHours) <= 0}
                        type="text"
                        inputMode="decimal"
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9.]/g, "");
                          const parts = v.split(".");
                          const cleaned =
                            parts.length > 0
                              ? parts[0] +
                                (parts.length > 1
                                  ? "." + parts.slice(1).join("")
                                  : "")
                              : "";
                          field.onChange(cleaned);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData("text");
                          const cleaned = pastedText.replace(/[^0-9.]/g, "");
                          const parts = cleaned.split(".");
                          const numbersOnly =
                            parts.length > 0
                              ? parts[0] +
                                (parts.length > 1
                                  ? "." + parts.slice(1).join("")
                                  : "")
                              : "";
                          if (numbersOnly) field.onChange(numbersOnly);
                        }}
                        placeholder={
                          Number(durationHours) > 0
                            ? t(
                                "createEvent.enterUnlockPrice",
                                "Enter unlock price",
                              )
                            : t(
                                "createEvent.setDurationFirst",
                                "Set Duration First",
                              )
                        }
                        className={cn(
                          "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none disabled:opacity-60",
                          errors.unlockPriceBtc
                            ? "border-red-500 focus:ring-red-500"
                            : "border-border focus:ring-(--color-orange-500)",
                        )}
                      />
                    )}
                  />
                  {errors.unlockPriceBtc && (
                    <p className="tx-12 lh-18 mt-1 text-red-500">
                      {errors.unlockPriceBtc.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preheat */}
          <div className="space-y-2">
            <div className="tx-14 lh-20 text-primary flex items-center gap-2">
              <Controller
                control={control}
                name="enablePreheat"
                render={({ field }) => (
                  <input
                    id="enable-preheat"
                    type="checkbox"
                    className="accent-(--color-orange-500)"
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (!e.target.checked) {
                        setValue("preheatHours", "");
                        clearErrors("preheatHours");
                      }
                    }}
                  />
                )}
              />
              <label
                htmlFor="enable-preheat"
                className="tx-14 lh-20 text-primary cursor-pointer"
              >
                {t("createEvent.enablePreheat")}
              </label>
              <Tooltip
                placement="topLeft"
                title={formatTooltipText(t("createEvent.enablePreheatTooltip"))}
                color="white"
                arrow={{ pointAtCenter: true }}
                {...enablePreheatTooltip.tooltipProps}
              >
                <span
                  {...enablePreheatTooltip.triggerProps}
                  className="tx-14 text-admin-text-main cursor-pointer dark:text-white"
                >
                  ⓘ
                </span>
              </Tooltip>
            </div>
            <Controller
              control={control}
              name="preheatHours"
              rules={{
                validate: (v) => {
                  if (!enablePreheatRef.current) return true;
                  if (!v || v.trim() === "")
                    return t(
                      "createEvent.errorEnterPreheatHours",
                      "Please enter preheat hours",
                    );
                  const n = Number(v);
                  if (!Number.isFinite(n))
                    return t(
                      "createEvent.errorInvalidNumber",
                      "Please enter a valid number",
                    );
                  if (n > 720)
                    return t(
                      "createEvent.errorMaxPreheatHours",
                      "Maximum preheat hours is 720",
                    );
                  if (n < 1)
                    return t(
                      "createEvent.errorMinPreheatHours",
                      "Minimum preheat hours is 1",
                    );
                  return true;
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={!enablePreheat}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    field.onChange(v);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData("text");
                    const numbersOnly = pastedText.replace(/[^0-9]/g, "");
                    if (numbersOnly) {
                      field.onChange(numbersOnly);
                    }
                  }}
                  placeholder={t(
                    "createEvent.enterHoursMax",
                    "Enter hours (max 720)",
                  )}
                  className={cn(
                    "tx-14 lh-20 placeholder:text-secondary w-full rounded-xl border bg-white px-3 py-2 text-black focus:ring-2 focus:outline-none disabled:opacity-60",
                    errors.preheatHours
                      ? "border-red-500 focus:ring-red-500"
                      : "border-border focus:ring-(--color-orange-500)",
                  )}
                />
              )}
            />
            {enablePreheat && errors.preheatHours && (
              <p className="tx-12 lh-18 mt-1 text-red-500">
                {errors.preheatHours.message}
              </p>
            )}
          </div>

          {/* Preheat fee */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.preheatFee", "Preheat fee:")}
            </p>
            <p className="tx-12 lh-18 text-black dark:text-white">
              {preheatFeeDisplay}
            </p>
          </div>

          {/* Terms checkbox */}
          <div
            className={cn(
              "-mx-2 rounded-lg border-t p-2 pt-2",
              errors.agree ? "border-2 border-red-500" : "border-border",
            )}
          >
            <label className="tx-12 lh-18 text-secondary flex items-start gap-2">
              <input
                {...register("agree", {
                  validate: (v) =>
                    v ||
                    t(
                      "createEvent.alertAgreeRequired",
                      "Please agree to the Terms of Service to continue.",
                    ),
                })}
                type="checkbox"
                className="mt-0.5 cursor-pointer accent-(--color-orange-500)"
              />
              <span>
                {t("createEvent.agreeToThe", "I agree to the")}{" "}
                <Link
                  to="/terms"
                  className="text-(--color-orange-500) underline"
                >
                  {t("createEvent.termsOfService", "Terms of Service")}
                </Link>
                ,{" "}
                <Link
                  to="/terms-reward-distribution"
                  className="text-(--color-orange-500) underline"
                >
                  {t("createEvent.rewardDistribution", "Reward Distribution")}
                </Link>
                ,{" "}
                <Link
                  to="/privacy"
                  className="text-(--color-orange-500) underline"
                >
                  {t("createEvent.privacyPolicy", "Privacy Policy")}
                </Link>{" "}
                {t("createEvent.and", "and")}{" "}
                <Link
                  to="/charges-refunds"
                  className="text-(--color-orange-500) underline"
                >
                  {t("createEvent.chargesRefunds", "Charges & Refunds")}
                </Link>
                .
              </span>
            </label>
            {errors.agree && (
              <p className="tx-12 lh-18 mt-1 ml-6 text-red-500">
                {errors.agree.message as string}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              name="clearButton"
              type="button"
              appearance="outline"
              tone="primary"
              text="sm"
              className="sm:w-40"
              onClick={handleClear}
            >
              {t("createEvent.clear", "Clear")}
            </Button>
            <Button
              name="previewButton"
              type="submit"
              appearance="solid"
              tone="primary"
              text="sm"
              className={cn(
                "sm:w-40",
                isPreviewDisabled && !isSubmitting && "opacity-50",
              )}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("createEvent.submitting", "Submitting…")
                : t("createEvent.preview", "Preview")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
