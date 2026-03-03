import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { Button } from "@/components/base/Button";
import { cn } from "@/utils/style";

type UnlockPaymentState = {
  email: string;
  unlockPrice?: string;
  eventTitle?: string;
};

export default function UnlockPayment() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as UnlockPaymentState | undefined;

  const [confirmEmail, setConfirmEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const confirmEmailRef = useRef<HTMLInputElement>(null);

  if (!state?.email) {
    navigate(`/event/${eventId}`);
    return null;
  }

  const { email, unlockPrice, eventTitle } = state;
  const emailMatches = confirmEmail === email;
  const canPay = emailMatches && agreedToTerms;

  const handleConfirmPay = () => {
    if (!emailMatches) {
      confirmEmailRef.current?.focus();
      return;
    }
    // TODO: initiate unlock payment API call
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 md:px-0">
      <div className="relative h-[50px] w-full">
        <button
          type="button"
          className="hover:text-admin-text-sub absolute left-0 cursor-pointer text-black dark:text-white"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="h-8 w-8 fill-current" />
        </button>
      </div>

      <div className="border-gray-450 bg-bg w-full max-w-3xl rounded-3xl border px-6 py-6 md:px-8 md:py-8">
        {/* Title */}
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500) mb-6">
          {t("unlockPayment.title", "Unlock Result")}
        </h1>

        <div className="space-y-5">
          {/* Event */}
          {eventTitle && (
            <div className="space-y-1">
              <div className="tx-12 lh-18 text-secondary">
                {t("unlockPayment.event", "Event")}
              </div>
              <div className="tx-16 lh-24 text-primary fw-m">{eventTitle}</div>
            </div>
          )}

          {/* Unlock email */}
          <div className="space-y-1">
            <div className="tx-12 lh-18 text-secondary">
              {t("unlockPayment.email", "Unlock email")}
            </div>
            <div className="tx-14 lh-20 text-primary">{email}</div>
          </div>

          {/* Confirm unlock email */}
          <div className="space-y-2">
            <div className="tx-12 lh-18 text-secondary flex items-center gap-1">
              {t("unlockPayment.confirmEmail", "Confirm unlock email")}
              <span className="text-red-500 ml-0.5">*</span>
            </div>
            <input
              ref={confirmEmailRef}
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={t(
                "unlockPayment.confirmEmailPlaceholder",
                "Confirm unlock email",
              )}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="one-time-code"
              spellCheck={false}
              className="border-border bg-bg text-primary tx-14 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-(--color-orange-500)"
            />
            {confirmEmail && !emailMatches && (
              <p className="tx-12 lh-18 text-red-500">
                {t("unlockPayment.emailMismatch", "Email does not match")}
              </p>
            )}
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Price */}
          <div className="space-y-1">
            <div className="tx-12 lh-18 text-secondary">
              {t("unlockPayment.price", "Price")}
            </div>
            <div className="tx-16 lh-24 text-primary fw-m">
              {unlockPrice ?? "--"} BTC
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 cursor-pointer"
            />
            <label
              htmlFor="agree-terms"
              className="tx-13 lh-18 text-secondary cursor-pointer"
            >
              {t("unlockPayment.agreeToThe", "I agree to the")}{" "}
              <Link
                to="/terms"
                className="text-(--color-orange-500) hover:underline"
              >
                {t("unlockPayment.termsOfService", "Terms of Service")}
              </Link>
              {", "}
              <Link
                to="/terms-reward-distribution"
                className="text-(--color-orange-500) hover:underline"
              >
                {t("unlockPayment.rewardDistribution", "Reward Distribution")}
              </Link>
              {", "}
              <Link
                to="/privacy"
                className="text-(--color-orange-500) hover:underline"
              >
                {t("unlockPayment.privacyPolicy", "Privacy Policy")}
              </Link>{" "}
              {t("unlockPayment.and", "and")}{" "}
              <Link
                to="/charges-refunds"
                className="text-(--color-orange-500) hover:underline"
              >
                {t("unlockPayment.chargesRefunds", "Charges & Refunds")}
              </Link>
              {"."}
            </label>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="mt-4 flex w-full max-w-3xl justify-end gap-3 px-1">
        <Button
          type="button"
          appearance="solid"
          tone="surface"
          onClick={() => navigate(`/event/${eventId}`)}
        >
          {t("unlockPayment.backToEvent", "Back to Event")}
        </Button>
        <Button
          type="button"
          appearance="solid"
          tone="primary"
          className={cn(!canPay && "opacity-50")}
          onClick={handleConfirmPay}
        >
          {t("unlockPayment.confirmAndPay", "Confirm & Pay")}
        </Button>
      </div>
    </div>
  );
}
