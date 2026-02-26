import { CheckOutlined, CloseOutlined, DownOutlined } from "@ant-design/icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Collapse } from "antd";
import { useMemo } from "react";

import CopyIcon from "@/assets/icons/copy.svg?react";
import ProcessingIcon from "@/assets/icons/processing.svg?react";
import { toast } from "@/components/base/Toast/toast";

import { AdminAPI, type ApiResponse } from "@/api";
import type { GetWithdrawalRecordRes, WithdrawalRecord } from "@/api/response";
import { truncateAddress } from "@/utils/address";

const PAGE_LIMIT = 15;

function copyToClipboard({ label, value }: { label: string; value: string }) {
  navigator.clipboard.writeText(value).then(
    () => toast("success", `${label} 已複製到剪貼簿`),
    () => toast("error", `${label} 複製失敗`),
  );
}

function CopyableText({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-secondary text-sm">{label}:</span>
      <span className="text-primary font-mono text-sm break-all">{value}</span>
      {value !== "multiple" && (
        <button
          type="button"
          onClick={() => copyToClipboard({ label, value })}
          className="text-secondary hover:text-primary shrink-0 cursor-pointer"
        >
          <CopyIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: WithdrawalRecord["status"] }) {
  if (status === "completed") {
    return <CheckOutlined className="text-lg text-green-500!" />;
  }
  if (status === "failed") {
    return <CloseOutlined className="text-lg text-red-500!" />;
  }
  return <ProcessingIcon className="text-secondary text-lg" />;
}

function formatLocalTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function groupByDate(records: WithdrawalRecord[]) {
  const groups: { date: string; records: WithdrawalRecord[] }[] = [];
  const map = new Map<string, WithdrawalRecord[]>();

  for (const record of records) {
    const dateKey = new Date(record.timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!map.has(dateKey)) {
      const arr: WithdrawalRecord[] = [];
      map.set(dateKey, arr);
      groups.push({ date: dateKey, records: arr });
    }
    map.get(dateKey)!.push(record);
  }

  return groups;
}

export default function WithdrawalRecordSection() {
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["adminWithdrawalRecords"],
    queryFn: async ({ pageParam }) => {
      const res = (await AdminAPI.getWithdrawalRecords({
        page: String(pageParam),
        limit: String(PAGE_LIMIT),
      })) as unknown as ApiResponse<GetWithdrawalRecordRes>;

      if (!res.success) throw new Error(res.message || "取得提款紀錄失敗");

      return res.data.withdrawals;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE_LIMIT) return undefined;
      return lastPageParam + 1;
    },
  });

  const allRecords = useMemo(() => data?.pages.flat() ?? [], [data]);

  const groups = useMemo(() => groupByDate(allRecords), [allRecords]);

  return (
    <section className="rounded bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h2 className="fw-l tx-16">提款紀錄</h2>
        <Button
          size="small"
          autoInsertSpace={false}
          onClick={() => refetch()}
          loading={isFetching && !isFetchingNextPage}
        >
          更新
        </Button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-secondary py-4 text-center text-sm">載入中...</p>
        ) : allRecords.length === 0 ? (
          <p className="text-secondary py-4 text-center text-sm">
            尚無提款紀錄
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.date}>
                <h3 className="py-2 text-base font-bold">{group.date}</h3>
                <Collapse
                  bordered={true}
                  expandIcon={({ isActive }) => (
                    <DownOutlined rotate={isActive ? 180 : 0} />
                  )}
                  expandIconPlacement="end"
                  styles={{
                    root: { backgroundColor: "transparent" },
                  }}
                  items={group.records.map((record) => ({
                    key: record.id,
                    label: (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <span className="w-32 font-mono text-sm">
                          {record.amount}
                          <span className="text-secondary ml-1">Sats</span>
                        </span>
                        <span className="flex min-w-0 flex-1 items-center gap-1">
                          <span className="text-secondary text-sm">TXID:</span>
                          <span className="text-primary min-w-0 truncate font-mono text-sm lg:hidden">
                            {truncateAddress(record.txid, 10, 8)}
                          </span>
                          <span className="text-primary hidden min-w-0 truncate font-mono text-sm lg:inline">
                            {record.txid}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard({
                                value: record.txid,
                                label: "TXID",
                              });
                            }}
                            className="text-secondary hover:text-primary shrink-0 cursor-pointer"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </button>
                        </span>
                        <span className="text-sm">
                          {formatLocalTime(record.timestamp)}
                        </span>
                        <StatusIcon status={record.status} />
                      </div>
                    ),
                    children: (
                      <div className="space-y-2 p-2">
                        <CopyableText
                          label="From Address"
                          value={record.from_address}
                        />
                        <CopyableText
                          label="To Address"
                          value={record.to_address}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-secondary text-sm">Fee:</span>
                          <span className="text-primary font-mono text-sm">
                            {record.fee} Sats
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-secondary text-sm">
                            Ticket ID:
                          </span>
                          <span className="text-primary font-mono text-sm">
                            {record.ticket_id}
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                />
              </div>
            ))}

            {hasNextPage && (
              <div className="py-4 text-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="fw-m text-secondary hover:text-accent cursor-pointer text-sm disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading" : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
