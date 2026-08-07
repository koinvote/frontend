import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { AdminActionButtons } from "@/admin/component/AdminActionButtons";
import { AdminFormSectionWithField } from "@/admin/component/AdminFormSection";
import { StepUpDialog } from "@/admin/component/StepUpDialog";
import { useSystemParametersSave } from "@/admin/hooks/useSystemParametersSave";
import { AdminAPI } from "@/api";
import { useToast } from "@/components/base/Toast/useToast";

// Zod schema for form validation
const refundSchema = z.object({
  refundServiceFeePercent: z
    .string()
    .min(1, "必填欄位")
    .refine((val) => !isNaN(Number(val)), "必須為數字"),
});

type RefundFormData = z.infer<typeof refundSchema>;

const defaultValues: RefundFormData = {
  refundServiceFeePercent: "",
};

export default function AdminRefundsPage() {
  const { showToast } = useToast();
  // The form values behind the staged payload, promoted to "saved" only once
  // the write actually lands.
  const pendingFormRef = useRef<RefundFormData | null>(null);

  const { stepUpOpen, isSaving, requestSave, submitWithProof, cancel } =
    useSystemParametersSave({
      successMessage: "退款設定已儲存",
      onSaved: () => {
        if (pendingFormRef.current) {
          initialDataRef.current = pendingFormRef.current;
        }
      },
    });

  // The save button and the form fields both track the in-flight write.
  const isLoading = isSaving;
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);

  // Store initial API data for restore
  const initialDataRef = useRef<RefundFormData | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
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
        const formData: RefundFormData = {
          refundServiceFeePercent:
            data.refund_service_fee_percentage?.toString() || "0",
        };
        initialDataRef.current = formData;
        reset(formData);
      } else {
        const errorMessage = envelope?.message || "獲取退款設定失敗";
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
          "獲取退款設定失敗";
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
      showToast("success", "已恢復退款設定");
    } else {
      showToast("error", "無法恢復，請重新整理頁面");
    }
  };

  // Handle save (update to API)
  //
  // Two steps now: the payload is staged, the step-up dialog collects a fresh
  // wallet signature or passkey assertion, and both are sent together. The
  // backend refuses this write without one.
  const onSubmit = (data: RefundFormData) => {
    pendingFormRef.current = data;
    requestSave({
      refund_service_fee_percentage: Number(data.refundServiceFeePercent) || 0,
    });
  };

  // Handle clear (clear all inputs)
  const handleClear = () => {
    reset(defaultValues);
    showToast("success", "已清除所有輸入");
  };

  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-neutral-200 bg-white px-4 py-4 md:h-20 md:flex-nowrap md:px-6">
        <h1 className="tx-18 fw-l">退款相關</h1>
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
            name="refundServiceFeePercent"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="1. 退款服務費比例"
                error={errors.refundServiceFeePercent?.message}
                fieldProps={{
                  type: "input",
                  inputType: "number",
                  step: "0.1",
                  label: "服務費比例",
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "%",
                }}
              />
            )}
          />
        </form>
      </main>

      <StepUpDialog
        open={stepUpOpen}
        purpose="system_parameters"
        title="確認退款設定"
        description="退款服務費會從每一筆退款中扣除，所以除了目前的登入狀態之外，還需要一次即時的驗證。"
        confirmLoading={isSaving}
        onProof={submitWithProof}
        onCancel={cancel}
      />
    </div>
  );
}
