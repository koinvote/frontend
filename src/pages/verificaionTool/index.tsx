import { DownOutlined } from "@ant-design/icons";
import type { CollapseProps } from "antd";
import { Collapse } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import VerificationIcon from "@/assets/icons/verification.svg?react";
import VerificationWhiteIcon from "@/assets/icons/verificationWhite.svg?react";
import ReceiptVerificationPNG from "@/assets/img/receiptVerification.png";
import BackButton from "@/components/base/BackButton";
import { useBackIfInternal } from "@/hooks/useBack";

const VerificaionTool = () => {
  const { t } = useTranslation();
  const goBack = useBackIfInternal("/");

  const eventCode = t("verificationTool.codeBlock_content");
  const receiptCode = t("verificationTool.receiptCodeBlock_content");

  const handleCopy = useCallback((text: string) => {
    try {
      if (navigator && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.error("Failed to copy", e);
    }
  }, []);

  const faqItems: CollapseProps["items"] = [
    {
      key: "1",
      label: (
        <span className="text-primary">
          {t("verificationTool.faq1_question")}
        </span>
      ),
      children: (
        <p className="px-4 py-2 text-secondary">
          {t("verificationTool.faq1_answer")}
        </p>
      ),
    },
    {
      key: "2",
      label: (
        <span className="text-primary">
          {t("verificationTool.faq2_question")}
        </span>
      ),
      children: (
        <p className="px-4 py-2 text-secondary">
          {t("verificationTool.faq2_answer")}
        </p>
      ),
    },
    {
      key: "3",
      label: (
        <span className="text-primary">
          {t("verificationTool.faq3_question")}
        </span>
      ),
      children: (
        <p className="px-4 py-2 text-secondary">
          {t("verificationTool.faq3_answer")}
        </p>
      ),
    },
  ];

  const onChange = (key: string | string[]) => {
    console.log(key);
  };

  return (
    <div className="flex flex-col items-start justify-start overflow-x-hidden px-2 md:px-0">
      <div className="h-[50px] w-full relative">
        <BackButton onClick={goBack} />
      </div>
      <div className="flex flex-col gap-6 w-full px-4 pb-6 md:px-8 md:pb-10 ">
        {/* Intro card */}
        <div className="flex gap-4 p-4 md:p-8 md:items-center border-b border-border">
          <span>
            <VerificationIcon />
          </span>
          <div className="flex flex-col items-start justify-center">
            <h1 className="text-2xl lg:text-3xl fw-m text-accent">
              {t("verificationTool.title")}
            </h1>
            <p className="text-secondary leading-relaxed md:tx-16 lg:tx-18 lg:lh-27">
              {t("verificationTool.description")}
            </p>
          </div>
        </div>

        {/* Intro note box */}
        <div className="flex flex-col items-start justify-start gap-2 border border-border p-4 rounded-xl md:tx-16 lg:tx-18 lg:lh-27 w-full">
          <div className="flex flex-row items-center justify-start gap-2">
            <VerificationWhiteIcon className="w-6 h-6" />
            <span className="text-primary">
              {t("verificationTool.introductionTitle")}
            </span>
          </div>
          <span className="text-secondary leading-relaxed">
            {t("verificationTool.introductionText1")}
          </span>
          <span className="text-secondary leading-relaxed">
            {t("verificationTool.introductionText2")}
          </span>
        </div>

        {/* Event Result Verification */}
        <section className="w-full space-y-6 border border-border p-4 rounded-xl md:tx-16 lg:tx-18 lg:lh-27">
          <h2 className="fw-m md:tx-18 lg:tx-20">
            {t("verificationTool.eventResultTitle")}
          </h2>

          <div className="border-b border-border w-full" />

          {/* Step 1 */}
          <div className="flex gap-4">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center
               rounded-full border border-border fw-m bg-primary-lightModeGray
               md:w-10 md:h-10"
            >
              <span className="text-black">1</span>
            </div>
            <div className="space-y-2">
              <h3 className="fw-m">{t("verificationTool.step1Title")}</h3>
              <ul className="list-disc list-inside text-secondary md:tx-14 lg:tx-16 lg:lh-24">
                <li>{t("verificationTool.step1_1")}</li>
                <li>{t("verificationTool.step1_2")}</li>
                <li>{t("verificationTool.step1_3")}</li>
              </ul>
            </div>
          </div>

          <div className="border-b border-border w-full" />

          {/* Step 2 */}
          <div className="flex gap-4">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center
            rounded-full border border-border fw-m bg-primary-lightModeGray
            md:w-10 md:h-10"
            >
              <span className="text-black">2</span>
            </div>
            <div className="space-y-4 w-full">
              <h3 className="fw-m">{t("verificationTool.step2Title")}</h3>

              {/* 2.1 View the open-source code */}
              <div className="space-y-1">
                <p className="fw-m">{t("verificationTool.step2_1_title")}</p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_1_text_before")}{" "}
                  <a
                    href="https://github.com/koinvote/event-verifier"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {t("verificationTool.step2_1_linkLabel")}
                  </a>{" "}
                  {t("verificationTool.step2_1_text_after")}
                </p>
              </div>

              {/* 2.2 Install Go */}
              <div className="space-y-1">
                <p className="fw-m">{t("verificationTool.step2_2_title")}</p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_2_text1")}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_2_text2")}
                </p>
              </div>

              {/* 2.3 Clone and Run */}
              <div className="space-y-1">
                <p className="fw-m">{t("verificationTool.step2_3_title")}</p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_3_text")}
                </p>

                {/* Terminal-like code block */}
                <div className="relative mt-2 w-full rounded-xl border border-border bg-surface">
                  <button
                    type="button"
                    onClick={() => handleCopy(eventCode)}
                    className="absolute right-3 top-3 tx-12 px-3 py-1 
               rounded-lg border border-border bg-[--color-bg] text-secondary hover:bg-border"
                  >
                    {t("verificationTool.codeBlock_copy")}
                  </button>

                  <pre
                    className="m-0 p-4 pt-9 text-secondary tx-12 md:tx-14 font-mono
               whitespace-pre-wrap wrap-break-word"
                  >
                    {eventCode}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Receipt Verification */}
        <section className="w-full space-y-6 border border-border p-4 rounded-xl md:tx-16 lg:tx-18 lg:lh-27">
          <h2 className="fw-m md:tx-18 lg:tx-20">
            {t("verificationTool.receiptSectionTitle")}
          </h2>

          <div className="border-b border-border w-full" />

          {/* Step 1 + image */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center
              rounded-full border border-border fw-m bg-primary-lightModeGray
              md:w-10 md:h-10"
              >
                <span className="text-black">1</span>
              </div>
              <div className="space-y-1">
                <h3 className="fw-m">
                  {t("verificationTool.receiptStep1Title")}
                </h3>
                <p className="text-secondary">
                  {t("verificationTool.receiptStep1Subtitle")}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <img
                src={ReceiptVerificationPNG}
                alt={t("verificationTool.receiptImageAlt")}
                className="max-w-xs md:max-w-sm border border-accent rounded-xl"
              />
            </div>
          </div>

          <div className="border-b border-border w-full" />

          {/* Step 2 + terminal */}
          <div className="flex gap-4">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center
            rounded-full border border-border fw-m bg-primary-lightModeGray
            md:w-10 md:h-10"
            >
              <span className="text-black">2</span>
            </div>
            <div className="space-y-4 w-full">
              <h3 className="fw-m">
                {t("verificationTool.receiptStep2Title")}
              </h3>

              {/* 2.1 View the open-source code */}
              <div className="space-y-1">
                <p className="fw-m">{t("verificationTool.step2_1_title")}</p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_1_text_before")}{" "}
                  <a
                    href="https://github.com/koinvote/receipt-verifier"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {t("verificationTool.step2_1_linkLabel")}
                  </a>{" "}
                  {t("verificationTool.step2_1_text_after")}
                </p>
              </div>

              {/* 2.2 Install Go */}
              <div className="space-y-1">
                <p className="fw-m">{t("verificationTool.step2_2_title")}</p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_2_text1")}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_2_text2")}
                </p>
              </div>

              {/* 2.3 Clone and Run */}
              <div className="space-y-1">
                <p className="fw-m">{t("verificationTool.step2_3_title")}</p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_3_text")}
                </p>

                {/* Terminal-like code block */}
                <div className="relative mt-2 w-full rounded-xl border border-border bg-surface">
                  <button
                    type="button"
                    onClick={() => handleCopy(receiptCode)}
                    className="absolute right-3 top-3 tx-12 px-3 py-1 
               rounded-lg border border-border bg-[--color-bg] text-secondary hover:bg-border"
                  >
                    {t("verificationTool.codeBlock_copy")}
                  </button>

                  <pre
                    className="m-0 p-4 pt-9 text-secondary tx-12 md:tx-14 font-mono
               whitespace-pre-wrap wrap-break-word"
                  >
                    {receiptCode}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full space-y-6 border border-border p-4 rounded-xl md:tx-16 lg:tx-18 lg:lh-27">
          <h2 className="fw-m md:tx-18 lg:tx-20">
            {t("verificationTool.faqTitle", "FAQ")}
          </h2>
          <Collapse
            items={faqItems}
            className="text-sm! md:text-base! lg:text-lg!"
            onChange={onChange}
            bordered={false}
            expandIcon={({ isActive }) => (
              <DownOutlined rotate={isActive ? 180 : 0} />
            )}
            expandIconPlacement="end"
            styles={{
              root: { backgroundColor: "transparent" },
            }}
          />
          <div></div>
        </section>
      </div>
    </div>
  );
};

export default VerificaionTool;
