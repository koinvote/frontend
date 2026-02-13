import { useQuery } from "@tanstack/react-query";
import { Button, Modal } from "antd";
import { useState } from "react";

import { AdminFormSection } from "@/admin/component/AdminFormSection";
import { AdminAPI, type ApiResponse } from "@/api";
import type { WithdrawalInfoRes } from "@/api/response";
import CheckCircle from "@/assets/icons/check_circle.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import Logo from "@/assets/logo/logo.svg?react";
import { toast } from "@/components/base/Toast/toast";
import systemConsts from "@/consts";
import { truncateAddress } from "@/utils/address";

const adminAddress = truncateAddress(systemConsts.ADMIN_ADDRESS);

function DisplayField({
  label,
  value,
  variant = "default",
  copyable = false,
}: {
  label: string;
  value: string;
  variant?: "default" | "highlight";
  copyable?: boolean;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast("success", `${label} 已複製到剪貼簿`);
    } catch {
      toast("error", `${label} 複製失敗`);
    }
  };

  const bgClass = variant === "highlight" ? "bg-admin-surface" : "bg-admin-bg";

  return (
    <div>
      <label className="fw-m text-primary mb-1 block text-sm">{label}</label>
      <div
        className={`flex items-center justify-between rounded-lg border border-neutral-200 ${bgClass} px-3 py-4`}
      >
        <span className="text-secondary min-w-0 font-mono text-sm break-all">
          {value}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-secondary hover:text-primary ml-2 shrink-0 cursor-pointer"
          >
            <CopyIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

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

  // Modal states
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [modalData, setModalData] = useState<WithdrawalInfoRes | null>(null);
  const [signature, setSignature] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const handleWithdrawal = async () => {
    setIsFetchingInfo(true);
    try {
      const res =
        (await AdminAPI.getWithdrawalInfo()) as unknown as ApiResponse<WithdrawalInfoRes>;
      if (res.success) {
        setModalData(res.data);
        setSignature("");
        setSignatureError("");
        setSignModalOpen(true);
      } else {
        toast("error", res.message || "取得提款資訊失敗");
      }
    } catch {
      toast("error", "取得提款資訊失敗");
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleWithdraw = async () => {
    if (!modalData || !adminAddress.trim() || !signature.trim()) return;

    setIsSubmitting(true);
    setSignatureError("");
    try {
      const res = (await AdminAPI.createWithdrawal({
        admin_address: adminAddress.trim(),
        hash_key: modalData.hash_key,
        signature: signature.trim(),
      })) as unknown as ApiResponse<unknown>;

      if (res.success) {
        setSignModalOpen(false);
        setSuccessModalOpen(true);
      } else {
        setSignatureError("Signature incorrect");
      }
    } catch {
      setSignatureError("Signature incorrect");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleUploadAddress = () => {
  //   // TODO: Implement upload address logic
  // };

  return (
    <div>
      <div className="flex h-20 items-center justify-between border-neutral-200 bg-white px-6 py-4">
        <h1 className="tx-18 fw-l">提款相關</h1>
      </div>

      <main className="px-6 py-4">
        <div className="space-y-6">
          {/* 維護模式開關 */}
          {/* <AdminFormSection title="維護模式開關">
            <AdminToggle
              value={maintenanceMode}
              onChange={setMaintenanceMode}
            />
          </AdminFormSection> */}

          {/* 提款 */}
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
                  onClick={handleWithdrawal}
                  disabled={isFetchingInfo}
                >
                  {isFetchingInfo ? "載入中..." : "提款"}
                </Button>
              </div>
            </div>
          </AdminFormSection>

          {/* 更新提款地址 */}
          {/* <AdminFormSection title="更新提款地址">
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
          </AdminFormSection> */}
        </div>
      </main>

      {/* Sign Modal */}
      <Modal
        open={signModalOpen}
        centered
        footer={null}
        closable
        onCancel={() => setSignModalOpen(false)}
        maskClosable={false}
        width={480}
      >
        {modalData && (
          <div className="flex flex-col gap-5 py-2">
            <div className="mb-6 flex items-center justify-center gap-2 text-center">
              <div>
                <Logo className="h-8 w-8" />
              </div>
              <div>
                <div className="fw-m text-base">Withdraw</div>
                <div className="text-secondary text-sm">Confirm & Sign</div>
              </div>
            </div>

            {/* Fields */}
            <DisplayField
              label="Withdraw Amount"
              value={`${modalData.withdrawable_amount_satoshi} Sats`}
            />

            <DisplayField
              label="On-Chain Transaction Fee"
              value={`${modalData.fee_satoshi} Sats`}
            />

            <DisplayField
              label="Withdraw Address"
              value={modalData.withdraw_address}
              copyable
            />

            <DisplayField
              label="Admin Address"
              value={adminAddress}
              variant="highlight"
            />

            <DisplayField
              label="Hash Key"
              value={modalData.hash_key}
              variant="highlight"
              copyable
            />

            {/* Signature - input */}
            <div>
              <label className="fw-m mb-1 block text-sm text-black">
                Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  if (signatureError) setSignatureError("");
                }}
                placeholder="Paste signature here"
                className={`text-secondary w-full rounded-lg border px-3 py-4 font-mono text-sm outline-none ${
                  signatureError
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:border-accent border-neutral-200"
                }`}
              />
              {signatureError && (
                <p className="mt-1 text-xs text-red-500">{signatureError}</p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="primary"
              size="large"
              onClick={handleWithdraw}
              disabled={
                isSubmitting || !adminAddress.trim() || !signature.trim()
              }
            >
              {isSubmitting ? "Submitting..." : "Withdraw"}
            </Button>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        open={successModalOpen}
        centered
        footer={null}
        closable
        onCancel={() => setSuccessModalOpen(false)}
        maskClosable={false}
        width={400}
      >
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle className="mb-1" />
          <p className="fw-m text-lg text-orange-500">Broadcast Successful</p>
          <p className="text-secondary text-base wrap-break-word">
            Your withdraw has been broadcast successfully
          </p>
        </div>
      </Modal>
    </div>
  );
}
