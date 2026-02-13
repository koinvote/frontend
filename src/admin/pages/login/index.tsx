import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import AdminLogin from "@/admin/component/AdminLogin";
import { AdminAPI } from "@/api";
import { setAdminToken } from "@/api/http";
import { useToast } from "@/components/base/Toast/useToast";
import systemConsts from "@/consts";
import { truncateAddress } from "@/utils/address";

/**
 * Generate a random 32-character string
 */
function generateRandomHashKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const adminAddress = truncateAddress(systemConsts.ADMIN_ADDRESS);

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [hashKey, setHashKey] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate hash key and plaintext on mount
  useEffect(() => {
    const randomHashKey = generateRandomHashKey();
    setHashKey(randomHashKey);
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", `${label} 已複製到剪貼簿`);
    } catch {
      showToast("error", `${label} 複製失敗`);
    }
  };

  const handleLogin = async () => {
    if (!signature.trim()) {
      showToast("error", "請輸入簽名");
      return;
    }

    try {
      setIsLoading(true);

      // Note: axios interceptor returns response.data at runtime, but types may still reflect AxiosResponse
      const loginRes = (await AdminAPI.login({
        address: systemConsts.ADMIN_ADDRESS,
        plaintext: hashKey,
        signature,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;

      const envelope =
        loginRes?.success !== undefined ? loginRes : loginRes?.data;

      if (envelope?.success && envelope?.data?.token) {
        // Save token to localStorage
        setAdminToken(envelope.data.token);
        showToast("success", "登入成功");

        // Navigate to reward-rules page
        navigate("/admin/reward-rules");
      } else {
        const errorMessage = envelope?.message || "登入失敗";
        showToast("error", errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage || (error as any)?.message || "登入失敗";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLogin
      adminAddress={adminAddress}
      hashKey={hashKey}
      signature={signature}
      isLoading={isLoading}
      onSignatureChange={setSignature}
      onCopy={handleCopy}
      onLogin={handleLogin}
    />
  );
}
