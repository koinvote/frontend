// Mock data for API responses
import type {
  SystemConfigRes,
  EventListDataRes,
  EventDetailDataRes,
  GetEventListRes,
  GetHotHashtagsRes,
  DepositStatusRes,
  GetListRepliesRes,
  Reply,
  AdminSystemParametersRes,
  PayoutReportRes,
  PayoutWinner,
  RewardDetail,
} from "@/api/response";
import { EventStatus, DepositStatus } from "@/api/types";

// System Configuration Mock
export const mockSystemConfig: SystemConfigRes = {
  min_reward_amount_satoshi: 50000,
  satoshi_per_extra_winner: 50000,
  satoshi_per_duration_hour: 50000,
  dust_threshold_satoshi: 10000,
  free_hours: 24,
  platform_fee_percentage: 2,
  refund_service_fee_percentage: 0,
  payout_fee_multiplier: 1.0,
  refund_fee_multiplier: 1.0,
  withdrawal_fee_multiplier: 1.0,
  maintenance_mode: false,
  required_confirmations: 3,
};

// Event List Mock Data
export const mockEventList: EventListDataRes[] = [
  {
    id: 1,
    event_type: "open-ended",
    event_id: "evt_001_mock",
    title: "What's the best Bitcoin scaling solution?",
    description:
      "Lightning Network vs other L2 solutions. Share your thoughts on the future of Bitcoin scaling.",
    status: 3, // active
    hashtags: ["bitcoin", "lightning", "scaling"],
    created_at: "2026-01-10T10:00:00Z",
    preheat_start_at: "2026-01-10T12:00:00Z",
    started_at: "2026-01-11T00:00:00Z",
    deadline_at: "2026-01-15T00:00:00Z",
    ended_at: "",
    updated_at: "2026-01-13T10:00:00Z",
    total_reward_satoshi: 100000,
    participants_count: 45,
    total_stake_satoshi: 5000000,
    top_replies: [
      {
        id: 1,
        body: "Lightning Network is the most mature solution",
        weight_percent: 35,
        amount_satoshi: 35000,
      },
      {
        id: 2,
        body: "We need multiple L2 solutions for different use cases",
        weight_percent: 28,
        amount_satoshi: 28000,
      },
      {
        id: 3,
        body: "RGB protocol shows great promise",
        weight_percent: 22,
        amount_satoshi: 22000,
      },
    ],
    options: [],
  },
  {
    id: 2,
    event_type: "single-choice",
    event_id: "evt_002_mock",
    title: "Which Bitcoin conference will you attend in 2026?",
    description: "Vote for your preferred Bitcoin conference this year!",
    status: 2, // preheat
    hashtags: ["bitcoin", "conference", "btc2026"],
    created_at: "2026-01-12T08:00:00Z",
    preheat_start_at: "2026-01-12T12:00:00Z",
    started_at: "2026-01-13T00:00:00Z",
    deadline_at: "2026-01-20T00:00:00Z",
    ended_at: "",
    updated_at: "2026-01-13T08:00:00Z",
    total_reward_satoshi: 50000,
    participants_count: 23,
    total_stake_satoshi: 3200000,
    top_replies: [],
    options: [
      {
        id: 1,
        option_text: "Bitcoin 2026 Miami",
        order: 1,
        weight_percent: 45,
        amount_satoshi: 22500,
      },
      {
        id: 2,
        option_text: "BTC Prague 2026",
        order: 2,
        weight_percent: 30,
        amount_satoshi: 15000,
      },
      {
        id: 3,
        option_text: "Bitcoin Amsterdam",
        order: 3,
        weight_percent: 25,
        amount_satoshi: 12500,
      },
    ],
  },
  {
    id: 3,
    event_type: "open-ended",
    event_id: "evt_003_mock",
    title: "Best Bitcoin wallet for beginners?",
    description:
      "Recommend your favorite Bitcoin wallet for newcomers. Explain why it's beginner-friendly.",
    status: 5, // completed
    hashtags: ["bitcoin", "wallet", "beginners"],
    created_at: "2026-01-05T10:00:00Z",
    preheat_start_at: "2026-01-05T12:00:00Z",
    started_at: "2026-01-06T00:00:00Z",
    deadline_at: "2026-01-10T00:00:00Z",
    ended_at: "2026-01-10T00:05:00Z",
    updated_at: "2026-01-10T01:00:00Z",
    total_reward_satoshi: 75000,
    participants_count: 67,
    total_stake_satoshi: 8500000,
    top_replies: [
      {
        id: 1,
        body: "BlueWallet - simple UI and Lightning support",
        weight_percent: 40,
        amount_satoshi: 30000,
      },
      {
        id: 2,
        body: "Muun Wallet - great for first-time users",
        weight_percent: 35,
        amount_satoshi: 26250,
      },
    ],
    options: [],
  },
  {
    id: 4,
    event_type: "single-choice",
    event_id: "evt_004_mock",
    title: "Bitcoin halving prediction: What will the price be in 2028?",
    description: "Make your prediction for Bitcoin price after the 2028 halving",
    status: 3, // active
    hashtags: ["bitcoin", "halving", "price"],
    created_at: "2026-01-08T10:00:00Z",
    preheat_start_at: "2026-01-08T16:00:00Z",
    started_at: "2026-01-09T00:00:00Z",
    deadline_at: "2026-01-18T00:00:00Z",
    ended_at: "",
    updated_at: "2026-01-13T10:00:00Z",
    total_reward_satoshi: 150000,
    participants_count: 89,
    total_stake_satoshi: 12000000,
    top_replies: [],
    options: [
      {
        id: 1,
        option_text: "Below $100k",
        order: 1,
        weight_percent: 10,
        amount_satoshi: 15000,
      },
      {
        id: 2,
        option_text: "$100k - $250k",
        order: 2,
        weight_percent: 35,
        amount_satoshi: 52500,
      },
      {
        id: 3,
        option_text: "$250k - $500k",
        order: 3,
        weight_percent: 40,
        amount_satoshi: 60000,
      },
      {
        id: 4,
        option_text: "Above $500k",
        order: 4,
        weight_percent: 15,
        amount_satoshi: 22500,
      },
    ],
  },
];

export const mockGetEventListResponse: GetEventListRes = {
  events: mockEventList,
  page: 1,
  limit: 20,
};

// Event Detail Mock Data
export const mockEventDetail: EventDetailDataRes = {
  id: 1,
  event_id: "evt_001_mock",
  title: "What's the best Bitcoin scaling solution?",
  description:
    "Lightning Network vs other L2 solutions. Share your thoughts on the future of Bitcoin scaling. We want to hear detailed explanations about why you prefer certain solutions over others.",
  event_type: "open-ended",
  event_reward_type: "rewarded",
  status: EventStatus.ACTIVE,
  initial_reward_satoshi: 80000,
  additional_reward_satoshi: 20000,
  total_reward_satoshi: 100000,
  winner_count: 5,
  additional_winner_count: 2,
  max_recipient: 10,
  duration_hours: 96,
  creator_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  created_at: "2026-01-10T10:00:00Z",
  started_at: "2026-01-11T00:00:00Z",
  deadline_at: "2026-01-15T00:00:00Z",
  participants_count: 45,
  total_stake_satoshi: 5000000,
  options: [],
  top_replies: [
    {
      id: 1,
      btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      body: "Lightning Network is the most mature solution with the best tooling and ecosystem support. It's battle-tested and has real-world adoption.",
      weight_percent: 35,
      amount_satoshi: 35000,
    },
    {
      id: 2,
      btc_address: "bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4",
      body: "We need multiple L2 solutions for different use cases. Lightning for payments, RGB for smart contracts, and sidechains for experimentation.",
      weight_percent: 28,
      amount_satoshi: 28000,
    },
    {
      id: 3,
      btc_address: "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
      body: "RGB protocol shows great promise for client-side validation and privacy. It's the future of Bitcoin DeFi.",
      weight_percent: 22,
      amount_satoshi: 22000,
    },
  ],
  hashtags: ["bitcoin", "lightning", "scaling"],
  preheat_hours: 12,
};

// Hot Hashtags Mock
export const mockHotHashtags: GetHotHashtagsRes = [
  "bitcoin",
  "lightning",
  "scaling",
  "defi",
  "wallet",
  "mining",
  "halving",
  "conference",
  "adoption",
  "layer2",
];

// Deposit Status Mock
export const mockDepositStatus: DepositStatusRes = {
  event_id: "evt_001_mock",
  deposit_address:
    "bc1qf35u6njdw57v3hyy5k2e8ss6z6qz7suj5tjnxx2gwzh0r0u6zrnq0dcd3n",
  expected_amount_satoshi: 150000,
  received_amount_satoshi: 150000,
  status: DepositStatus.RECEIVED,
  confirmed_at: "2026-01-10T12:30:00Z",
  received_txid:
    "3e1b3d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
  deposit_timeout_at: "2026-01-10T22:00:00Z",
  first_seen_at: "2026-01-10T11:45:00Z",
  block_height: 850000,
  deposit_type: "event_creation",
};

// Replies Mock Data
export const mockReplies: Reply[] = [
  {
    id: 1,
    btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    content:
      "Lightning Network is the most mature solution with excellent tooling.",
    plaintext:
      "Koinvote Event Reply\nEvent ID: evt_001_mock\nAddress: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq\nNonce: 1705123456\nRandom: abc123",
    signature: "H8j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2",
    balance_at_reply_satoshi: 1500000,
    balance_at_snapshot_satoshi: 1500000,
    balance_at_current_satoshi: 1600000,
    created_at: "2026-01-11T05:30:00Z",
    is_reply_valid: true,
  },
  {
    id: 2,
    btc_address: "bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4",
    content:
      "Multiple L2 solutions are needed for different use cases and experimentation.",
    plaintext:
      "Koinvote Event Reply\nEvent ID: evt_001_mock\nAddress: bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4\nNonce: 1705123789\nRandom: xyz789",
    signature: "I9j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3",
    balance_at_reply_satoshi: 1200000,
    balance_at_snapshot_satoshi: 1200000,
    balance_at_current_satoshi: 1250000,
    created_at: "2026-01-11T08:15:00Z",
    is_reply_valid: true,
  },
  {
    id: 3,
    btc_address: "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
    content: "RGB protocol for client-side validation is revolutionary.",
    plaintext:
      "Koinvote Event Reply\nEvent ID: evt_001_mock\nAddress: bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej\nNonce: 1705124012\nRandom: rgb456",
    signature: "J0k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4",
    balance_at_reply_satoshi: 950000,
    balance_at_snapshot_satoshi: 950000,
    balance_at_current_satoshi: 980000,
    created_at: "2026-01-11T10:45:00Z",
    is_reply_valid: true,
  },
];

export const mockGetListRepliesResponse: GetListRepliesRes = {
  replies: mockReplies,
  page: 1,
  limit: 20,
};

// Admin System Parameters Mock
export const mockAdminSystemParameters: AdminSystemParametersRes = {
  min_reward_amount_satoshi: 50000,
  satoshi_per_extra_winner: 10000,
  satoshi_per_duration_hour: 10000,
  dust_threshold_satoshi: 10000,
  free_hours: 24,
  platform_fee_percentage: 2.5,
  refund_service_fee_percentage: 0.5,
  payout_fee_multiplier: 1.0,
  refund_fee_multiplier: 1.0,
  withdrawal_fee_multiplier: 1.0,
  maintenance_mode: false,
  required_confirmations: 3,
};

// Payout Report Mock Data
export const mockPayoutWinners: PayoutWinner[] = [
  {
    winner_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    balance_at_snapshot_satoshi: 500000,
    win_probability_percent: 20.0,
    is_dust: false,
    reward_satoshi: 57500,
    payout_status: "completed",
    payout_txid:
      "3e1b3d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
    payout_at: "2026-01-16T16:00:00Z",
  },
  {
    winner_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    balance_at_snapshot_satoshi: 450000,
    win_probability_percent: 18.0,
    is_dust: false,
    reward_satoshi: 51750,
    payout_status: "completed",
    payout_txid:
      "4f2c4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c",
    payout_at: "2026-01-16T16:01:00Z",
  },
  {
    winner_address: "bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4",
    balance_at_snapshot_satoshi: 400000,
    win_probability_percent: 16.0,
    is_dust: false,
    reward_satoshi: 46000,
    payout_status: "completed",
    payout_txid:
      "5g3d5f9g1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d",
    payout_at: "2026-01-16T16:02:00Z",
  },
  {
    winner_address: "bc1qabc123xyz456def789ghi012jkl345mno678pqr",
    balance_at_snapshot_satoshi: 350000,
    win_probability_percent: 14.0,
    is_dust: false,
    reward_satoshi: 40250,
    payout_status: "completed",
    payout_txid:
      "6h4e6g0h2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e",
    payout_at: "2026-01-16T16:03:00Z",
  },
  {
    winner_address: "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
    balance_at_snapshot_satoshi: 300000,
    win_probability_percent: 12.0,
    is_dust: false,
    reward_satoshi: 34500,
    payout_status: "completed",
    payout_txid:
      "7i5f7h1i3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    payout_at: "2026-01-16T16:04:00Z",
  },
  {
    winner_address: "bc1qdef456uvw789xyz012abc345ghi678jkl901mno",
    balance_at_snapshot_satoshi: 250000,
    win_probability_percent: 10.0,
    is_dust: false,
    reward_satoshi: 28750,
    payout_status: "completed",
    payout_txid:
      "8j6g8i2j4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
    payout_at: "2026-01-16T16:05:00Z",
  },
];

export const mockAdditionalPayoutWinners: PayoutWinner[] = [
  {
    winner_address: "bc1qghi789rst012uvw345xyz678abc901def234ghi",
    balance_at_snapshot_satoshi: 800000,
    win_probability_percent: 32.0,
    is_dust: false,
    reward_satoshi: 61280,
    payout_status: "completed",
    payout_txid:
      "9k7h9j3k5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    payout_at: "2026-01-16T16:05:00Z",
  },
  {
    winner_address: "bc1qjkl012mno345pqr678stu901vwx234yz567abc",
    balance_at_snapshot_satoshi: 650000,
    win_probability_percent: 26.0,
    is_dust: false,
    reward_satoshi: 49790,
    payout_status: "completed",
    payout_txid:
      "al8i0k4l6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    payout_at: "2026-01-16T16:06:00Z",
  },
  {
    winner_address: "bc1qmno345pqr678stu901vwx234yz567abc890def",
    balance_at_snapshot_satoshi: 550000,
    win_probability_percent: 22.0,
    is_dust: false,
    reward_satoshi: 42130,
    payout_status: "completed",
    payout_txid:
      "bm9j1l5m7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
    payout_at: "2026-01-16T16:07:00Z",
  },
  {
    winner_address: "bc1qpqr678stu901vwx234yz567abc890def123ghi",
    balance_at_snapshot_satoshi: 500000,
    win_probability_percent: 20.0,
    is_dust: false,
    reward_satoshi: 38300,
    payout_status: "completed",
    payout_txid:
      "cn0k2m6n8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
    payout_at: "2026-01-16T16:08:00Z",
  },
];

export const mockRewardDetails: RewardDetail[] = [
  {
    reward_type: "initial",
    deposit_id: 123,
    plan_id: 456,
    original_amount_satoshi: 300000,
    platform_fee_satoshi: 7500,
    estimated_miner_fee_satoshi: 5000,
    distributable_satoshi: 287500,
    winner_count: 6,
    winners: mockPayoutWinners,
  },
  {
    reward_type: "additional",
    deposit_id: 124,
    plan_id: 457,
    original_amount_satoshi: 200000,
    platform_fee_satoshi: 5000,
    estimated_miner_fee_satoshi: 3500,
    distributable_satoshi: 191500,
    winner_count: 4,
    winners: mockAdditionalPayoutWinners,
  },
];

export const mockPayoutReport: PayoutReportRes = {
  event_id: "evt_001_mock",
  event_title: "What's the best Bitcoin scaling solution?",
  completed_at: "2026-01-16T15:00:00Z",
  snapshot_block_height: 850000,
  initial_reward_satoshi: 300000,
  additional_reward_1_satoshi: 200000,
  additional_reward_2_satoshi: 0,
  total_reward_pool_satoshi: 500000,
  reward_details: mockRewardDetails,
};

// Mock CSV data for verification
export const mockVerificationCsvContent = `plan_id,deposit_id,event_id,winner_address,balance_satoshi,win_probability,original_reward_satoshi,is_dust,final_reward_satoshi,payout_txid,payout_status,csv_sha256
456,123,evt_001_mock,bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh,500000,0.20,57500,0,57500,3e1b3d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq,450000,0.18,51750,0,51750,4f2c4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4,400000,0.16,46000,0,46000,5g3d5f9g1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qabc123xyz456def789ghi012jkl345mno678pqr,350000,0.14,40250,0,40250,6h4e6g0h2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej,300000,0.12,34500,0,34500,7i5f7h1i3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qdef456uvw789xyz012abc345ghi678jkl901mno,250000,0.10,28750,0,28750,8j6g8i2j4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567`;
