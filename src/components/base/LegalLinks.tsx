import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { cn } from "@/utils/style";

interface LegalLinksProps {
  /** Override paragraph className (e.g. `text-secondary`) */
  className?: string;
  /** Replace link className entirely (e.g. `"text-(--color-orange-500) hover:underline"`) */
  linkClassName?: string;
  /** Link `target` attribute (e.g. `"_blank"`) */
  target?: string;
}

/**
 * Renders the standard "By proceeding, you agree to the Terms of Service..."
 * legal disclaimer paragraph.
 */
export function LegalLinks({ className, linkClassName, target }: LegalLinksProps) {
  const { t } = useTranslation();

  const linkCls =
    linkClassName ?? "text-(--color-orange-500) underline";

  return (
    <p className={cn("text-xs leading-[18px] text-primary", className)}>
      {t("common.byProceeding", "By proceeding, you agree to the")}{" "}
      <Link to="/terms" className={linkCls} target={target}>
        {t("common.termsOfService", "Terms of Service")}
      </Link>
      {", "}
      <Link to="/terms-reward-distribution" className={linkCls} target={target}>
        {t("common.rewardDistribution", "Reward Distribution")}
      </Link>
      {", "}
      <Link to="/privacy" className={linkCls} target={target}>
        {t("common.privacyPolicy", "Privacy Policy")}
      </Link>{" "}
      {t("common.and", "and")}{" "}
      <Link to="/charges-refunds" className={linkCls} target={target}>
        {t("common.chargesRefunds", "Charges & Refunds")}
      </Link>
      {"."}
    </p>
  );
}
