import { useState } from "react";
import { useToast } from "@/components/base/Toast/useToast";
import { AdminActionButtons } from "@/admin/component/AdminActionButtons";
import { AdminFormSectionWithField } from "@/admin/component/AdminFormSection";
import type { SelectOption } from "@/admin/component/AdminFormField";

const FEE_MULTIPLIER_OPTIONS: SelectOption[] = [
  { value: "0.75", label: "0.75X" },
  { value: "1", label: "1X" },
  { value: "1.25", label: "1.25X" },
];

export default function AdminFeesPage() {
  const { showToast } = useToast();

  // State for form inputs
  const [bonusDistributionMultiplier, setBonusDistributionMultiplier] =
    useState<string>("1");
  const [refundMultiplier, setRefundMultiplier] = useState<string>("1");
  const [withdrawalMultiplier, setWithdrawalMultiplier] = useState<string>("1");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);

  // Handle restore (get from API)
  const handleRestore = async () => {
    try {
      setIsLoadingRestore(true);
      // TODO: Implement API call when backend is ready
      // const response = await AdminAPI.getFeeSettings();
      showToast("success", "已恢復手續費設定");
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message ||
        "獲取手續費設定失敗";
      showToast("error", errorMessage);
    } finally {
      setIsLoadingRestore(false);
    }
  };

  // Handle save (update to API)
  const handleSave = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call when backend is ready
      // const updateData = {
      //   bonus_distribution_multiplier: Number(bonusDistributionMultiplier),
      //   refund_multiplier: Number(refundMultiplier),
      //   withdrawal_multiplier: Number(withdrawalMultiplier),
      // };
      // await AdminAPI.updateFeeSettings(updateData);
      showToast("success", "手續費設定已儲存");
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage || (error as any)?.message || "儲存失敗";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel (clear all inputs)
  const handleCancel = () => {
    setBonusDistributionMultiplier("1");
    setRefundMultiplier("1");
    setWithdrawalMultiplier("1");
    showToast("success", "已清除所有輸入");
  };

  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="bg-white border-admin-border h-20 px-6 py-4 flex items-center justify-between">
        <h1 className="tx-18 fw-l">手續費相關</h1>
      </div>

      <main className="px-6 py-4">
        <AdminActionButtons
          onRestore={handleRestore}
          onSave={handleSave}
          onClear={handleCancel}
          isLoading={isLoading}
          isLoadingRestore={isLoadingRestore}
        />

        <div className="space-y-6">
          <AdminFormSectionWithField
            title="1. 派發獎金轉帳費倍率"
            fieldProps={{
              type: "select",
              label: "倍率",
              options: FEE_MULTIPLIER_OPTIONS,
              value: bonusDistributionMultiplier,
              onChange: setBonusDistributionMultiplier,
              disabled: isLoading || isLoadingRestore,
              suffix: "mempool 建議手續費",
            }}
          />

          <AdminFormSectionWithField
            title="2. 退款轉帳費倍率"
            fieldProps={{
              type: "select",
              label: "倍率",
              options: FEE_MULTIPLIER_OPTIONS,
              value: refundMultiplier,
              onChange: setRefundMultiplier,
              disabled: isLoading || isLoadingRestore,
              suffix: "mempool 建議手續費",
            }}
          />

          <AdminFormSectionWithField
            title="3. 提款轉帳費倍率"
            fieldProps={{
              type: "select",
              label: "倍率",
              options: FEE_MULTIPLIER_OPTIONS,
              value: withdrawalMultiplier,
              onChange: setWithdrawalMultiplier,
              disabled: isLoading || isLoadingRestore,
              suffix: "mempool 建議手續費",
            }}
          />
        </div>
      </main>
    </div>
  );
}
