import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

import { EventStatus } from "@/api/types";
import { type EventSummary } from "@/pages/create-event/types/index";
import { formatOngoingCountdown } from "@/utils/formatter";

dayjs.extend(relativeTime);
dayjs.extend(utc);

type TranslateFunction = (
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>,
) => string;

export function formatCountdown(event: EventSummary, t: TranslateFunction) {
  if (event.status === EventStatus.ACTIVE) {
    return formatOngoingCountdown(event.deadline_at, t);
  }

  // PREHEAT
  if (event.status === EventStatus.PREHEAT) {
    const now = dayjs();
    // 確保將服務器返回的 UTC 時間正確解析為 UTC
    // 預熱階段應倒數至 started_at（事件進入 Ongoing 的時間）
    const startAt = event.started_at
      ? dayjs.utc(event.started_at)
      : dayjs.utc(event.deadline_at); // fallback 防呆
    if (startAt.isBefore(now))
      return t("eventCard.startingSoon", "Starting soon");
    const diffMs = startAt.diff(now);
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return t(
        "eventCard.startsInDays",
        "Starts in {{days}}d {{hours}}h {{minutes}}m {{seconds}}s",
        { days, hours, minutes, seconds },
      );
    }
    if (hours > 0) {
      return t(
        "eventCard.startsInHours",
        "Starts in {{hours}}h {{minutes}}m {{seconds}}s",
        { hours, minutes, seconds },
      );
    }
    if (minutes > 0) {
      return t(
        "eventCard.startsInMinutes",
        "Starts in {{minutes}}m {{seconds}}s",
        { minutes, seconds },
      );
    }
    return t("eventCard.startsInSeconds", "Starts in {{seconds}}s", {
      seconds,
    });
  }

  // COMPLETED
  if (event.status === EventStatus.COMPLETED) {
    if (event.ended_at) {
      // 確保將服務器返回的 UTC 時間正確解析為 UTC
      const ended = dayjs.utc(event.ended_at);
      const now = dayjs();
      const diffDays = now.diff(ended, "day");

      if (diffDays < 1) {
        const hours = now.diff(ended, "hour");
        return t("eventCard.hoursAgo", "{{hours}}h ago", { hours });
      }
      if (diffDays < 7) {
        return t("eventCard.daysAgo", "{{days}}d ago", { days: diffDays });
      }
      const weeks = Math.floor(diffDays / 7);
      return t("eventCard.weeksAgo", "{{weeks}}w ago", { weeks });
    }
    // If no ended_at, use deadline_at as fallback
    // 確保將服務器返回的 UTC 時間正確解析為 UTC
    const deadline = dayjs.utc(event.deadline_at);
    const now = dayjs();
    if (deadline.isBefore(now)) {
      const diffDays = now.diff(deadline, "day");
      if (diffDays < 1) {
        const hours = now.diff(deadline, "hour");
        return t("eventCard.hoursAgo", "{{hours}}h ago", { hours });
      }
      if (diffDays < 7) {
        return t("eventCard.daysAgo", "{{days}}d ago", { days: diffDays });
      }
      const weeks = Math.floor(diffDays / 7);
      return t("eventCard.weeksAgo", "{{weeks}}w ago", { weeks });
    }
    return t("eventCard.ended", "Ended");
  }

  return t("eventCard.ended", "Ended");
}
