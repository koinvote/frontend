import { API, type ApiResponse } from "@/api";
import type { EventOption, GetListRepliesRes, Reply } from "@/api/response";
import { EventStatus, ReplySortBy, type EventType } from "@/api/types";
import CopyIcon from "@/assets/icons/copy.svg?react";
import InvalidateIcon from "@/assets/icons/invalidate.svg?react";
import ReplyValidateIcon from "@/assets/icons/replyValidate.svg?react";
import IconSha from "@/assets/icons/sha256.svg?react";
import UnlockIcon from "@/assets/icons/unlock.svg?react";
import { Button } from "@/components/base/Button";
import { useToast } from "@/components/base/Toast/useToast";
import { PageLoading } from "@/components/PageLoading";
import { satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { cn } from "@/utils/style";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
// import ReportIcon from "@/assets/icons/report.svg?react";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useHomeStore } from "@/stores/homeStore";
import { formatRelativeTime } from "@/utils/formatter";
import { Divider } from "./Divider";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface ReplyListProps {
  eventId: string;
  search?: string;
  sortBy?: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME;
  order?: "desc" | "asc";
  options?: EventOption[] | string[];
  eventType?: EventType;
  eventStatus?: number;
  balanceDisplayMode?: "snapshot" | "on_chain";
  unlockPriceSatoshi?: number;
  unlockCount?: number;
  participantsCount?: number;
  totalStakeSatoshi?: number;
  eventTitle?: string;
  resultVisibility?: "public" | "paid_only" | "creator_only";
  onLockedChange?: (locked: boolean) => void;
  onCreatorChange?: (isCreator: boolean, email: string) => void;
  initialUnlockEmail?: string;
}

function truncateAddress(
  address: string,
  startLength = 6,
  endLength = 4,
): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

function truncateText(text: string, maxLength = 20): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

export function ReplyList({
  eventId,
  search = "",
  sortBy = ReplySortBy.BALANCE,
  order = "desc",
  options = [],
  eventType,
  eventStatus,
  balanceDisplayMode,
  unlockPriceSatoshi,
  unlockCount,
  participantsCount,
  totalStakeSatoshi,
  eventTitle,
  resultVisibility,
  onLockedChange,
  onCreatorChange,
  initialUnlockEmail,
}: ReplyListProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [page] = useState(1); // TODO: 实现分页功能时使用 setPage
  const limit = 20;

  const [unlockEmail, setUnlockEmail] = useState(initialUnlockEmail ?? "");
  const [submittedEmail, setSubmittedEmail] = useState(
    initialUnlockEmail ?? "",
  );
  const [emailTouched, setEmailTouched] = useState(false);
  const unlockInputRef = useRef<HTMLInputElement>(null);
  // True when submittedEmail was auto-applied from payment return — skip redirect in that case
  const isPaymentReturnRef = useRef(!!initialUnlockEmail);

  const {
    data: repliesData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [
      "replies",
      eventId,
      page,
      limit,
      search,
      sortBy,
      order,
      balanceDisplayMode,
      submittedEmail,
    ],
    queryFn: async () => {
      const balanceType =
        balanceDisplayMode === "on_chain" ? "current" : "snapshot";
      try {
        const response = (await API.getListReplies()({
          event_id: eventId,
          search: search || undefined,
          sortBy,
          order,
          page,
          limit,
          balance_type: balanceType,
          unlock_email: submittedEmail || undefined,
        })) as unknown as ApiResponse<GetListRepliesRes>;
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch replies");
        }
        return response.data;
      } catch (err: unknown) {
        // HTTP 403 with code 403101 means the event is locked
        const axiosErr = err as {
          response?: { status?: number; data?: { code?: string } };
        };
        if (
          axiosErr?.response?.status === 403 ||
          axiosErr?.response?.data?.code === "403101"
        ) {
          return null; // locked sentinel
        }
        throw err;
      }
    },
    enabled: !!eventId,
    placeholderData: keepPreviousData,
  });

  const isLocked = !isLoading && !error && repliesData === null;

  useEffect(() => {
    onLockedChange?.(isLocked);
  }, [isLocked, onLockedChange]);

  useEffect(() => {
    if (!isLoading && repliesData !== null && repliesData !== undefined) {
      onCreatorChange?.(repliesData.is_creator === 1, submittedEmail);
    }
  }, [isLoading, repliesData, submittedEmail, onCreatorChange]);

  // When a submitted email still results in locked (and fetch is complete):
  // - creator_only: show a toast error
  // - paid_only: redirect to unlock payment page
  // Skip redirect if the email was auto-applied from a payment return — the user just paid, no loop.
  useEffect(() => {
    if (submittedEmail && isLocked && !isFetching) {
      if (resultVisibility === "creator_only") {
        setSubmittedEmail("");
        showToast(
          "error",
          t(
            "replyList.incorrectCreatorEmail",
            "Please enter the correct creator email.",
          ),
        );
      } else if (!isPaymentReturnRef.current) {
        navigate(`/event/${eventId}/unlock-payment`, {
          state: { email: submittedEmail, unlockPriceSatoshi, eventTitle },
        });
      }
    }
  }, [
    submittedEmail,
    isLocked,
    isFetching,
    resultVisibility,
    eventId,
    unlockPriceSatoshi,
    eventTitle,
    navigate,
    showToast,
    t,
  ]);

  const isUnlockEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    unlockEmail.trim(),
  );

  const handleUnlock = () => {
    setEmailTouched(true);
    if (!unlockEmail.trim() || !isUnlockEmailValid) {
      unlockInputRef.current?.focus();
      return;
    }
    const trimmedEmail = unlockEmail.trim();
    isPaymentReturnRef.current = false; // User manually triggered — re-enable redirect
    if (trimmedEmail === submittedEmail && isLocked) {
      if (resultVisibility === "creator_only") {
        showToast(
          "error",
          t(
            "replyList.incorrectCreatorEmail",
            "Please enter the correct creator email.",
          ),
        );
      } else {
        // Same email already returned locked (e.g. back from payment, mock doesn't track state).
        // setSubmittedEmail won't change state, so navigate directly.
        navigate(`/event/${eventId}/unlock-payment`, {
          state: { email: trimmedEmail, unlockPriceSatoshi, eventTitle },
        });
      }
      return;
    }
    setSubmittedEmail(trimmedEmail);
  };

  const handleCopy = useDebouncedClick(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        "success",
        t("replyList.copiedToClipboard", "{{label}} copied to clipboard", {
          label,
        }),
      );
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      showToast(
        "error",
        t("replyList.failedToCopy", "Failed to copy {{label}}", { label }),
      );
    }
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-2 text-lg">
            {t("replyList.failedToLoadReplies", "Failed to load replies")}
          </p>
          <p className="text-secondary text-sm">
            {error instanceof Error
              ? error.message
              : t("replyList.unknownError", "Unknown error")}
          </p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    const totalBtc = satsToBtc(totalStakeSatoshi ?? null, { suffix: false });
    return (
      <div className="border-border flex flex-col items-center rounded-xl border p-4 text-center sm:px-6 sm:py-10">
        <div className="bg-surface mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <UnlockIcon className="h-7 w-7" />
        </div>
        <p className="tx-16 fw-m mb-1 text-(--color-orange-500)">
          {resultVisibility === "creator_only"
            ? t(
                "replyList.creatorOnlyResults",
                "Results are visible to the creator only.",
              )
            : t(
                "replyList.unlockResultsWith",
                "Unlock Results with {{price}} BTC",
                {
                  price: unlockPriceSatoshi
                    ? unlockPriceSatoshi / 100000000
                    : "?",
                },
              )}
        </p>
        {resultVisibility !== "creator_only" && unlockCount !== undefined && (
          <p className="tx-14">
            <span className="fw-m text-(--color-orange-500)">
              {unlockCount}
            </span>{" "}
            <span className="text-primary">
              {t("replyList.unlocked", "unlocked")}
            </span>
          </p>
        )}
        <div className="text-secondary tx-13 mt-4 mb-6 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          {participantsCount !== undefined && participantsCount > 0 ? (
            <>
              {participantsCount !== undefined && (
                <span>
                  {participantsCount === 1
                    ? t("replyList.participantsCountOne", "1 Participant")
                    : t(
                        "replyList.participantsCount",
                        "{{count}} Participants",
                        { count: participantsCount },
                      )}
                </span>
              )}
              {totalStakeSatoshi !== undefined && (
                <span>
                  {Number(totalBtc)} {t("replyList.btcTotal", "BTC Total")}
                </span>
              )}
            </>
          ) : (
            <div>
              {eventStatus === 3
                ? t("replyList.noRepliesYet", "No replies yet")
                : t("replyList.noReplies", "No replies")}
            </div>
          )}
        </div>
        <div className="w-full max-w-sm space-y-2">
          <input
            ref={unlockInputRef}
            type="text"
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="one-time-code"
            spellCheck="false"
            value={unlockEmail}
            onChange={(e) => setUnlockEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUnlock();
            }}
            placeholder={t(
              "replyList.unlockEmailPlaceholder",
              "your@email.com",
            )}
            className="border-border bg-surface text-primary tx-14 py-2outline-none w-full rounded-lg border px-3 py-2 outline-0 focus:ring-2 focus:ring-(--color-orange-500)"
          />
          {emailTouched && unlockEmail && !isUnlockEmailValid ? (
            <p className="tx-12 lh-18 text-left text-red-500">
              {t(
                "replyList.invalidEmailFormat",
                "Please enter a valid email address",
              )}
            </p>
          ) : (
            <p className="text-secondary tx-12 text-left">
              {t("replyList.enterUnlockEmail", "Enter your unlock email")}
            </p>
          )}
        </div>
        <Button
          type="button"
          appearance="solid"
          tone="primary"
          className={cn(
            "mt-4 w-full max-w-sm",
            !unlockEmail.trim() && "opacity-50",
          )}
          onClick={handleUnlock}
        >
          {t("replyList.unlock", "Unlock")}
        </Button>
      </div>
    );
  }

  if (!repliesData || repliesData.replies.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-secondary">
          {eventStatus === 4 || eventStatus === 5
            ? t("replyList.noReplies", "No replies")
            : t("replyList.noRepliesYet", "No replies yet")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {repliesData.replies.map((reply) => (
        <ReplyItem
          key={reply.id}
          reply={reply}
          onCopy={handleCopy}
          options={options}
          eventType={eventType}
          eventStatus={eventStatus}
          balanceDisplayMode={balanceDisplayMode}
        />
      ))}
    </div>
  );
}

interface ReplyItemProps {
  reply: Reply;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopy: any; // Using any for debounced function return type compatibility
  options: EventOption[] | string[];
  eventType?: EventType;
  eventStatus?: number;
  balanceDisplayMode?: "snapshot" | "on_chain";
}

function ReplyItem({
  reply,
  onCopy,
  options,
  eventType,
  eventStatus,
  balanceDisplayMode,
}: ReplyItemProps) {
  const { t } = useTranslation();
  const { isDesktop } = useHomeStore();
  const { showToast } = useToast();
  const { tooltipProps, triggerProps } = useTooltipWithClick({
    keepOpenOnClick: !isDesktop,
    singleLine: isDesktop,
  });

  const getDisplayBalance = () => {
    if (
      eventStatus === EventStatus.COMPLETED &&
      balanceDisplayMode !== "on_chain"
    ) {
      return reply.balance_at_snapshot_satoshi;
    }
    return reply.balance_at_current_satoshi;
  };

  const balanceBtc = satsToBtc(getDisplayBalance(), {
    suffix: false,
  });
  const timeAgo = formatRelativeTime(reply.created_at, t);

  // Calculate SHA-256 hash of reply content
  const [answerHash, setAnswerHash] = useState<string | null>(null);

  // Handle copy content hash
  const handleCopyHash = useDebouncedClick(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!answerHash) return;
    try {
      await navigator.clipboard.writeText(answerHash);
      showToast(
        "success",
        t("replyList.hashCopiedToClipboard", "Hash copied to clipboard"),
      );
    } catch (error) {
      console.error("Failed to copy hash:", error);
      showToast(
        "error",
        t("replyList.failedToCopyHash", "Failed to copy hash"),
      );
    }
  });

  useEffect(() => {
    if (eventType === "open" && reply.content_hash) {
      setAnswerHash(reply.content_hash);
      return;
    }
    if (eventType === "single_choice" && reply.option_hash) {
      setAnswerHash(reply.option_hash);
      return;
    }
  }, [eventType, reply.content_hash, reply.option_hash]);

  // Helper to get option text
  const getOptionText = (optionId: number) => {
    if (!options || options.length === 0)
      return t("replyList.option", "Option {{optionId}}", { optionId });

    // Handle EventOption[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundOption = (options as any[]).find((opt) =>
      typeof opt === "object" ? opt.id === optionId : false,
    );

    if (foundOption) return foundOption.option_text;

    // Fallback if options are strings or not found by ID (though with API they should be objects with IDs)
    // If it's a simple string array, we might assume 1-based index maps to array index
    if (typeof options[0] === "string") {
      return (
        options[optionId - 1] ||
        t("replyList.option", "Option {{optionId}}", { optionId })
      );
    }

    return t("replyList.option", "Option {{optionId}}", { optionId });
  };

  const displayText =
    reply.content ||
    (reply.option_id !== undefined ? getOptionText(reply.option_id) : "");

  return (
    <div className="border-border bg-bg group relative flex h-full flex-col rounded-xl border p-4 md:p-6">
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-stretch md:justify-between">
        {/* Left Column: Balance and Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-primary text-base font-semibold md:text-lg ${
                  !reply.is_reply_valid ? "line-through" : ""
                }`}
              >
                {balanceBtc} BTC
              </span>
              {reply.is_reply_valid ? (
                <Tooltip
                  title={t(
                    "replyList.signatureVerificationValid",
                    "Signature verification valid",
                  )}
                  placement={isDesktop ? "top" : "bottom"}
                  color="white"
                  {...tooltipProps}
                  getPopupContainer={(triggerNode) =>
                    triggerNode.parentElement || document.body
                  }
                >
                  <span className="text-success text-xs" {...triggerProps}>
                    <ReplyValidateIcon className="h-4 w-4 text-current" />
                  </span>
                </Tooltip>
              ) : (
                <Tooltip
                  title={t(
                    "replyList.signatureVoid",
                    "This address submitted a new signature before the deadline; this signature is void.",
                  )}
                  placement={isDesktop ? "top" : "bottom"}
                  color="white"
                  {...tooltipProps}
                  getPopupContainer={(triggerNode) =>
                    triggerNode.parentElement || document.body
                  }
                >
                  <span className="text-xs text-red-500" {...triggerProps}>
                    <InvalidateIcon className="h-4 w-4 text-current" />
                  </span>
                </Tooltip>
              )}
            </div>
            <span className="text-secondary text-xs md:hidden md:text-sm">
              {timeAgo}
            </span>
          </div>
          {displayText && (
            <div>
              <span
                className={`text-primary text-sm wrap-break-word md:text-base ${
                  !reply.is_reply_valid ? "line-through" : ""
                }`}
              >
                {displayText}
              </span>
              {answerHash && (
                <Tooltip
                  title={t(
                    "replyList.tapToCopyHash",
                    "Tap to copy SHA-256 hash",
                  )}
                  placement={isDesktop ? "top" : "bottom"}
                  color="white"
                  getPopupContainer={(triggerNode) =>
                    triggerNode.parentElement || document.body
                  }
                  styles={{
                    container: {
                      maxWidth: isDesktop
                        ? "max-content"
                        : "min(300px, calc(100vw - 32px))",
                      whiteSpace: isDesktop ? "nowrap" : "normal",
                      width: isDesktop ? "max-content" : undefined,
                    },
                  }}
                >
                  <Button
                    appearance="outline"
                    tone="primary"
                    size="sm"
                    text="xs"
                    className="hover:text-primary relative top-0.5 ml-1 h-auto border-0 bg-transparent p-0 hover:bg-transparent"
                    onClick={handleCopyHash}
                  >
                    <IconSha className="text-secondary h-4 w-4" />
                  </Button>
                </Tooltip>
              )}
            </div>
          )}

          <div className="flex-1"></div>
          {/* Todo Next version: Add report button */}
          {/* <button
            type="button"
            className="flex items-center gap-1 text-secondary hover:text-primary transition-colors mt-2"
          
          >
            <ReportIcon className="w-4 h-4" />
          </button> */}
        </div>

        {/* Right Column: Time and Details */}
        <div className="flex min-w-[280px] flex-col items-start gap-3 md:items-end">
          <span className="text-secondary hidden w-full text-right text-xs md:inline-block md:text-sm md:whitespace-nowrap">
            {timeAgo}
          </span>

          <div className="flex w-full flex-col gap-4">
            {/* Bitcoin Address */}
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-xs">
                {t("replyList.bitcoinAddress", "Bitcoin Address")}
              </span>
              <div className="bg-surface border-border flex items-center justify-between gap-2 rounded border p-2">
                <span className="text-primary truncate font-mono text-xs">
                  {truncateAddress(reply.btc_address)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      reply.btc_address,
                      t("replyList.bitcoinAddress", "Bitcoin Address"),
                    )
                  }
                  className="hover:bg-surface-hover text-secondary hover:text-primary shrink-0 cursor-pointer rounded p-1 transition-colors"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Divider />

            {/* Bitcoin Signature */}
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-xs">
                {t("replyList.bitcoinSignature", "Bitcoin Signature")}
              </span>
              <div className="bg-surface border-border flex items-center justify-between gap-2 rounded border p-2">
                <span className="text-primary truncate font-mono text-xs">
                  {truncateText(reply.signature, 20)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      reply.signature,
                      t("replyList.bitcoinSignature", "Bitcoin Signature"),
                    )
                  }
                  className="hover:bg-surface-hover text-secondary hover:text-primary shrink-0 cursor-pointer rounded p-1 transition-colors"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Divider />

            {/* Plaintext */}
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-xs">
                {t("replyList.plaintext", "Plaintext")}
              </span>
              <div className="bg-surface border-border flex items-center justify-between gap-2 rounded border p-2">
                <span className="text-primary truncate font-mono text-xs">
                  {truncateText(reply.plaintext, 20)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      reply.plaintext,
                      t("replyList.plaintext", "Plaintext"),
                    )
                  }
                  className="hover:bg-surface-hover text-secondary hover:text-primary shrink-0 cursor-pointer rounded p-1 transition-colors"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
