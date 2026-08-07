import { forwardRef } from "react";

import { cn } from "@/utils/style";

export type AddressInputProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows" | "wrap"
>;

/**
 * Single-line field for entering a Bitcoin address.
 *
 * Deliberately a <textarea> and not an <input>: Safari (and Chrome) offer to
 * fill a text input from the user's own contact card whenever the surrounding
 * copy reads like a postal address, and our labels and placeholders all say
 * "address". No combination of autocomplete/name/id values reliably turns that
 * off, but contact autofill never targets a <textarea>.
 */
export const AddressInput = forwardRef<HTMLTextAreaElement, AddressInputProps>(
  function AddressInput({ className, onChange, onKeyDown, ...rest }, ref) {
    return (
      <textarea
        {...rest}
        ref={ref}
        rows={1}
        wrap="off"
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
        onChange={(e) => {
          // A Bitcoin address never contains whitespace, so dropping it lets a
          // line-wrapped or trailing-newline paste still validate.
          const cleaned = e.target.value.replace(/\s+/g, "");
          if (cleaned !== e.target.value) e.target.value = cleaned;
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
          onKeyDown?.(e);
        }}
        className={cn("address-input block", className)}
      />
    );
  },
);
