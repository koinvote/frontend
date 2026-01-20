import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { EventRewardType } from "@/api/types";
import { EventStatus } from "@/api/types";
import RewardReportIcon from "@/assets/icons/rewardReport.svg?react";
import { Button } from "@/components/base/Button";
import { useHomeStore } from "@/stores/homeStore";

interface EventCTAButtonProps {
  status:
    | typeof EventStatus.PREHEAT
    | typeof EventStatus.ACTIVE
    | typeof EventStatus.ENDED
    | typeof EventStatus.COMPLETED;
  eventRewardType: EventRewardType;
  eventId: string;
  totalRewardAmount: number;
}

export function EventCTAButton({
  status,
  eventRewardType,
  eventId,
  totalRewardAmount,
}: EventCTAButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDesktop = useHomeStore((s) => s.isDesktop);

  const isCompleted = status === EventStatus.COMPLETED;
  const isRewarded = eventRewardType === "rewarded";
  const hasReward = isRewarded || totalRewardAmount > 0;
  const replyText = hasReward
    ? t("eventCTA.replyToWinBTC", "Reply to win BTC")
    : t("eventCTA.reply", "Reply");

  // Determine button config based on status
  const getButtonConfig = () => {
    switch (status) {
      case EventStatus.PREHEAT:
        return {
          text: replyText,
          disabled: true,
          tooltip: t(
            "eventCTA.preheatTooltip",
            "Preheat lets people see the event before replies open.\nDuring this time, the event is visible but replies are disabled."
          ),
        };
      case EventStatus.ACTIVE:
        return {
          text: replyText,
          disabled: false,
          tooltip: null,
        };
      case EventStatus.ENDED:
        return {
          text: t("eventCTA.viewRewardReport", "View Reward Report"),
          disabled: true,
          tooltip: !isRewarded
            ? t(
                "eventCTA.noRewardTooltip",
                "This is a no-reward event.\nNo payout report is generated."
              )
            : t(
                "eventCTA.eventEndedTooltip",
                "The event has ended. Reward payouts are being processed."
              ),
        };
      case EventStatus.COMPLETED:
        return {
          text: t("eventCTA.viewRewardReport", "View Reward Report"),
          disabled: !isRewarded,
          tooltip: !isRewarded
            ? t(
                "eventCTA.noRewardTooltip",
                "This is a no-reward event.\nNo payout report is generated."
              )
            : null,
        };
    }
  };

  const {
    text: buttonText,
    disabled: isDisabled,
    tooltip: tooltipText,
  } = getButtonConfig() ?? {
    text: "",
    disabled: false,
    tooltip: null,
  };

  const handleClick = () => {
    switch (status) {
      case EventStatus.ACTIVE:
        navigate(`/event/${eventId}/reply`);
        break;
      case EventStatus.COMPLETED:
        if (isRewarded) {
          navigate(`/event/${eventId}/report`);
        }
        break;
    }
  };

  const button = (
    <Button
      type="button"
      appearance="solid"
      tone="primary"
      text="sm"
      className={`w-full md:w-auto whitespace-nowrap px-8 gap-2 ${
        isCompleted
          ? "bg-gray-500 dark:bg-gray-450 text-white hover:bg-gray-500/90 dark:hover:bg-gray-450/80"
          : ""
      }`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isCompleted && <RewardReportIcon className="w-4 h-4" />}
      {buttonText}
    </Button>
  );

  // No reward tooltip
  if (
    tooltipText &&
    (status === EventStatus.PREHEAT ||
      status === EventStatus.ENDED ||
      (status === EventStatus.COMPLETED && !isRewarded))
  ) {
    return (
      <Tooltip
        title={tooltipText}
        placement={isDesktop ? "left" : "bottom"}
        arrow={{ pointAtCenter: true }}
        styles={{
          root: { maxWidth: "min(300px, 90vw)", whiteSpace: "pre-line" },
        }}
      >
        <span className="w-full md:w-auto inline-block cursor-not-allowed">
          {button}
        </span>
      </Tooltip>
    );
  }

  return button;
}
