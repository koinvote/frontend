import { Button } from "antd";

import CopyIcon from "@/assets/icons/copy.svg?react";
import Logo from "@/assets/logo/logo.svg?react";

interface AdminLoginProps {
  adminAddress: string;
  plaintext: string;
  signature: string;
  secondsLeft: number;
  isExpired: boolean;
  isLoading: boolean;
  isFetchingChallenge: boolean;
  onSignatureChange: (value: string) => void;
  onCopy: (text: string, label: string) => void;
  onRegenerate: () => void;
  onLogin: () => void;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function AdminLogin({
  adminAddress,
  plaintext,
  signature,
  secondsLeft,
  isExpired,
  isLoading,
  isFetchingChallenge,
  onSignatureChange,
  onCopy,
  onRegenerate,
  onLogin,
}: AdminLoginProps) {
  const busy = isLoading || isFetchingChallenge;
  const canSubmit = Boolean(plaintext) && !isExpired && !busy;

  return (
    <div className="bg-admin-bg flex min-h-screen items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-white px-10 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="mb-8 flex items-center justify-center gap-2 text-center">
          <div>
            <Logo className="h-8 w-8" />
          </div>
          <div>
            <div className="text-admin-text-main text-xl font-medium">
              Koinvote Admin
            </div>
            <div className="text-admin-text-sub text-sm">
              Admin Login Interface
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Admin Address */}
          <div className="space-y-1">
            <label className="text-admin-text-sub text-sm">Admin Address</label>
            <div className="bg-admin-surface mt-2 flex items-center gap-2 rounded-md px-3 py-2">
              <input
                className="text-admin-text-main flex-1 border-0 bg-transparent font-mono text-sm outline-none"
                value={adminAddress}
                readOnly
              />
            </div>
          </div>

          {/* Message to sign. Issued by the server, single-use, 15 minutes. */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-admin-text-sub text-sm">
                Message to Sign
              </label>
              <div className="flex items-center gap-3">
                {plaintext && (
                  <span
                    className={
                      isExpired
                        ? "text-sm text-red-600"
                        : "text-admin-text-sub text-sm"
                    }
                  >
                    {isExpired
                      ? "Expired"
                      : `Expires in ${formatCountdown(secondsLeft)}`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={busy}
                  className="text-accent text-sm underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFetchingChallenge ? "Generating..." : "Regenerate"}
                </button>
              </div>
            </div>

            <div className="bg-admin-surface mt-2 flex items-start gap-2 rounded-md px-3 py-2">
              {/* A textarea rather than an input: the server-issued message runs
                  to about 120 characters, and a single-line field would hide all
                  but the first few, making it impossible to check against what
                  the wallet is about to sign. */}
              <textarea
                className="text-admin-text-main min-h-[4.5rem] flex-1 resize-none border-0 bg-transparent font-mono text-sm break-all outline-none"
                value={plaintext}
                readOnly
                rows={3}
              />
              <button
                type="button"
                onClick={() => onCopy(plaintext, "Message")}
                disabled={!plaintext}
                className="text-admin-text-sub hover:text-admin-text-main mt-1 transition-colors disabled:opacity-40"
                aria-label="Copy message to sign"
              >
                <CopyIcon className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-1">
            <label className="text-admin-text-sub text-sm">Signature</label>
            <input
              className="focus:border-accent mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-sm outline-none"
              placeholder="Paste your signature here"
              value={signature}
              onChange={(e) => onSignatureChange(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="pt-2">
            <Button
              block
              size="large"
              type="primary"
              onClick={onLogin}
              disabled={!canSubmit}
            >
              {isLoading
                ? "Logging in..."
                : isExpired
                  ? "Message expired — regenerate"
                  : "Log in"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
