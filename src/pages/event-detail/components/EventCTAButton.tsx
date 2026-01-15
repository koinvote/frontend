import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Tooltip } from "antd";
import { Button } from "@/components/base/Button";
import { EventStatus } from "@/api/types";
import type { EventRewardType } from "@/api/types";
import RewardReportIcon from "@/assets/icons/rewardReport.svg?react";

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
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    // Initial set
    setIsDesktop(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const isPreheat = status === EventStatus.PREHEAT;
  const isOngoing = status === EventStatus.ACTIVE;
  const isCompleted = status === EventStatus.COMPLETED;
  const isRewarded = eventRewardType === "rewarded";
  const isAdditionalRewarded = totalRewardAmount > 0;

  // Determine button text and state
  let buttonText = "";
  let isDisabled = false;
  let tooltipText = "";

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
    if (!isRewarded) {
      buttonText = "View Reward Report";
      isDisabled = false;
    } else {
      // No CTA for completed non-reward events
      return null;
    }
  }

  const handleClick = () => {
    if (isCompleted && !isRewarded) {
      // TODO: Navigate to reward report page
      navigate(`/event/${eventId}/reward-report`);
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
      className={`w-full md:w-auto whitespace-nowrap px-4 gap-2 ${
        isCompleted && !isRewarded
          ? "bg-surface text-black hover:bg-surface/80 dark:bg-surface dark:text-white dark:hover:bg-surface/80"
          : ""
      }`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {!isRewarded && isCompleted && <RewardReportIcon className="w-4 h-4" />}
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
            maxWidth: isDesktop ? "300px" : "min(180px, 90vw)",
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

  return button;
}
