import { useState } from "react";
import { useToast } from "@/components/base/Toast/useToast";
import { AdminActionButtons } from "@/admin/component/AdminActionButtons";
import { AdminFormSectionWithField } from "@/admin/component/AdminFormSection";

export default function AdminRefundsPage() {
  const { showToast } = useToast();

  // State for form inputs
  const [refundServiceFeePercent, setRefundServiceFeePercent] =
    useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);

  // Handle restore (get from API)
  const handleRestore = async () => {
    try {
      setIsLoadingRestore(true);
      // TODO: Implement API call when backend is ready
      // const response = await AdminAPI.getRefundSettings();
      showToast("success", "已恢復退款設定");
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message ||
        "獲取退款設定失敗";
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
      //   refund_service_fee_percent: Number(refundServiceFeePercent) || 0,
      // };
      // await AdminAPI.updateRefundSettings(updateData);
      showToast("success", "退款設定已儲存");
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
    setRefundServiceFeePercent("0");
    showToast("success", "已清除所有輸入");
  };

  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="bg-white border-admin-border h-20 px-6 py-4 flex items-center justify-between">
        <h1 className="tx-18 fw-l">退款相關</h1>
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
            title="1. 退款服務費比例"
            fieldProps={{
              type: "input",
              inputType: "number",
              step: "0.1",
              label: "服務費比例",
              value: refundServiceFeePercent,
              onChange: setRefundServiceFeePercent,
              disabled: isLoading || isLoadingRestore,
              suffix: "%",
            }}
          />
        </div>
      </main>
    </div>
  );
}
