import { DownOutlined } from "@ant-design/icons";
import type { CollapseProps } from "antd";
import { Collapse } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { API } from "@/api/index";
import CopyIcon from "@/assets/icons/copy.svg?react";
import VerificationIcon from "@/assets/icons/verification.svg?react";
import VerificationWhiteIcon from "@/assets/icons/verificationWhite.svg?react";
import ReceiptSamplePng from "@/assets/img/receipt_sample.png";
import ReceiptVerificationPng from "@/assets/img/receipt_verification.png";
import BackButton from "@/components/base/BackButton";
import { useToast } from "@/components/base/Toast/useToast";
import { useBackIfInternal } from "@/hooks/useBack";

const VerificationTool = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const goBack = useBackIfInternal("/");

  const [receiptPubKeys, setReceiptPubKeys] = useState<
    Array<{
      kid: string;
      public_key: string;
      alg: string;
      active: boolean;
      created_at: string;
    }>
  >([]);

  useEffect(() => {
    const fetchPubKeys = async () => {
      const response = await API.getReceiptVerifyPubKeys();
      setReceiptPubKeys(response.data);
    };
    fetchPubKeys();
  }, []);

  const eventCode = t("verificationTool.codeBlockContentForCopy");

  const handleCopy = useCallback(
    (text: string) => {
      try {
        if (navigator && navigator.clipboard) {
          navigator.clipboard.writeText(text);
          showToast(
            "success",
            t("verificationTool.codeBlockCopied", "Code copied to clipboard"),
          );
        }
      } catch (e) {
        console.error("Failed to copy", e);
        showToast(
          "error",
          t("verificationTool.codeBlockCopyFailed", "Failed to copy code"),
        );
      }
    },
    [t, showToast],
  );

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
            <h1 className="text-2xl fw-m text-accent">
              {t("verificationTool.title", "Verification Guide")}
            </h1>
            <p className="text-secondary leading-relaxed md:tx-16">
              {t(
                "verificationTool.description",
                "How to independently verify events and receipts using open-source tools",
              )}
            </p>
          </div>
        </div>

        {/* Intro note box */}
        <div className="flex flex-col items-start justify-start gap-2 border border-border p-4 rounded-xl md:tx-16 w-full">
          <div className="flex flex-row items-center justify-start gap-2">
            <VerificationWhiteIcon className="w-6 h-6" />
            <span className="text-primary">
              {t(
                "verificationTool.introductionTitle",
                "Introduction to the Verification Tool",
              )}
            </span>
          </div>
          <span className="text-secondary leading-relaxed">
            {t(
              "verificationTool.introductionText1",
              "This page guides you in independently verifying the fairness of results and the authenticity of your reply receipt using the provided data and open-source tools.",
            )}
          </span>
          <span className="text-secondary leading-relaxed">
            {t(
              "verificationTool.introductionText2",
              "No trust in the platform is required, as all verification inputs and source code are publicly available.",
            )}
          </span>
        </div>

        {/* Event Result Verification */}
        <section className="w-full space-y-6 border border-border p-4 rounded-xl md:tx-16">
          <h2 className="fw-m md:tx-18">
            {t(
              "verificationTool.eventResultTitle",
              "Event Result Verification",
            )}
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
              <h3 className="fw-m">
                {t(
                  "verificationTool.step1Title",
                  "Go to the Reward Distribution Report to download the verification package (CSV).",
                )}
              </h3>
              <ul className="pl-6 list-disc text-secondary">
                <li>
                  {t(
                    "verificationTool.step1_1",
                    "Go to the event page you want to verify.",
                  )}
                </li>
                <li>
                  {t(
                    "verificationTool.step1_2",
                    "View the Reward Distribution Report for that event.",
                  )}
                </li>
                <li>
                  {t(
                    "verificationTool.step1_3",
                    "Find the reward you want to verify and download the verification package.",
                  )}
                </li>
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
              <h3 className="fw-m">
                {t(
                  "verificationTool.step2Title",
                  "Set Up and Run the Event Verifier",
                )}
              </h3>

              {/* 2.1 View the open-source code */}
              <div className="space-y-1">
                <p className="fw-m">
                  {t(
                    "verificationTool.step2_1_title",
                    "1. View the open-source code",
                  )}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t("verificationTool.step2_1_text_before", "Go to our")}{" "}
                  <a
                    href="https://github.com/koinvote/event-verifier"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {t(
                      "verificationTool.step2_1_linkLabel",
                      "GitHub repository",
                    )}
                  </a>{" "}
                  {t(
                    "verificationTool.step2_1_text_after",
                    "to inspect or download the verification script.",
                  )}
                </p>
              </div>

              {/* 2.2 Install Go */}
              <div className="space-y-1">
                <p className="fw-m">
                  {t("verificationTool.step2_2_title", "2. Install Go")}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t(
                    "verificationTool.step2_2_text1",
                    "To run the verifier, you need to install the Go programming language (version 1.20 or above).",
                  )}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t(
                    "verificationTool.step2_2_text2",
                    "If you already have Go installed, you can skip this step.",
                  )}
                </p>
              </div>

              {/* 2.3 Clone and Run */}
              <div className="space-y-1">
                <p className="fw-m">
                  {t(
                    "verificationTool.step2_3_title",
                    "3. Clone and Run the Verifier",
                  )}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t(
                    "verificationTool.step2_3_text",
                    "Download the open-source verifier code from GitHub and run it using Go.",
                  )}
                </p>
              </div>
            </div>
          </div>
          {/* Terminal-like code block */}
          <div className="md:ml-14">
            <div className="relative mt-2 w-full rounded-xl border border-border bg-surface border-t-38 border-t-neutral-200 dark:border-t-neutral-700">
              <button
                type="button"
                onClick={() => handleCopy(eventCode)}
                className="absolute right-3 -top-8 tx-12 px-3 py-1 
               rounded-lg bg-[--color-bg] text-secondary hover:bg-border cursor-pointer"
              >
                <CopyIcon className="w-4 h-4 text-current inline-block mr-1" />
                {t("verificationTool.codeBlockCopy", "Copy code")}
              </button>

              <pre
                className="m-0 p-4 text-secondary tx-12 md:tx-14 font-mono
               whitespace-pre-wrap wrap-break-word"
              >
                {/* 有顏色的版本, 註釋拆出來 for i18n */}
                {t("verificationTool.codeBlockAlt1", "# Download the verifier")}
                <br />
                <span className="text-primary">
                  git <span className="text-orange-500">clone</span>{" "}
                  https://github.com/koinvote/event-verifier.git
                </span>
                <br />
                <span className="text-primary">
                  <span className="text-orange-500">cd</span> event-verifier
                </span>
                <br />
                <br />
                {t("verificationTool.codeBlockAlt2", "# Compile the verifier")}
                <br />
                <span className="text-primary">
                  go build -o verify-event main.go
                </span>
                <br />
                <br />
                {t(
                  "verificationTool.codeBlockAlt3",
                  "# Run the verifier\n# Replace <your-report-file.csv> with the actual report file you downloaded",
                )}
                <br />
                <span className="text-primary">
                  ./verify-event --report &lt;your-report-file.csv&gt;
                </span>
              </pre>
            </div>
          </div>
        </section>

        {/* Receipt Verification */}
        <section className="w-full space-y-6 border border-border p-4 rounded-xl md:tx-16">
          <h2 className="fw-m md:tx-18">
            {t("verificationTool.receiptSectionTitle", "Receipt Verification")}
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
                  {t(
                    "verificationTool.receiptStep1Title",
                    "Download your reply receipt after submitting your reply",
                  )}
                </h3>
                <p className="text-secondary">
                  {t(
                    "verificationTool.receiptStep1Subtitle",
                    'Once your reply is submitted, click "Download Receipt" to save your receipt file.',
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <img
                src={ReceiptVerificationPng}
                alt={t(
                  "verificationTool.receiptImageAlt",
                  "Screenshot of the submission success screen with the Download Receipt button highlighted.",
                )}
                className="max-w-xs md:max-w-sm border border-accent rounded-xl"
              />
            </div>
          </div>

          <div className="border-b border-border w-full" />

          {/* Step 2 + sample */}
          <div className="flex flex-col gap-4">
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
                  {t(
                    "verificationTool.receiptStep2Title",
                    "Identify the Public Key for the kid",
                  )}
                </h3>

                {/* 2.1 View the open-source code */}
                <div className="space-y-1 text-secondary leading-relaxed whitespace-pre-line">
                  <p>
                    {t(
                      "verificationTool.receiptStep2Description1",
                      "Open the receipt file and locate the kid field.\nMatch the kid value to the corresponding public key listed below.",
                    )}
                  </p>
                  {receiptPubKeys.length > 0 &&
                    receiptPubKeys.map((item) => (
                      <div className="my-4 text-sm md:text-base">
                        kid ({item.kid})
                        <br />
                        {item.alg.toLocaleUpperCase()} {` `}
                        Public Key (Base64):
                        <br />
                        <span className="text-green-600 break-all">
                          {item.public_key}
                        </span>
                      </div>
                    ))}
                  <p>
                    {t(
                      "verificationTool.receiptStep2Description2",
                      "Note:\nThe kid field is a key identifier, not the public key itself.\nAlways use the public key mapped to the kid for verification.",
                    )}
                  </p>
                  <p className="mt-4">
                    {t(
                      "verificationTool.receiptSampleImageTitle",
                      "Receipt File Example:",
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={ReceiptSamplePng}
                alt={t(
                  "verificationTool.receiptSampleImageAlt",
                  "Screenshot showing the kid field in the receipt file.",
                )}
                className="max-w-xs sm:max-w-md md:max-w-md lg:max-w-lg border border-accent rounded-xl"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-4">
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
                  {t(
                    "verificationTool.receiptStep3Title",
                    "Verify the Receipt Signature",
                  )}
                </h3>

                {/* 2.1 View the open-source code */}
                <div className="space-y-1 text-secondary leading-relaxed whitespace-pre-line">
                  <p>
                    {t(
                      "verificationTool.receiptStep3Description1",
                      "Go to the following external verification tool:",
                    )}
                    <br />
                    <span className="mr-2">&#128073;</span>
                    <a
                      href="https://cyphr.me/ed25519_tool/ed.html"
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline"
                    >
                      https://cyphr.me/ed25519_tool/ed.html
                    </a>
                  </p>
                  <ul className="mt-4 pl-6 list-disc">
                    <li>Algorithm → ed25519</li>
                    <li>Message → receipt payload (UTF-8)</li>
                    <li>Public Key → mapped public key for the kid (Base64)</li>
                    <li>Signature → receipt sig</li>
                  </ul>
                  <p>
                    {t(
                      "verificationTool.receiptStep3Description2",
                      "Click Verify to complete verification.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full space-y-6 border border-border p-4 rounded-xl md:tx-16">
          <h2 className="fw-m md:tx-18">
            {t("verificationTool.faqTitle", "FAQ")}
          </h2>
          <Collapse
            items={faqItems}
            className="text-sm! md:text-base!"
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

export default VerificationTool;
