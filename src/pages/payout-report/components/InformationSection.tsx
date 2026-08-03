import type { PayoutReportRes } from "@/api/response";
import { useTranslation } from "react-i18next";

interface InformationSectionProps {
  report: PayoutReportRes;
}

export function InformationSection({ report }: InformationSectionProps) {
  const { t } = useTranslation();

  // The threshold comes from the payout itself, not from the live system
  // parameters. The current setting is 600 satoshi while payouts made in
  // 2026-03 were planned at 2000: showing today's number against an older
  // payout would misstate why those winners were redistributed.
  const payoutThreshold = report.reward_details[0]?.dust_threshold_satoshi;

  const infoItems = [
    { label: t("payoutReport.eventTitle", "Event title"), value: report.event_title },
    { label: t("payoutReport.eventId", "Event ID"), value: report.event_id },
    {
      label: t("payoutReport.settlementBlock", "Settlement Block Height"),
      // Settled before the height was recorded, so there is nothing to show.
      value: report.snapshot_block_height?.toLocaleString() ?? "--",
    },
    {
      label: t("payoutReport.payoutThreshold", "Payout threshold"),
      value:
        payoutThreshold === undefined
          ? "--"
          : `${payoutThreshold.toLocaleString()} sats`,
    },
  ];

  return (
    <div className="rounded-2xl md:border border-neutral-800 md:p-6">
      <h2 className="text-base text-primary mt-12 mb-8 md:mt-0 md:mb-4">
        {t("payoutReport.information", "Information")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoItems.map((item, index) => (
          <div key={index}>
            <p className="text-base text-gray-400 mb-1">{item.label}</p>
            <p className="text-base text-primary wrap-break-word">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
