import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { AdminActionButtons } from "@/admin/component/AdminActionButtons";
import type { SelectOption } from "@/admin/component/AdminFormField";
import { AdminFormSectionWithField } from "@/admin/component/AdminFormSection";
import { StepUpDialog } from "@/admin/component/StepUpDialog";
import { useSystemParametersSave } from "@/admin/hooks/useSystemParametersSave";
import { AdminAPI } from "@/api";
import { useToast } from "@/components/base/Toast/useToast";

// Confirmation targets, in blocks, looked up against the self-hosted node's
// own fee estimator. These replaced a set of multipliers applied to a constant
// in the config file: "1.25x" multiplied a number the market had no say in,
// and the label next to it claimed the base was a mempool recommendation,
// which nothing in the system ever asked for. Worse, the product was truncated
// to a whole number, so against a base of 2 the three options produced only
// two distinct fees - 1.25x and 1x cost exactly the same.
//
// A target says what it does. The estimator is keyed by it.
const FEE_TARGET_OPTIONS: SelectOption[] = [
  { value: "", label: "請選擇" },
  { value: "1", label: "1 個區塊（最快，約 10 分鐘）" },
  { value: "3", label: "3 個區塊（約 30 分鐘）" },
  { value: "6", label: "6 個區塊（約 1 小時）" },
  { value: "12", label: "12 個區塊（約 2 小時）" },
  { value: "25", label: "25 個區塊（約 4 小時，最省）" },
];

// Zod schema for form validation
const feeSchema = z.object({
  payoutFeeTargetBlocks: z.string().min(1, "必填欄位"),
  refundFeeTargetBlocks: z.string().min(1, "必填欄位"),
  withdrawalFeeTargetBlocks: z.string().min(1, "必填欄位"),
  maxPayoutFeePercentage: z
    .string()
    .min(1, "必填欄位")
    .refine((v) => Number(v) > 0 && Number(v) <= 50, "請輸入 0.1 到 50 之間"),
});

type FeeFormData = z.infer<typeof feeSchema>;

const defaultValues: FeeFormData = {
  payoutFeeTargetBlocks: "6",
  refundFeeTargetBlocks: "12",
  withdrawalFeeTargetBlocks: "3",
  maxPayoutFeePercentage: "5",
};

export default function AdminFeesPage() {
  const { showToast } = useToast();
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);

  // The form values behind the staged payload, promoted to "saved" only once
  // the write actually lands.
  const pendingFormRef = useRef<FeeFormData | null>(null);

  const { stepUpOpen, isSaving, requestSave, submitWithProof, cancel } =
    useSystemParametersSave({
      successMessage: "手續費設定已儲存",
      onSaved: () => {
        if (pendingFormRef.current) {
          initialDataRef.current = pendingFormRef.current;
        }
      },
    });

  // The save button and the form fields both track the in-flight write.
  const isLoading = isSaving;

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
          payoutFeeTargetBlocks:
            data.payout_fee_target_blocks?.toString() || "6",
          refundFeeTargetBlocks:
            data.refund_fee_target_blocks?.toString() || "12",
          withdrawalFeeTargetBlocks:
            data.withdrawal_fee_target_blocks?.toString() || "3",
          maxPayoutFeePercentage:
            data.max_payout_fee_percentage?.toString() || "5",
        };
        initialDataRef.current = formData;
        reset(formData);
      } else {
        const errorMessage = envelope?.message || "獲取手續費設定失敗";
        showToast("error", errorMessage);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(error as any)?.isHandled) {
        const errorMessage =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.apiMessage ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.message ||
          "獲取手續費設定失敗";
        showToast("error", errorMessage);
      }
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
  //
  // Two steps now: the payload is staged, the step-up dialog collects a fresh
  // wallet signature or passkey assertion, and both are sent together. The
  // backend refuses this write without one.
  const onSubmit = (data: FeeFormData) => {
    pendingFormRef.current = data;
    requestSave({
      payout_fee_target_blocks: Number(data.payoutFeeTargetBlocks) || 6,
      refund_fee_target_blocks: Number(data.refundFeeTargetBlocks) || 12,
      withdrawal_fee_target_blocks: Number(data.withdrawalFeeTargetBlocks) || 3,
      max_payout_fee_percentage: Number(data.maxPayoutFeePercentage) || 5,
    });
  };

  // Handle clear (clear all inputs)
  const handleClear = () => {
    reset({
      payoutFeeTargetBlocks: "",
      refundFeeTargetBlocks: "",
      withdrawalFeeTargetBlocks: "",
      maxPayoutFeePercentage: "",
    });
    showToast("success", "已清除所有輸入");
  };

  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-neutral-200 bg-white px-4 py-4 md:h-20 md:flex-nowrap md:px-6">
        <h1 className="tx-18 fw-l">手續費相關</h1>
      </div>

      <main className="px-4 py-4 md:px-6">
        <AdminActionButtons
          onRestore={handleRestore}
          onSave={handleSubmit(onSubmit)}
          onClear={handleClear}
          isLoading={isLoading}
          isLoadingRestore={isLoadingRestore}
        />

        <form className="space-y-6">
          <Controller
            name="payoutFeeTargetBlocks"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="1. 派發獎金目標確認區塊數"
                error={errors.payoutFeeTargetBlocks?.message}
                fieldProps={{
                  type: "select",
                  label: "目標確認區塊數",
                  options: FEE_TARGET_OPTIONS,
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "費率由自架節點即時估算",
                }}
              />
            )}
          />

          <Controller
            name="refundFeeTargetBlocks"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="2. 退款目標確認區塊數"
                error={errors.refundFeeTargetBlocks?.message}
                fieldProps={{
                  type: "select",
                  label: "目標確認區塊數",
                  options: FEE_TARGET_OPTIONS,
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "費率由自架節點即時估算",
                }}
              />
            )}
          />

          <Controller
            name="withdrawalFeeTargetBlocks"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="3. 提款目標確認區塊數"
                error={errors.withdrawalFeeTargetBlocks?.message}
                fieldProps={{
                  type: "select",
                  label: "目標確認區塊數",
                  options: FEE_TARGET_OPTIONS,
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "費率由自架節點即時估算",
                }}
              />
            )}
          />
          <Controller
            name="maxPayoutFeePercentage"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="4. 礦工費上限（佔獎池百分比）"
                error={errors.maxPayoutFeePercentage?.message}
                fieldProps={{
                  type: "input",
                  inputType: "number",
                  step: "0.1",
                  label: "上限百分比",
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "% ；超過則延後派獎，等費率下降後自動完成",
                }}
              />
            )}
          />
        </form>
      </main>

      <StepUpDialog
        open={stepUpOpen}
        purpose="system_parameters"
        title="確認手續費設定"
        description="手續費設定會決定每一筆派獎、退款與提領實際支付的礦工費，所以除了目前的登入狀態之外，還需要一次即時的驗證。"
        confirmLoading={isSaving}
        onProof={submitWithProof}
        onCancel={cancel}
      />
    </div>
  );
}
