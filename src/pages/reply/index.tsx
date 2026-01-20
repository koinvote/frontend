import { useQuery } from "@tanstack/react-query";
import { Network, validate } from "bitcoin-address-validation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import type { EventDetailDataRes } from "@/api/response";
import { EventStatus } from "@/api/types";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import ClockIcon from "@/assets/icons/clock.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import EventCardParticipantsIcon from "@/assets/icons/eventCard-participants.svg?react";
import HashIcon from "@/assets/icons/hash.svg?react";
import TrophyIcon from "@/assets/icons/trophy.svg?react";
import { Button } from "@/components/base/Button";
import { EventInfoBox } from "@/components/base/EventInfoBox";
import { Loading } from "@/components/base/Loading";
import { useToast } from "@/components/base/Toast/useToast";
import {
  formatCompletedTime,
  formatOngoingCountdown,
  satsToBtc,
} from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { cn } from "@/utils/style";

// Helper for checklist items
const ChecklistItem = ({
  label,
  isValid,
  isError,
}: {
  label: string;
  isValid: boolean;
  isError?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        isValid ? "bg-green-500" : isError ? "bg-red-500" : "bg-white/20"
      )}
    />
    <span
      className={cn(
        "text-sm",
        isValid ? "text-green-500" : isError ? "text-red-500" : "text-secondary"
      )}
    >
      {label}
    </span>
  </div>
);

export default function ReplyPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- States ---
  const [btcAddress, setBtcAddress] = useState("");
  const [replyContent, setReplyContent] = useState(""); // For open-ended
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null); // For single-choice
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [nonceTimestamp, setNonceTimestamp] = useState<string>("");
  const [randomCode, setRandomCode] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPlaintext, setIsGeneratingPlaintext] = useState(false);

  // --- Validation States ---
  const isAddressValid = useMemo(() => {
    if (!btcAddress) return false;
    const network =
      import.meta.env.MODE === "development"
        ? Network.mainnet // Or testnet depending on env setup
        : Network.mainnet;
    // Simple validation for now, or match CreateEvent logic
    return validate(btcAddress, network);
  }, [btcAddress]);

  // Countdown timer
  useEffect(() => {
    if (!expiredAt) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiredAt - now;

      if (remaining <= 0) {
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // --- Data Fetching ---
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = (await API.getEventDetail(
        eventId
      )()) as unknown as ApiResponse<EventDetailDataRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch event detail");
      }
      return response.data;
    },
    enabled: !!eventId,
  });

  // --- Derived States ---
  const isContentFilled = useMemo(() => {
    if (!event) return false;
    if (event.event_type === "open") {
      return replyContent.trim().length > 0;
    } else {
      return selectedOptionId !== null;
    }
  }, [event, replyContent, selectedOptionId]);

  const canGeneratePlaintext = isAddressValid && isContentFilled;
  const isPlaintextGenerated = !!plaintext;
  const isSignatureEntered = signature.trim().length > 0;

  const canSubmit =
    isAddressValid &&
    isContentFilled &&
    isPlaintextGenerated &&
    isSignatureEntered &&
    countdown > 0;

  // --- Handlers ---

  const handleGeneratePlaintext = async () => {
    if (!event || !eventId) return;
    setIsGeneratingPlaintext(true);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const [res] = await Promise.all([
        API.generateReplyPlaintext()({
          event_id: eventId,
          btc_address: btcAddress,
          content: event.event_type === "open" ? replyContent : undefined,
          option_id:
            event.event_type === "single_choice"
              ? selectedOptionId || undefined
              : undefined,
        }),
        minDelay,
      ]);

      if (res.success) {
        setPlaintext(res.data.plaintext);
        setNonceTimestamp(res.data.nonce_timestamp);
        setRandomCode(res.data.random_code);

        // Set expiration time (15 minutes from now)
        const now = Math.floor(Date.now() / 1000);
        setExpiredAt(now + 15 * 60);
        setCountdown(15 * 60);

        showToast("success", "Plaintext generated");
      } else {
        showToast("error", res.message || "Failed to generate plaintext");
      }
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      showToast(
        "error",
        err.response?.data?.message ||
          err.message ||
          "Failed to generate plaintext"
      );
    } finally {
      setIsGeneratingPlaintext(false);
    }
  };

  const handleCopyPlaintext = useDebouncedClick(async () => {
    if (!plaintext) return;

    try {
      await navigator.clipboard.writeText(plaintext);
      showToast("success", "Plaintext copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", "Failed to copy plaintext");
    }
  });

  const handleSubmit = async () => {
    if (!eventId || !canSubmit) return;

    if (countdown <= 0) {
      showToast("error", "Plaintext has expired. Please generate a new one.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.submitReply()({
        event_id: eventId,
        btc_address: btcAddress,
        content: event?.event_type === "open" ? replyContent : undefined,
        option_id:
          event?.event_type === "single_choice"
            ? selectedOptionId || undefined
            : undefined,
        plaintext: plaintext!,
        signature: signature,
        nonce_timestamp: nonceTimestamp,
        random_code: randomCode,
      });

      if (res.success) {
        showToast("success", "Reply submitted successfully");
        // Navigate back to event detail
        navigate(`/event/${eventId}`);
      } else {
        showToast("error", res.message || "Failed to submit reply");
      }
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      showToast(
        "error",
        err.response?.data?.message || err.message || "Failed to submit reply"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const rewardText =
    event?.event_reward_type === "rewarded"
      ? `${satsToBtc(event.initial_reward_satoshi, { suffix: false })}`
      : "None";

  // Event Countdown logic
  const [eventCountdown, setEventCountdown] = useState("");

  useEffect(() => {
    if (!event) return;

    if (event.status === EventStatus.COMPLETED) {
      setEventCountdown(
        formatCompletedTime(
          event.deadline_at,
          t("eventInfo.eventEndedOn", "Ended on")
        )
      );
      return;
    }

    const updateEventCountdown = () => {
      setEventCountdown(formatOngoingCountdown(event.deadline_at));
    };

    updateEventCountdown(); // Initial update
    const interval = setInterval(updateEventCountdown, 1000);

    return () => clearInterval(interval);
  }, [event, t]);

  if (isLoadingEvent) return <Loading />;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="flex-col flex items-center justify-center w-full px-2 md:px-0 pb-10">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>

      <div className="w-full max-w-3xl rounded-3xl border border-gray-450 bg-bg px-6 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-primary">Reply to Win BTC </h1>
        <p className="mt-1 tx-14 lh-20 text-secondary">
          Complete the steps below to submit your reply and enter the draw.
        </p>

        {/* 1. Event Information */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-accent text-lg">
              <TrophyIcon className="w-4 h-4" />
            </span>
            <h2 className="tx-16 lh-20 fw-m text-primary">Event information</h2>
          </div>

          <h3 className="tx-16 lh-24 fw-m text-primary mb-2">{event.title}</h3>
          <p className="tx-14 lh-20 text-secondary mb-4">{event.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <EventInfoBox
              label="Time Remaining"
              value={eventCountdown}
              icon={<ClockIcon className="w-3 h-3 text-[#2B7FFF]" />}
            />
            <EventInfoBox
              label="Event-ID"
              value={event.event_id}
              icon={<HashIcon className="w-3 h-3 text-[#00C950]" />}
            />
            <EventInfoBox
              label="Reward Amount"
              value={rewardText}
              icon={<TrophyIcon className="w-3 h-3 text-[#AD46FF]" />}
            />
            <EventInfoBox
              label="Max Recipients"
              value={event.max_recipient || "-"}
              icon={
                <EventCardParticipantsIcon className="w-3 h-3 text-[#AD46FF]" />
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="tx-14 text-secondary">Type :</span>
            <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-medium border border-border">
              {event.event_type === "open" ? "Open-ended" : "Single-choice"}
            </span>
          </div>
        </div>

        {/* 2. Enter BTC Address */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full 
            border border-border fw-m bg-primary-lightModeGray md:w-6 md:h-6"
            >
              <span className="text-black tx-12 md:tx-14">1</span>
            </div>
            <h2 className="tx-16 fw-m text-primary">Enter BTC Address</h2>
          </div>

          <div className="space-y-2">
            <label className="tx-14 fw-m text-primary">
              BTC Address <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={btcAddress}
              onChange={(e) => setBtcAddress(e.target.value)}
              placeholder="Please enter your BTC address"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-bg text-primary tx-14 outline-none focus:ring-2 transition-all",
                btcAddress && !isAddressValid
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-accent"
              )}
            />
            {btcAddress && !isAddressValid && (
              <p className="text-red-500 text-xs">Invalid BTC address</p>
            )}
          </div>
        </div>

        {/* 3. Enter/Select Reply */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border fw-m bg-primary-lightModeGray md:w-6 md:h-6">
              <span className="text-black tx-12 md:tx-14">2</span>
            </div>
            <h2 className="tx-16 fw-m text-primary">
              {event.event_type === "open"
                ? "Enter your reply"
                : "Select your reply"}
            </h2>
          </div>

          {event.event_type === "open" ? (
            <div className="space-y-2">
              <label className="tx-14 fw-m text-primary">
                Enter your reply message <span className="text-accent">*</span>
              </label>
              <textarea
                value={replyContent}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setReplyContent(e.target.value);
                  }
                }}
                placeholder="Enter your reply..."
                rows={4}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border bg-bg text-primary tx-14 outline-none focus:ring-2 transition-all resize-none",
                  "border-border focus:ring-accent"
                )}
              />
              <div className="flex justify-end">
                <span
                  className={cn(
                    "text-xs",
                    replyContent.length >= 500
                      ? "text-red-500"
                      : "text-secondary"
                  )}
                >
                  {replyContent.length}/500
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="tx-14 fw-m text-primary">
                Please select one option <span className="text-accent">*</span>
              </label>
              <div className="flex flex-col gap-3">
                {event.options?.map((option, index) => {
                  const optionText =
                    typeof option === "string" ? option : option.option_text;
                  const optionId =
                    typeof option === "string" ? index + 1 : option.id;

                  return (
                    <label
                      key={optionId}
                      className={cn(
                        "flex items-center p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5",
                        selectedOptionId === optionId
                          ? "border-accent bg-accent/5"
                          : "border-border bg-bg"
                      )}
                    >
                      <input
                        type="radio"
                        name="reply-option"
                        className="radio-orange mr-3"
                        checked={selectedOptionId === optionId}
                        onChange={() => setSelectedOptionId(optionId)}
                      />
                      <span
                        className="text-primary wrap-break-word whitespace-normal"
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Generate Plaintext */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full 
            border border-border fw-m bg-primary-lightModeGray md:w-6 md:h-6"
            >
              <span className="text-black tx-12 md:tx-14">3</span>
            </div>
            <h2 className="tx-16 fw-m text-primary">Generate the Plaintext</h2>
          </div>

          <Button
            appearance="solid"
            tone={canGeneratePlaintext ? "primary" : "white"} // Use white/grey when disabled-ish visually
            disabled={!canGeneratePlaintext || isGeneratingPlaintext}
            onClick={handleGeneratePlaintext}
            className="w-full"
          >
            {isGeneratingPlaintext ? "Generating..." : "Generate Plaintext"}
          </Button>

          {plaintext && (
            <div className="mt-4 space-y-2">
              <div className="relative">
                <div className="px-3 py-2 rounded-lg border border-border bg-bg">
                  <div className="flex items-center justify-between gap-2">
                    <p className="tx-12 lh-18 text-green-500 break-all font-mono flex-1">
                      {plaintext}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPlaintext}
                      className="flex-shrink-0 text-secondary hover:text-primary transition-colors cursor-pointer"
                      aria-label="Copy plaintext"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {countdown > 0 ? (
                <div className="flex items-center gap-2 text-green-500 text-xs">
                  <ClockIcon className="w-4 h-4" />
                  <span>Expired in {formatTimeRemaining(countdown)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    This plaintext has expired. Please generate a new one.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Enter Signature */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full 
            border border-border fw-m bg-primary-lightModeGray md:w-6 md:h-6"
            >
              <span className="text-black tx-12 md:tx-14">4</span>
            </div>
            <h2 className="tx-16 fw-m text-primary">Enter Signature</h2>
          </div>

          <div className="space-y-2">
            <label className="tx-14 fw-m text-primary">
              Signature <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Paste the signature generated by your BTC wallet for the plaintext here..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-primary tx-14 outline-none focus:ring-2 focus:ring-accent font-mono transition-all"
            />
          </div>
        </div>

        {/* 6. Submit Reply */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center 
            rounded-full border border-border fw-m bg-primary-lightModeGray md:w-6 md:h-6"
            >
              <span className="text-black tx-12 md:tx-14">5</span>
            </div>
            <h2 className="tx-16 fw-m text-primary">Submit Reply</h2>
          </div>

          <div className="bg-bg rounded-xl p-4 mb-6">
            <div className="text-sm font-medium text-primary mb-3">
              Pre-submit checklist :
            </div>
            <div className="space-y-2">
              <ChecklistItem
                label="BTC address format is valid"
                isValid={isAddressValid}
                isError={!!btcAddress && !isAddressValid}
              />
              <ChecklistItem
                label="Reply content is filled in"
                isValid={isContentFilled}
              />
              <ChecklistItem
                label="Plaintext has been generated"
                isValid={isPlaintextGenerated}
              />
              <ChecklistItem
                label="Signature has been entered"
                isValid={isSignatureEntered}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              appearance="outline"
              tone="white"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              appearance="solid"
              tone="primary"
              className="flex-1"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
