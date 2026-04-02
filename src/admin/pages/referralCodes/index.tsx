import { Button, Pagination } from "antd";
import { useCallback, useEffect, useState } from "react";

import { AdminAPI, type ApiResponse } from "@/api";
import type { GetReferralCodesRes, ReferralCode } from "@/api/response";
import { useToast } from "@/components/base/Toast/useToast";

import AddReferralCodeModal from "./AddReferralCodeModal";
import DeleteReferralCodeModal from "./DeleteReferralCodeModal";

const PAGE_SIZE = 20;

export default function AdminReferralCodesPage() {
  const { showToast } = useToast();
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReferralCode | null>(null);

  const fetchCodes = useCallback(
    async (currentPage: number) => {
      try {
        setIsLoading(true);
        const res = (await AdminAPI.getReferralCodes({
          page: currentPage,
          limit: PAGE_SIZE,
        })) as unknown as ApiResponse<GetReferralCodesRes>;
        if (res.success && res.data) {
          setCodes(res.data.referral_codes ?? []);
          setTotal(res.data.total ?? 0);
        } else {
          showToast("error", res.message || "獲取推薦碼失敗");
        }
      } catch (error: unknown) {
        const err = error as {
          isHandled?: boolean;
          apiMessage?: string;
          message?: string;
        };
        if (!err.isHandled) {
          showToast("error", err.apiMessage || err.message || "獲取推薦碼失敗");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchCodes(page);
  }, [fetchCodes, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const formatDate = (iso: string) => iso.slice(0, 10);

  return (
    <div>
      <div className="flex h-20 items-center justify-between border-neutral-200 bg-white px-6 py-4">
        <h1 className="text-lg font-medium">推薦碼管理</h1>
        <Button
          type="primary"
          autoInsertSpace={false}
          onClick={() => setShowAddModal(true)}
        >
          新增推薦碼
        </Button>
      </div>

      <main className="px-6 py-4">
        <div className="overflow-hidden rounded bg-white">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_auto] border-b border-neutral-200 px-2 py-3 text-sm font-medium text-neutral-700">
            <span>推薦碼</span>
            <span>建立時間</span>
            <span>動作</span>
          </div>

          {/* Table rows */}
          {isLoading ? (
            <div className="px-2 py-4 text-center text-sm text-neutral-400">
              載入中...
            </div>
          ) : codes.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-neutral-400">
              尚無推薦碼
            </div>
          ) : (
            codes.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_1fr_auto] border-b border-neutral-100 px-2 py-4 text-sm last:border-b-0"
              >
                <span className="text-neutral-800">{item.code}</span>
                <span className="text-neutral-600">
                  {formatDate(item.created_at)}
                </span>
                <Button
                  type="link"
                  danger
                  autoInsertSpace={false}
                  size="small"
                  className="p-0!"
                  onClick={() => setDeleteTarget(item)}
                >
                  移除
                </Button>
              </div>
            ))
          )}
        </div>

        {total > PAGE_SIZE && (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </main>

      {showAddModal && (
        <AddReferralCodeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchCodes(page);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteReferralCodeModal
          code={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            fetchCodes(page);
          }}
        />
      )}
    </div>
  );
}
