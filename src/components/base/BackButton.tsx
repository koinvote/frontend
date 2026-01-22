import React from "react";

import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";

interface BackButtonProps {
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
      onClick={onClick}
    >
      <CircleLeftIcon className="w-8 h-8 fill-current" />
    </button>
  );
};

export default BackButton;
