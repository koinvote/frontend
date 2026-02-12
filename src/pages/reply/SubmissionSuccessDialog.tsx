import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";

interface SubmissionSuccessDialogProps {
  open: boolean;
  onDownloadReceipt: () => void;
  onViewResult: () => void;
  isDownloading?: boolean;
}

export function SubmissionSuccessDialog({
  open,
  onDownloadReceipt,
  onViewResult,
  isDownloading = false,
}: SubmissionSuccessDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={{
        xs: "90vw",
        sm: "390px",
      }}
      classNames={{
        container: "!bg-white dark:!bg-gray-950 !rounded-2xl !p-8",
      }}
    >
      <div className="flex flex-col items-center">
        {/* Checkmark Icon */}
        <div className="py-6">
          <CheckCircleOutlined className="text-[40px] text-[#67c23a]!" />
        </div>

        <div className="p-6">
          {/* Title */}
          <h2 className="text-orange-500 text-2xl font-semibold mb-2 text-center">
            {t("reply.submissionSuccessful", "Submission Successful")}
          </h2>

          {/* Subtitle */}
          <p className="text-black dark:text-white text-base text-center">
            {t(
              "reply.submissionSuccessMessage",
              "Your reply has been submitted successfully",
            )}
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4 my-6">
          <Button
            color="orange"
            variant="solid"
            size="large"
            block
            onClick={onDownloadReceipt}
            disabled={isDownloading}
            className="font-medium"
          >
            {isDownloading
              ? t("reply.downloading", "Downloading...")
              : t("reply.downloadReceipt", "Download Receipt")}
          </Button>

          <Button
            type="primary"
            size="large"
            className="bg-neutral-500! hover:bg-neutral-500/80! text-white! font-medium!"
            block
            onClick={onViewResult}
            styles={{
              root: {
                boxShadow: "none",
              },
            }}
          >
            {t("reply.viewResult", "View Result")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
