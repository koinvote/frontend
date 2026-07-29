/**
 * Passkey ceremonies, kept behind dynamic imports.
 *
 * `@simplewebauthn/browser` is only ever loaded from inside these functions, so
 * it lands in its own chunk that a Safari 14 client never fetches. The admin
 * panel ships in the same bundle as the public site, which still targets
 * iOS 14; a static import would put the library on the path every visitor
 * executes.
 */

/** Unwraps the API envelope, which the axios interceptor may already have opened. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: any) {
  return res?.success !== undefined ? res : res?.data;
}

/** Extracts the most useful message from a failed ceremony. */
export function ceremonyErrorMessage(error: unknown, fallback: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;

  // The browser aborts with NotAllowedError both when the user cancels and
  // when the ceremony times out. They are indistinguishable by design — the
  // spec deliberately refuses to tell the site which happened.
  if (e?.name === "NotAllowedError") {
    return "已取消或逾時，請再試一次";
  }
  if (e?.name === "InvalidStateError") {
    return "這個裝置已經註冊過了";
  }
  return e?.apiMessage || e?.message || fallback;
}

/**
 * Runs the registration ceremony and returns the raw credential to send back.
 */
export async function createPasskey(publicKey: unknown): Promise<unknown> {
  const { startRegistration } = await import("@simplewebauthn/browser");
  return startRegistration({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    optionsJSON: publicKey as any,
  });
}

/**
 * Runs the authentication ceremony.
 */
export async function getPasskeyAssertion(
  publicKey: unknown,
): Promise<unknown> {
  const { startAuthentication } = await import("@simplewebauthn/browser");
  return startAuthentication({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    optionsJSON: publicKey as any,
  });
}

export { unwrap };
