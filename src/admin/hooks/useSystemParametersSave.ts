import { useCallback, useState } from "react";

import { unwrap } from "@/admin/passkey";
import { AdminAPI } from "@/api";
import type { StepUpProof } from "@/api/request";
import { useToast } from "@/components/base/Toast/useToast";

/**
 * Saving system parameters, which now needs a step-up.
 *
 * The backend refuses `PUT /admin/system-parameters` with STEP_UP_REQUIRED
 * unless the body carries a fresh proof that the wallet or an enrolled passkey
 * is present: these values set the platform fee, the dust threshold, the fee
 * targets and the confirmation depth, and a session token on its own is not
 * enough authority over what gets paid out.
 *
 * The save therefore becomes two steps — hold the payload, collect the proof,
 * then send both together. Three pages (fee, rewardRules, refund) write to the
 * same endpoint, so the sequencing lives here rather than three times over.
 *
 * A proof is single-use. A failed save needs a new one, which is why the dialog
 * closes on both outcomes and re-fetches when it next opens.
 */
export function useSystemParametersSave<T extends object>({
  successMessage,
  onSaved,
}: {
  successMessage: string;
  onSaved?: () => void;
}) {
  const { showToast } = useToast();

  const [pending, setPending] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /** Stages a payload and opens the step-up dialog. */
  const requestSave = useCallback((payload: T) => {
    setPending(payload);
  }, []);

  const cancel = useCallback(() => setPending(null), []);

  /** Sends the staged payload together with the proof that authorises it. */
  const submitWithProof = useCallback(
    async (proof: StepUpProof) => {
      if (!pending) return;

      try {
        setIsSaving(true);

        const res = unwrap(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (AdminAPI.updateSystemParameters as any)({
            ...pending,
            step_up: proof,
          }),
        );

        if (res?.success) {
          showToast("success", successMessage);
          onSaved?.();
        } else {
          showToast("error", res?.message || "儲存失敗");
        }
      } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = error as any;
        if (!e?.isHandled) {
          showToast("error", e?.apiMessage || e?.message || "儲存失敗");
        }
      } finally {
        setIsSaving(false);
        // Closed on failure too: the proof was spent either way, so leaving the
        // dialog open would offer a dead signature to sign again.
        setPending(null);
      }
    },
    [pending, showToast, successMessage, onSaved],
  );

  return {
    /** Whether the step-up dialog should be open. */
    stepUpOpen: pending !== null,
    isSaving,
    requestSave,
    submitWithProof,
    cancel,
  };
}
