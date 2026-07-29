import { useEffect, useState } from "react";

/**
 * Reports whether this browser can do passkeys.
 *
 * The admin panel ships in the same bundle as the public site, which targets
 * Safari 14 / iOS 14 (see vite.config.ts). WebAuthn needs iOS 16+, so the
 * passkey UI must be hidden rather than merely broken on the old baseline —
 * and `@simplewebauthn/browser` must only be imported once this returns true,
 * so the library never enters the code path an old browser executes.
 *
 * Returns `null` while still checking: `isUserVerifyingPlatformAuthenticator
 * Available()` is async, and rendering "not supported" before it resolves
 * would flash the wrong UI.
 */
export function usePasskeySupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Guarded with `typeof` rather than a property read: on browsers without
    // WebAuthn the identifier is simply undefined.
    if (
      typeof window === "undefined" ||
      typeof window.PublicKeyCredential === "undefined"
    ) {
      setSupported(false);
      return;
    }

    // Presence of PublicKeyCredential is not enough — an in-app WebView can
    // expose it without a usable platform authenticator.
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        if (!cancelled) setSupported(available);
      })
      .catch(() => {
        if (!cancelled) setSupported(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return supported;
}
