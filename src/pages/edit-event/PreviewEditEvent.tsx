import { Divider } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import BackButton from "@/components/base/BackButton";
import { Button } from "@/components/base/Button";
import { LegalLinks } from "@/components/base/LegalLinks";

import type { EditEventState } from "./types";

export default function PreviewEditEvent() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as EditEventState | null;

  useEffect(() => {
    if (!state) {
      navigate(`/event/${eventId}/edit`, { replace: true });
    }
  }, [state, eventId, navigate]);

  if (!state) return null;

  const hashtags = state.hashtag
    ? state.hashtag.split(",").filter(Boolean)
    : [];

  const handleBack = () => {
    navigate(`/event/${eventId}/edit`, { state });
  };

  const handleConfirmSign = () => {
    navigate(`/event/${eventId}/edit-confirm-sign`, { state });
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 md:px-0">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={handleBack} />
      </div>
      <div className="border-border bg-bg w-full max-w-3xl rounded-3xl border px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-accent">
          {t("preview.title", "Preview Your Event")}
        </h1>

        <p className="tx-14 lh-20 text-secondary mt-1">
          {t(
            "preview.reviewConfirm",
            "Please review and confirm your event details.",
          )}
        </p>

        <div className="mt-6 space-y-6">
          {/* Creator Address */}
          <div>
            <p className="text-secondary text-xs">
              {t("preview.creatorAddress", "Creator address")}
            </p>
            <p className="text-primary mt-2 text-sm break-all">
              {state.creatorAddress || "--"}
            </p>
            <p className="text-warning mt-2 text-xs">
              {t(
                "createEvent.creatorAddressHint",
                "This address will be used to receive payments. Make sure you control the private key for this address.",
              )}
            </p>
          </div>

          <Divider />

          {/* Title */}
          <div>
            <p className="text-secondary text-xs">
              {t("createEvent.title", "Title")}
            </p>
            <p className="text-primary mt-1 text-sm">{state.title}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-secondary text-xs">
              {t("createEvent.description", "Description")}
            </p>
            <p className="text-primary mt-1 text-sm whitespace-pre-wrap">
              {state.description || "—"}
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <p className="text-secondary text-xs">
              {t("createEvent.hashtags", "Hashtags")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {hashtags.length ? (
                hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="border-border bg-surface text-primary rounded-full border px-3 py-1 text-xs"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-secondary text-sm">—</span>
              )}
            </div>
          </div>

          <Divider />

          {/* Response Type */}
          <div>
            <p className="text-secondary text-xs">
              {t("createEvent.responseType", "Response Type")}
            </p>
            <p className="text-primary mt-1 text-sm">
              {state.eventType === "single_choice"
                ? t("createEvent.responseTypeOptions.1.label", "Single-choice")
                : t("createEvent.responseTypeOptions.0.label", "Open-ended")}
            </p>
          </div>

          {/* Options */}
          {state.eventType === "single_choice" && state.options?.length && (
            <div>
              <p className="text-secondary text-xs">
                {t("createEvent.options", "Options")}
              </p>
              <ul className="mt-1 space-y-1">
                {state.options.map((opt, i) => (
                  <li key={i} className="text-primary text-sm">
                    {i + 1}. {opt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="border-border mt-6 border-t pt-4">
          <LegalLinks />
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          appearance="outline"
          tone="primary"
          text="sm"
          className="sm:w-40"
          onClick={handleBack}
        >
          {t("preview.editEvent", "Edit Event")}
        </Button>
        <Button
          type="button"
          appearance="solid"
          tone="primary"
          text="sm"
          className="sm:w-40"
          onClick={handleConfirmSign}
        >
          {t("confirmSign.title", "Confirm & Sign")}
        </Button>
      </div>
    </div>
  );
}
