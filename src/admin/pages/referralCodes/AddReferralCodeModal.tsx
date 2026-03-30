import { useState } from "react";

import { AdminAPI, type ApiResponse } from "@/api";
import { useToast } from "@/components/base/Toast/useToast";
import { Button, Divider } from "antd";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddReferralCodeModal({ onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const codeError =
    code.length > 0 && !/^[a-zA-Z0-9]+$/.test(code)
      ? "推薦碼只能包含英文字母及數字"
      : null;

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed || codeError) return;

    try {
      setIsLoading(true);
      const res = (await AdminAPI.createReferralCode({
        code: trimmed,
      })) as unknown as ApiResponse<void>;
      if (res.success) {
        showToast("success", "已新增推薦碼");
        onSuccess();
      } else {
        showToast("error", res.message || "新增推薦碼失敗");
      }
    } catch (error: unknown) {
      const err = error as {
        isHandled?: boolean;
        apiMessage?: string;
        message?: string;
      };
      if (!err.isHandled) {
        showToast("error", err.apiMessage || err.message || "新增推薦碼失敗");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[360px] rounded-lg bg-white shadow-lg md:w-[540px]">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-base font-semibold">新增推薦碼</h2>
          <Button type="text" size="small" onClick={onClose}>
            ✕
          </Button>
        </div>

        <Divider className="m-0!" />

        <div className="p-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            推薦碼 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full rounded-xl border px-3 py-2 text-sm transition-colors outline-none ${
              codeError
                ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                : "border-neutral-300 focus:border-[#F5851F] focus:ring-1 focus:ring-[#F5851F]"
            }`}
            placeholder="推薦碼"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
          />
          {codeError && (
            <p className="mt-1 text-xs text-red-500">{codeError}</p>
          )}
        </div>

        <Divider className="m-0!" />

        <div className="p-5">
          <Button
            type="primary"
            size="large"
            block
            autoInsertSpace={false}
            onClick={handleSubmit}
            disabled={isLoading || !code.trim() || !!codeError}
            loading={isLoading}
            className="rounded-xl! [&.ant-btn-disabled]:border-[#ff8904]! [&.ant-btn-disabled]:bg-[#ff8904]! [&.ant-btn-disabled]:text-white! [&.ant-btn-disabled]:opacity-50!"
          >
            新增
          </Button>
        </div>
      </div>
    </div>
  );
}
