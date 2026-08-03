/**
 * Admin session expiry plumbing.
 *
 * The axios interceptor lives outside React, so it cannot navigate on its own
 * without a full page reload. It publishes here instead, and AdminLayout
 * subscribes and hands the redirect to the router: the login screen appears
 * immediately rather than after a toast, a timer and a white reload.
 */

/** Login URL used by the fallback hard redirect below. */
const LOGIN_PATH = "/admin/login";

/** Marks a hard redirect as caused by expiry, so the login page can say so. */
export const SESSION_EXPIRED_PARAM = "expired";

type Listener = () => void;

const listeners = new Set<Listener>();
let hardRedirectInFlight = false;

export function subscribeSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Announce that the stored admin token is no longer good.
 *
 * Safe to call repeatedly — several requests failing at once is the normal
 * case, and every listener just flips the same flag.
 */
export function notifySessionExpired(): void {
  if (listeners.size > 0) {
    for (const listener of listeners) listener();
    return;
  }

  // Nobody is mounted to handle it (a 401 from outside the admin tree). Fall
  // back to a hard redirect so a dead session can never look alive.
  if (typeof window === "undefined" || hardRedirectInFlight) return;
  const { pathname } = window.location;
  if (!pathname.startsWith("/admin") || pathname === LOGIN_PATH) return;

  hardRedirectInFlight = true;
  window.location.replace(`${LOGIN_PATH}?${SESSION_EXPIRED_PARAM}=1`);
}

/** Decode a JWT payload without verifying it — only `exp` is read from it. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;

  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * True only when the token's own `exp` claim is already in the past.
 *
 * This is a courtesy check, not authorization: the server remains the only
 * authority on whether a token is good. Anything unreadable returns false so
 * the request still goes out and the server decides. The point is the common
 * case — coming back to an open admin tab the next day — where knowing the
 * token is dead up front means no request, no 401, and no error flashing past
 * before the login form.
 */
export function isTokenExpired(token: string): boolean {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== "number") return false;
  return exp * 1000 <= Date.now();
}
