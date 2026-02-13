import { useQuery } from "@tanstack/react-query";
import { Button } from "antd";

import { AdminFormSection } from "@/admin/component/AdminFormSection";
import { AdminAPI, type ApiResponse } from "@/api";
import type { WithdrawalInfoRes } from "@/api/response";

import { useWithdrawalModal } from "@/hooks/useWithdrawalModal";
import WithdrawalRecordSection from "./WithdrawalRecord";

export default function AdminWithdrawalPage() {
  const { data: withdrawalInfo, isLoading } = useQuery({
    queryKey: ["adminWithdrawalInfo"],
    queryFn: async () => {
      const res =
        (await AdminAPI.getWithdrawalInfo()) as unknown as ApiResponse<WithdrawalInfoRes>;
      if (!res.success) throw new Error(res.message || "取得提款資訊失敗");
      return res.data;
    },
  });

  const { openSignModal, isFetchingInfo, modals } = useWithdrawalModal();

  return (
    <div>
      <div className="flex h-20 items-center justify-between border-neutral-200 bg-white px-6 py-4">
        <h1 className="tx-18 fw-l">提款相關</h1>
      </div>

      <main className="px-6 py-4">
        <div className="space-y-6">
          <AdminFormSection title="提款">
            <div className="space-y-2">
              <div className="flex max-w-xl flex-wrap items-center gap-3">
                <label className="text-sm">平台金額:</label>
                <span className="font-mono text-sm">
                  {isLoading
                    ? "載入中..."
                    : `${withdrawalInfo?.platform_amount_satoshi ?? 0} Sats`}
                </span>
              </div>
              <div className="flex max-w-xl flex-wrap items-center gap-3">
                <label className="text-sm">可提領金額:</label>
                <span className="font-mono text-sm">
                  {isLoading
                    ? "載入中..."
                    : `${withdrawalInfo?.withdrawable_amount_satoshi ?? 0} Sats`}
                </span>
              </div>
              <div className="flex max-w-xl flex-wrap items-center gap-3">
                <label className="text-sm">提款至地址:</label>
                <span className="font-mono text-sm break-all">
                  {isLoading
                    ? "載入中..."
                    : withdrawalInfo?.withdraw_address || "未設定"}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  size="middle"
                  autoInsertSpace={false}
                  onClick={openSignModal}
                  disabled={isFetchingInfo}
                >
                  {isFetchingInfo ? "載入中..." : "提款"}
                </Button>
              </div>
            </div>
          </AdminFormSection>

          <WithdrawalRecordSection />
        </div>
      </main>

      {modals}
    </div>
  );
}
