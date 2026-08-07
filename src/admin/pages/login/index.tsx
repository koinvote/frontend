import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import AdminLogin from "@/admin/component/AdminLogin";
import { usePasskeySupport } from "@/admin/hooks/usePasskeySupport";
import {
  ceremonyErrorMessage,
  getPasskeyAssertion,
  unwrap,
} from "@/admin/passkey";
import { AdminAPI } from "@/api";
import { SESSION_EXPIRED_PARAM } from "@/api/adminSession";
import { getApiErrorMessage, setAdminToken } from "@/api/http";
import { useToast } from "@/components/base/Toast/useToast";
import systemConsts from "@/consts";
import { truncateAddress } from "@/utils/address";

const adminAddress = truncateAddress(systemConsts.ADMIN_ADDRESS);

/**
 * Every message on this screen is English, whatever the site language is.
 * The URL is public, and a login screen that answers in Chinese says more
 * about who runs the site than it needs to.
 */
function loginErrorMessage(error: unknown, fallback: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;
  return e?.response ? getApiErrorMessage(e, "en") : e?.message || fallback;
}

/** As above, but keeps the two WebAuthn cases the ceremony helper explains. */
function passkeyErrorMessage(error: unknown): string {
  const fallback = "Passkey sign-in failed";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const name = (error as any)?.name;
  return name === "NotAllowedError" || name === "InvalidStateError"
    ? ceremonyErrorMessage(error, fallback)
    : loginErrorMessage(error, fallback);
}

/** Seconds remaining until an RFC3339 instant, floored at zero. */
function secondsUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  // Why the login form is on screen: bounced out of the admin area (router
  // state), or bounced by the hard-redirect fallback (query param). Either way
  // it belongs in the card, not in an error toast in front of it.
  const sessionExpired =
    Boolean((location.state as { sessionExpired?: boolean } | null)
      ?.sessionExpired) || searchParams.get(SESSION_EXPIRED_PARAM) === "1";

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
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const passkeySupported = usePasskeySupport();

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
            showToast("success", "New message generated");
          }
          return true;
        }

        showToast(
          "error",
          envelope?.message || "Failed to get a message to sign",
        );
        return false;
      } catch (error: unknown) {
        showToast(
          "error",
          loginErrorMessage(error, "Failed to get a message to sign"),
        );
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
      showToast("success", `${label} copied to clipboard`);
    } catch {
      showToast("error", `Failed to copy ${label.toLowerCase()}`);
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
      showToast(
        "warn",
        "That message is no longer valid. A new one was generated — please sign again.",
      );
    }
  }, [fetchChallenge, showToast]);

  const handleLogin = async () => {
    if (!signature.trim()) {
      showToast("error", "Please enter a signature");
      return;
    }
    if (!plaintext || !nonceTimestamp) {
      showToast("error", "No message to sign yet — regenerate");
      return;
    }
    if (isExpired) {
      showToast("error", "The message expired — regenerate");
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
        showToast("success", "Signed in");
        navigate("/admin/reward-rules");
        return;
      }

      showToast("error", envelope?.message || "Login failed");
      await replaceBurntChallenge();
    } catch (error: unknown) {
      showToast("error", loginErrorMessage(error, "Login failed"));
      await replaceBurntChallenge();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      setIsPasskeyLoading(true);

      // begin takes no input: the authenticator picks the credential, so the
      // request reveals nothing about who the administrators are.
      const beginRes = unwrap(await AdminAPI.passkeyLoginBegin());
      if (!beginRes?.success || !beginRes?.data?.publicKey) {
        showToast(
          "error",
          beginRes?.message || "Could not start passkey sign-in",
        );
        return;
      }

      const credential = await getPasskeyAssertion(beginRes.data.publicKey);

      const finishRes = unwrap(
        await AdminAPI.passkeyLoginFinish({
          challenge_id: beginRes.data.challenge_id,
          credential,
        }),
      );

      if (finishRes?.success && finishRes?.data?.token) {
        setAdminToken(finishRes.data.token);
        showToast("success", "Signed in");
        navigate("/admin/reward-rules");
        return;
      }

      showToast("error", finishRes?.message || "Passkey sign-in failed");
    } catch (error: unknown) {
      showToast("error", passkeyErrorMessage(error));
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <AdminLogin
      sessionExpired={sessionExpired}
      adminAddress={adminAddress}
      plaintext={plaintext}
      signature={signature}
      secondsLeft={secondsLeft}
      isExpired={isExpired}
      isLoading={isLoading}
      isFetchingChallenge={isFetchingChallenge}
      passkeySupported={passkeySupported === true}
      isPasskeyLoading={isPasskeyLoading}
      onPasskeyLogin={handlePasskeyLogin}
      onSignatureChange={setSignature}
      onCopy={handleCopy}
      onRegenerate={() => void fetchChallenge()}
      onLogin={handleLogin}
    />
  );
}
