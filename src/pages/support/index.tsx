import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { API } from "@/api";
import CheckCircle from "@/assets/icons/check_circle.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
import CONSTS from "@/consts";

import { toast } from "@/components/base/Toast/toast";

const SUPPORT_EMAIL = CONSTS.SUPPORT_EMAIL;
const SUBJECT_MAX = 150;
const MESSAGE_MAX = 3000;

export default function Support() {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const schema = z.object({
    email: z
      .string()
      .min(1, t("support.emailRequired", "Please enter your email address"))
      .pipe(
        z.email({
          error: t(
            "support.emailInvalid",
            "Please enter a valid email address",
          ),
        }),
      ),
    subject: z
      .string()
      .min(1, t("support.subjectRequired", "Please enter a subject"))
      .max(
        SUBJECT_MAX,
        t("support.subjectMaxLength", "Subject must be 150 characters or less"),
      ),
    message: z
      .string()
      .min(1, t("support.messageRequired", "Please enter a message"))
      .max(
        MESSAGE_MAX,
        t(
          "support.messageMaxLength",
          "Message must be 3000 characters or less",
        ),
      ),
  });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", subject: "", message: "" },
  });

  useEffect(() => {
    if (isSubmitted) trigger();
  }, [i18n.language, isSubmitted, trigger]);

  const emailValue = watch("email") ?? "";
  const subjectValue = watch("subject") ?? "";
  const messageValue = watch("message") ?? "";

  const isIncomplete =
    !emailValue.trim() || !subjectValue.trim() || !messageValue.trim();

  const handleClear = () => setIsClearModalOpen(true);

  const handleClearConfirm = () => {
    reset({ email: "", subject: "", message: "" });
    setIsClearModalOpen(false);
    toast("success", t("general.cleared", "Cleared!"));
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await API.contactUs({
        email: data.email,
        subject: data.subject,
        message: data.message,
      });
      if (res.success) {
        setIsSuccess(true);
      } else {
        toast(
          "error",
          res.message ||
            t(
              "support.sendFailed",
              "Something went wrong. Please try again later or email {{supportEmail}}",
              { supportEmail: SUPPORT_EMAIL },
            ),
        );
      }
    } catch {
      toast(
        "error",
        t(
          "support.sendFailed",
          "Something went wrong. Please try again later or email {{supportEmail}}",
          { supportEmail: SUPPORT_EMAIL },
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      toast(
        "success",
        t(
          "support.copyEmailSuccess",
          "Support email copied to clipboard: support@koinvote.com",
        ),
      );
    } catch {
      toast(
        "error",
        t(
          "support.failedToCopyText",
          "Failed to copy support email: support@koinvote.com",
        ),
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-3xl flex-col items-center justify-center gap-3 px-2 text-center text-xl md:px-0">
        <CheckCircle className="mb-1" />
        <p className="text-primary">
          {t("support.sendSuccessTitle", "Message sent")}
        </p>
        <p className="text-secondary">
          {t("support.sendSuccessDescription", "We will contact you via email")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 md:px-0 md:pt-6">
      <h1 className="fw-m text-center text-2xl md:text-3xl">
        {t("support.title", "Contact")}
      </h1>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="fw-m text-primary mb-2 text-sm">
            {t("support.emailLabel", "Email")}
            <span className="text-orange-500"> *</span>
          </label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t(
                  "support.emailPlaceholder",
                  "Your email address",
                )}
                status={errors.email ? "error" : undefined}
                disabled={isLoading}
              />
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-1">
          <label className="fw-m text-primary mb-2 text-sm">
            {t("support.subjectLabel", "Subject")}
            <span className="text-orange-500"> *</span>
          </label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t(
                  "support.subjectPlaceholder",
                  "Subject of your message",
                )}
                maxLength={SUBJECT_MAX}
                status={errors.subject ? "error" : undefined}
                disabled={isLoading}
              />
            )}
          />
          <div className="text-secondary mt-1 flex text-xs">
            {errors.subject ? (
              <p className="text-red-500">{errors.subject.message}</p>
            ) : (
              <span>
                {SUBJECT_MAX - subjectValue.length}{" "}
                {SUBJECT_MAX - subjectValue.length === 1
                  ? t("general.characterLeft", "character left")
                  : t("general.charactersLeft", "characters left")}
              </span>
            )}
          </div>
        </div>

        {/* To */}
        <div className="flex flex-col gap-1">
          <label className="fw-m text-primary mb-2 text-sm">
            {t("support.toLabel", "To")}
          </label>
          <div className="flex">
            {SUPPORT_EMAIL}
            <CopyIcon
              className="hover:text-primary text-secondary mt-1 ml-1 cursor-pointer md:mt-0.5"
              onClick={handleCopyEmail}
            />
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1">
          <label className="fw-m text-primary mb-2 text-sm">
            {t("support.messageLabel", "Message")}
            <span className="text-orange-500"> *</span>
          </label>
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={6}
                placeholder={t(
                  "support.messagePlaceholder",
                  "Enter your message",
                )}
                maxLength={MESSAGE_MAX}
                status={errors.message ? "error" : undefined}
                disabled={isLoading}
              />
            )}
          />
          <div className="text-secondary mt-1 flex text-xs">
            {errors.message ? (
              <p className="text-red-500">{errors.message.message}</p>
            ) : (
              <span>
                {MESSAGE_MAX - messageValue.length}{" "}
                {MESSAGE_MAX - messageValue.length === 1
                  ? t("general.characterLeft", "character left")
                  : t("general.charactersLeft", "characters left")}
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-2 flex justify-end gap-3">
          <Button
            onClick={handleClear}
            disabled={isLoading}
            autoInsertSpace={false}
            className="w-40"
          >
            {t("general.clearButton", "Clear")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={isLoading}
            autoInsertSpace={false}
            className="w-40"
            style={
              isIncomplete
                ? { backgroundColor: "#848484", borderColor: "#848484" }
                : undefined
            }
          >
            {t("general.sendButton", "Send")}
          </Button>
        </div>
      </form>

      <Modal
        open={isClearModalOpen}
        centered
        footer={null}
        closable={false}
        width={512}
        classNames={{
          container: "!bg-surface !border !border-border !rounded-xl",
        }}
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-primary fw-m text-lg">
            {t("support.clearConfirmTitle", "Clear all content?")}
          </p>
          <p className="text-secondary text-sm">
            {t("support.clearConfirmMessage", "This action cannot be undone.")}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setIsClearModalOpen(false)}
              autoInsertSpace={false}
            >
              {t("general.cancel", "Cancel")}
            </Button>
            <Button
              type="primary"
              onClick={handleClearConfirm}
              autoInsertSpace={false}
            >
              {t("general.clearButton", "Clear")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
