import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API, type ApiResponse } from "@/api";
import { ReplySortBy } from "@/api/types";
import type { Reply, GetListRepliesRes } from "@/api/response";
import { satsToBtc } from "@/utils/formatter";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import { PageLoading } from "@/components/PageLoading";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface ReplyListProps {
  eventId: string;
  search?: string;
  sortBy?: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME;
  order?: "desc" | "asc";
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

function truncateText(text: string, maxLength = 50): string {
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
}: ReplyListProps) {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: repliesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["replies", eventId, page, limit, search, sortBy, order],
    queryFn: async () => {
      const response = (await API.getListReplies(eventId)({
        page,
        limit,
        q: search || undefined,
        sortBy,
        order,
      })) as unknown as ApiResponse<GetListRepliesRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch replies");
      }
      return response.data;
    },
    enabled: !!eventId,
  });

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", `${label} copied to clipboard`);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      showToast("error", `Failed to copy ${label}`);
    }
  };

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
        <ReplyItem key={reply.id} reply={reply} onCopy={handleCopy} />
      ))}
    </div>
  );
}

interface ReplyItemProps {
  reply: Reply;
  onCopy: (text: string, label: string) => void;
}

function ReplyItem({ reply, onCopy }: ReplyItemProps) {
  const balanceBtc = satsToBtc(reply.balance_at_current_satoshi, {
    suffix: false,
  });
  const timeAgo = formatRelativeTime(reply.created_at);

  return (
    <div className="rounded-xl border border-border bg-bg p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left Column: Balance and Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base md:text-lg font-semibold text-primary">
              {balanceBtc} BTC
            </span>
            {reply.is_reply_valid && (
              <span className="text-green-500 text-xs">✓</span>
            )}
          </div>
          {(reply.content || reply.option_id !== undefined) && (
            <p className="text-sm md:text-base text-primary mb-2">
              {reply.content ||
                (reply.option_id !== undefined
                  ? `Option ${reply.option_id}`
                  : "")}
            </p>
          )}
        </div>

        {/* Right Column: Time and Details */}
        <div className="flex flex-col items-start md:items-end gap-3">
          <span className="text-xs md:text-sm text-secondary">{timeAgo}</span>

          {/* Details */}
          <div className="flex flex-col gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-secondary">Bitcoin Address:</span>
              <span className="text-primary font-mono">
                {truncateAddress(reply.btc_address)}
              </span>
              <button
                type="button"
                onClick={() => onCopy(reply.btc_address, "Bitcoin Address")}
                className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
                aria-label="Copy Bitcoin address"
              >
                <CopyIcon className="w-4 h-4 text-current" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-secondary">Bitcoin Signature:</span>
              <span className="text-primary font-mono">
                {truncateText(reply.signature, 20)}
              </span>
              <button
                type="button"
                onClick={() => onCopy(reply.signature, "Bitcoin Signature")}
                className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
                aria-label="Copy Bitcoin signature"
              >
                <CopyIcon className="w-4 h-4 text-current" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-secondary">Plaintext:</span>
              <span className="text-primary font-mono">
                {truncateText(reply.plaintext, 20)}
              </span>
              <button
                type="button"
                onClick={() => onCopy(reply.plaintext, "Plaintext")}
                className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
                aria-label="Copy plaintext"
              >
                <CopyIcon className="w-4 h-4 text-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
