import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";

import { API } from "@/api";
import type { CreateEventReq } from "@/api/request";
import type { EventType } from "@/api/types";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { Button } from "@/components/base/Button";
import { useToast } from "@/components/base/Toast/useToast";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { satsToBtc } from "@/utils/formatter";

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
  refundAddress?: string;
  options?: string[];
  enablePreheat: boolean;
  preheatHours?: number;
};

function formatDuration(
  hours: number,
  t: (
    key: string,
    defaultValue: string,
    options?: Record<string, unknown>,
  ) => string,
): string {
  if (!hours || hours <= 0) return "--";
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1
      ? t("common.oneDay", "1 day")
      : t("common.days", "{{days}} days", { days });
  }
  return t("common.hours", "{{hours}} hours", { hours });
}

export default function PreviewEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();

  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Get system parameters
  const params = useSystemParametersStore((s) => s.params);

  // Extract values with safe defaults for useMemo (must be before early return)
  const enablePreheat = state?.enablePreheat ?? false;
  const preheatHours = state?.preheatHours ?? 0;
  const isRewarded = state?.isRewarded ?? false;
  const durationHours = state?.durationHours ?? 0;

  // Calculate max recipients for rewarded events
  // Formula: [用户输入的奖金金额] / [satoshi_per_extra_winner], 无条件舍去取整数
  const maxRecipients = useMemo(() => {
    if (!isRewarded || !state?.rewardBtc) return null;

    const rewardAmountSatoshi = Math.round(
      parseFloat(state.rewardBtc) * 100_000_000,
    );
    if (!Number.isFinite(rewardAmountSatoshi) || rewardAmountSatoshi <= 0) {
      return null;
    }

    const satoshiPerExtraWinner = params?.satoshi_per_extra_winner ?? 0;
    if (!satoshiPerExtraWinner || satoshiPerExtraWinner <= 0) {
      return null;
    }

    // 无条件舍去取整数
    return Math.floor(rewardAmountSatoshi / satoshiPerExtraWinner);
  }, [isRewarded, state?.rewardBtc, params?.satoshi_per_extra_winner]);

  // Calculate platform fee for non-reward events
  // Formula: [Duration - free_hours] × satoshi_per_duration_hour × platform_fee_percentage
  const platformFeeSatoshi = useMemo(() => {
    // Only calculate for non-reward events
    if (isRewarded) return null;

    // Check if system parameters are loaded
    if (!params) return null;

    const freeHours = params.free_hours ?? 0;
    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    // If duration is invalid or not provided, return null
    if (!Number.isFinite(durationHours) || durationHours <= 0) return null;

    // If free_hours is 0, it means no free hours, calculate for full duration
    // If duration <= free_hours, platform fee is 0
    const billableHours =
      freeHours > 0 ? Math.max(0, durationHours - freeHours) : durationHours;

    // If no billable hours, platform fee is 0
    if (billableHours <= 0) return 0;

    // Calculate: billableHours × satoshi_per_duration_hour × platform_fee_percentage
    const fee =
      billableHours * satoshiPerDurationHour * (platformFeePercentage / 100);

    // Round to nearest satoshi
    return Math.round(fee);
  }, [isRewarded, params, durationHours]);

  // Calculate preheat fee
  // Formula: preheatHours × satoshi_per_duration_hour × platform_fee_percentage × (0.2 + 0.8 × preheatHours / 720)
  const preheatFeeSatoshi = useMemo(() => {
    // Only calculate if preheat is enabled
    if (!enablePreheat || !preheatHours || preheatHours <= 0) return null;

    // Check if system parameters are loaded
    if (!params) return null;

    const satoshiPerDurationHour = params.satoshi_per_duration_hour ?? 0;
    const platformFeePercentage = params.platform_fee_percentage ?? 0;

    // Validate preheat hours (must be between 1 and 720)
    if (preheatHours < 1 || preheatHours > 720) {
      return null;
    }

    // Calculate: preheatHours × satoshi_per_duration_hour × platform_fee_percentage × (0.2 + 0.8 × preheatHours / 720)
    const multiplier = 0.2 + 0.8 * (preheatHours / 720);
    const fee =
      preheatHours *
      satoshiPerDurationHour *
      (platformFeePercentage / 100) *
      multiplier;

    // Round to nearest satoshi
    return Math.round(fee);
  }, [enablePreheat, params, preheatHours]);

  // Format fees for display
  const platformFeeDisplay = useMemo(() => {
    return satsToBtc(platformFeeSatoshi);
  }, [platformFeeSatoshi]);

  const preheatFeeDisplay = useMemo(() => {
    return satsToBtc(preheatFeeSatoshi);
  }, [preheatFeeSatoshi]);

  // Calculate reward amount in satoshi (for rewarded events)
  const rewardAmountSatoshi = useMemo(() => {
    if (!isRewarded || !state?.rewardBtc) return 0;
    return Math.round(parseFloat(state.rewardBtc) * 100_000_000);
  }, [isRewarded, state?.rewardBtc]);

  // Calculate total amount
  // For rewarded events: total = reward amount + preheat fee (if enabled)
  // For non-rewarded events: total = platform fee + preheat fee (if enabled)
  const totalAmountSatoshi = useMemo(() => {
    const preheat = preheatFeeSatoshi ?? 0;

    if (isRewarded) {
      // For rewarded events, total = reward amount + preheat fee
      return rewardAmountSatoshi + preheat;
    }

    // For non-rewarded events, calculate platform fee + preheat fee
    // If both are null, return null
    if (platformFeeSatoshi === null && preheatFeeSatoshi === null) {
      return null;
    }

    // Sum up the fees (treat null as 0)
    const platform = platformFeeSatoshi ?? 0;
    return platform + preheat;
  }, [isRewarded, rewardAmountSatoshi, platformFeeSatoshi, preheatFeeSatoshi]);

  const totalFeeDisplay = useMemo(() => {
    return satsToBtc(totalAmountSatoshi);
  }, [totalAmountSatoshi]);

  const showLowTotalWarning = useMemo(() => {
    if (
      totalAmountSatoshi === null ||
      totalAmountSatoshi === undefined ||
      totalAmountSatoshi <= 0
    ) {
      return false;
    }
    return totalAmountSatoshi <= 1_000; // 0.00001 BTC in sats
  }, [totalAmountSatoshi]);

  // ----- FREE / PAID 判斷 -----
  const { isFree, primaryButtonLabel, headerSubTitle } = useMemo(() => {
    const hasPreheat = enablePreheat && preheatHours > 0;
    const freeHours = params?.free_hours ?? 24; // Use system parameter or default to 24
    const isDurationWithinFree = !isRewarded && durationHours <= freeHours;

    const free =
      !isRewarded && // 無獎金
      !hasPreheat && // 沒預熱
      isDurationWithinFree; // 時數在免費時數內

    const primaryLabel = free
      ? t("preview.confirmSign", "Confirm & Sign")
      : t("preview.confirmPay", "Confirm & Pay");
    const subTitle = t(
      "preview.reviewConfirm",
      "Please review and confirm your event details.",
    );

    return {
      isFree: free,
      primaryButtonLabel: primaryLabel,
      headerSubTitle: subTitle,
    };
  }, [enablePreheat, preheatHours, isRewarded, durationHours, params, t]);

  const {
    creatorAddress,
    title,
    description,
    hashtag,
    eventType,
    rewardBtc,
    options = [],
  } = state || {};

  const handlePrimaryClick = useCallback(async () => {
    if (!state) return;
    if (isFree) {
      // FREE flow → 先創建 event，然後導航到簽名流程
      try {
        setIsCreatingEvent(true);

        // Prepare CreateEventReq payload
        const hashtags = state.hashtag
          ? state.hashtag
              .split(/[,\s]+/)
              .filter(Boolean)
              .map((tag) => tag.trim().replace(/^#+/, ""))
          : [];

        const payload: CreateEventReq = {
          title: state.title,
          description: state.description,
          event_type: state.eventType,
          event_reward_type: state.isRewarded ? "rewarded" : "non_reward",
          initial_reward_satoshi:
            state.isRewarded && state.rewardBtc
              ? Math.round(parseFloat(state.rewardBtc) * 100000000)
              : 0,
          duration_hours: state.durationHours,
          creator_address: state.creatorAddress,
          options: state.options,
          preheat_hours:
            state.enablePreheat && state.preheatHours
              ? state.preheatHours
              : undefined,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
        };

        // Create event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createRes = (await API.createEvent(payload)) as any;
        const createEnvelope =
          createRes?.success !== undefined ? createRes : createRes?.data;

        if (!createEnvelope?.success || !createEnvelope?.data) {
          throw new Error(createEnvelope?.message || "Failed to create event");
        }

        const eventId = createEnvelope.data.event_id;
        // Navigate to confirm-sign with eventId in URL
        navigate(`/confirm-sign/${eventId}`, { state });
      } catch (error) {
        console.error("Error creating event:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorAny = error as any;
        const errorMessage =
          errorAny?.apiMessage ||
          (error instanceof Error
            ? error.message
            : "Failed to create event. Please try again.");
        showToast("error", errorMessage);
      } finally {
        setIsCreatingEvent(false);
      }
    } else {
      // PAID flow → 先創建 event，然後導航到付款頁
      try {
        setIsCreatingEvent(true);

        // Prepare CreateEventReq payload
        const hashtags = state.hashtag
          ? state.hashtag
              .split(/[,\s]+/)
              .filter(Boolean)
              .map((tag) => tag.trim().replace(/^#+/, ""))
          : [];

        const payload: CreateEventReq = {
          title: state.title,
          description: state.description,
          event_type: state.eventType,
          event_reward_type: state.isRewarded ? "rewarded" : "non_reward",
          initial_reward_satoshi:
            state.isRewarded && state.rewardBtc
              ? Math.round(parseFloat(state.rewardBtc) * 100000000)
              : 0,
          duration_hours: state.durationHours,
          creator_address: state.creatorAddress,
          options: state.options,
          preheat_hours:
            state.enablePreheat && state.preheatHours
              ? state.preheatHours
              : undefined,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
        };

        // Create event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createRes = (await API.createEvent(payload)) as any;
        const createEnvelope =
          createRes?.success !== undefined ? createRes : createRes?.data;

        if (!createEnvelope?.success || !createEnvelope?.data) {
          throw new Error(createEnvelope?.message || "Failed to create event");
        }

        const eventId = createEnvelope.data.event_id;
        // Navigate to confirm-pay with eventId in URL
        navigate(`/confirm-pay/${eventId}/payment`, { state });
      } catch (error) {
        console.error("Error creating event:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorAny = error as any;
        const errorMessage =
          errorAny?.apiMessage ||
          (error instanceof Error
            ? error.message
            : "Failed to create event. Please try again.");
        showToast("error", errorMessage);
      } finally {
        setIsCreatingEvent(false);
      }
    }
  }, [isFree, state, navigate, showToast]);

  // Handle Enter key press for free events
  useEffect(() => {
    if (!isFree || !state) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Enter key is pressed and no input/textarea is focused
      if (
        event.key === "Enter" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !isCreatingEvent
      ) {
        event.preventDefault();
        handlePrimaryClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFree, isCreatingEvent, handlePrimaryClick, state]);

  // 如果 user 直接打網址進來，沒有 state，就導回 create-event
  if (!state) {
    return (
      <div className="flex-col flex items-center justify-center w-full">
        <div className="h-[50px] w-full relative">
          <button
            type="button"
            className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
            onClick={() => navigate(-1)}
          >
            <CircleLeftIcon className="w-8 h-8 fill-current" />
          </button>
        </div>
        <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
          <p className="tx-14 lh-20 text-primary">
            {t(
              "preview.noEventData",
              "No event data to preview. Please create an event first.",
            )}
          </p>
          <div className="mt-4">
            <Button
              appearance="solid"
              tone="primary"
              text="sm"
              onClick={() => navigate("/create-event")}
            >
              {t("preview.backToCreate", "Back to Create Event")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col flex items-center justify-center w-full">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>

      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500)">
          {t("preview.title", "Preview Your Event")}
        </h1>
        <p className="mt-1 tx-14 lh-20 text-secondary">{headerSubTitle}</p>

        <div className="mt-6 space-y-4">
          {/* Creator address */}
          <Field label={t("preview.creatorAddress", "Creator address")}>
            {creatorAddress || "--"}
          </Field>
          {/* Title */}
          <Field label={t("preview.titleLabel", "Title")}>
            {title || "--"}
          </Field>

          {/* Description */}
          <Field label={t("preview.description", "Description")}>
            {description || "--"}
          </Field>

          {/* Response type */}
          <Field label={t("preview.responseType", "Response type")}>
            {eventType === "open"
              ? t("preview.openEnded", "Open-ended")
              : t("preview.singleChoice", "Single choice")}
          </Field>

          {/* Hashtag */}
          <Field label={t("preview.hashtag", "Hashtag")}>
            {hashtag
              ? hashtag
                  .split(/[,\s]+/)
                  .filter(Boolean)
                  .map((tag) => `#${tag.trim()}`)
                  .join(" ")
              : "--"}
          </Field>

          {/* Event type / Reward type */}
          <Field label={t("preview.rewardType", "Reward type")}>
            {isRewarded
              ? t("preview.rewardEvent", "Reward event")
              : t("preview.noReward", "No reward")}
          </Field>

          {/* Reward BTC & Max Recipient（有獎金時才顯示） */}
          {isRewarded && (
            <>
              <Field label={t("preview.rewardBtc", "Reward (BTC)")}>
                {rewardBtc ? `${rewardBtc} BTC` : "--"}
              </Field>
              <Field label={t("preview.maxRecipient", "Max Recipient")}>
                {maxRecipients !== null && maxRecipients > 0
                  ? maxRecipients === 1
                    ? t("preview.oneAddress", "1 Address")
                    : t("preview.multipleAddresses", "{{count}} Addresses", {
                        count: maxRecipients,
                      })
                  : "--"}
              </Field>
            </>
          )}

          {/* Single choice options */}
          {eventType === "single_choice" && options.length > 0 && (
            <Field label={t("preview.options", "Options")}>
              <ol className="list-decimal pl-5 space-y-1">
                {options.map((opt, idx) => (
                  <li key={idx} className="tx-14 lh-20 text-primary">
                    {opt || "--"}
                  </li>
                ))}
              </ol>
            </Field>
          )}

          {/* Duration */}
          <Field label={t("preview.duration", "Duration of this event")}>
            {formatDuration(durationHours, t)}
          </Field>

          {/* Platform fee（只有無獎金事件顯示） */}
          {!isRewarded && (
            <Field label={t("preview.platformFee", "Platform fee")}>
              {platformFeeDisplay}
            </Field>
          )}

          {/* Preheat + Preheat fee（有開啟 Preheat 才顯示） */}
          {enablePreheat && preheatHours > 0 && (
            <>
              <Field label={t("preview.preheat", "Preheat")}>
                {t("common.hours", "{{hours}} hours", { hours: preheatHours })}
              </Field>
              <Field label={t("preview.preheatFee", "Preheat fee")}>
                {preheatFeeDisplay}
              </Field>
            </>
          )}
          {/* Your Total */}
          <Field label={t("preview.yourTotal", "Your Total")}>
            <div className="flex flex-col gap-1">
              <span>{totalFeeDisplay}</span>
              {showLowTotalWarning && (
                <span className="text-xs md:text-sm text-red-700 mt-1">
                  {t(
                    "preview.lowAmountWarning",
                    "Under 0.00002 BTC, your wallet may not be able to send this transaction.",
                  )}
                </span>
              )}
            </div>
          </Field>
        </div>

        {/* Terms */}
        <div className="pt-2 border-t border-border mt-2">
          <p className="tx-12 lh-18 text-secondary">
            {t("preview.byProceeding", "By proceeding, you agree to the")}{" "}
            <Link to="/terms" className="text-(--color-orange-500) underline">
              {t("preview.termsOfService", "Terms of Service")}
            </Link>
            ,{" "}
            <Link
              to="/terms-reward-distribution"
              className="text-(--color-orange-500) underline"
            >
              {t("preview.rewardDistribution", "Reward Distribution")}
            </Link>
            ,{" "}
            <Link to="/privacy" className="text-(--color-orange-500) underline">
              {t("preview.privacyPolicy", "Privacy Policy")}
            </Link>{" "}
            {t("preview.and", "and")}{" "}
            <Link
              to="/charges-refunds"
              className="text-(--color-orange-500) underline"
            >
              {t("preview.chargesRefunds", "Charges & Refunds")}
            </Link>
            .
          </p>
        </div>

        {/* 按鈕區塊 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            appearance="outline"
            tone="primary"
            text="sm"
            className="sm:w-40"
            onClick={() => navigate("/create-event")}
          >
            {t("preview.editEvent", "Edit Event")}
          </Button>
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-40"
            disabled={isCreatingEvent}
            onClick={handlePrimaryClick}
          >
            {isCreatingEvent
              ? t("preview.creating", "Creating...")
              : primaryButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="tx-12 lh-18 text-secondary">{label}</div>
      <div className="tx-14 lh-20 text-primary whitespace-pre-line break-words">{children}</div>
    </div>
  );
}
