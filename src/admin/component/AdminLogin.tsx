import CopyIcon from "@/assets/icons/copy.svg?react";
import Logo from "@/assets/logo/logo.svg?react";
import { Button } from "@/components/base/Button";

interface AdminLoginProps {
  adminAddress: string;
  hashKey: string;
  signature: string;
  isLoading: boolean;
  onSignatureChange: (value: string) => void;
  onCopy: (text: string, label: string) => void;
  onLogin: () => void;
}

export default function AdminLogin({
  adminAddress,
  hashKey,
  signature,
  isLoading,
  onSignatureChange,
  onCopy,
  onLogin,
}: AdminLoginProps) {
  return (
    <div className="bg-admin-bg flex min-h-screen items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-white px-10 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="mb-8 flex items-center justify-center gap-2 text-center">
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
            <div className="bg-admin-surface flex items-center gap-2 rounded-md px-3 py-2">
              <input
                className="tx-14 text-admin-text-main flex-1 border-0 bg-transparent outline-none"
                value={adminAddress}
                readOnly
              />
            </div>
          </div>

          {/* Hash Key */}
          <div className="space-y-1">
            <label className="tx-14 text-admin-text-sub">Hash Key</label>
            <div className="bg-admin-surface flex items-center gap-2 rounded-md px-3 py-2">
              <input
                className="tx-14 text-admin-text-main flex-1 border-0 bg-transparent outline-none"
                value={hashKey}
                readOnly
              />
              <button
                type="button"
                onClick={() => onCopy(hashKey, "Hash Key")}
                className="text-admin-text-sub hover:text-admin-text-main transition-colors"
                aria-label="Copy Hash Key"
              >
                <CopyIcon className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-1">
            <label className="tx-14 text-admin-text-sub">Signature</label>
            <input
              className="border-admin-border tx-14 w-full rounded-md border bg-white px-3 py-2"
              placeholder="Paste your signature here"
              value={signature}
              onChange={(e) => onSignatureChange(e.target.value)}
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
              onClick={onLogin}
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
