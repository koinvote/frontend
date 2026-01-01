import { useState } from "react";
import { AdminAPI } from "@/api";
import { useToast } from "@/components/base/Toast/useToast";
import { AdminActionButtons } from "@/admin/component/AdminActionButtons";
import { AdminFormSection } from "@/admin/component/AdminFormSection";
import { AdminFormField } from "@/admin/component/AdminFormField";

export default function AdminRewardRulesPage() {
  const { showToast } = useToast();

  // State for form inputs
  const [freeHours, setFreeHours] = useState<string>("");
  const [satsPerExtraWinner, setSatsPerExtraWinner] = useState<string>("");
  const [satsPerDurationHour, setSatsPerDurationHour] = useState<string>("");
  const [platformFeePercent, setPlatformFeePercent] = useState<string>("");
  const [minPayoutSats, setMinPayoutSats] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);

  // Handle restore (get from API)
  const handleRestore = async () => {
    try {
      setIsLoadingRestore(true);
      // AdminAPI.getSystemParameters returns a function, call it with no params
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getApiFunc = AdminAPI.getSystemParameters as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (await getApiFunc()) as any;

      const envelope =
        response?.success !== undefined ? response : response?.data;

      if (envelope?.success && envelope?.data) {
        const data = envelope.data;
        setFreeHours(data.free_hours?.toString() || "0");
        setSatsPerExtraWinner(data.sats_per_extra_winner?.toString() || "0");
        setSatsPerDurationHour(data.sats_per_duration_hour?.toString() || "0");
        setPlatformFeePercent(data.platform_fee_percent?.toString() || "0");
        setMinPayoutSats(data.min_payout_sats?.toString() || "0");
        showToast("success", "已恢復系統參數");
      } else {
        const errorMessage = envelope?.message || "獲取系統參數失敗";
        showToast("error", errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message ||
        "獲取系統參數失敗";
      showToast("error", errorMessage);
    } finally {
      setIsLoadingRestore(false);
    }
  };

  // Handle save (update to API)
  const handleSave = async () => {
    try {
      setIsLoading(true);

      const updateData = {
        min_reward_sats: 0, // Not in the form, but required by API
        sats_per_extra_winner: Number(satsPerExtraWinner) || 0,
        sats_per_duration_hour: Number(satsPerDurationHour) || 0,
        platform_fee_percent: Number(platformFeePercent) || 0,
        min_payout_sats: Number(minPayoutSats) || 0,
        free_hours: Number(freeHours) || 0,
      };

      // AdminAPI.updateSystemParameters returns a function, call it with updateData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateApiFunc = AdminAPI.updateSystemParameters as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (await updateApiFunc(updateData)) as any;

      const envelope =
        response?.success !== undefined ? response : response?.data;

      if (envelope?.success) {
        showToast("success", "系統參數已儲存");
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

  // Handle cancel (clear all inputs)
  const handleCancel = () => {
    setFreeHours("0");
    setSatsPerExtraWinner("0");
    setSatsPerDurationHour("0");
    setPlatformFeePercent("0");
    setMinPayoutSats("0");
    showToast("success", "已清除所有輸入");
  };

  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="bg-white border-admin-border h-20 px-6 py-4 flex items-center justify-between">
        <h1 className="tx-18 fw-l">獎金與派獎規則</h1>
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
          <AdminFormSection title="1. 免費時間">
            <AdminFormField
              type="input"
              inputType="number"
              label="所有事件享有免費"
              value={freeHours}
              onChange={setFreeHours}
              disabled={isLoading || isLoadingRestore}
              suffix="小時"
            />
          </AdminFormSection>

          <AdminFormSection title="2. 中獎地址數 / 獎金金額比例">
            <div className="flex flex-wrap items-center gap-3 max-w-xl tx-14">
              <span>每</span>
              <input
                type="number"
                className="w-24 border border-admin-border rounded-[4px] px-3 py-2 bg-white"
                placeholder="輸入"
                value={satsPerExtraWinner}
                onChange={(e) => setSatsPerExtraWinner(e.target.value)}
                disabled={isLoading || isLoadingRestore}
              />
              <span>Sats 對應 1 地址</span>
            </div>
          </AdminFormSection>

          <AdminFormSection title="3. 活動最長存續時間 / 獎金金額比例">
            <div className="flex flex-wrap items-center gap-3 max-w-xl tx-14">
              <span>每</span>
              <input
                type="number"
                className="w-24 border border-admin-border rounded-[4px] px-3 py-2 bg-white"
                placeholder="輸入"
                value={satsPerDurationHour}
                onChange={(e) => setSatsPerDurationHour(e.target.value)}
                disabled={isLoading || isLoadingRestore}
              />
              <span>Sats 對應 1 小時</span>
            </div>
          </AdminFormSection>

          <AdminFormSection title="4. 設定平台服務費比例">
            <AdminFormField
              type="input"
              inputType="number"
              step="0.1"
              label="服務費比例"
              value={platformFeePercent}
              onChange={setPlatformFeePercent}
              disabled={isLoading || isLoadingRestore}
              suffix="%"
            />
          </AdminFormSection>

          <AdminFormSection title="5. 最低派獎門檻（Dust Rule）">
            <AdminFormField
              type="input"
              inputType="number"
              label="最低派獎門檻"
              value={minPayoutSats}
              onChange={setMinPayoutSats}
              disabled={isLoading || isLoadingRestore}
              suffix="sats"
            />
          </AdminFormSection>
        </div>
      </main>
    </div>
  );
}
