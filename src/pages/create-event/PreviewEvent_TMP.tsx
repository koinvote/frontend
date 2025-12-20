import { Link, useLocation, useNavigate } from "react-router";
import { useMemo, useState, type ReactNode } from "react";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { Button } from "@/components/base/Button";
import type { EventType } from "@/api/types";
import { API } from "@/api";
import type { CreateEventReq } from "@/api/request";
import { useToast } from "@/components/base/Toast/useToast";

const FREE_HOURS = 24; // 先用常數，之後從 Admin 設定帶進來

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

function formatDuration(hours: number): string {
  if (!hours || hours <= 0) return "--";
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "1 day" : `${days} days`;
  }
  return `${hours} hours`;
}

export default function PreviewEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PreviewEventState | undefined;
  const { showToast } = useToast();

  const [agree, setAgree] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Extract values with safe defaults for useMemo (must be before early return)
  const enablePreheat = state?.enablePreheat ?? false;
  const preheatHours = state?.preheatHours ?? 0;
  const isRewarded = state?.isRewarded ?? false;
  const durationHours = state?.durationHours ?? 0;

  // ----- FREE / PAID 判斷 -----
  const {
    isFree,
    primaryButtonLabel,
    headerSubTitle,
    platformFeeText,
    preheatFeeText,
    totalFeeText,
  } = useMemo(() => {
    const hasPreheat = enablePreheat && preheatHours > 0;
    const isDurationWithinFree = !isRewarded && durationHours <= FREE_HOURS;

    const free =
      !isRewarded && // 無獎金
      !hasPreheat && // 沒預熱
      isDurationWithinFree; // 時數在 FREE_HOURS 內

    const primaryLabel = free ? "Confirm & Sign" : "Confirm & Pay";
    const subTitle = free
      ? "Please review and confirm your event."
      : "Please complete your payment";

    // 平台費：現在先用 UI 區分，實際金額之後接後端
    // 只有無獎金事件才需要平台費
    const platformFee = !isRewarded ? (free ? "0" : "--") : undefined;
    // 預熱費：之後用 API 回傳，先留佔位
    const preheatFee = hasPreheat ? "--" : undefined;

    // 計算總費用
    // 1. 免費事件（無獎金 + 無預熱 + <=24小時）：0
    // 2. 有獎事件：0（因為平台費只對無獎金事件收取）
    // 3. 無獎金事件但不是免費的：平台費 + 預熱費（如果有）
    let totalFee: string;
    if (free) {
      totalFee = "0";
    } else if (isRewarded) {
      // 有獎事件，總費用為 0
      totalFee = "0";
    } else {
      // 無獎金事件但不是免費的
      // 如果平台費和預熱費都是 "--"，總費用也顯示 "--"
      // 如果其中一個是 "--"，總費用顯示 "--"
      // 如果都是數字，需要相加（但目前都是 "--"，所以先顯示 "--"）
      totalFee = "--";
    }

    return {
      isFree: free,
      primaryButtonLabel: primaryLabel,
      headerSubTitle: subTitle,
      platformFeeText: platformFee,
      preheatFeeText: preheatFee,
      totalFeeText: totalFee,
    };
  }, [enablePreheat, preheatHours, isRewarded, durationHours]);

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
            No event data to preview. Please create an event first.
          </p>
          <div className="mt-4">
            <Button
              appearance="solid"
              tone="primary"
              text="sm"
              onClick={() => navigate("/create-event")}
            >
              Back to Create Event
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    creatorAddress,
    title,
    description,
    hashtag,
    eventType,
    rewardBtc,
    maxRecipient,
    options = [],
  } = state;

  const handlePrimaryClick = async () => {
    if (!agree) return;

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
  };

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
          Preview Your Event
        </h1>
        <p className="mt-1 tx-14 lh-20 text-secondary">{headerSubTitle}</p>

        <div className="mt-6 space-y-4">
          {/* Creator address */}
          <Field label="Creator address">{creatorAddress || "--"}</Field>
          {/* Title */}
          <Field label="Title">{title || "--"}</Field>

          {/* Description */}
          <Field label="Description">{description || "--"}</Field>

          {/* Response type */}
          <Field label="Response type">
            {eventType === "open" ? "Open-ended" : "Single choice"}
          </Field>

          {/* Hashtag */}
          <Field label="Hashtag">
            {hashtag
              ? hashtag
                  .split(/[,\s]+/)
                  .filter(Boolean)
                  .map((tag) => `#${tag.trim()}`)
                  .join(" ")
              : "--"}
          </Field>

          {/* Event type / Reward type */}
          <Field label="Event type">
            {isRewarded ? "Reward event" : "No reward"}
          </Field>

          {/* Reward BTC & Max Recipient（有獎金時才顯示） */}
          {isRewarded && (
            <>
              <Field label="Reward (BTC)">
                {rewardBtc ? `${rewardBtc} BTC` : "--"}
              </Field>
              <Field label="Max Recipient">
                {typeof maxRecipient === "number" ? maxRecipient : "--"}
              </Field>
            </>
          )}

          {/* Single choice options */}
          {eventType === "single_choice" && options.length > 0 && (
            <Field label="Options">
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
          <Field label="Duration of this event">
            {formatDuration(durationHours)}
          </Field>

          {/* Platform fee（只有無獎金事件顯示） */}
          {!isRewarded && <Field label="Platform fee">{platformFeeText}</Field>}

          {/* Preheat + Preheat fee（有開啟 Preheat 才顯示） */}
          {enablePreheat && preheatHours > 0 && (
            <>
              <Field label="Preheat">{`${preheatHours} hours`}</Field>
              <Field label="Preheat fee">{preheatFeeText ?? "--"}</Field>
            </>
          )}
          {/* Your Total */}
          <Field label="Your Total">{totalFeeText}</Field>
        </div>

        {/* 同意條款 */}
        <div className="mt-6 pt-4 border-t border-border">
          <label className="flex items-start gap-2 tx-12 lh-18 text-secondary">
            <input
              type="checkbox"
              className="mt-[2px] accent-(--color-orange-500)"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              By proceeding, you agree to the{" "}
              <Link
                to="/charges-refunds"
                className="text-(--color-orange-500) underline"
              >
                Charges and Refund
              </Link>
              ,{" "}
              <Link to="/terms" className="text-(--color-orange-500) underline">
                Terms of Service
              </Link>
              , and{" "}
              <Link
                to="/privacy"
                className="text-(--color-orange-500) underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        {/* 按鈕區塊 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            appearance="outline"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={() => navigate("/create-event")}
          >
            Edit Event
          </Button>
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            disabled={!agree || isCreatingEvent}
            onClick={handlePrimaryClick}
          >
            {isCreatingEvent ? "Creating..." : primaryButtonLabel}
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
      <div className="tx-14 lh-20 text-primary break-words">{children}</div>
    </div>
  );
}
