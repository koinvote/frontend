import { Tooltip } from "antd";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router";
// import { useMutation } from '@tanstack/react-query'

import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import MinusIcon from "@/assets/icons/minus.svg?react";
import PlusIcon from "@/assets/icons/plus.svg?react";
import { Button } from "@/components/base/Button";
import { useBackIfInternal } from "@/hooks/useBack";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { cn } from "@/utils/style";

// import { API } from '@/api'
// import type { CreateEventReq } from '@/api/request'
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

type PreviewEventState = {
  creatorAddress: string;
  title: string;
  description: string;
  hashtag: string;
  eventType: EventType; // 'open' | 'single_choice'
  isRewarded: boolean;
  rewardBtc?: string;
  maxRecipient?: number;
  durationHours: number;
  options?: string[];
  enablePreheat: boolean;
  preheatHours?: number;
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
};

const CREATE_EVENT_DRAFT_KEY = "koinvote:create-event-draft";

const normalizeTag = (raw: string) => {
  const v = raw.trim();
  if (!v) return null;

  const noHash = v.replace(/^#+/, "");

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
  const goBack = useBackIfInternal("/");

  useEffect(() => {
    const fromCreateEvent = sessionStorage.getItem("fromCreateEvent");
    if (fromCreateEvent === "true") {
      isFromCreateEventRef.current = true;
      sessionStorage.removeItem("fromCreateEvent");
    } else {
      isFromCreateEventRef.current = false;
    }
  }, [location.pathname]);

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

  /** 同意條款 */
  const [agree, setAgree] = useState(false);

  /** Validation error states for form fields */
  const [titleError, setTitleError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [agreeError, setAgreeError] = useState<string | null>(null);

  /** 基本文字欄位 */
  const [creatorAddress, setCreatorAddress] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagList, setHashtagList] = useState<string[]>([]);

  /** Minimum duration hours */
  // const [minimumDurationHours, setMinimumDurationHours] = useState<number>()
  // address verification
  const [addrStatus, setAddrStatus] = useState<AddressValidationStatus>("idle");
  const [addrInfo, setAddrInfo] = useState<AddressInfo | null>(null);
  const [addrError, setAddrError] = useState<string>("");

  /** 回覆類型：open / single_choice */
  const [eventType, setEventType] = useState<EventType>("single_choice");

  /** 是否有獎金 */
  const [isRewarded, setIsRewarded] = useState(true);
  const [rewardBtc, setRewardBtc] = useState(""); // 使用者輸入的 BTC 字串
  const [rewardBtcTouched, setRewardBtcTouched] = useState(false); // Track if rewardBtc field has been interacted with

  /** 單選題選項 */
  const [options, setOptions] = useState<string[]>([""]);
  const [optionsTouched, setOptionsTouched] = useState(false); // Track if options field has been interacted with

  /** Duration + Preheat */
  const [durationHours, setDurationHours] = useState(""); // 用字串綁 input，比較好處理空值
  const [enablePreheat, setEnablePreheat] = useState(false);
  const [preheatHours, setPreheatHours] = useState("");

  // 回填資料後再次確認是否可預覽
  const [checkPreview, setCheckPreview] = useState(false);

  useEffect(() => {
    const raw = creatorAddress.trim();

    if (!raw) {
      setAddrStatus("idle");
      setAddrInfo(null);
      setAddrError("");
      return;
    }

    setAddrStatus("checking");
    setAddrError("");

    const timer = window.setTimeout(() => {
      const ok = validate(raw, ACTIVE_BTC_NETWORK);

      if (!ok) {
        setAddrStatus("invalid");
        setAddrInfo(null);
        setAddrError(
          t("createEvent.invalidBitcoinAddress", "Invalid Bitcoin address."),
        );
        return;
      }

      try {
        const info = getAddressInfo(raw);

        if (info.network !== ACTIVE_BTC_NETWORK) {
          setAddrStatus("invalid");
          setAddrInfo(null);
          setAddrError(
            t(
              "createEvent.addressWrongNetwork",
              "Address is for {{network}}, not {{expected}}.",
              {
                network: info.network,
                expected: networkLabel,
              },
            ),
          );
          return;
        }

        setAddrStatus("valid");
        setAddrInfo(info);
        setAddrError("");
      } catch {
        setAddrStatus("invalid");
        setAddrInfo(null);
        setAddrError(
          t(
            "createEvent.invalidBitcoinAddressNetwork",
            "Invalid Bitcoin address ({{network}}).",
            {
              network: networkLabel,
            },
          ),
        );
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [creatorAddress, ACTIVE_BTC_NETWORK, networkLabel, t]);

  useEffect(() => {
    const saved = sessionStorage.getItem(CREATE_EVENT_DRAFT_KEY);
    if (!saved) return;

    try {
      const draft: CreateEventDraft = JSON.parse(saved);

      // Set flag to prevent clearing preheatHours during restore
      isRestoringRef.current = true;

      setCreatorAddress(draft.creatorAddress ?? "");
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setHashtagList(
        (draft.hashtags ?? "")
          .split(/[,\s]+/g)
          .map((s) => s.trim())
          .filter(Boolean),
      );
      setEventType(draft.eventType ?? "single_choice");
      setIsRewarded(draft.isRewarded ?? true);
      setRewardBtc(draft.rewardBtc ?? "");
      setOptions(draft.options && draft.options.length ? draft.options : [""]);
      setDurationHours(draft.durationHours ?? "");
      // Restore enablePreheat and preheatHours together to maintain consistency
      setEnablePreheat(draft.enablePreheat ?? false);
      setPreheatHours(draft.preheatHours ?? "");
      setAgree(draft.agree ?? false);

      if (draft.rewardBtc) {
        setRewardBtcTouched(true);
      }
      setCheckPreview(true);
    } catch (e) {
      console.error("Failed to parse create-event draft", e);
    }
  }, []);

  // Clear preheat hours when preheat is disabled
  // Use a ref to track if we're restoring from sessionStorage to avoid clearing during restore
  const isRestoringRef = useRef(false);

  // Refs for form field focus
  const creatorAddressRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rewardBtcRef = useRef<HTMLInputElement>(null);
  const preheatHoursRef = useRef<HTMLInputElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Don't clear if we're restoring from sessionStorage
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    if (!enablePreheat) {
      setPreheatHours("");
    }
  }, [enablePreheat]);

  // -------- Creator address handlers --------
  const handleCreatorAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    //todo when user finish input, check if it is a valid btc address
    //and call Get API to check if there any free ongoing event by this address
    //so if yes, we change minumum duration hour above 25 hours
    setCreatorAddress(e.target.value);
  };

  /** -------- Options handlers -------- */
  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddOption = () => {
    // Maximum 5 options
    if (options.length >= 5) return;
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  /** -------- Clear form handler -------- */
  const handleClear = () => {
    // Clear all form fields
    setAgree(false);
    setCreatorAddress("");
    setTitle("");
    setDescription("");
    setHashtagInput("");
    setHashtagList([]);
    setAddrStatus("idle");
    setAddrInfo(null);
    setAddrError("");
    setEventType("single_choice");
    setIsRewarded(true);
    setRewardBtc("");
    setRewardBtcTouched(false); // Reset touched state
    setOptions([""]);
    setOptionsTouched(false); // Reset touched state
    setDurationHours("");
    setEnablePreheat(false);
    setPreheatHours("");
  };

  /** -------- Submit handler -------- */

  // Helper to focus and scroll element into view
  const focusAndScroll = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear all validation errors first
    setTitleError(null);
    setDurationError(null);
    setAgreeError(null);

    // Validate creator address
    if (addrStatus !== "valid") {
      focusAndScroll(creatorAddressRef);
      return;
    }

    // Validate title
    if (!title.trim()) {
      setTitleError(
        t("createEvent.alertTitleRequired", "Please enter a title."),
      );
      focusAndScroll(titleRef);
      return;
    }

    // Validate options for single_choice events
    let cleanedOptions: string[] | undefined;
    if (eventType === "single_choice") {
      const list = options.map((o) => o.trim()).filter(Boolean);
      if (list.length === 0) {
        setOptionsTouched(true);
        optionRefs.current[0]?.focus();
        optionRefs.current[0]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
      cleanedOptions = list;
    }

    // Validate duration
    const duration = Number(durationHours || 0);
    if (!duration || duration <= 0) {
      setDurationError(
        t("createEvent.alertInvalidDuration", "Please enter a valid duration."),
      );
      focusAndScroll(durationRef);
      return;
    }

    // Validate reward BTC if rewarded
    if (isRewarded && (!rewardBtcTouched || !rewardBtcValidation.isValid)) {
      setRewardBtcTouched(true);
      focusAndScroll(rewardBtcRef);
      return;
    }

    // Validate preheat hours if enabled
    let preheat = 0;
    if (enablePreheat) {
      preheat = Number(preheatHours || 0);
      if (!preheat || preheat < 1 || preheat > 720) {
        focusAndScroll(preheatHoursRef);
        return;
      }
    }

    // Validate agreement checkbox
    if (!agree) {
      setAgreeError(
        t(
          "createEvent.alertAgreeRequired",
          "Please agree to the Terms of Service to continue.",
        ),
      );
      // Scroll to the agree checkbox area
      agreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const previewData: PreviewEventState = {
      creatorAddress,
      title: title.trim(),
      description: description.trim(),
      hashtag: hashtagList.join(","),
      eventType,
      isRewarded,
      rewardBtc: isRewarded ? rewardBtc : undefined,
      maxRecipient: undefined, // TODO: 之後由後端 or 前端計算
      durationHours: duration,
      options: cleanedOptions,
      enablePreheat,
      preheatHours: enablePreheat && preheat > 0 ? preheat : undefined,
    };

    navigate("/preview-event", { state: previewData });
  };

  const isSubmitting = false;

  useEffect(() => {
    const draft: CreateEventDraft = {
      creatorAddress,
      title,
      description,
      hashtags: hashtagList.join(","),
      eventType,
      isRewarded,
      rewardBtc,
      options,
      durationHours,
      enablePreheat,
      preheatHours,
      agree,
    };
    sessionStorage.setItem(CREATE_EVENT_DRAFT_KEY, JSON.stringify(draft));
  }, [
    creatorAddress,
    title,
    description,
    hashtagList,
    eventType,
    isRewarded,
    rewardBtc,
    options,
    durationHours,
    enablePreheat,
    preheatHours,
    agree,
  ]);

  const params = useSystemParametersStore((s) => s.params);

  // Calculate minimum reward based on duration and free hours
  // Rule 1: If duration_hours ≤ free_hours, min = satoshi_per_duration_hour
  // Rule 2: If duration_hours > free_hours, min = max(min_reward_amount_satoshi, duration_hours × satoshi_per_duration_hour)
  const minRewardBtc = useMemo(() => {
    if (!params) {
      return 0.000011; // Default fallback
    }

    const durationHoursNum = Number(durationHours);
    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const minRewardAmountSatoshi = params.min_reward_amount_satoshi ?? 0;

    // If duration is not set or invalid, return default
    if (!Number.isFinite(durationHoursNum) || durationHoursNum <= 0) {
      return minRewardAmountSatoshi / 100_000_000;
    }

    let minRewardSatoshi: number;

    if (durationHoursNum <= freeHours) {
      // Rule 1: duration_hours ≤ free_hours, min = satoshi_per_duration_hour
      minRewardSatoshi = satoshiPerDurationHour;
    } else {
      // Rule 2: duration_hours > free_hours, min = max(min_reward_amount_satoshi, duration_hours × satoshi_per_duration_hour)
      const durationBasedMin = durationHoursNum * satoshiPerDurationHour;
      minRewardSatoshi = Math.max(minRewardAmountSatoshi, durationBasedMin);
    }

    // Convert to BTC
    return minRewardSatoshi / 100_000_000;
  }, [params, durationHours]);

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

  // Calculate max recipients for rewarded events
  // Formula: [用户输入的奖金金额] / [satoshi_per_extra_winner], 无条件舍去取整数
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

    // 无条件舍去取整数
    return Math.floor(rewardAmountSatoshi / satoshiPerExtraWinner);
  }, [isRewarded, rewardBtc, params?.satoshi_per_extra_winner]);

  // Validate reward amount
  const rewardBtcValidation = useMemo(() => {
    if (!isRewarded) {
      return { isValid: true, error: null };
    }

    if (!rewardBtcTouched) {
      return { isValid: true, error: null };
    }

    // Check if reward is empty
    if (!rewardBtc || rewardBtc.trim() === "") {
      return {
        isValid: false,
        error: rewardBtcTouched
          ? t(
              "createEvent.errorEnterRewardAmount",
              "Please enter reward amount",
            )
          : null,
      };
    }

    const rewardAmount = parseFloat(rewardBtc);
    if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
      return {
        isValid: false,
        error: rewardBtcTouched
          ? t(
              "createEvent.errorInvalidRewardAmount",
              "Please enter a valid reward amount",
            )
          : null,
      };
    }

    // Check if reward amount is less than minimum
    if (rewardAmount < minRewardBtc) {
      return {
        isValid: false,
        error: rewardBtcTouched
          ? t("createEvent.errorMinimumReward", "Minimum {{min}} BTC", {
              min: minRewardBtc.toFixed(8),
            })
          : null,
      };
    }

    return { isValid: true, error: null };
  }, [isRewarded, rewardBtc, minRewardBtc, rewardBtcTouched, t]);

  // Calculate platform fee for non-reward events
  // Formula: [Duration - free_hours] × satoshi_per_duration_hour × platform_fee_percentage
  const platformFeeSatoshi = useMemo(() => {
    // Only calculate for non-reward events
    if (isRewarded) return null;

    // Check if system parameters are loaded
    if (!params) return null;

    const duration = Number(durationHours);
    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    // If duration is invalid or not provided, return null
    if (!Number.isFinite(duration) || duration <= 0) return null;

    // If free_hours is 0, it means no free hours, calculate for full duration
    // If duration <= free_hours, platform fee is 0
    const billableHours =
      freeHours > 0 ? Math.max(0, duration - freeHours) : duration;

    // If no billable hours, platform fee is 0
    if (billableHours <= 0) return 0;

    // Calculate: billableHours × satoshi_per_duration_hour × platform_fee_percentage
    const fee =
      billableHours * satoshiPerDurationHour * (platformFeePercentage / 100);

    // Round to nearest satoshi
    return Math.round(fee);
  }, [isRewarded, params, durationHours]);

  // Format platform fee for display
  const platformFeeDisplay = useMemo(() => {
    return satsToBtc(platformFeeSatoshi);
  }, [platformFeeSatoshi]);

  // Calculate preheat fee
  // Formula: preheatHours × satoshi_per_duration_hour × platform_fee_percentage × (0.2 + 0.8 × preheatHours / 720)
  const preheatFeeSatoshi = useMemo(() => {
    // Only calculate if preheat is enabled
    if (!enablePreheat) return null;

    // Check if system parameters are loaded
    if (!params) return null;

    const preheatHoursNum = Number(preheatHours);
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    // Validate preheat hours (must be between 1 and 720)
    if (
      !Number.isFinite(preheatHoursNum) ||
      preheatHoursNum < 1 ||
      preheatHoursNum > 720
    ) {
      return null;
    }

    // Calculate: preheatHours × satoshi_per_duration_hour × platform_fee_percentage × (0.2 + 0.8 × preheatHours / 720)
    const multiplier = 0.2 + 0.8 * (preheatHoursNum / 720);
    const fee =
      preheatHoursNum *
      satoshiPerDurationHour *
      (platformFeePercentage / 100) *
      multiplier;

    // Round to nearest satoshi
    return Math.round(fee);
  }, [enablePreheat, params, preheatHours]);

  // Format preheat fee for display
  const preheatFeeDisplay = useMemo(() => {
    return satsToBtc(preheatFeeSatoshi);
  }, [preheatFeeSatoshi]);

  // Validate preheat hours
  const preheatHoursValidation = useMemo(() => {
    if (!enablePreheat) {
      return { isValid: true, error: null };
    }

    const preheatHoursNum = Number(preheatHours);

    // Check if preheat hours is empty
    if (!preheatHours || preheatHours.trim() === "") {
      return {
        isValid: false,
        error: t(
          "createEvent.errorEnterPreheatHours",
          "Please enter preheat hours",
        ),
      };
    }

    // Check if preheat hours is a valid number
    if (!Number.isFinite(preheatHoursNum)) {
      return {
        isValid: false,
        error: t(
          "createEvent.errorInvalidNumber",
          "Please enter a valid number",
        ),
      };
    }

    // Check if preheat hours is greater than 720
    if (preheatHoursNum > 720) {
      return {
        isValid: false,
        error: t(
          "createEvent.errorMaxPreheatHours",
          "Maximum preheat hours is 720",
        ),
      };
    }

    // Check if preheat hours is less than 1
    if (preheatHoursNum < 1) {
      return {
        isValid: false,
        error: t(
          "createEvent.errorMinPreheatHours",
          "Minimum preheat hours is 1",
        ),
      };
    }

    return { isValid: true, error: null };
  }, [enablePreheat, preheatHours, t]);

  // Validate options for single_choice events
  const optionsValidation = useMemo(() => {
    if (eventType !== "single_choice") {
      return { isValid: true, error: null };
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    const hasValidOptions = validOptions.length > 0;

    // isValid always reflects the true validation state
    // error message only shows after field has been touched
    if (!hasValidOptions) {
      return {
        isValid: false,
        error: optionsTouched
          ? t(
              "createEvent.errorAtLeastOneOption",
              "At least one option is required",
            )
          : null,
      };
    }

    return { isValid: true, error: null };
  }, [eventType, options, optionsTouched, t]);

  // Check if Preview button should be disabled
  const isPreviewDisabled = useMemo(() => {
    const duration = Number(durationHours || 0);
    return (
      isSubmitting ||
      addrStatus !== "valid" ||
      !title.trim() ||
      !duration ||
      duration <= 0 ||
      !preheatHoursValidation.isValid ||
      (isRewarded && !rewardBtcTouched) ||
      !rewardBtcValidation.isValid ||
      !optionsValidation.isValid ||
      !agree
    );
  }, [
    agree,
    isSubmitting,
    title,
    durationHours,
    preheatHoursValidation.isValid,
    isRewarded,
    rewardBtcTouched,
    rewardBtcValidation.isValid,
    optionsValidation.isValid,
    addrStatus,
    checkPreview,
  ]);

  // -------- Hashtags handlers -------- *
  const MAX_TAGS = 3;
  const MAX_TAG_LENGTH = 20; // exclude leading '#'
  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag) return;

    setHashtagList((prev) => {
      // 最多 3 個
      if (prev.length >= MAX_TAGS) return prev;
      // 如果標籤已存在，不添加
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

    // input 空時，Backspace 刪最後一顆
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
    // 已達最大 chips 數量時，直接不再接受新的輸入（維持空值），需先刪除既有標籤
    if (hashtagList.length >= MAX_TAGS) {
      setHashtagInput("");
      return;
    }

    // 已達最大 chips 數量時，仍允許輸入但新增時會被跳過
    // 如果用戶貼上「#a #b,#c 」這種，直接拆 chips
    if (/[,\s]/.test(v)) {
      commitByDelimiters(v);
      setHashtagInput("");
      return;
    }

    // 計算新輸入的字符數（清理後，排除 # 和非字母數字字符）
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
    <div className="flex-col flex items-center justify-center w-full px-2 md:px-0">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={goBack}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>

      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500) mb-6">
          {t("createEvent.formTitle")}
        </h1>

        {/* onSubmit 綁定 handleSubmit */}
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {/* Creator address */}
          <div>
            <div className="flex items-center gap-1 mb-1">
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
                  className="tx-14 text-admin-text-main dark:text-white cursor-pointer flex items-center"
                >
                  ⓘ
                </span>
              </Tooltip>
              <span className={`text-(--color-orange-500) ml-1`}>*</span>
            </div>
            <input
              ref={creatorAddressRef}
              type="text"
              // avoid browser auto-fill
              name="field_7x9abtca"
              id="field_7x9abtca"
              value={creatorAddress}
              onChange={handleCreatorAddressChange}
              placeholder={t("createEvent.creatorAddressPlaceholder")}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="new-password"
              spellCheck="false"
              className={`w-full rounded-xl border border-border bg-white px-3 py-2
    tx-14 lh-20 text-black placeholder:text-secondary
    focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
    ${addrStatus === "invalid" ? "border-red-500 focus:ring-red-500" : ""}
    ${addrStatus === "valid" ? "border-green-500 focus:ring-green-500" : ""}
  `}
            />
            <div className="mt-1 tx-12 lh-18">
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
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.title")}{" "}
              <span className="text-(--color-orange-500)">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              maxLength={120}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder={t("createEvent.titlePlaceholder")}
              className={cn(
                "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2",
                titleError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-(--color-orange-500)",
              )}
            />
            <div className="flex justify-between mt-1">
              {titleError && (
                <span className="tx-12 lh-18 text-red-500">{titleError}</span>
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
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.description")}
            </label>
            <textarea
              maxLength={500}
              rows={3}
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setDescription(e.target.value);
                }
              }}
              placeholder={t("createEvent.descriptionPlaceholder")}
              className={`w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
                         resize-none h-auto min-h-[100px]
                         ${
                           description.length >= 500
                             ? "border-red-500 focus:ring-red-500"
                             : ""
                         }`}
            />
            <span
              className={`tx-12 lh-18  block text-right 
              ${description.length >= 500 ? "text-red-500" : "text-secondary"}`}
            >
              {500 - description.length}{" "}
              {t("createEvent.characterLeft", "characters left")}
            </span>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.hashtags", "Hashtags")}
            </label>

            <div
              className={cn(
                "w-full rounded-xl border border-border bg-white px-3 py-2",
                "flex flex-wrap items-center gap-2",
                "focus-within:ring-2 focus-within:ring-(--color-orange-500)",
              )}
              onMouseDown={(e) => {
                // 點容器時讓 input focus（但不影響點 X）
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
                    "bg-surface text-primary border border-border",
                    "px-3 py-1 tx-12 lh-18",
                  )}
                >
                  <span className="select-none">#{tag}</span>
                  <button
                    type="button"
                    data-chip-remove
                    aria-label={`Remove ${tag}`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/10"
                    onClick={() => removeTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => handleHashtagChange(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                onBlur={handleHashtagBlur}
                className={cn(
                  "min-w-[120px] flex-1",
                  "bg-transparent outline-none",
                  "tx-14 lh-20 text-black placeholder:text-secondary",
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
            <p className="tx-14 lh-20 fw-m text-primary mb-2">
              {t("createEvent.responseType", "Response Type")}
              <span className="text-(--color-orange-500)">*</span>
            </p>
            <div className="space-y-2">
              <label className="flex tx-14 lh-20 text-primary">
                <div className="flex items-center gap-2 cursor-pointer">
                  {" "}
                  <input
                    type="radio"
                    name="responseType"
                    className="radio-orange"
                    checked={eventType === "single_choice"}
                    onChange={() => setEventType("single_choice")}
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
              <label className="flex tx-14 lh-20 text-primary">
                <div className="flex items-center gap-2 cursor-pointer">
                  <input
                    className="radio-orange"
                    type="radio"
                    name="responseType"
                    checked={eventType === "open"}
                    onChange={() => setEventType("open")}
                  />
                  <span>
                    {t("createEvent.responseTypeOptions.0.label", "Open-ended")}
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
          </div>

          {/* Options（只有 single_choice 時顯示） */}
          {eventType === "single_choice" && (
            <div>
              <label className="block tx-14 lh-20 fw-m text-primary mb-1">
                {t("createEvent.options")}
                <span className="text-(--color-orange-500)">*</span>
              </label>

              <div className="space-y-2">
                {options.map((opt, index) => {
                  const isLast = index === options.length - 1;
                  const canRemove = options.length > 1;

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative w-full">
                        <input
                          ref={(el) => {
                            optionRefs.current[index] = el;
                          }}
                          type="text"
                          value={opt}
                          maxLength={20}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          onBlur={() => setOptionsTouched(true)}
                          placeholder={t(
                            "createEvent.optionPlaceholder",
                            "Option {{n}}",
                            {
                              n: index + 1,
                            },
                          )}
                          className="w-full rounded-xl border border-border bg-white px-3 py-2
                           tx-14 lh-20 text-black placeholder:text-secondary
                           focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)"
                        />
                        <span
                          className={`tx-12 lh-18 absolute right-3 bottom-1 ${
                            opt.length >= 20 ? "text-red-500" : "text-secondary"
                          }`}
                        >
                          {opt.length}/20
                        </span>
                      </div>

                      {/* 減號：有兩個以上 option 才顯示 */}
                      {canRemove && (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center cursor-pointer",
                          )}
                          onClick={() => handleRemoveOption(index)}
                        >
                          <MinusIcon />
                        </div>
                      )}

                      {/* 加號：只在最後一列顯示，且選項數量少於5個時才顯示 */}
                      {isLast && options.length < 5 && (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center cursor-pointer",
                          )}
                          onClick={handleAddOption}
                        >
                          <PlusIcon />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {optionsValidation.error && (
                <p className="tx-12 lh-18 text-red-500 mt-1">
                  {optionsValidation.error}
                </p>
              )}
            </div>
          )}

          {/* Reward type */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-2">
              {t("createEvent.rewardType")}
              <span className="text-(--color-orange-500)">*</span>
            </p>
            <div className="space-y-2">
              <label className="flex tx-14 lh-20 text-primary">
                <div className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rewardType"
                    className="radio-orange"
                    checked={isRewarded}
                    onChange={() => setIsRewarded(true)}
                  />
                  <span>{t("createEvent.rewarded", "Rewarded")}</span>
                </div>
              </label>
              <label className="flex tx-14 lh-20 text-primary">
                <div className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rewardType"
                    className="radio-orange"
                    checked={!isRewarded}
                    onChange={() => setIsRewarded(false)}
                  />
                  <span>{t("createEvent.nonRewarded", "Non-Rewarded")}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="tx-14 lh-20 fw-m text-primary">
                {t("createEvent.durationOfEvent", "Duration of this event")}
                <span className="text-(--color-orange-500)">*</span>
              </label>
            </div>
            <input
              ref={durationRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={durationHours}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setDurationHours(v);
                if (durationError) setDurationError(null);
                const n = Number(v);
                if (!Number.isFinite(n) || n <= 0) {
                  setRewardBtc("");
                  setRewardBtcTouched(false);
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                const numbersOnly = pastedText.replace(/[^0-9]/g, "");
                if (numbersOnly) {
                  setDurationHours(numbersOnly);
                  if (durationError) setDurationError(null);
                  const n = Number(numbersOnly);
                  if (!Number.isFinite(n) || n <= 0) {
                    setRewardBtc("");
                    setRewardBtcTouched(false);
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
                "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2",
                durationError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-(--color-orange-500)",
              )}
            />
            {durationError && (
              <p className="tx-12 lh-18 text-red-500 mt-1">{durationError}</p>
            )}
          </div>

          {/* Reward (BTC) */}
          {isRewarded && (
            <div>
              <label className="block tx-14 lh-20 fw-m text-primary mb-1">
                {t("createEvent.rewardBtc", "Reward (BTC)")}{" "}
                <span className="text-(--color-orange-500)">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={rewardBtcRef}
                  disabled={Number(durationHours) <= 0}
                  type="text"
                  inputMode="decimal"
                  value={rewardBtc}
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
                    setRewardBtc(cleaned);
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
                      setRewardBtc(numbersOnly);
                    }
                  }}
                  onBlur={() => setRewardBtcTouched(true)}
                  //if enabled, the placeholder need to be change to Enter reward ( Min 0.000011 ), and the number Min xxxx need to have a state so I can update it dynamically
                  placeholder={rewardBtcPlaceholder}
                  className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2 disabled:opacity-60",
                    rewardBtcValidation.error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-border focus:ring-(--color-orange-500)",
                  )}
                />
                <Button
                  disabled={Number(durationHours) <= 0}
                  type="button"
                  appearance="solid"
                  tone="white"
                  text="sm"
                  className="w-[100px]"
                  onClick={() => {
                    setRewardBtc(minRewardBtc.toString());
                    setRewardBtcTouched(true); // Mark as touched when user clicks Minimum button
                  }}
                >
                  {t("createEvent.minimum")}
                </Button>
              </div>
              {isRewarded && rewardBtcValidation.error && (
                <p className="tx-12 lh-18 text-red-500 mt-1">
                  {rewardBtcValidation.error}
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
              <p className="tx-12 lh-18 dark:text-white text-black">
                {platformFeeDisplay}
              </p>
            </div>
          )}

          {/* Preheat */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 tx-14 lh-20 text-primary">
              <input
                id="enable-preheat"
                type="checkbox"
                // check box color change to white
                className="accent-(--color-orange-500)"
                checked={enablePreheat}
                onChange={(e) => setEnablePreheat(e.target.checked)}
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
                  className="tx-14 text-admin-text-main dark:text-white cursor-pointer"
                >
                  ⓘ
                </span>
              </Tooltip>
            </div>
            <input
              ref={preheatHoursRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={preheatHours}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setPreheatHours(v);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                const numbersOnly = pastedText.replace(/[^0-9]/g, "");
                if (numbersOnly) {
                  setPreheatHours(numbersOnly);
                }
              }}
              placeholder={t(
                "createEvent.enterHoursMax",
                "Enter hours (max 720)",
              )}
              className={cn(
                "w-full rounded-xl border bg-white px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary focus:outline-none focus:ring-2 disabled:opacity-60",
                preheatHoursValidation.error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-(--color-orange-500)",
              )}
              disabled={!enablePreheat}
            />
            {enablePreheat && preheatHoursValidation.error && (
              <p className="tx-12 lh-18 text-red-500 mt-1">
                {preheatHoursValidation.error}
              </p>
            )}
          </div>

          {/* Preheat fee */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-1">
              {t("createEvent.preheatFee", "Preheat fee:")}
            </p>
            <p className="tx-12 lh-18 dark:text-white text-black">
              {preheatFeeDisplay}
            </p>
          </div>

          {/* Terms checkbox */}
          <div
            className={cn(
              "pt-2 border-t rounded-lg p-2 -mx-2",
              agreeError ? "border-2 border-red-500" : "border-border",
            )}
          >
            <label className="flex items-start gap-2 tx-12 lh-18 text-secondary">
              <input
                ref={agreeRef}
                type="checkbox"
                className="mt-0.5 accent-(--color-orange-500) cursor-pointer"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  if (agreeError) setAgreeError(null);
                }}
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
            {agreeError && (
              <p className="tx-12 lh-18 text-red-500 mt-1 ml-6">{agreeError}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              appearance="outline"
              tone="primary"
              text="sm"
              className="sm:w-[160px]"
              onClick={handleClear}
            >
              {t("createEvent.clear", "Clear")}
            </Button>
            <Button
              type="submit"
              appearance="solid"
              tone="primary"
              text="sm"
              className={cn(
                "sm:w-[160px]",
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
