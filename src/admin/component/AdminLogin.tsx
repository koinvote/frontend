import { Button } from "antd";

import CopyIcon from "@/assets/icons/copy.svg?react";
import Logo from "@/assets/logo/logo.svg?react";

interface AdminLoginProps {
  /** Shown when the admin was bounced here by an expired session. */
  sessionExpired?: boolean;
  adminAddress: string;
  plaintext: string;
  signature: string;
  secondsLeft: number;
  isExpired: boolean;
  isLoading: boolean;
  isFetchingChallenge: boolean;
  passkeySupported: boolean;
  isPasskeyLoading: boolean;
  onSignatureChange: (value: string) => void;
  onCopy: (text: string, label: string) => void;
  onRegenerate: () => void;
  onLogin: () => void;
  onPasskeyLogin: () => void;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function AdminLogin({
  sessionExpired = false,
  adminAddress,
  plaintext,
  signature,
  secondsLeft,
  isExpired,
  isLoading,
  isFetchingChallenge,
  passkeySupported,
  isPasskeyLoading,
  onSignatureChange,
  onCopy,
  onRegenerate,
  onLogin,
  onPasskeyLogin,
}: AdminLoginProps) {
  const busy = isLoading || isFetchingChallenge || isPasskeyLoading;
  const canSubmit = Boolean(plaintext) && !isExpired && !busy;

  return (
    <div
      className="bg-admin-bg flex min-h-screen items-center justify-center px-4 py-6"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white px-5 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)] md:px-10 md:py-8">
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

        {/* Stated plainly and in the card, so it reads as the reason the form
            is here rather than as something that went wrong. Deliberately not
            the word "expired": that already means the signing message below. */}
        {sessionExpired && (
          <div
            role="status"
            className="text-admin-text-sub mb-6 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
          >
            Your previous session has ended. Please sign in again.
          </div>
        )}

        <div className="space-y-4">
          {passkeySupported && (
            <>
              <Button
                block
                size="large"
                type="primary"
                onClick={onPasskeyLogin}
                disabled={busy}
              >
                {isPasskeyLoading
                  ? "Waiting for passkey..."
                  : "Sign in with Passkey"}
              </Button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-neutral-200" />
                <span className="text-admin-text-sub text-xs">
                  or use your wallet
                </span>
                <span className="h-px flex-1 bg-neutral-200" />
              </div>
            </>
          )}

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
            <div className="flex flex-wrap items-center justify-between gap-2">
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
