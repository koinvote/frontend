import { API, type ApiResponse } from "@/api";
import type { PayoutReportRes } from "@/api/response";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { PageLoading } from "@/components/PageLoading";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { InformationSection } from "./components/InformationSection";
import { RewardDistributionSection } from "./components/RewardDistributionSection";

const PayoutReport = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [eventId]);

  const {
    data: payoutReport,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payoutReport", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = (await API.getPayoutReport(
        eventId
      )()) as unknown as ApiResponse<PayoutReportRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch payout report");
      }
      return response.data;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !payoutReport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-secondary mb-2">
            {t("payoutReport.error")}
          </p>
          <p className="text-sm text-secondary">
            {error instanceof Error ? error.message : t("payoutReport.noData")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col flex items-center justify-center w-full px-2 md:px-0">
      {/* Back button */}
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(`/event/${eventId}`)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>

      {/* Main content */}
      <div className="w-full p-6 md:p-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl  font-medium text-(--color-orange-500) mb-2">
            {t("payoutReport.title", "Reward Distribution Report")}
          </h1>
          <p className="text-base text-gray-400">
            {t(
              "payoutReport.subtitle",
              "View complete reward distribution details and verification information"
            )}
          </p>
        </div>

        {/* Information Section */}
        <InformationSection report={payoutReport} />

        {/* Reward Distribution Detail */}
        <div className="mt-6">
          <h2 className="text-lg text-primary mt-8 mb-0 md:mb-6 font-bold md:font-normal">
            {t("payoutReport.distributionDetail", "Reward Distribution Detail")}
          </h2>
          {payoutReport.reward_details.map((detail, index) => (
            <RewardDistributionSection
              key={`${detail.reward_type}-${detail.plan_id}`}
              detail={detail}
              eventId={payoutReport.event_id}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayoutReport;
