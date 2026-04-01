import { useState } from "react";

import { AdminAPI, type ApiResponse } from "@/api";
import type { ReferralCode } from "@/api/response";
import { useToast } from "@/components/base/Toast/useToast";
import { Button } from "antd";

interface Props {
  code: ReferralCode;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteReferralCodeModal({
  code,
  onClose,
  onSuccess,
}: Props) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const res = (await AdminAPI.deleteReferralCode(
        code.id,
      )) as unknown as ApiResponse<void>;
      if (res.success) {
        showToast("success", "已移除推薦碼");
        onSuccess();
      } else {
        showToast("error", res.message || "移除推薦碼失敗");
      }
    } catch (error: unknown) {
      const err = error as {
        isHandled?: boolean;
        apiMessage?: string;
        message?: string;
      };
      if (!err.isHandled) {
        showToast("error", err.apiMessage || err.message || "移除推薦碼失敗");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[360px] rounded-lg bg-white p-6 shadow-lg md:w-[540px]">
        <h2 className="mb-2 text-base font-semibold">移除推薦碼？</h2>
        <p className="text-secondary mb-6 text-sm">
          請問您確定要移除這個推薦碼嗎？
        </p>

        <div className="flex justify-end gap-3">
          <Button
            autoInsertSpace={false}
            onClick={onClose}
            disabled={isLoading}
            size="large"
            className="rounded-xl!"
          >
            取消
          </Button>
          <Button
            type="primary"
            autoInsertSpace={false}
            onClick={handleDelete}
            disabled={isLoading}
            loading={isLoading}
            size="large"
            className="rounded-xl! [&.ant-btn-disabled]:border-[#ff8904]! [&.ant-btn-disabled]:bg-[#ff8904]! [&.ant-btn-disabled]:text-white! [&.ant-btn-disabled]:opacity-50!"
          >
            移除
          </Button>
        </div>
      </div>
    </div>
  );
}
