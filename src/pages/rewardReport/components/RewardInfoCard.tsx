interface RewardInfoData {
  eventTitle: string;
  eventId: string;
  blockHigh: string;
  originalReward: string;
  additionalRewards: string[];
  totalReward: string;
  rewardThreshold: string;
}

const defaultData: RewardInfoData = {
  eventTitle: "2024 Q4 Bitcoin Campaign",
  eventId: "BTC-REWARD-2024-Q4-001",
  blockHigh: "815,432",
  originalReward: "500,000 sats",
  additionalRewards: ["150,000 sats", "200,000 sats"],
  totalReward: "850,000 sats",
  rewardThreshold: "10,000 sats",
};

export function RewardInfoCard({
  data = defaultData,
}: {
  data?: RewardInfoData;
}) {
  const additionalLabels = data.additionalRewards.map((_, idx) =>
    data.additionalRewards.length > 1
      ? `Additional Reward #${idx + 1}`
      : "Additional Reward"
  );

  return (
    <div className="w-full rounded-xl border border-border bg-bg p-4 md:p-5 space-y-4">
      <div className="text-sm md:text-base font-semibold text-primary">
        Information
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm md:text-base text-primary">
        <div className="space-y-1">
          <div className="text-secondary text-xs md:text-sm">Event Title</div>
          <div className="font-medium">{data.eventTitle}</div>
        </div>
        <div className="space-y-1">
          <div className="text-secondary text-xs md:text-sm">Event-ID</div>
          <div className="font-medium">{data.eventId}</div>
        </div>
        <div className="space-y-1">
          <div className="text-secondary text-xs md:text-sm">Block high</div>
          <div className="font-medium">{data.blockHigh}</div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm md:text-base text-primary">
        <div className="space-y-1">
          <div className="text-secondary text-xs md:text-sm">
            Original reward
          </div>
          <div className="font-medium">{data.originalReward}</div>
        </div>
        {data.additionalRewards.map((value, idx) => (
          <div key={idx} className="space-y-1">
            <div className="text-secondary text-xs md:text-sm">
              {additionalLabels[idx]}
            </div>
            <div className="font-medium">{value}</div>
          </div>
        ))}
        <div className="space-y-1">
          <div className="text-secondary text-xs md:text-sm">Total Reward</div>
          <div className="font-semibold text-primary">{data.totalReward}</div>
        </div>
      </div>

      {/* Threshold */}
      <div className="flex items-center gap-2 text-sm md:text-base text-secondary">
        <span>Reward threshold:</span>
        <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-primary font-medium">
          {data.rewardThreshold}
        </span>
      </div>
    </div>
  );
}
