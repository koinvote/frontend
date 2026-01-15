import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { useNavigate } from "react-router";
import { RewardInfoCard } from "./components/RewardInfoCard";

const RewardReport = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-col flex items-center justify-center w-full px-4 md:px-2">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>
      <div className="flex flex-col items-start justify-start w-full ">
        <span className="text-2xl font-bold text-accent">
          Reward Distribution Report
        </span>
        <span className="text-secondary tx-16 lh-24">
          View complete reward distribution details and verification information
        </span>
      </div>
      <div className="h-4 md:h-6" />
      {/* Information Section */}
      <div className="w-full max-w-5xl">
        <RewardInfoCard />
      </div>
    </div>
  );
};

export default RewardReport;
