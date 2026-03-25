import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import type { EventDetailDataRes, EventOption } from "@/api/response";
import { EventStatus } from "@/api/types";
import InfoIcon from "@/assets/icons/info.svg?react";
import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { PageLoading } from "@/components/PageLoading";
import { useBackOrFallback } from "@/hooks/useBack";
import { cn } from "@/utils/style";

import { DescriptionField } from "../create-event/components/DescriptionField";
import { HashtagField } from "../create-event/components/HashtagField";
import { OptionsField } from "../create-event/components/OptionsField";
import { ResponseTypeField } from "../create-event/components/ResponseTypeField";
import { TitleField } from "../create-event/components/TitleField";
import {
  DEFAULT_VALUES,
  type CreateEventFormValues,
} from "../create-event/formTypes";
import type { EditEventState } from "./types";

export default function EditEvent() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnedState = location.state as EditEventState | null;
  const goBack = useBackOrFallback(`/event/${eventId}`);

  const {
    data: eventDetail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = (await API.getEventDetail(
        eventId,
      )()) as unknown as ApiResponse<EventDetailDataRes>;
      if (!response.success)
        throw new Error(response.message || "Failed to fetch event");
      return response.data;
    },
    enabled: !!eventId,
  });

  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagList, setHashtagList] = useState<string[]>([]);
  const [lastField, setLastField] = useState<string>("");
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsTouched, setOptionsTouched] = useState(false);

  const methods = useForm<CreateEventFormValues>({
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const eventType = watch("eventType");
  const title = watch("title");
  const optionValues = watch("options");
  const agreeValue = watch("agree");

  // Build original form values from fetched event data
  const originalValues = useMemo((): Partial<CreateEventFormValues> | null => {
    if (!eventDetail) return null;
    return {
      title: eventDetail.title,
      description: eventDetail.description ?? "",
      eventType: eventDetail.event_type,
      options: eventDetail.options?.length
        ? eventDetail.options.map((o) => ({
            value: typeof o === "string" ? o : (o as EventOption).option_text,
          }))
        : [{ value: "" }],
      resultVisibility: eventDetail.result_visibility ?? "public",
      isRewarded: eventDetail.event_reward_type === "rewarded",
    };
  }, [eventDetail]);

  // Populate form once event data is available
  const initialized = useRef(false);
  useEffect(() => {
    if (!originalValues || initialized.current) return;
    initialized.current = true;

    if (returnedState) {
      // Returning from preview — restore the edited values
      const formOptions = returnedState.options?.length
        ? returnedState.options.map((v) => ({ value: v }))
        : [{ value: "" }];
      reset({
        ...DEFAULT_VALUES,
        ...originalValues,
        title: returnedState.title,
        description: returnedState.description,
        eventType: returnedState.eventType,
        options: formOptions,
        agree: true,
      });
      setHashtagList(
        returnedState.hashtag
          ? returnedState.hashtag.split(",").filter(Boolean)
          : [],
      );
    } else {
      reset({ ...DEFAULT_VALUES, ...originalValues });
      setHashtagList(eventDetail?.hashtags ?? []);
    }
  }, [originalValues, reset, eventDetail?.hashtags, returnedState]);

  // Redirect away if event is not in PREHEAT status
  useEffect(() => {
    if (eventDetail && eventDetail.status !== EventStatus.PREHEAT) {
      navigate(`/event/${eventId}`, { replace: true });
    }
  }, [eventDetail, eventId, navigate]);

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

  useEffect(() => {
    if (optionsTouched) {
      setOptionsError(validateOptions(optionValues));
    }
  }, [optionValues, optionsTouched, validateOptions]);

  const isPreviewDisabled = useMemo(() => {
    return (
      isSubmitting ||
      !title.trim() ||
      !agreeValue ||
      (eventType === "single_choice" && !!validateOptions(optionValues))
    );
  }, [
    isSubmitting,
    title,
    agreeValue,
    eventType,
    optionValues,
    validateOptions,
  ]);

  const handleClear = () => {
    if (!originalValues) return;
    reset({ ...DEFAULT_VALUES, ...originalValues });
    setHashtagList(eventDetail?.hashtags ?? []);
    setHashtagInput("");
    setOptionsError(null);
    setOptionsTouched(false);
  };

  const onSubmit = handleSubmit((data) => {
    if (data.eventType === "single_choice") {
      const err = validateOptions(data.options);
      if (err) {
        setOptionsError(err);
        setOptionsTouched(true);
        return;
      }
    }

    const cleanedOptions =
      data.eventType === "single_choice"
        ? data.options.map((o) => o.value.trim()).filter(Boolean)
        : undefined;

    const state: EditEventState = {
      eventId: eventId!,
      creatorAddress: eventDetail.creator_address,
      title: data.title.trim(),
      description: data.description.trim(),
      hashtag: hashtagList.join(","),
      eventType: data.eventType,
      options: cleanedOptions,
    };

    navigate(`/event/${eventId}/edit-preview`, { state });
  });

  if (isLoading) return <PageLoading />;

  if (error || !eventDetail) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-secondary text-sm">
          {error instanceof Error ? error.message : "Failed to load event"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 md:px-0">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={goBack} />
      </div>
      <FormProvider {...methods}>
        <form className="space-y-6" onSubmit={onSubmit} autoComplete="off">
          <div className="border-border bg-bg w-full max-w-3xl rounded-3xl border px-4 py-6 md:px-8 md:py-8">
            <h1 className="text-accent mb-6 text-lg font-medium">
              {t("editEvent.formTitle", "Edit Event")}
            </h1>

            {/* Creator address warning */}
            <div className="border-border mb-6 rounded-2xl border p-3">
              <div className="lh-20 flex items-start gap-2">
                <InfoIcon className="text-accent h-5 w-7" />
                <p className="text-primary text-sm">
                  {t(
                    "editEvent.creatorAddressWarning",
                    "Only the creator can edit this event. You will need to sign with this address to verify your changes. Please ensure you control it:",
                  )}
                  <br />
                  <span className="text-accent mt-2 text-sm break-all">
                    {eventDetail.creator_address}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <TitleField />
              <DescriptionField />
              <HashtagField
                hashtagList={hashtagList}
                hashtagInput={hashtagInput}
                setHashtagList={setHashtagList}
                setHashtagInput={setHashtagInput}
                setLastField={setLastField}
              />
              <ResponseTypeField />
              <OptionsField
                optionsError={optionsError}
                setOptionsError={setOptionsError}
                setOptionsTouched={setOptionsTouched}
                validateOptions={validateOptions}
              />

              {/* Terms checkbox */}
              <div
                className={cn(
                  "-mx-2 rounded-lg p-2 pt-2",
                  errors.agree ? "border-2 border-red-500" : "border-border",
                )}
              >
                <label className="flex cursor-pointer items-start gap-2">
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
                  <span className="text-secondary lh-18 text-xs">
                    {t("common.agreeToThe", "I agree to the")}{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      {t("common.termsOfService", "Terms of Service")}
                    </Link>
                    {", "}
                    <Link
                      to="/terms-reward-distribution"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      {t("common.rewardDistribution", "Reward Distribution")}
                    </Link>
                    {", "}
                    <Link
                      to="/privacy"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      {t("common.privacyPolicy", "Privacy Policy")}
                    </Link>{" "}
                    {t("common.and", "and")}{" "}
                    <Link
                      to="/charges-refunds"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      {t("common.chargesRefunds", "Charges & Refunds")}
                    </Link>
                    {"."}
                  </span>
                </label>
                {errors.agree && (
                  <p className="lh-18 mt-1 ml-6 text-xs text-red-500">
                    {errors.agree.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
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
  );
}
