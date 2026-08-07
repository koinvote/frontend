import { Button, Input, Modal } from "antd";
import { useCallback, useEffect, useState } from "react";

import { usePasskeySupport } from "@/admin/hooks/usePasskeySupport";
import { ceremonyErrorMessage, getPasskeyAssertion, unwrap } from "@/admin/passkey";
import { AdminAPI } from "@/api";
import type { StepUpProof, StepUpPurpose } from "@/api/request";
import { useToast } from "@/components/base/Toast/useToast";
import systemConsts from "@/consts";

/**
 * Collects a step-up proof.
 *
 * Some admin actions need more than a live session: the system parameters
 * decide platform fee, dust threshold, fee targets and confirmation depth, and
 * every one of them is an input to what gets paid out. The backend refuses
 * those writes with STEP_UP_REQUIRED unless the request carries a fresh proof
 * that the wallet or an enrolled passkey is present.
 *
 * Two paths, because they fail differently. The wallet works anywhere and needs
 * no enrolment, but the key is in cold storage and reaching it is deliberately
 * inconvenient. A passkey is one touch, but only on a device holding one.
 * Offering both means the inconvenient path is always available and never the
 * only one.
 *
 * The proof is handed back to the caller to put in the body of the request it
 * authorises — it is never exchanged for a token, so nothing intermediate
 * exists to steal. It is also single-use: a failed save needs a new one.
 */
export function StepUpDialog({
  open,
  purpose,
  title,
  description,
  confirmLoading,
  onProof,
  onCancel,
}: {
  open: boolean;
  purpose: StepUpPurpose;
  title: string;
  /** What the admin is about to authorise, in their words. */
  description: string;
  confirmLoading?: boolean;
  onProof: (proof: StepUpProof) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { showToast } = useToast();
  const passkeySupported = usePasskeySupport();

  const [plaintext, setPlaintext] = useState("");
  const [nonce, setNonce] = useState("");
  const [signature, setSignature] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isAsserting, setIsAsserting] = useState(false);

  const fetchWalletChallenge = useCallback(async () => {
    try {
      setIsFetching(true);
      const res = unwrap(await AdminAPI.stepUpWalletChallenge({ purpose }));
      if (!res?.success || !res?.data?.plaintext) {
        showToast("error", res?.message || "取得簽章訊息失敗");
        return;
      }
      setPlaintext(res.data.plaintext);
      setNonce(res.data.nonce_timestamp);
      setSignature("");
    } catch (error: unknown) {
      showToast("error", ceremonyErrorMessage(error, "取得簽章訊息失敗"));
    } finally {
      setIsFetching(false);
    }
  }, [purpose, showToast]);

  // A challenge is fetched when the dialog opens, and discarded when it closes.
  // Each one is single-use, so a stale message left on screen would only fail
  // at the point of saving.
  useEffect(() => {
    if (!open) {
      setPlaintext("");
      setNonce("");
      setSignature("");
      return;
    }
    void fetchWalletChallenge();
  }, [open, fetchWalletChallenge]);

  const submitWallet = async () => {
    if (!signature.trim()) {
      showToast("error", "請貼上錢包簽章");
      return;
    }
    await onProof({
      plaintext,
      nonce_timestamp: nonce,
      signature: signature.trim(),
    });
  };

  const submitPasskey = async () => {
    try {
      setIsAsserting(true);

      const beginRes = unwrap(await AdminAPI.stepUpPasskeyBegin({ purpose }));
      if (!beginRes?.success || !beginRes?.data?.publicKey) {
        // Covers STEP_UP_NO_PASSKEY, whose message already says the wallet
        // path is still open. The dialog stays put so it can be used.
        showToast("error", beginRes?.message || "通行金鑰驗證失敗");
        return;
      }

      const credential = await getPasskeyAssertion(beginRes.data.publicKey);

      await onProof({
        challenge_id: beginRes.data.challenge_id,
        credential,
      });
    } catch (error: unknown) {
      showToast("error", ceremonyErrorMessage(error, "通行金鑰驗證失敗"));
    } finally {
      setIsAsserting(false);
    }
  };

  const busy = Boolean(confirmLoading) || isAsserting || isFetching;

  return (
    <Modal
      open={open}
      title={title}
      okText="以錢包簽章確認"
      cancelText="取消"
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: busy || !plaintext || !signature.trim() }}
      onOk={submitWallet}
      onCancel={onCancel}
    >
      <div className="space-y-3">
        <p className="text-admin-text-sub text-sm">{description}</p>

        {passkeySupported && (
          <div className="space-y-2">
            <Button block loading={isAsserting} disabled={busy} onClick={submitPasskey}>
              使用通行金鑰
            </Button>
            <p className="text-admin-text-sub text-center text-xs">或用錢包簽章</p>
          </div>
        )}

        <p className="text-admin-text-sub text-sm">
          用 <span className="font-mono">{systemConsts.ADMIN_ADDRESS}</span>{" "}
          對下面這段文字簽名：
        </p>

        <textarea
          className="bg-admin-surface w-full resize-none rounded-md px-3 py-2 font-mono text-xs break-all"
          rows={4}
          value={plaintext}
          readOnly
        />

        <Input.TextArea
          rows={2}
          placeholder="貼上錢包簽章"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
      </div>
    </Modal>
  );
}
