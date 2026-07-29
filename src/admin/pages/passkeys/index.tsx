import { Button, Input, Modal } from "antd";
import { useCallback, useEffect, useState } from "react";

import { usePasskeySupport } from "@/admin/hooks/usePasskeySupport";
import { ceremonyErrorMessage, createPasskey, unwrap } from "@/admin/passkey";
import { AdminAPI } from "@/api";
import type { PasskeyRes } from "@/api/response";
import { useToast } from "@/components/base/Toast/useToast";
import systemConsts from "@/consts";

export default function AdminPasskeysPage() {
  const { showToast } = useToast();
  const passkeySupported = usePasskeySupport();

  const [passkeys, setPasskeys] = useState<PasskeyRes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Step-up state. Registering needs a fresh wallet signature; holding a
  // session token is not enough, because a passkey outlives the token that
  // created it.
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpPlaintext, setStepUpPlaintext] = useState("");
  const [stepUpNonce, setStepUpNonce] = useState("");
  const [stepUpSignature, setStepUpSignature] = useState("");
  const [label, setLabel] = useState("");

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = unwrap(await AdminAPI.getPasskeys());
      if (res?.success) {
        setPasskeys(res.data?.passkeys ?? []);
      } else {
        showToast("error", res?.message || "讀取通行金鑰失敗");
      }
    } catch (error: unknown) {
      showToast("error", ceremonyErrorMessage(error, "讀取通行金鑰失敗"));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openStepUp = async () => {
    try {
      const res = unwrap(await AdminAPI.passkeyStepUp());
      if (!res?.success || !res?.data?.plaintext) {
        showToast("error", res?.message || "取得簽章訊息失敗");
        return;
      }
      setStepUpPlaintext(res.data.plaintext);
      setStepUpNonce(res.data.nonce_timestamp);
      setStepUpSignature("");
      setLabel("");
      setStepUpOpen(true);
    } catch (error: unknown) {
      showToast("error", ceremonyErrorMessage(error, "取得簽章訊息失敗"));
    }
  };

  const register = async () => {
    if (!stepUpSignature.trim()) {
      showToast("error", "請貼上錢包簽章");
      return;
    }

    try {
      setIsRegistering(true);

      const beginRes = unwrap(
        await AdminAPI.passkeyRegisterBegin({
          plaintext: stepUpPlaintext,
          nonce_timestamp: stepUpNonce,
          signature: stepUpSignature,
        }),
      );
      if (!beginRes?.success || !beginRes?.data?.publicKey) {
        showToast("error", beginRes?.message || "註冊失敗");
        // The step-up nonce is consumed before the signature is checked, so a
        // failed attempt burns it. Close and make the admin start over rather
        // than let them retry against a dead challenge.
        setStepUpOpen(false);
        return;
      }

      const credential = await createPasskey(beginRes.data.publicKey);

      const finishRes = unwrap(
        await AdminAPI.passkeyRegisterFinish({
          challenge_id: beginRes.data.challenge_id,
          label: label.trim() || "Passkey",
          credential,
        }),
      );

      if (finishRes?.success) {
        showToast("success", "通行金鑰已新增");
        setStepUpOpen(false);
        void load();
        return;
      }
      showToast("error", finishRes?.message || "註冊失敗");
    } catch (error: unknown) {
      showToast("error", ceremonyErrorMessage(error, "註冊失敗"));
    } finally {
      setIsRegistering(false);
    }
  };

  const rename = (row: PasskeyRes) => {
    let next = row.label;
    Modal.confirm({
      title: "重新命名",
      content: (
        <Input
          defaultValue={row.label}
          maxLength={64}
          onChange={(e) => (next = e.target.value)}
        />
      ),
      okText: "儲存",
      cancelText: "取消",
      onOk: async () => {
        if (!next.trim()) {
          showToast("error", "名稱不可為空");
          return;
        }
        const res = unwrap(
          await AdminAPI.renamePasskey(row.id, { label: next.trim() }),
        );
        if (res?.success) {
          showToast("success", "已重新命名");
          void load();
        } else {
          showToast("error", res?.message || "重新命名失敗");
        }
      },
    });
  };

  const remove = (row: PasskeyRes) => {
    const isLast = passkeys.length === 1;
    Modal.confirm({
      title: `刪除「${row.label}」？`,
      // Deleting the last one is allowed on purpose — the wallet path is
      // permanent, so zero passkeys is recoverable — but the admin should know
      // what they are going back to.
      content: isLast
        ? "這是最後一把通行金鑰。刪除後將只能用比特幣簽章登入。"
        : "刪除後這個裝置將無法再用於登入。",
      okText: "刪除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        const res = unwrap(await AdminAPI.deletePasskey(row.id));
        if (res?.success) {
          showToast("success", "已刪除");
          void load();
        } else {
          showToast("error", res?.message || "刪除失敗");
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-admin-text-main text-xl font-medium">通行金鑰</h1>
          <p className="text-admin-text-sub mt-1 text-sm">
            建議註冊兩把，其中一把放在另一台裝置上。比特幣簽章登入永遠保留為救援管道。
          </p>
        </div>
        <Button
          type="primary"
          onClick={openStepUp}
          disabled={!passkeySupported || isRegistering}
        >
          新增通行金鑰
        </Button>
      </div>

      {passkeySupported === false && (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          這個瀏覽器不支援通行金鑰（需要 iOS 16 以上、Safari 16 以上或 Chrome
          108 以上）。如果是在其他 App 內開啟，請改用 Safari。
        </div>
      )}

      {/* Plain grid rather than antd's Table: no other admin page pulls in
          rc-table, and the admin bundle ships with the public site, so adding
          it would cost every visitor ~300 KB for a screen only the admin sees.
          This matches the layout referralCodes already uses. */}
      <div className="rounded-lg bg-white px-4 py-2">
        <div className="text-admin-text-sub grid grid-cols-[1.5fr_1.4fr_1fr_auto] border-b border-neutral-200 px-2 py-3 text-sm font-medium">
          <span>名稱</span>
          <span>同步狀態</span>
          <span>最後使用</span>
          <span />
        </div>

        {isLoading && (
          <div className="text-admin-text-sub px-2 py-6 text-sm">載入中…</div>
        )}

        {!isLoading && passkeys.length === 0 && (
          <div className="text-admin-text-sub px-2 py-6 text-sm">
            尚未註冊任何通行金鑰
          </div>
        )}

        {!isLoading &&
          passkeys.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.5fr_1.4fr_1fr_auto] items-center border-b border-neutral-100 px-2 py-4 text-sm last:border-b-0"
            >
              <span className="text-neutral-800">
                {row.label}
                {row.clone_warning && (
                  <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    計數器異常
                  </span>
                )}
              </span>

              <span>
                {row.synced ? (
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    已同步
                  </span>
                ) : (
                  // Device-bound: dies with this device. The most useful
                  // lockout-prevention signal there is, so it is not buried.
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                    未同步（換機後會遺失）
                  </span>
                )}
              </span>

              <span className="text-neutral-600">
                {row.last_used_at
                  ? new Date(row.last_used_at).toLocaleString()
                  : "尚未使用"}
              </span>

              <span className="flex gap-3">
                <Button
                  type="link"
                  size="small"
                  autoInsertSpace={false}
                  className="p-0!"
                  onClick={() => rename(row)}
                >
                  重新命名
                </Button>
                <Button
                  type="link"
                  danger
                  size="small"
                  autoInsertSpace={false}
                  className="p-0!"
                  onClick={() => remove(row)}
                >
                  刪除
                </Button>
              </span>
            </div>
          ))}
      </div>

      <Modal
        open={stepUpOpen}
        title="新增通行金鑰"
        okText="繼續"
        cancelText="取消"
        confirmLoading={isRegistering}
        onOk={register}
        onCancel={() => setStepUpOpen(false)}
      >
        <div className="space-y-3">
          <p className="text-admin-text-sub text-sm">
            註冊通行金鑰會授予持久的存取權，所以除了目前的登入狀態之外，還需要一次即時的錢包簽章。
            用 <span className="font-mono">{systemConsts.ADMIN_ADDRESS}</span>{" "}
            對下面這段文字簽名：
          </p>

          <textarea
            className="bg-admin-surface w-full resize-none rounded-md px-3 py-2 font-mono text-xs break-all"
            rows={4}
            value={stepUpPlaintext}
            readOnly
          />

          <Input.TextArea
            rows={2}
            placeholder="貼上錢包簽章"
            value={stepUpSignature}
            onChange={(e) => setStepUpSignature(e.target.value)}
          />

          <Input
            placeholder="名稱，例如「我的 iPhone」"
            maxLength={64}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
