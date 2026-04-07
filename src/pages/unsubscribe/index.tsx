import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { API } from "@/api";
import CheckCircle from "@/assets/icons/check_circle.svg?react";
import Invalidate from "@/assets/icons/invalidate.svg?react";

export default function Unsubscribe() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    API.unsubscribe({ token })
      .then((res) => {
        setStatus(res.success ? "success" : "error");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center gap-3 px-6 text-center text-xl md:px-0">
      <h1 className="text-center text-2xl font-medium md:text-3xl">
        {t("unsubscribe.title", "Email Notification Settings")}
      </h1>

      {status === "loading" && (
        <p className="text-lg text-gray-400">
          {t("unsubscribe.loading", "Processing your request...")}
        </p>
      )}

      {status === "success" && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center md:min-w-md">
          <CheckCircle className="mb-1" />
          <p className="text-primary text-lg md:text-xl">
            {t("unsubscribe.successTitle", "Unsubscribed successfully.")}
          </p>
          <p className="text-lg text-gray-400 md:text-xl">
            {t(
              "unsubscribe.successDescription",
              "You will no longer receive these notifications.",
            )}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center md:min-w-md">
          <Invalidate className="mb-1 size-8" />
          <p className="text-lg md:text-xl">
            {t("unsubscribe.errorTitle", "Unsubscribe Failed.")}
          </p>
          <p className="text-lg text-gray-400 md:text-xl">
            {t(
              "unsubscribe.errorDescription",
              "Please contact customer support for assistance.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
