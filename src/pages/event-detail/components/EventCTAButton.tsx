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
          text: t("common.edit", "Edit"),
          disabled: false,
          tooltip: null,
        };
      case EventStatus.ACTIVE:
        return {
          text: replyText,
          disabled: false,
          tooltip: null,
        };
      case EventStatus.ENDED:
        return {
          text: isRewarded
            ? t("eventCTA.rewardProcessing", "Reward processing…")
            : t("eventCTA.viewRewardReport", "View Reward Report"),
          disabled: true,
          tooltip: !isRewarded
            ? t(
                "eventCTA.noRewardTooltip",
                "This is a no-reward event.\nNo payout report is generated.",
              )
            : null,
        };
      case EventStatus.COMPLETED:
        return {
          text: t("eventCTA.viewRewardReport", "View Reward Report"),
          disabled: !isRewarded,
          tooltip: !isRewarded
            ? t(
                "eventCTA.noRewardTooltip",
                "This is a no-reward event.\nNo payout report is generated.",
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

  const isPreheat = status === EventStatus.PREHEAT;

  const handleClick = () => {
    switch (status) {
      case EventStatus.PREHEAT:
        navigate(`/event/${eventId}/edit`);
        break;
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

  const button = isPreheat ? (
    <Button
      type="button"
      appearance="outline"
      tone="white"
      text="sm"
      className="border-border! w-full px-6 whitespace-nowrap text-black hover:bg-white/5 md:w-auto dark:border-white dark:text-white"
      onClick={handleClick}
    >
      {buttonText}
    </Button>
  ) : (
    <Button
      type="button"
      appearance="solid"
      tone="primary"
      text="sm"
      className={`w-full gap-2 px-8 whitespace-nowrap md:w-auto ${
        isCompleted
          ? "dark:bg-gray-450 dark:hover:bg-gray-450/80 bg-gray-500 text-white hover:bg-gray-500/90"
          : ""
      }`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isCompleted && <RewardReportIcon className="h-4 w-4" />}
      {buttonText}
    </Button>
  );

  // has tooltip
  if (tooltipText) {
    return (
      <Tooltip
        title={tooltipText}
        placement={isDesktop ? "left" : "bottom"}
        arrow={{ pointAtCenter: true }}
        styles={{
          root: { maxWidth: "min(300px, 90vw)", whiteSpace: "pre-line" },
        }}
      >
        <span className="inline-block w-full cursor-not-allowed md:w-auto">
          {button}
        </span>
      </Tooltip>
    );
  }

  return button;
}
