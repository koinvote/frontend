import { Button, Input } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { MailOutlined } from "@ant-design/icons";

import { API } from "@/api";
import CheckCircle from "@/assets/icons/check_circle.svg?react";
import { toast } from "@/components/base/Toast/toast";
import { useHomeStore } from "@/stores/homeStore";

export default function Subscribe() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const isDesktop = useHomeStore((s) => s.isDesktop);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError(t("subscribe.errorEmpty", "Please enter your email address"));
      return;
    }

    if (!validateEmail(email)) {
      setError(
        t("subscribe.errorInvalid", "Please enter a valid email address"),
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.subscribe({ email });
      if (res.success) {
        setIsSuccess(true);
      } else {
        toast(
          "error",
          res.message ||
            t(
              "subscribe.errorFailed",
              "Subscription failed. Please try again.",
            ),
        );
      }
    } catch {
      toast(
        "error",
        t("subscribe.errorFailed", "Subscription failed. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center gap-3 px-6 text-center text-xl md:px-0">
      <h1 className="fw-m text-center text-2xl md:text-3xl">
        {t("subscribe.title", "Don't Miss Any Chance to Earn Bitcoin")}
      </h1>

      <p className="text-lg text-gray-400 md:text-xl">
        {t(
          "subscribe.description",
          "Enter your email and you’ll be notified when new reward events are announced.",
        )}
      </p>

      {isSuccess ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center md:min-w-md">
          <CheckCircle className="mb-1" />
          <p className="text-primary text-lg md:text-xl">
            {t("subscribe.successMessageTitle", "Subscription successful.")}
          </p>
          <p className="text-lg wrap-break-word text-gray-400 md:text-xl">
            {t(
              "subscribe.successMessageDescription",
              "You'll be notified when new reward events go live.",
            )}
          </p>
        </div>
      ) : (
        <div className="mt-10 flex w-full max-w-3xl flex-col gap-4 md:min-w-md">
          <Input
            className="p-4!"
            size={isDesktop ? "large" : "small"}
            prefix={<MailOutlined className="mr-2 text-gray-400!" />}
            placeholder={t(
              "subscribe.emailPlaceholder",
              "Enter your email address...",
            )}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            onPressEnter={handleSubmit}
            status={error ? "error" : undefined}
            disabled={isLoading}
          />
          {error && (
            <p className="-mt-2 text-left text-sm text-red-500">{error}</p>
          )}
          <Button
            size="large"
            type="primary"
            className="w-full"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            autoInsertSpace={false}
          >
            {isLoading
              ? t("subscribe.subscribing", "Subscribing")
              : t("subscribe.button", "Subscribe")}
          </Button>
        </div>
      )}
    </div>
  );
}
