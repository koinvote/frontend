import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";

import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { useBackIfInternal } from "@/hooks/useBack";
import { cn } from "@/utils/style";

import {
  getAddressInfo,
  Network,
  validate,
  type AddressInfo,
} from "bitcoin-address-validation";

import type { AddressValidationStatus } from "./types/index";

import { useTranslation } from "react-i18next";

import {
  CREATE_EVENT_DRAFT_KEY,
  DEFAULT_VALUES,
  type CreateEventDraft,
  type CreateEventFormValues,
  type PreviewEventState,
} from "./formTypes";

import { CreatorAddressField } from "./components/CreatorAddressField";
import { DescriptionField } from "./components/DescriptionField";
import { DurationField } from "./components/DurationField";
import { HashtagField } from "./components/HashtagField";
import { OptionsField } from "./components/OptionsField";
import { PreheatField } from "./components/PreheatField";
import { ResponseTypeField } from "./components/ResponseTypeField";
import { ResultVisibilityField } from "./components/ResultVisibilityField";
import { RewardBtcField } from "./components/RewardBtcField";
import { RewardTypeField } from "./components/RewardTypeField";
import { TitleField } from "./components/TitleField";

export default function CreateEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isFromCreateEventRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isProgrammaticRef = useRef(false);
  const goBack = useBackIfInternal("/");

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
  const methods = useForm<CreateEventFormValues>({
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    setFocus,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = methods;

  // Reactive watched values
  const creatorAddress = watch("creatorAddress");
  const durationHours = watch("durationHours");
  const isRewarded = watch("isRewarded");
  const enablePreheat = watch("enablePreheat");
  const eventType = watch("eventType");
  const title = watch("title");
  const agree = watch("agree");
  const resultVisibility = watch("resultVisibility");
  const rewardBtc = watch("rewardBtc");
  const creatorEmail = watch("creatorEmail");
  const unlockPriceBtc = watch("unlockPriceBtc");

  // Refs for current values used inside validate closures to avoid stale captures
  const addrStatusRef = useRef(addrStatus);
  addrStatusRef.current = addrStatus;
  const addrErrorRef = useRef(addrError);
  addrErrorRef.current = addrError;
  const hashtagListRef = useRef(hashtagList);
  hashtagListRef.current = hashtagList;

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

        if (
          lastField === "responseType" ||
          lastField === "rewardType" ||
          lastField === "resultVisibility"
        ) {
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

      // Trigger validation after React re-renders with the restored values so
      // that child-component refs (minRewardBtcRef, etc.) are up to date.
      requestAnimationFrame(() => {
        trigger();
      });

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
      (isRewarded && (!rewardBtc || !!errors.rewardBtc)) ||
      (eventType === "single_choice" && hasOptionsError) ||
      (enablePreheat && !!errors.preheatHours) ||
      (resultVisibility === "paid_only" &&
        (!creatorEmail || !!errors.creatorEmail)) ||
      (resultVisibility === "paid_only" &&
        (!unlockPriceBtc || !!errors.unlockPriceBtc)) ||
      !agree
    );
  }, [
    agree,
    isSubmitting,
    title,
    durationHours,
    errors.preheatHours,
    isRewarded,
    rewardBtc,
    errors.rewardBtc,
    optionValues,
    eventType,
    addrStatus,
    enablePreheat,
    validateOptions,
    resultVisibility,
    creatorEmail,
    errors.creatorEmail,
    unlockPriceBtc,
    errors.unlockPriceBtc,
  ]);

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
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={goBack} />
      </div>
      <div className="border-gray-450 bg-bg w-full max-w-3xl rounded-3xl border px-4 py-6 md:px-8 md:py-8">
        <h1 className="lh-24 fw-m mb-6 text-lg font-medium text-(--color-orange-500)">
          {t("createEvent.formTitle")}
        </h1>

        <FormProvider {...methods}>
          <form
            ref={formRef}
            className="space-y-6"
            onSubmit={onSubmit}
            autoComplete="off"
            onFocus={handleFormItemFocus}
          >
            <CreatorAddressField
              addrStatus={addrStatus}
              addrInfo={addrInfo}
              addrError={addrError}
              addrStatusRef={addrStatusRef}
              addrErrorRef={addrErrorRef}
            />
            <TitleField />
            <DescriptionField />
            <HashtagField
              hashtagList={hashtagList}
              hashtagInput={hashtagInput}
              setHashtagList={setHashtagList}
              setHashtagInput={setHashtagInput}
              setLastField={setLastField}
            />
            <DurationField />

            <ResponseTypeField />
            <OptionsField
              optionsError={optionsError}
              setOptionsError={setOptionsError}
              setOptionsTouched={setOptionsTouched}
              validateOptions={validateOptions}
            />
            <RewardTypeField />
            <RewardBtcField setLastField={setLastField} />
            <ResultVisibilityField />
            <PreheatField />

            {/* Terms checkbox */}
            <div
              className={cn(
                "-mx-2 rounded-lg p-2 pt-2",
                errors.agree ? "border-2 border-red-500" : "border-border",
              )}
            >
              <label className="tx-12 lh-18 text-secondary flex items-start gap-2">
                <input
                  {...methods.register("agree", {
                    validate: (v) =>
                      v ||
                      t(
                        "createEvent.alertAgreeRequired",
                        "Please agree to the Terms of Service to continue.",
                      ),
                  })}
                  type="checkbox"
                  className="checkbox-form-bg mt-0.5"
                />
                <span>
                  {t("common.agreeToThe", "I agree to the")}{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-(--color-orange-500) underline"
                  >
                    {t("common.termsOfService", "Terms of Service")}
                  </Link>
                  ,{" "}
                  <Link
                    to="/terms-reward-distribution"
                    target="_blank"
                    className="text-(--color-orange-500) underline"
                  >
                    {t("common.rewardDistribution", "Reward Distribution")}
                  </Link>
                  ,{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-(--color-orange-500) underline"
                  >
                    {t("common.privacyPolicy", "Privacy Policy")}
                  </Link>{" "}
                  {t("common.and", "and")}{" "}
                  <Link
                    to="/charges-refunds"
                    target="_blank"
                    className="text-(--color-orange-500) underline"
                  >
                    {t("common.chargesRefunds", "Charges & Refunds")}
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
        </FormProvider>
      </div>
    </div>
  );
}
