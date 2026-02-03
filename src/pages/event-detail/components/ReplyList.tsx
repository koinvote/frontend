import { API, type ApiResponse } from "@/api";
import type { EventOption, GetListRepliesRes, Reply } from "@/api/response";
import { EventStatus, ReplySortBy, type EventType } from "@/api/types";
import CopyIcon from "@/assets/icons/copy.svg?react";
import InvalidateIcon from "@/assets/icons/invalidate.svg?react";
import ReplyValidateIcon from "@/assets/icons/replyValidate.svg?react";
import VerificationWhiteIcon from "@/assets/icons/verificationWhite.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import { PageLoading } from "@/components/PageLoading";
import { satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
// import ReportIcon from "@/assets/icons/report.svg?react";
import { Button } from "@/components/base/Button";
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
}: ReplyListProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [page] = useState(1); // TODO: 实现分页功能时使用 setPage
  const limit = 20;

  const {
    data: repliesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["replies", eventId, page, limit, search, sortBy, order],
    queryFn: async () => {
      const response = (await API.getListReplies()({
        event_id: eventId,
        search: search || undefined,
        sortBy,
        order,
        page,
        limit,
      })) as unknown as ApiResponse<GetListRepliesRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch replies");
      }
      return response.data;
    },
    enabled: !!eventId,
  });

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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-lg text-secondary mb-2">
            {t("replyList.failedToLoadReplies", "Failed to load replies")}
          </p>
          <p className="text-sm text-secondary">
            {error instanceof Error
              ? error.message
              : t("replyList.unknownError", "Unknown error")}
          </p>
        </div>
      </div>
    );
  }

  if (!repliesData || repliesData.replies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-secondary">
          {eventStatus === 5
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

  console.log("balanceDisplayMode", balanceDisplayMode);

  const getDisplayBalance = () => {
    if (
      eventStatus === EventStatus.ENDED ||
      eventStatus === EventStatus.COMPLETED
    ) {
      if (balanceDisplayMode === "on_chain") {
        return reply.balance_at_current_satoshi;
      }
      return reply.balance_at_snapshot_satoshi;
    }
    return reply.balance_at_reply_satoshi;
  };

  const balanceBtc = satsToBtc(getDisplayBalance(), {
    suffix: false,
  });
  const timeAgo = formatRelativeTime(reply.created_at, t);

  // Calculate SHA-256 hash of reply content
  const [contentHash, setContentHash] = useState<string | null>(null);

  // Handle copy content hash
  const handleCopyHash = useDebouncedClick(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!contentHash) return;
    try {
      await navigator.clipboard.writeText(contentHash);
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
    const calculateHash = async () => {
      if (!reply.content) {
        setContentHash(null);
        return;
      }
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(reply.content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setContentHash(hashHex);
      } catch (error) {
        console.error("Failed to calculate SHA-256 hash:", error);
        setContentHash(null);
      }
    };

    calculateHash();
  }, [reply.content]);

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
    <div className="rounded-xl border border-border bg-bg p-4 md:p-6 relative group flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-4 flex-1">
        {/* Left Column: Balance and Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-base md:text-lg font-semibold text-primary ${
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
                  <span className="text-green-500 text-xs" {...triggerProps}>
                    <ReplyValidateIcon className="w-4 h-4 text-current" />
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
                  <span className="text-red-500 text-xs" {...triggerProps}>
                    <InvalidateIcon className="w-4 h-4 text-current" />
                  </span>
                </Tooltip>
              )}
              {eventType === "open" && reply.content && contentHash && (
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
                  <span>
                    <Button
                      appearance="outline"
                      tone="primary"
                      size="sm"
                      text="xs"
                      className="p-0 border-0 bg-transparent hover:bg-transparent hover:text-primary"
                      onClick={handleCopyHash}
                    >
                      <VerificationWhiteIcon
                        className="w-4 h-4"
                        style={{ color: "#155DFC" }}
                      />
                    </Button>
                  </span>
                </Tooltip>
              )}
            </div>
            <span className="text-xs md:text-sm text-secondary md:hidden">
              {timeAgo}
            </span>
          </div>
          {displayText && (
            <p
              className={`text-sm md:text-base text-primary wrap-break-word ${
                !reply.is_reply_valid ? "line-through" : ""
              }`}
            >
              {displayText}
            </p>
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
        <div className="flex flex-col items-start md:items-end gap-3 min-w-[280px]">
          <span className="text-xs md:text-sm text-secondary text-right w-full hidden md:inline-block md:whitespace-nowrap">
            {timeAgo}
          </span>

          <div className="flex flex-col gap-4 w-full">
            {/* Bitcoin Address */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-secondary">
                {t("replyList.bitcoinAddress", "Bitcoin Address")}
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface border border-border">
                <span className="text-xs text-primary font-mono truncate">
                  {truncateAddress(reply.btc_address)}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(reply.btc_address, "Bitcoin Address")}
                  className="shrink-0 p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Divider />

            {/* Bitcoin Signature */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-secondary">
                {t("replyList.bitcoinSignature", "Bitcoin Signature")}
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface border border-border">
                <span className="text-xs text-primary font-mono truncate">
                  {truncateText(reply.signature, 20)}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(reply.signature, "Bitcoin Signature")}
                  className="shrink-0 p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Divider />

            {/* Plaintext */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-secondary">
                {t("replyList.plaintext", "Plaintext")}
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface border border-border">
                <span className="text-xs text-primary font-mono truncate">
                  {truncateText(reply.plaintext, 20)}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(reply.plaintext, "Plaintext")}
                  className="shrink-0 p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
