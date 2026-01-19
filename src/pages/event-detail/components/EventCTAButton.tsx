import { Tooltip } from "antd";
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
  const navigate = useNavigate();
  const isDesktop = useHomeStore((s) => s.isDesktop);

  const isPreheat = status === EventStatus.PREHEAT;
  const isOngoing = status === EventStatus.ACTIVE;
  const isCompleted = status === EventStatus.COMPLETED;
  const isRewarded = eventRewardType === "rewarded";
  const isAdditionalRewarded = totalRewardAmount > 0;

  // Determine button text and state
  let buttonText = "";
  let isDisabled = false;
  let tooltipText = null;
  if (isPreheat) {
    buttonText =
      isRewarded || isAdditionalRewarded ? "Reply to win BTC" : "Reply";
    isDisabled = true;
    tooltipText =
      "Preheat lets people see the event before replies open.\n\nDuring this time, the event is visible but replies are disabled.";
  } else if (isOngoing) {
    buttonText =
      isRewarded || isAdditionalRewarded ? "Reply to win BTC" : "Reply";
    isDisabled = false;
  } else if (isCompleted) {
    buttonText = "View Reward Report";
    if (isRewarded) {
      isDisabled = false;
    } else {
      isDisabled = true;
      tooltipText =
        "This is a no-reward event. No payout report is generated. Provide an overview of the task and related details.";
    }
  }

  const handleClick = () => {
    if (isCompleted && isRewarded) {
      navigate(`/event/${eventId}/report`);
    } else if (isCompleted && !isRewarded) {
      return;
    } else if (isOngoing) {
      // TODO: Navigate to reply page
      navigate(`/event/${eventId}/reply`);
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

  if (isPreheat && tooltipText) {
    return (
      <Tooltip
        title={
          <>
            {/* Desktop: split into two lines */}
            <div className="hidden md:block">
              <div>Preheat lets people see the event before replies open.</div>
              <div>
                During this time, the event is visible but replies are disabled.
              </div>
            </div>
            {/* Mobile: original single block (auto wrapping) */}
            <div className="block md:hidden">
              {tooltipText.split("\n\n").map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </>
        }
        placement={isDesktop ? "left" : "bottom"}
        color="white"
        arrow={{ pointAtCenter: true }}
        styles={{
          container: {
            maxWidth: isDesktop ? "300px" : "min(250px, 90vw)",
            whiteSpace: "normal",
          },
        }}
      >
        <span className={isDesktop ? "inline-block" : "block w-full"}>
          {button}
        </span>
      </Tooltip>
    );
  }

  if (isCompleted && !isRewarded && tooltipText) {
    return (
      <Tooltip
        title={tooltipText}
        styles={{ root: { maxWidth: "min(500px, 90vw)" } }}
      >
        <span className="w-full md:w-auto inline-block cursor-not-allowed">
          {button}
        </span>
      </Tooltip>
    );
  }

  return button;
}
