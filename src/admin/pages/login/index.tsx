import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import AdminLogin from "@/admin/component/AdminLogin";
import { AdminAPI } from "@/api";
import { setAdminToken } from "@/api/http";
import { useToast } from "@/components/base/Toast/useToast";
import systemConsts from "@/consts";
import { truncateAddress } from "@/utils/address";

const adminAddress = truncateAddress(systemConsts.ADMIN_ADDRESS);

/** Seconds remaining until an RFC3339 instant, floored at zero. */
function secondsUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // The message to sign is now issued by the server instead of invented here.
  // The old client-side random string was never validated by the backend, so
  // any captured (address, plaintext, signature) triple stayed a working
  // credential forever.
  const [plaintext, setPlaintext] = useState<string>("");
  const [nonceTimestamp, setNonceTimestamp] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChallenge, setIsFetchingChallenge] = useState(false);

  const fetchChallenge = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        setIsFetchingChallenge(true);

        // The axios interceptor unwraps to response.data at runtime while the
        // types still describe an AxiosResponse, so both shapes are handled.
        const res = (await AdminAPI.loginChallenge({
          address: systemConsts.ADMIN_ADDRESS,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any;
        const envelope = res?.success !== undefined ? res : res?.data;

        if (envelope?.success && envelope?.data?.plaintext) {
          setPlaintext(envelope.data.plaintext);
          setNonceTimestamp(envelope.data.nonce_timestamp);
          setExpiresAt(envelope.data.expires_at);
          setSecondsLeft(secondsUntil(envelope.data.expires_at));
          setSignature("");
          if (!opts?.silent) {
            showToast("success", "已產生新的簽章訊息");
          }
          return true;
        }

        showToast("error", envelope?.message || "取得簽章訊息失敗");
        return false;
      } catch (error: unknown) {
        const message =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.apiMessage ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.message ||
          "取得簽章訊息失敗";
        showToast("error", message);
        return false;
      } finally {
        setIsFetchingChallenge(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    void fetchChallenge({ silent: true });
  }, [fetchChallenge]);

  // Countdown, so expiry is visible before the message is used rather than
  // discovered by a failed login.
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => setSecondsLeft(secondsUntil(expiresAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const isExpired = Boolean(expiresAt) && secondsLeft <= 0;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", `${label} 已複製到剪貼簿`);
    } catch {
      showToast("error", `${label} 複製失敗`);
    }
  };

  /**
   * Replace the challenge after a failed attempt.
   *
   * The server consumes the nonce before it verifies the signature, so a typo
   * in the signature burns the message exactly as thoroughly as a successful
   * login does. Retrying with the same one returns LOGIN_CHALLENGE_ALREADY_USED,
   * which reads like a bug. Fetching a fresh one is the only correct retry.
   */
  const replaceBurntChallenge = useCallback(async () => {
    const ok = await fetchChallenge({ silent: true });
    if (ok) {
      showToast("warn", "簽章訊息已失效，已重新產生，請重新簽名");
    }
  }, [fetchChallenge, showToast]);

  const handleLogin = async () => {
    if (!signature.trim()) {
      showToast("error", "請輸入簽名");
      return;
    }
    if (!plaintext || !nonceTimestamp) {
      showToast("error", "尚未取得簽章訊息，請重新產生");
      return;
    }
    if (isExpired) {
      showToast("error", "簽章訊息已過期，請重新產生");
      return;
    }

    try {
      setIsLoading(true);

      const loginRes = (await AdminAPI.login({
        address: systemConsts.ADMIN_ADDRESS,
        plaintext,
        nonce_timestamp: nonceTimestamp,
        signature,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;

      const envelope =
        loginRes?.success !== undefined ? loginRes : loginRes?.data;

      if (envelope?.success && envelope?.data?.token) {
        setAdminToken(envelope.data.token);
        showToast("success", "登入成功");
        navigate("/admin/reward-rules");
        return;
      }

      showToast("error", envelope?.message || "登入失敗");
      await replaceBurntChallenge();
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage || (error as any)?.message || "登入失敗";
      showToast("error", errorMessage);
      await replaceBurntChallenge();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLogin
      adminAddress={adminAddress}
      plaintext={plaintext}
      signature={signature}
      secondsLeft={secondsLeft}
      isExpired={isExpired}
      isLoading={isLoading}
      isFetchingChallenge={isFetchingChallenge}
      onSignatureChange={setSignature}
      onCopy={handleCopy}
      onRegenerate={() => void fetchChallenge()}
      onLogin={handleLogin}
    />
  );
}
