import { useState } from "react";
import { Button } from "@/components/base/Button";
import { AdminFormSection } from "@/admin/component/AdminFormSection";
import { AdminToggle } from "@/admin/component/AdminToggle";

export default function AdminSystemSettingPage() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  // TODO: These will be populated from API when integration is implemented
  const withdrawalAddress = "";
  const platformAmount = "0";
  const withdrawableAmount = "0";

  const handleWithdrawal = () => {
    // TODO: Implement withdrawal logic
    console.log("Withdrawal:", withdrawalAddress);
  };

  const handleUploadAddress = () => {
    // TODO: Implement upload address logic
    console.log("Upload address");
  };

  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="bg-white border-admin-border h-20 px-6 py-4 flex items-center justify-between">
        <h1 className="tx-18 fw-l">系統設定</h1>
      </div>

      <main className="px-6 py-4">
        <div className="space-y-6">
          {/* 維護模式開關 */}
          <AdminFormSection title="維護模式開關">
            <AdminToggle
              value={maintenanceMode}
              onChange={setMaintenanceMode}
            />
          </AdminFormSection>

          {/* 提款 */}
          <AdminFormSection title="提款">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 max-w-xl">
                <label className="tx-14 text-admin-text-sub">平台金額:</label>
                <span className="tx-14 text-admin-text-main">
                  {platformAmount} Sats
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 max-w-xl">
                <label className="tx-14 text-admin-text-sub">可提領金額:</label>
                <span className="tx-14 text-admin-text-main">
                  {withdrawableAmount} Sats
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 max-w-xl">
                <label className="tx-14 text-admin-text-sub">提款至地址:</label>
                <span className="tx-14 text-admin-text-main font-mono break-all">
                  {withdrawalAddress || "未設定"}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  size="md"
                  text="sm"
                  tone="white"
                  appearance="solid"
                  onClick={handleWithdrawal}
                >
                  提款
                </Button>
              </div>
            </div>
          </AdminFormSection>

          {/* 更新提款地址 */}
          <AdminFormSection title="更新提款地址">
            <div className="pt-2">
              <Button
                size="md"
                text="sm"
                tone="white"
                appearance="solid"
                onClick={handleUploadAddress}
              >
                上傳
              </Button>
            </div>
          </AdminFormSection>
        </div>
      </main>
    </div>
  );
}
