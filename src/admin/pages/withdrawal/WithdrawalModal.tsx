import { Button, Modal } from "antd";
import { useState } from "react";

import { AdminAPI, type ApiResponse } from "@/api";
import type { WithdrawalInfoRes } from "@/api/response";
import CheckCircle from "@/assets/icons/check_circle.svg?react";
import Logo from "@/assets/logo/logo.svg?react";
import systemConsts from "@/consts";
import { truncateAddress } from "@/utils/address";

import { DisplayField } from "./DisplayField";

const adminAddress = truncateAddress(systemConsts.ADMIN_ADDRESS);

interface SignModalProps {
  open: boolean;
  data: WithdrawalInfoRes | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SignModal({ open, data, onClose, onSuccess }: SignModalProps) {
  const [signature, setSignature] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!data || !adminAddress.trim() || !signature.trim()) return;

    setIsSubmitting(true);
    setSignatureError("");
    try {
      const res = (await AdminAPI.createWithdrawal({
        admin_address: adminAddress.trim(),
        hash_key: data.hash_key,
        signature: signature.trim(),
      })) as unknown as ApiResponse<unknown>;

      if (res.success) {
        setSignature("");
        setSignatureError("");
        onSuccess();
      } else {
        setSignatureError("Signature incorrect");
      }
    } catch {
      setSignatureError("Signature incorrect");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSignature("");
    setSignatureError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      centered
      footer={null}
      closable
      onCancel={handleClose}
      maskClosable={false}
      width={480}
    >
      {data && (
        <div className="flex flex-col gap-5 py-2">
          <div className="mb-6 flex items-center justify-center gap-2 text-center">
            <div>
              <Logo className="h-8 w-8" />
            </div>
            <div className="text-left">
              <div className="fw-m text-base">Withdraw</div>
              <div className="text-secondary text-sm">Confirm & Sign</div>
            </div>
          </div>

          <DisplayField
            label="Withdraw Amount"
            value={`${data.withdrawable_amount_satoshi} Sats`}
          />

          <DisplayField
            label="On-Chain Transaction Fee"
            value={`${data.fee_satoshi} Sats`}
          />

          <DisplayField
            label="Withdraw Address"
            value={data.withdraw_address}
            copyable
          />

          <DisplayField
            label="Admin Address"
            value={adminAddress}
            variant="highlight"
          />

          <DisplayField
            label="Hash Key"
            value={data.hash_key}
            variant="highlight"
            copyable
          />

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

          <Button
            type="primary"
            size="large"
            onClick={handleWithdraw}
            disabled={isSubmitting || !adminAddress.trim() || !signature.trim()}
          >
            {isSubmitting ? "Submitting..." : "Withdraw"}
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function SuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      centered
      footer={null}
      closable
      onCancel={onClose}
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
  );
}
