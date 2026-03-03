import { Tooltip } from "antd";
import type { RefObject } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AddressInfo } from "bitcoin-address-validation";

import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useHomeStore } from "@/stores/homeStore";

import type { AddressValidationStatus } from "../types/index";
import type { CreateEventFormValues } from "../formTypes";

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
      <div className="flex items-center gap-1 mb-1">
        <label className="tx-14 lh-20 fw-m text-primary mr-1">
          {t("createEvent.creatorAddress")}
        </label>
        <Tooltip
          placement="topLeft"
          title={t("createEvent.creatorAddressTooltip")}
          color="white"
          arrow={{ pointAtCenter: true }}
          {...creatorAddressTooltip.tooltipProps}
          overlayInnerStyle={{
            ...creatorAddressTooltip.tooltipProps.overlayInnerStyle,
          }}
        >
          <span
            {...creatorAddressTooltip.triggerProps}
            className="tx-14 text-admin-text-main dark:text-white cursor-pointer flex items-center"
          >
            ⓘ
          </span>
        </Tooltip>
        <span className={`text-(--color-orange-500) ml-1`}>*</span>
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
            className={`w-full rounded-xl border border-border bg-white px-3 py-2
  tx-14 lh-20 text-black placeholder:text-secondary
  focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
  ${addrStatus === "invalid" ? "border-red-500 focus:ring-red-500" : ""}
  ${addrStatus === "valid" ? "border-green-500 focus:ring-green-500" : ""}
`}
          />
        )}
      />
      <div className="mt-1 tx-12 lh-18">
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
    </div>
  );
}
