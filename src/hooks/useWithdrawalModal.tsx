import { useState } from "react";

import { AdminAPI, type ApiResponse } from "@/api";
import type { WithdrawalInfoRes } from "@/api/response";
import { SignModal, SuccessModal } from "@/admin/pages/withdrawal/WithdrawalModal";
import { toast } from "@/components/base/Toast/toast";

export function useWithdrawalModal() {
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [modalData, setModalData] = useState<WithdrawalInfoRes | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const openSignModal = async () => {
    setIsFetchingInfo(true);
    try {
      const res =
        (await AdminAPI.getWithdrawalInfo()) as unknown as ApiResponse<WithdrawalInfoRes>;
      if (res.success) {
        setModalData(res.data);
        setSignModalOpen(true);
      } else {
        toast("error", res.message || "取得提款資訊失敗");
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(error as any)?.isHandled) {
        toast("error", "取得提款資訊失敗");
      }
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const modals = (
    <>
      <SignModal
        open={signModalOpen}
        data={modalData}
        onClose={() => setSignModalOpen(false)}
        onSuccess={() => {
          setSignModalOpen(false);
          setSuccessModalOpen(true);
        }}
      />
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );

  return { openSignModal, isFetchingInfo, modals };
}
