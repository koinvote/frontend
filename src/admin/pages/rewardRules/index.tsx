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
const rewardRulesSchema = z.object({
  freeHours: z
    .string()
    .min(1, "必填欄位")
    .refine((val) => !isNaN(Number(val)), "必須為數字"),
  satsPerExtraWinner: z
    .string()
    .min(1, "必填欄位")
    .refine((val) => !isNaN(Number(val)), "必須為數字"),
  satsPerDurationHour: z
    .string()
    .min(1, "必填欄位")
    .refine((val) => !isNaN(Number(val)), "必須為數字"),
  platformFeePercent: z
    .string()
    .min(1, "必填欄位")
    .refine((val) => !isNaN(Number(val)), "必須為數字"),
  minPayoutSats: z
    .string()
    .min(1, "必填欄位")
    .refine((val) => !isNaN(Number(val)), "必須為數字"),
});

type RewardRulesFormData = z.infer<typeof rewardRulesSchema>;

const defaultValues: RewardRulesFormData = {
  freeHours: "",
  satsPerExtraWinner: "",
  satsPerDurationHour: "",
  platformFeePercent: "",
  minPayoutSats: "",
};

export default function AdminRewardRulesPage() {
  const { showToast } = useToast();
  // The form values behind the staged payload, promoted to "saved" only once
  // the write actually lands.
  const pendingFormRef = useRef<RewardRulesFormData | null>(null);

  const { stepUpOpen, isSaving, requestSave, submitWithProof, cancel } =
    useSystemParametersSave({
      successMessage: "系統參數已儲存",
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
  const initialDataRef = useRef<RewardRulesFormData | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RewardRulesFormData>({
    resolver: zodResolver(rewardRulesSchema),
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
        const formData: RewardRulesFormData = {
          freeHours: data.free_hours?.toString() || "0",
          satsPerExtraWinner:
            data.satoshi_per_extra_winner?.toString() ||
            data.sats_per_extra_winner?.toString() ||
            "0",
          satsPerDurationHour:
            data.satoshi_per_duration_hour?.toString() ||
            data.sats_per_duration_hour?.toString() ||
            "0",
          platformFeePercent:
            data.platform_fee_percentage?.toString() ||
            data.platform_fee_percent?.toString() ||
            "0",
          minPayoutSats:
            data.dust_threshold_satoshi?.toString() ||
            data.min_payout_sats?.toString() ||
            "0",
        };
        initialDataRef.current = formData;
        reset(formData);
      } else {
        const errorMessage = envelope?.message || "獲取系統參數失敗";
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
          "獲取系統參數失敗";
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
      showToast("success", "已恢復系統參數");
    } else {
      showToast("error", "無法恢復，請重新整理頁面");
    }
  };

  // Handle save (update to API)
  //
  // Two steps now: the payload is staged, the step-up dialog collects a fresh
  // wallet signature or passkey assertion, and both are sent together. The
  // backend refuses this write without one.
  const onSubmit = (data: RewardRulesFormData) => {
    pendingFormRef.current = data;
    requestSave({
      satoshi_per_extra_winner: Number(data.satsPerExtraWinner) || 0,
      satoshi_per_duration_hour: Number(data.satsPerDurationHour) || 0,
      platform_fee_percentage: Number(data.platformFeePercent) || 0,
      dust_threshold_satoshi: Number(data.minPayoutSats) || 0,
      free_hours: Number(data.freeHours) || 0,
    });
  };

  // Handle clear (clear all inputs)
  const handleClear = () => {
    reset(defaultValues);
    showToast("success", "已清除所有輸入");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-neutral-200 bg-white px-4 py-4 md:h-20 md:flex-nowrap md:px-6">
        <h1 className="tx-18 fw-l">獎金與派獎規則</h1>
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
            name="freeHours"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="1. 免費時間"
                error={errors.freeHours?.message}
                fieldProps={{
                  type: "input",
                  inputType: "number",
                  label: "所有事件享有免費",
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "小時",
                }}
              />
            )}
          />

          <Controller
            name="satsPerExtraWinner"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="2. 中獎地址數 / 獎金金額比例"
                error={errors.satsPerExtraWinner?.message}
                fieldProps={{
                  type: "input",
                  inputType: "number",
                  label: "每",
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "Sats 對應 1 地址",
                }}
              />
            )}
          />

          <Controller
            name="satsPerDurationHour"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="3. 活動最長存續時間 / 獎金金額比例"
                error={errors.satsPerDurationHour?.message}
                fieldProps={{
                  type: "input",
                  inputType: "number",
                  label: "每",
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "Sats 對應 1 小時",
                }}
              />
            )}
          />

          <Controller
            name="platformFeePercent"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="4. 設定平台服務費比例"
                error={errors.platformFeePercent?.message}
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

          <Controller
            name="minPayoutSats"
            control={control}
            render={({ field }) => (
              <AdminFormSectionWithField
                title="5. 最低派獎門檻（Dust Rule）"
                error={errors.minPayoutSats?.message}
                fieldProps={{
                  type: "input",
                  inputType: "number",
                  label: "最低派獎門檻",
                  value: field.value,
                  onChange: field.onChange,
                  disabled: isLoading || isLoadingRestore,
                  suffix: "sats",
                }}
              />
            )}
          />
        </form>
      </main>

      <StepUpDialog
        open={stepUpOpen}
        purpose="system_parameters"
        title="確認獎金與派獎規則"
        description="這些參數決定每一場活動的定價、平台費與派獎門檻，所以除了目前的登入狀態之外，還需要一次即時的驗證。"
        confirmLoading={isSaving}
        onProof={submitWithProof}
        onCancel={cancel}
      />
    </div>
  );
}
