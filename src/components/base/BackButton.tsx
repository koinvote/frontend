import React from "react";

import ArrowBackIcon from "@/assets/icons/arroe_back.svg?react";

interface BackButtonProps {
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      className="hover:text-admin-text-sub border-border absolute left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-black dark:text-white"
      onClick={onClick}
    >
      <ArrowBackIcon className="h-4 w-4 fill-current" />
    </button>
  );
};

export default BackButton;
