import {
  DownloadOutlined,
  ExportOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

interface VerificationInfoProps {
  eventId: string;
  planId: number;
  payout_txid: string;
  csvSha256: string;
  isDownloading: boolean;
  onDownloadCsv: () => void;
}

export function VerificationInfo({
  payout_txid,
  csvSha256,
  isDownloading,
  onDownloadCsv,
}: VerificationInfoProps) {
  const { t } = useTranslation();

  const blockExplorerUrl = `https://mempool.space/tx/${payout_txid}`;

  return (
    <div>
      <h4 className="text-base text-primary mt-6 mb-4">
        {t("payoutReport.verificationInfo", "Verification Information")}
      </h4>

      {/* Batch Transfer Txid Section */}
      <div className="p-4 mb-4 border border-neutral-800 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-base text-primary mb-2">
              {t("payoutReport.payout_txid", "Batch transfer txid")}
            </h4>
            <p className="text-xs text-gray-400 dark:text-secondary break-all">
              {payout_txid}
            </p>
          </div>

          <div className="sm:shrink-0">
            <Button
              className="bg-neutral-500! dark:bg-neutral-800! text-white dark:text-primary! border-none! hover:opacity-80!"
              color="default"
              variant="solid"
              icon={<ExportOutlined />}
              onClick={() => window.open(blockExplorerUrl, "_blank")}
            >
              {t("payoutReport.blockExplorer", "Block Explorer")}
            </Button>
          </div>
        </div>
      </div>

      {/* Verification Package Section */}
      <div className="p-4 border border-neutral-800 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-base text-primary mb-2">
              <span className="mr-2">
                {t("payoutReport.verificationPackage", "Verification package")}
              </span>
              <Tooltip
                className="bg-white text-black"
                styles={{ root: { maxWidth: "min(700px, 90vw)" } }}
                title={t(
                  "payoutReport.verificationPackageTooltip",
                  "Use this checksum to verify that the verification package you downloaded is complete and has not been modified."
                )}
              >
                <InfoCircleOutlined className="text-secondary cursor-pointer" />
              </Tooltip>
            </h4>
            <p className="text-xs text-gray-400 dark:text-secondary break-all">
              SHA-256: {csvSha256}
            </p>
          </div>

          <div className="sm:shrink-0">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={isDownloading}
              onClick={onDownloadCsv}
            >
              {t("payoutReport.csv", "CSV")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
