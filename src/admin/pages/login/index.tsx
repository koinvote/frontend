import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/Button";
import Logo from "@/assets/logo/logo.svg?react";
import { AdminAPI } from "@/api";
import { setAdminToken } from "@/api/http";
import { useToast } from "@/components/base/Toast/useToast";

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        fill="none"
      />
      <rect
        x="4"
        y="4"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        fill="none"
      />
    </svg>
  );
}

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

/**
 * Generate plaintext for admin login
 * Format: "koinvote.com|admin_login|timestamp|random_code"
 */
function generatePlaintext(randomCode: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `koinvote.com|admin_login|${timestamp}|${randomCode}`;
}

const ADMIN_ADDRESS = "tb1qm3gqcr680wdm90wgepcq357hs0wpevm5ul7fsm";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [hashKey, setHashKey] = useState<string>("");
  const [plaintext, setPlaintext] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate hash key and plaintext on mount
  useEffect(() => {
    const randomHashKey = generateRandomHashKey();
    setHashKey(randomHashKey);
    setPlaintext(generatePlaintext(randomHashKey));
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", `${label} copied to clipboard`);
    } catch {
      showToast("error", `Failed to copy ${label}`);
    }
  };

  const handleLogin = async () => {
    if (!signature.trim()) {
      showToast("error", "Please enter a signature");
      return;
    }

    if (!plaintext) {
      showToast("error", "Plaintext not generated. Please refresh the page.");
      return;
    }

    try {
      setIsLoading(true);

      // Note: axios interceptor returns response.data at runtime, but types may still reflect AxiosResponse
      const loginRes = (await AdminAPI.login({
        address: ADMIN_ADDRESS,
        plaintext,
        signature,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;

      const envelope =
        loginRes?.success !== undefined ? loginRes : loginRes?.data;

      if (envelope?.success && envelope?.data?.token) {
        // Save token to localStorage
        setAdminToken(envelope.data.token);
        showToast("success", "Login successful");

        // Navigate to reward-rules page
        navigate("/admin/reward-rules");
      } else {
        const errorMessage = envelope?.message || "Login failed";
        showToast("error", errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.apiMessage || (error as any)?.message || "Login failed";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] px-10 py-8">
        <div className="text-center flex items-center justify-center gap-2 mb-8">
          <div>
            <Logo className="h-8 w-8" />
          </div>
          <div>
            <div className="tx-20 text-admin-text-main fw-m">
              Koinvote Admin
            </div>
            <div className="tx-14 text-admin-text-sub">
              Admin Login Interface
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Admin Address */}
          <div className="space-y-1">
            <label className="tx-14 text-admin-text-sub">Admin Address</label>
            <div className="flex items-center gap-2 bg-admin-surface rounded-[6px] px-3 py-2">
              <input
                className="flex-1 bg-transparent border-0 outline-none tx-14 text-admin-text-main"
                value={ADMIN_ADDRESS}
                readOnly
              />
            </div>
          </div>

          {/* Hash Key */}
          <div className="space-y-1">
            <label className="tx-14 text-admin-text-sub">Hash Key</label>
            <div className="flex items-center gap-2 bg-admin-surface rounded-[6px] px-3 py-2">
              <input
                className="flex-1 bg-transparent border-0 
                outline-none tx-14 text-admin-text-main"
                value={hashKey}
                readOnly
              />
              <button
                type="button"
                onClick={() => handleCopy(hashKey, "Hash Key")}
                className="text-admin-text-sub hover:text-admin-text-main transition-colors"
                aria-label="Copy Hash Key"
              >
                <CopyIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-1">
            <label className="tx-14 text-admin-text-sub">Signature</label>
            <input
              className="w-full border border-admin-border rounded-[6px] px-3 py-2 tx-14 bg-white"
              placeholder="Paste your signature here"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <Button
              block
              size="lg"
              text="md"
              tone="orange"
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
