import { Tooltip } from "antd";
import type { RefObject } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import InfoIcon from "@/assets/icons/info.svg?react";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useHomeStore } from "@/stores/homeStore";

import type { AddressInfo } from "bitcoin-address-validation";
import type { CreateEventFormValues } from "../formTypes";
import type { AddressValidationStatus } from "../types/index";

interface CreatorAddressFieldProps {
  addrStatus: AddressValidationStatus;
  addrInfo: AddressInfo | null;
  addrError: string;
  addrStatusRef: RefObject<AddressValidationStatus>;
  addrErrorRef: RefObject<string>;
}

export function CreatorAddressField({
  addrStatus,
  addrInfo,
  addrError,
  addrStatusRef,
  addrErrorRef,
}: CreatorAddressFieldProps) {
  const { t } = useTranslation();
  const { control } = useFormContext<CreateEventFormValues>();
  const { isDesktop } = useHomeStore();
  const creatorAddressTooltip = useTooltipWithClick({ singleLine: isDesktop });

  return (
    <div>
      <div className="mb-2 flex items-center gap-1">
        <label className="text-primary text-sm leading-5 font-medium">
          {t("createEvent.creatorAddress")}
        </label>
        <span className={`mr-1 ml-1 text-(--color-orange-500)`}>*</span>
        <Tooltip
          title={t(
            "createEvent.creatorAddressTooltip",
            "This address will also be used for refunds.",
          )}
          placement="top"
          color="white"
          {...creatorAddressTooltip.tooltipProps}
        >
          <span
            {...creatorAddressTooltip.triggerProps}
            className="cursor-pointer"
          >
            <InfoIcon />
          </span>
        </Tooltip>
      </div>
      <Controller
        control={control}
        name="creatorAddress"
        rules={{
          validate: () =>
            addrStatusRef.current === "valid" ||
            addrErrorRef.current ||
            t("createEvent.addressInvalid", "Invalid address."),
        }}
        render={({ field }) => (
          <input
            {...field}
            // Override DOM name/id to avoid browser autofill
            name="field_7x9abtca"
            id="field_7x9abtca"
            type="text"
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="one-time-code"
            spellCheck="false"
            placeholder={t("createEvent.creatorAddressPlaceholder")}
            className={`border-border bg-form-bg tx-14 text-primary w-full rounded-xl border px-3 py-2 leading-5 placeholder:text-neutral-300 focus:ring-2 focus:ring-(--color-orange-500) focus:outline-none dark:placeholder:text-neutral-600 ${addrStatus === "invalid" ? "border-red-500 focus:ring-red-500" : ""} ${addrStatus === "valid" ? "border-green-500 focus:ring-green-500" : ""} `}
          />
        )}
      />
      <div className="tx-12 lh-18 mt-1">
        {addrStatus === "checking" && (
          <span className="text-secondary">
            {t("createEvent.addressChecking", "Checking…")}
          </span>
        )}
        {addrStatus === "valid" && addrInfo && (
          <span className="text-green-600">
            {t("createEvent.addressValid", "Valid ({{type}})", {
              type: addrInfo.type.toUpperCase(),
            })}
          </span>
        )}
        {addrStatus === "invalid" && (
          <span className="text-red-500">
            {addrError || t("createEvent.addressInvalid", "Invalid address.")}
          </span>
        )}
      </div>
      <div className="text-secondary mt-1 text-xs">
        {t(
          "createEvent.creatorAddressHint",
          "This address will be used to receive payments. Make sure you control the private key for this address.",
        )}
      </div>
    </div>
  );
}
