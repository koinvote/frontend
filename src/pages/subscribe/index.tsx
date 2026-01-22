import { API } from "@/api";
import { toast } from "@/components/base/Toast/toast";
import { CheckOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Subscribe() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

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
        t("subscribe.errorInvalid", "Please enter a valid email address")
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
            t("subscribe.errorFailed", "Subscription failed. Please try again.")
        );
      }
    } catch {
      toast(
        "error",
        t("subscribe.errorFailed", "Subscription failed. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto space-y-6 px-2 md:px-0 text-center">
      <h1 className="text-2xl md:text-3xl fw-m">
        {t("subscribe.title", "Don't Miss Any Chance to Earn Bitcoin")}
      </h1>

      <p className="max-w-xl text-lg md:text-xl text-gray-400">
        {t(
          "subscribe.description",
          "Enter your email and you'll be notified whenever a new reward event is created."
        )}
      </p>

      {isSuccess ? (
        <div className="flex flex-col gap-4 min-w-md mt-10 text-center">
          <p className="max-w-xl text-lg md:text-xl text-primary">
            <CheckOutlined className="text-green-400! mr-2" />
            {t("subscribe.successMessageTitle", "Subscription successful.")}
          </p>
          <p className="max-w-xl text-lg md:text-xl text-gray-400">
            {t(
              "subscribe.successMessageDescription",
              "You'll be notified when new reward events go live."
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 min-w-md mt-10">
          <Input
            className="p-4!"
            size="large"
            prefix={<MailOutlined className="mr-2 text-gray-400!" />}
            placeholder={t(
              "subscribe.emailPlaceholder",
              "Enter your email address..."
            )}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            status={error ? "error" : undefined}
            disabled={isLoading}
          />
          {error && (
            <p className="text-left text-red-500 text-sm -mt-2">{error}</p>
          )}
          <Button
            size="large"
            type="primary"
            className="w-full"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
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
