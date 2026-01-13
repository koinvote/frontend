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
} from "@/api/response";
import { EventStatus, DepositStatus } from "@/api/types";

// System Configuration Mock
export const mockSystemConfig: SystemConfigRes = {
  maintenance_mode: false,
  min_reward_amount_satoshi: 10000,
  satoshi_per_extra_winner: 5000,
  dust_threshold_satoshi: 546,
  satoshi_per_duration_hour: 1000,
  free_hours: 24,
  platform_fee_percentage: 5,
  refund_service_fee_percentage: 2,
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
  deposit_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  expected_amount_satoshi: 100000,
  received_amount_satoshi: 100000,
  status: DepositStatus.COMPLETED,
  confirmed_at: "2026-01-10T12:30:00Z",
  received_txid:
    "3e1b3d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
  confirmations: 6,
  initial_timeout_at: "2026-01-10T22:00:00Z",
  extend_timeout_at: "2026-01-11T10:00:00Z",
  first_seen_at: "2026-01-10T11:45:00Z",
  block_height: 875432,
  deposit_type: "initial",
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
  min_reward_sats: 10000,
  sats_per_extra_winner: 5000,
  sats_per_duration_hour: 1000,
  platform_fee_percent: 5,
  min_payout_sats: 546,
  free_hours: 24,
  refund_service_fee_percentage: 2,
  payout_fee_multiplier: 2,
  refund_fee_multiplier: 1.5,
  withdrawal_fee_multiplier: 1,
  maintenance_mode: false,
  required_confirmations: 3,
};
