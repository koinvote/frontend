import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API, type ApiResponse } from "@/api";
import { ReplySortBy } from "@/api/types";
import type { Reply, GetListRepliesRes, EventOption } from "@/api/response";
import { satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import { PageLoading } from "@/components/PageLoading";
import ReplyValidateIcon from "@/assets/icons/replyValidate.svg?react";
import ReportIcon from "@/assets/icons/report.svg?react";
import { Divider } from "./Divider";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface ReplyListProps {
  eventId: string;
  search?: string;
  sortBy?: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME;
  order?: "desc" | "asc";
  options?: EventOption[] | string[];
}

function formatRelativeTime(dateString: string): string {
  // 確保將服務器返回的 UTC 時間正確解析為 UTC
  const date = dayjs.utc(dateString);
  const now = dayjs();
  const diffDays = now.diff(date, "day");

  if (diffDays < 1) {
    const hours = now.diff(date, "hour");
    return `${hours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  const weeks = Math.floor(diffDays / 7);
  return `${weeks}w ago`;
}

function truncateAddress(
  address: string,
  startLength = 6,
  endLength = 4
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
}: ReplyListProps) {
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
      console.log("response", response);
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
      showToast("success", `${label} copied to clipboard`);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      showToast("error", `Failed to copy ${label}`);
    }
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-lg text-secondary mb-2">Failed to load replies</p>
          <p className="text-sm text-secondary">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  if (!repliesData || repliesData.replies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-secondary">No replies found</p>
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
}

function ReplyItem({ reply, onCopy, options }: ReplyItemProps) {
  const balanceBtc = satsToBtc(reply.balance_at_reply_satoshi, {
    suffix: false,
  });
  const timeAgo = formatRelativeTime(reply.created_at);

  // Helper to get option text
  const getOptionText = (optionId: number) => {
    if (!options || options.length === 0) return `Option ${optionId}`;

    // Handle EventOption[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundOption = (options as any[]).find((opt) =>
      typeof opt === "object" ? opt.id === optionId : false
    );

    if (foundOption) return foundOption.option_text;

    // Fallback if options are strings or not found by ID (though with API they should be objects with IDs)
    // If it's a simple string array, we might assume 1-based index maps to array index
    if (typeof options[0] === "string") {
      return options[optionId - 1] || `Option ${optionId}`;
    }

    return `Option ${optionId}`;
  };

  const displayText =
    reply.content ||
    (reply.option_id !== undefined ? getOptionText(reply.option_id) : "");

  return (
    <div className="rounded-xl border border-border bg-bg p-4 md:p-6 relative group flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-4 flex-1">
        {/* Left Column: Balance and Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base md:text-lg font-semibold text-primary">
              {balanceBtc} BTC
            </span>
            {reply.is_reply_valid && (
              <span className="text-green-500 text-xs">
                <ReplyValidateIcon className="w-4 h-4 text-current" />
              </span>
            )}
          </div>
          {displayText && (
            <p className="text-sm md:text-base text-primary mb-4 break-words">
              {displayText}
            </p>
          )}

          <div className="flex-1"></div>

          <button
            type="button"
            className="flex items-center gap-1 text-secondary hover:text-primary transition-colors mt-2"
            onClick={() => {
              /* Logic to be added later */
            }}
          >
            <ReportIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Time and Details */}
        <div className="flex flex-col items-start md:items-end gap-3 min-w-[280px]">
          <span className="text-xs md:text-sm text-secondary text-right w-full">
            {timeAgo}
          </span>

          <div className="flex flex-col gap-4 w-full">
            {/* Bitcoin Address */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Bitcoin Address</span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface border border-border">
                <span className="text-xs text-primary font-mono truncate">
                  {truncateAddress(reply.btc_address)}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(reply.btc_address, "Bitcoin Address")}
                  className="flex-shrink-0 p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Divider />

            {/* Bitcoin Signature */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Bitcoin Signature</span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface border border-border">
                <span className="text-xs text-primary font-mono truncate">
                  {truncateText(reply.signature, 20)}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(reply.signature, "Bitcoin Signature")}
                  className="flex-shrink-0 p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Divider />

            {/* Plaintext */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Plaintext</span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface border border-border">
                <span className="text-xs text-primary font-mono truncate">
                  {truncateText(reply.plaintext, 20)}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(reply.plaintext, "Plaintext")}
                  className="flex-shrink-0 p-1 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors"
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
