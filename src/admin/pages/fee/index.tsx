import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { AdminActionButtons } from "@/admin/component/AdminActionButtons";
import type { SelectOption } from "@/admin/component/AdminFormField";
import { AdminFormSectionWithField } from "@/admin/component/AdminFormSection";
import { AdminAPI } from "@/api";
import { useToast } from "@/components/base/Toast/useToast";

const FEE_MULTIPLIER_OPTIONS: SelectOption[] = [
  { value: "", label: "請選擇" },
  { value: "0.75", label: "0.75X" },
  { value: "1", label: "1X" },
  { value: "1.25", label: "1.25X" },
];

// Zod schema for form validation
const feeSchema = z.object({
  payoutFeeMultiplier: z.string().min(1, "必填欄位"),
  refundFeeMultiplier: z.string().min(1, "必填欄位"),
  withdrawalFeeMultiplier: z.string().min(1, "必填欄位"),
});

type FeeFormData = z.infer<typeof feeSchema>;

const defaultValues: FeeFormData = {
  payoutFeeMultiplier: "1",
  refundFeeMultiplier: "1",
  withdrawalFeeMultiplier: "1",
};

export default function AdminFeesPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);

  // Store initial API data for restore
  const initialDataRef = useRef<FeeFormData | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues,
  });

  const fetchSystemParameters = useCallback(async () => {
    try {
      setIsLoadingRestore(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getApiFunc = AdminAPI.getSystemParameters as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (await getApiFunc()) as any;

      const envelope =
        response?.success !== undefined ? response : response?.data;

      if (envelope?.success && envelope?.data) {
        const data = envelope.data;
        const formData: FeeFormData = {
          payoutFeeMultiplier: data.payout_fee_multiplier?.toString() || "1",
          refundFeeMultiplier: data.refund_fee_multiplier?.toString() || "1",
          withdrawalFeeMultiplier:
            data.withdrawal_fee_multiplier?.toString() || "1",
        };
        initialDataRef.current = formData;
        reset(formData);
      } else {
        const errorMessage = envelope?.message || "獲取手續費設定失敗";
        showToast("error", errorMessage);
      }
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
  }, [reset, showToast]);

  // Fetch data on page load
  useEffect(() => {
    fetchSystemParameters();
  }, [fetchSystemParameters]);

  // Handle restore (restore to initial API data)
  const handleRestore = () => {
    if (initialDataRef.current) {
      reset(initialDataRef.current);
      showToast("success", "已恢復手續費設定");
    } else {
      showToast("error", "無法恢復，請重新整理頁面");
    }
  };

  // Handle save (update to API)
  const onSubmit = async (data: FeeFormData) => {
    try {
      setIsLoading(true);

      const updateData = {
        payout_fee_multiplier: Number(data.payoutFeeMultiplier) || 1,
        refund_fee_multiplier: Number(data.refundFeeMultiplier) || 1,
        withdrawal_fee_multiplier: Number(data.withdrawalFeeMultiplier) || 1,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateApiFunc = AdminAPI.updateSystemParameters as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (await updateApiFunc(updateData)) as any;

      const envelope =
        response?.success !== undefined ? response : response?.data;

      if (envelope?.success) {
        // Update initial data after successful save
        initialDataRef.current = data;
        showToast("success", "手續費設定已儲存");
      } else {
        const errorMessage = envelope?.message || "儲存失敗";
        showToast("error", errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage || (error as any)?.message || "儲存失敗";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clear (clear all inputs)
  const handleClear = () => {
    reset({
      payoutFeeMultiplier: "",
      refundFeeMultiplier: "",
      withdrawalFeeMultiplier: "",
    });
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
          onSave={handleSubmit(onSubmit)}
          onClear={handleClear}
          isLoading={isLoading}
          isLoadingRestore={isLoadingRestore}
        />

        <form className="space-y-6">
          <Controller
            name="payoutFeeMultiplier"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="1. 派發獎金轉帳費倍率"
                error={errors.payoutFeeMultiplier?.message}
                fieldProps={{
                  type: "select",
                  label: "倍率",
                  options: FEE_MULTIPLIER_OPTIONS,
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "mempool 建議手續費",
                }}
              />
            )}
          />

          <Controller
            name="refundFeeMultiplier"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="2. 退款轉帳費倍率"
                error={errors.refundFeeMultiplier?.message}
                fieldProps={{
                  type: "select",
                  label: "倍率",
                  options: FEE_MULTIPLIER_OPTIONS,
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "mempool 建議手續費",
                }}
              />
            )}
          />

          <Controller
            name="withdrawalFeeMultiplier"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="3. 提款轉帳費倍率"
                error={errors.withdrawalFeeMultiplier?.message}
                fieldProps={{
                  type: "select",
                  label: "倍率",
                  options: FEE_MULTIPLIER_OPTIONS,
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "mempool 建議手續費",
                }}
              />
            )}
          />
        </form>
      </main>
    </div>
  );
}
