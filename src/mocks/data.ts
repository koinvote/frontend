// Mock data for API responses
import type {
  AdminSystemParametersRes,
  DepositStatusRes,
  EventDetailDataRes,
  EventListDataRes,
  GetEventListRes,
  GetHotHashtagsRes,
  GetListRepliesRes,
  GetReceiptVerifyPubKeysRes,
  PayoutReportRes,
  PayoutWinner,
  Reply,
  RewardDetail,
  SystemConfigRes,
} from "@/api/response";
import { DepositStatus, EventStatus } from "@/api/types";

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
    id: 2,
    event_type: "single_choice",
    event_reward_type: "rewarded",
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
        total_stake_satoshi: 22500,
      },
      {
        id: 2,
        option_text: "BTC Prague 2026",
        order: 2,
        weight_percent: 30,
        total_stake_satoshi: 15000,
      },
      {
        id: 3,
        option_text: "Bitcoin Amsterdam",
        order: 3,
        weight_percent: 25,
        total_stake_satoshi: 12500,
      },
    ],
  },
  {
    id: 1,
    event_type: "open",
    event_reward_type: "rewarded",
    event_id: "evt_001_mock",
    title: "What's the best Bitcoin scaling solution?",
    description:
      "Lightning Network vs other L2 solutions. Share your thoughts on the future of Bitcoin scaling.",
    status: 3, // active
    hashtags: ["bitcoin", "lightning", "scaling"],
    created_at: "2026-01-10T10:00:00Z",
    preheat_start_at: "2026-01-10T12:00:00Z",
    started_at: "2026-01-11T00:00:00Z",
    deadline_at: "2026-02-28T00:00:00Z",
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
    id: 4,
    event_type: "single_choice",
    event_reward_type: "rewarded",
    event_id: "evt_004_mock",
    title: "Bitcoin halving prediction: What will the price be in 2028?",
    description:
      "Make your prediction for Bitcoin price after the 2028 halving",
    status: 3, // active
    hashtags: ["bitcoin", "halving", "price"],
    created_at: "2026-01-08T10:00:00Z",
    preheat_start_at: "2026-01-08T16:00:00Z",
    started_at: "2026-01-09T00:00:00Z",
    deadline_at: "2026-02-28T00:00:00Z",
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
        total_stake_satoshi: 15000,
      },
      {
        id: 2,
        option_text: "$100k - $250k",
        order: 2,
        weight_percent: 35,
        total_stake_satoshi: 52500,
      },
      {
        id: 3,
        option_text: "$250k - $500k",
        order: 3,
        weight_percent: 40,
        total_stake_satoshi: 60000,
      },
      {
        id: 4,
        option_text: "Above $500k",
        order: 4,
        weight_percent: 15,
        total_stake_satoshi: 22500,
      },
    ],
  },
  {
    id: 49,
    event_type: "single_choice",
    event_reward_type: "rewarded",
    event_id: "01KK0NP9AV6CQWG3TM4DJ5RFEZ",
    title: "Which exchange do you prefer?",
    description: "Options are listed in alphabetical order.",
    status: 3, // active
    hashtags: ["exchange", "business"],
    created_at: "2026-03-06T04:15:01.985181Z",
    preheat_start_at: "",
    started_at: "2026-03-06T04:21:45.284286Z",
    deadline_at: "2026-03-09T23:21:45.284286Z",
    ended_at: "",
    updated_at: "2026-03-07T18:39:09.702269Z",
    total_reward_satoshi: 1000000,
    participants_count: 15,
    total_stake_satoshi: 37216784,
    top_replies: [
      {
        id: 120,
        body: "Binance",
        weight_percent: 50.463868462014304,
        amount_satoshi: 18753296,
      },
      {
        id: 121,
        body: "Coinbase",
        weight_percent: 49.31754164515266,
        amount_satoshi: 18327300,
      },
    ],
    options: [
      {
        id: 120,
        option_text: "Binance",
        order: 1,
        total_stake_satoshi: 18753296,
        weight_percent: 50.463868462014304,
      },
      {
        id: 121,
        option_text: "Coinbase",
        order: 2,
        total_stake_satoshi: 18327300,
        weight_percent: 49.31754164515266,
      },
      {
        id: 122,
        option_text: "Hyperliquid",
        order: 3,
        total_stake_satoshi: 81232,
        weight_percent: 0.21858989283304364,
      },
      {
        id: 123,
        option_text: "Kraken",
        order: 4,
        total_stake_satoshi: 0,
        weight_percent: 0,
      },
      {
        id: 124,
        option_text: "OKX",
        order: 5,
        total_stake_satoshi: 0,
        weight_percent: 0,
      },
    ],
  },
  {
    id: 3,
    event_type: "open",
    event_reward_type: "rewarded",
    event_id: "evt_003_mock",
    title: "Best Bitcoin wallet for beginners?",
    description:
      "Recommend your favorite Bitcoin wallet for newcomers. Explain why it's beginner-friendly.",
    status: 5, // completed
    hashtags: ["bitcoin", "wallet", "beginners"],
    created_at: "2026-02-23T10:55:20.922627Z",
    preheat_start_at: "2026-01-05T12:00:00Z",
    started_at: "2026-02-23T10:55:56.831161Z",
    deadline_at: "2026-02-09T02:34:00.831161Z",
    ended_at: "2026-02-24T02:58:21.110156Z",
    updated_at: "2026-02-23T11:58:21.110156Z",
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
  event_type: "open",
  event_reward_type: "rewarded",
  status: EventStatus.ACTIVE,
  initial_reward_satoshi: 80000,
  additional_reward_satoshi: 20000,
  total_reward_satoshi: 100000,
  winner_count: 5,
  additional_winner_count: 2,
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
      btc_address:
        "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
      body: "RGB protocol shows great promise for client-side validation and privacy. It's the future of Bitcoin DeFi.",
      weight_percent: 22,
      amount_satoshi: 22000,
    },
  ],
  hashtags: ["bitcoin", "lightning", "scaling"],
  preheat_hours: 12,
  result_visibility: "creator_only",
  unlock_price_satoshi: 5000,
  unlock_count: 128,
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
    signature:
      "H8j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2",
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
    signature:
      "I9j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3",
    balance_at_reply_satoshi: 1200000,
    balance_at_snapshot_satoshi: 1200000,
    balance_at_current_satoshi: 1250000,
    created_at: "2026-01-11T08:15:00Z",
    is_reply_valid: true,
  },
  {
    id: 3,
    btc_address:
      "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
    content: "RGB protocol for client-side validation is revolutionary.",
    plaintext:
      "Koinvote Event Reply\nEvent ID: evt_001_mock\nAddress: bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej\nNonce: 1705124012\nRandom: rgb456",
    signature:
      "J0k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4",
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
  satoshi_per_extra_winner: 12345,
  satoshi_per_duration_hour: 10000,
  dust_threshold_satoshi: 4444,
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
    balance_at_snapshot_satoshi: 1280086,
    win_probability_percent: 20.0,
    is_dust: false,
    original_reward_satoshi: 1668,
    final_reward_satoshi: 1668,
    distributable_rate: 19.0,
    status: "completed",
  },
  {
    winner_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    balance_at_snapshot_satoshi: 450000,
    win_probability_percent: 18.0,
    is_dust: false,
    original_reward_satoshi: 51750,
    final_reward_satoshi: 51750,
    distributable_rate: 17.0,
    status: "completed",
  },
  {
    winner_address: "bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4",
    balance_at_snapshot_satoshi: 400000,
    win_probability_percent: 16.0,
    is_dust: false,
    original_reward_satoshi: 46000,
    final_reward_satoshi: 46000,
    distributable_rate: 15.0,
    status: "completed",
  },
  {
    winner_address: "bc1qabc123xyz456def789ghi012jkl345mno678pqr",
    balance_at_snapshot_satoshi: 350000,
    win_probability_percent: 14.0,
    is_dust: false,
    original_reward_satoshi: 40250,
    final_reward_satoshi: 40000,
    distributable_rate: 13.0,
    status: "completed",
  },
  {
    winner_address:
      "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
    balance_at_snapshot_satoshi: 300000,
    win_probability_percent: 12.0,
    is_dust: false,
    original_reward_satoshi: 34500,
    final_reward_satoshi: 34250,
    distributable_rate: 11.0,
    status: "completed",
  },
  {
    winner_address: "bc1qdef456uvw789xyz012abc345ghi678jkl901mno",
    balance_at_snapshot_satoshi: 250000,
    win_probability_percent: 10.0,
    is_dust: false,
    original_reward_satoshi: 28750,
    final_reward_satoshi: 28500,
    distributable_rate: 9.0,
    status: "completed",
  },
  {
    winner_address: "bc1qprocessing123xyz456def789ghi012jkl345mno",
    balance_at_snapshot_satoshi: 200000,
    win_probability_percent: 8.0,
    is_dust: false,
    original_reward_satoshi: 23000,
    final_reward_satoshi: 22500,
    distributable_rate: 7.0,
    status: "processing",
  },
  {
    winner_address: "bc1qwinner09abc123def456ghi789jkl012mno345pqr",
    balance_at_snapshot_satoshi: 180000,
    win_probability_percent: 7.2,
    is_dust: false,
    original_reward_satoshi: 20700,
    final_reward_satoshi: 20200,
    distributable_rate: 6.4,
    status: "completed",
  },
  {
    winner_address: "bc1qwinner10xyz789abc012def345ghi678jkl901mno",
    balance_at_snapshot_satoshi: 160000,
    win_probability_percent: 6.4,
    is_dust: false,
    original_reward_satoshi: 18400,
    final_reward_satoshi: 18000,
    distributable_rate: 5.8,
    status: "completed",
  },
  {
    winner_address: "bc1qdust123abc456def789ghi012jkl345mno678pqr",
    balance_at_snapshot_satoshi: 5000,
    win_probability_percent: 0.2,
    is_dust: true,
    original_reward_satoshi: 500,
    final_reward_satoshi: 0,
    distributable_rate: 0.0,
    status: "redistribute",
  },
];

export const mockAdditionalPayoutWinners: PayoutWinner[] = [
  {
    winner_address: "bc1qghi789rst012uvw345xyz678abc901def234ghi",
    balance_at_snapshot_satoshi: 800000,
    win_probability_percent: 32.0,
    is_dust: false,
    original_reward_satoshi: 61280,
    final_reward_satoshi: 61280,
    distributable_rate: 32.0,
    status: "completed",
  },
  {
    winner_address: "bc1qjkl012mno345pqr678stu901vwx234yz567abc",
    balance_at_snapshot_satoshi: 650000,
    win_probability_percent: 26.0,
    is_dust: false,
    original_reward_satoshi: 49790,
    final_reward_satoshi: 49790,
    distributable_rate: 26.0,
    status: "completed",
  },
  {
    winner_address: "bc1qmno345pqr678stu901vwx234yz567abc890def",
    balance_at_snapshot_satoshi: 550000,
    win_probability_percent: 22.0,
    is_dust: false,
    original_reward_satoshi: 42130,
    final_reward_satoshi: 42130,
    distributable_rate: 22.0,
    status: "completed",
  },
  {
    winner_address: "bc1qpqr678stu901vwx234yz567abc890def123ghi",
    balance_at_snapshot_satoshi: 500000,
    win_probability_percent: 20.0,
    is_dust: false,
    original_reward_satoshi: 38300,
    final_reward_satoshi: 38300,
    distributable_rate: 20.0,
    status: "completed",
  },
];

export const mockRewardDetails: RewardDetail[] = [
  {
    reward_type: "initial",
    plan_id: 456,
    original_amount_satoshi: 300000,
    platform_fee_satoshi: 7500,
    estimated_miner_fee_satoshi: 5000,
    distributable_satoshi: 287500,
    winner_count: 12,
    winners: mockPayoutWinners,
    dust_winner_count: 3,
    dust_redistribute_amount_satoshi: 1532,
    payout_txid:
      "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    csv_sha256:
      "d2f4a8c1b3e5f7890123456789abcdef0123456789abcdef0123456789abcef39",
  },
  {
    reward_type: "additional",
    plan_id: 457,
    original_amount_satoshi: 200000,
    platform_fee_satoshi: 5000,
    estimated_miner_fee_satoshi: 3500,
    distributable_satoshi: 191500,
    winner_count: 4,
    winners: mockAdditionalPayoutWinners,
    dust_winner_count: 0,
    dust_redistribute_amount_satoshi: 0,
    payout_txid:
      "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    csv_sha256:
      "d2f4a8c1b3e5f7890123456789abcdef0123456789abcdef0123456789abcef39",
  },
];

export const mockPayoutReport: PayoutReportRes = {
  event_id: "evt_001_mock",
  event_title: "What's the best Bitcoin scaling solution?",
  initial_reward_satoshi: 300000,
  snapshot_block_height: 850000,
  total_reward_pool_satoshi: 500000,
  reward_details: mockRewardDetails,
  // TODO: 追加獎金 (下面key目前沒有)
  additional_reward_1_satoshi: 200000,
  additional_reward_2_satoshi: 0,
};

// Mock CSV data for verification
export const mockVerificationCsvContent = `plan_id,deposit_id,event_id,winner_address,balance_satoshi,win_probability,original_reward_satoshi,is_dust,final_reward_satoshi,payout_txid,payout_status,csv_sha256
456,123,evt_001_mock,bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh,500000,0.20,57500,0,57500,3e1b3d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq,450000,0.18,51750,0,51750,4f2c4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4,400000,0.16,46000,0,46000,5g3d5f9g1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qabc123xyz456def789ghi012jkl345mno678pqr,350000,0.14,40250,0,40250,6h4e6g0h2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej,300000,0.12,34500,0,34500,7i5f7h1i3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567
456,123,evt_001_mock,bc1qdef456uvw789xyz012abc345ghi678jkl901mno,250000,0.10,28750,0,28750,8j6g8i2j4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a,completed,d4f8e7c2a1b3456789abcdef0123456789abcdef0123456789abcdef01234567`;

// Exchange event replies (01KK0NP9AV6CQWG3TM4DJ5RFEZ)
export const mockExchangeEventReplies: Reply[] = [
  {
    id: 111,
    btc_address: "bc1qmkwj22n9p9d9w33ep2s5zepss42097tfrpgndk",
    option_id: 120,
    option_hash:
      "f1624fcc63b615ac0e95daf9ab78434ec2e8ffe402144dc631b055f711225191",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(f1624fcc63b615ac0e95daf9ab78434ec2e8ffe402144dc631b055f711225191) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772908729 | 4e7cf6291e",
    signature:
      "ICuIpIbOsms1zEUO9xbBQkxuy1SghgKs1MSZlztvTdOWPxnLphsfWGOss/Vxy/CdkkF0cSEnVOF+wjcL01u7Lso=",
    nonce_timestamp: "1772908729",
    random_code: "4e7cf6291e",
    is_reply_valid: true,
    balance_at_reply_satoshi: 3396718,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 3396718,
    balance_last_updated_at: "2026-03-08T05:47:06.637073Z",
    is_hidden: false,
    created_at: "2026-03-07T18:39:09.688Z",
    created_by_ip: "99.228.76.52",
    updated_at: "2026-03-08T05:47:06.638Z",
  },
  {
    id: 110,
    btc_address: "1B79oEYhhw3KocT1L8dhY4HbMuanzNVffq",
    option_id: 121,
    option_hash:
      "8266deca6c65b39468e6fb8596869a231b9582ee3818d12ba7240cb126ebfb44",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(8266deca6c65b39468e6fb8596869a231b9582ee3818d12ba7240cb126ebfb44) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772902922 | 1ac49d292e",
    signature:
      "IO33M/zdwSzzFfDJJtSLCpulnP8wQd2kMM+E6naqjTdhd/QPUPJMovbEivANLXUT5v2abEpMePcOrfRnBXnmkrM=",
    nonce_timestamp: "1772902922",
    random_code: "1ac49d292e",
    is_reply_valid: true,
    balance_at_reply_satoshi: 3251200,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 3251200,
    balance_last_updated_at: "2026-03-08T05:46:47.031934Z",
    is_hidden: false,
    created_at: "2026-03-07T17:04:01.124Z",
    created_by_ip: "104.234.53.231",
    updated_at: "2026-03-08T05:46:47.033Z",
  },
  {
    id: 109,
    btc_address: "1GDznPQsDQTp5Kzmn1HApchULn7bpJ4LZ",
    option_id: 121,
    option_hash:
      "8266deca6c65b39468e6fb8596869a231b9582ee3818d12ba7240cb126ebfb44",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(8266deca6c65b39468e6fb8596869a231b9582ee3818d12ba7240cb126ebfb44) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772852695 | b007e14a1a",
    signature:
      "H8kn/BtXnOIlr7d1e3DBeJiCdB3Lio7NiWTo9uesoEjdOFz07Uvi3ZJaagEOJGukAsr+jXPLELqZVGkItMyY6a0=",
    nonce_timestamp: "1772852695",
    random_code: "b007e14a1a",
    is_reply_valid: true,
    balance_at_reply_satoshi: 15076100,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 15076100,
    balance_last_updated_at: "2026-03-08T05:46:49.869154Z",
    is_hidden: false,
    created_at: "2026-03-07T03:07:54.652Z",
    created_by_ip: "99.228.76.52",
    updated_at: "2026-03-08T05:46:49.87Z",
  },
  {
    id: 108,
    btc_address: "bc1qhwq3nwl8rp4h0lscqv7fugk5x7vh627q9nyw24",
    option_id: 120,
    option_hash:
      "f1624fcc63b615ac0e95daf9ab78434ec2e8ffe402144dc631b055f711225191",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(f1624fcc63b615ac0e95daf9ab78434ec2e8ffe402144dc631b055f711225191) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772828543 | 083af4270e",
    signature:
      "IAP7YALtQUbUhQv/ytcFTMTvwrqb1SgFv+SPhfpw3ldBZp16akHCxen8dtUiSMvlOweN/rgQg6qrlJOYlI7yRBA=",
    nonce_timestamp: "1772828543",
    random_code: "083af4270e",
    is_reply_valid: true,
    balance_at_reply_satoshi: 15349744,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 15349744,
    balance_last_updated_at: "2026-03-08T05:47:02.189134Z",
    is_hidden: false,
    created_at: "2026-03-06T20:22:45.073Z",
    created_by_ip: "99.228.76.52",
    updated_at: "2026-03-08T05:47:02.19Z",
  },
  {
    id: 107,
    btc_address: "bc1qvnwj9nuhmntgnfhlc9pa3t4fce239dwxm4ah5x",
    option_id: 122,
    option_hash:
      "597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772821970 | ce24101b9f",
    signature:
      "HzaqdOeU3zqbnHL2UQIYFwSYVTY166p3oFhm8koQhWl4IFaxElrVrzK6a8M3lwACmFuHoS8vM78dzfeX8P93aJA=",
    nonce_timestamp: "1772821970",
    random_code: "ce24101b9f",
    is_reply_valid: true,
    balance_at_reply_satoshi: 11505,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:12.604199Z",
    is_hidden: false,
    created_at: "2026-03-06T18:33:05.173Z",
    created_by_ip: "104.28.156.241",
    updated_at: "2026-03-08T05:47:12.605Z",
  },
  {
    id: 106,
    btc_address: "bc1qc0qtsc0wzsgj6jpk24fazfn2s2g5rsnmk5yq4k",
    option_id: 122,
    option_hash:
      "597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772821397 | 1f5f8a3a0b",
    signature:
      "H28JmZ9AHxH2OuTWGlpVsG+cOsO02LvvniANtFjLq2XlcpF2s+obFZVHDDEN8Jg5f/7wlow3J9iPUetOO80PHs4=",
    nonce_timestamp: "1772821397",
    random_code: "1f5f8a3a0b",
    is_reply_valid: true,
    balance_at_reply_satoshi: 3000,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:46:57.542191Z",
    is_hidden: false,
    created_at: "2026-03-06T18:23:26.425Z",
    created_by_ip: "104.28.156.244",
    updated_at: "2026-03-08T05:46:57.543Z",
  },
  {
    id: 105,
    btc_address: "bc1qu5x9yltcluq4ltaaa5t5nk7g0g66d0n52qmeje",
    option_id: 122,
    option_hash:
      "597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772821368 | 68c789a301",
    signature:
      "HyAck2/xgBnB8MAVd+vszTJNIW6YVbu7vICzLKT/AszkP/+6Tsv+AQq7tolDKgkdOvtOgSWvdgqeDj8dEvFU6Pw=",
    nonce_timestamp: "1772821368",
    random_code: "68c789a301",
    is_reply_valid: true,
    balance_at_reply_satoshi: 3165,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:10.657805Z",
    is_hidden: false,
    created_at: "2026-03-06T18:23:09.749Z",
    created_by_ip: "104.28.160.168",
    updated_at: "2026-03-08T05:47:10.659Z",
  },
  {
    id: 104,
    btc_address: "bc1qphduhq9w97wpr67kqncy8pf43kgy9ahgc9jmg6",
    option_id: 122,
    option_hash:
      "597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772821343 | 38e3b8da0c",
    signature:
      "IGkWsjTlJuy9GyrAd4Ex0/iDSzbOVVkyUceO3X2N1DhXKTip+HqH0kmYfY9O4N/Ub9ztyXNAIugNcxvaMRoR/zc=",
    nonce_timestamp: "1772821343",
    random_code: "38e3b8da0c",
    is_reply_valid: true,
    balance_at_reply_satoshi: 2890,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:09.020598Z",
    is_hidden: false,
    created_at: "2026-03-06T18:22:42.743Z",
    created_by_ip: "104.28.156.244",
    updated_at: "2026-03-08T05:47:09.021Z",
  },
  {
    id: 103,
    btc_address: "bc1qzjtvf7dwwahgevguaepj4szcuk0h8373423uk9",
    option_id: 122,
    option_hash:
      "597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772821327 | 7065fe89b4",
    signature:
      "H3iCuG4bHT63rvIoAOlTXftyKdm52pslskhZt75vVibZYCglwRa42RyKLU4DDpLf5obcPIx1iDSF3wQF627HUeY=",
    nonce_timestamp: "1772821327",
    random_code: "7065fe89b4",
    is_reply_valid: true,
    balance_at_reply_satoshi: 2890,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:16.461805Z",
    is_hidden: false,
    created_at: "2026-03-06T18:22:12.107Z",
    created_by_ip: "104.28.156.244",
    updated_at: "2026-03-08T05:47:16.463Z",
  },
  {
    id: 102,
    btc_address: "bc1qual0ccnxd8k40efvcrz4dhxguvl5zw9ledyejr",
    option_id: 124,
    option_hash:
      "ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772820353 | fbd16012dd",
    signature:
      "HzLcTEwMHTuNnKY6VvvmRnZfRg41n/5k2NO9zl1+VLUHFjvZPqfHsxMGO0WH4vhLHGqvutvTOrWgwYfY3JDtlH4=",
    nonce_timestamp: "1772820353",
    random_code: "fbd16012dd",
    is_reply_valid: true,
    balance_at_reply_satoshi: 3000,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:11.671275Z",
    is_hidden: false,
    created_at: "2026-03-06T18:05:58.03Z",
    created_by_ip: "104.28.156.244",
    updated_at: "2026-03-08T05:47:11.672Z",
  },
  {
    id: 101,
    btc_address: "bc1qx9vxu655zlj2fe0ssw5qr82y6auh2lku7yuwk2",
    option_id: 124,
    option_hash:
      "ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772820320 | 8c25b47b2a",
    signature:
      "IBzpDd2OvjZZo4DdsjvZH0rRhVUlHKsgHNyr9kW2DIOUb/Cst+3hdLK0yRaTJG0z3Zl3vcZMspH2Mg1Yc6rg8qQ=",
    nonce_timestamp: "1772820320",
    random_code: "8c25b47b2a",
    is_reply_valid: true,
    balance_at_reply_satoshi: 3000,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:13.482289Z",
    is_hidden: false,
    created_at: "2026-03-06T18:05:40.862Z",
    created_by_ip: "104.28.159.154",
    updated_at: "2026-03-08T05:47:13.483Z",
  },
  {
    id: 100,
    btc_address:
      "bc1pxk4lvef0pa2329u8kml2w42vlxkk39y8gk5760hp5gd0v3uhtuhqqe7ccv",
    option_id: 120,
    option_hash:
      "f1624fcc63b615ac0e95daf9ab78434ec2e8ffe402144dc631b055f711225191",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(f1624fcc63b615ac0e95daf9ab78434ec2e8ffe402144dc631b055f711225191) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772816574 | b00b15aabd",
    signature:
      "H4mylg1sGPKTBXsBFftJzIXbE2tBIscbGl+iQGRdkIXfXuj6IaXq5VzLJIj314Mdbu7EVjPxAPghiYaVfdeTvbA=",
    nonce_timestamp: "1772816574",
    random_code: "b00b15aabd",
    is_reply_valid: true,
    balance_at_reply_satoshi: 6834,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 6834,
    balance_last_updated_at: "2026-03-08T05:46:54.342046Z",
    is_hidden: false,
    created_at: "2026-03-06T17:03:21.012Z",
    created_by_ip: "118.166.25.162",
    updated_at: "2026-03-08T05:46:54.343Z",
  },
  {
    id: 99,
    btc_address: "bc1qgj9s4z3u9w0p4d7fmpwccz08389slsl063h6fa",
    option_id: 124,
    option_hash:
      "ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772815354 | 9ed7f1616a",
    signature:
      "H1M9dh1U5ns6i/onBx9IvqU+UpfSqZJNffyRNnt23J8YDeaL5l8uHBlw2RqQW2OfvcYpDT0U5bXZI9GVoVHqcMg=",
    nonce_timestamp: "1772815354",
    random_code: "9ed7f1616a",
    is_reply_valid: true,
    balance_at_reply_satoshi: 12698,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:47:00.676418Z",
    is_hidden: false,
    created_at: "2026-03-06T16:42:42.854Z",
    created_by_ip: "104.28.160.187",
    updated_at: "2026-03-08T05:47:00.678Z",
  },
  {
    id: 98,
    btc_address: "bc1qe2cey7xr72z296q0uylp6knzmdfjr3urd8w4pn",
    option_id: 124,
    option_hash:
      "ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(ebf3aed6e794a2112b253356a5a062baddff1b7ffb08aae34755436f17c85847) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772814149 | d05136ad19",
    signature:
      "HwUg5PCAzI/0E86J1NRzZrxlJDON8F0fjdwRia4ZglFSfPvA6ITKPo/e67D+Wyyi86Xf6yxQ92PqYYWnnhSb/Nk=",
    nonce_timestamp: "1772814149",
    random_code: "d05136ad19",
    is_reply_valid: true,
    balance_at_reply_satoshi: 12808,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 0,
    balance_last_updated_at: "2026-03-08T05:46:59.289674Z",
    is_hidden: false,
    created_at: "2026-03-06T16:22:36.302Z",
    created_by_ip: "104.28.156.240",
    updated_at: "2026-03-08T05:46:59.291Z",
  },
  {
    id: 97,
    btc_address: "bc1qn6yle9ae705ekvsq3xawp5ttyzqkr99pcsaa7z",
    option_id: 122,
    option_hash:
      "597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7",
    content: null,
    content_hash: null,
    plaintext:
      "koinvote.com | type:single | SHA256(597242c4be37dc3d734a8b5578eac0b877f31724da7e43ad5cd526ec98a220a7) | 01KK0NP9AV6CQWG3TM4DJ5RFEZ | 1772807020 | e523b31ac9",
    signature:
      "KBBMmqmH1MKHizxQ5zzE/1AivZQU5Z44DIqNaV0sljUlIfYv51fqAHfLW/RX1WHUrAX5wAdT0dPXZmc0cmT0JGg=",
    nonce_timestamp: "1772807020",
    random_code: "e523b31ac9",
    is_reply_valid: true,
    balance_at_reply_satoshi: 81232,
    balance_at_snapshot_satoshi: null,
    balance_at_current_satoshi: 81232,
    balance_last_updated_at: "2026-03-08T05:47:07.587821Z",
    is_hidden: false,
    created_at: "2026-03-06T14:24:01.519Z",
    created_by_ip: "223.138.242.0",
    updated_at: "2026-03-08T05:47:07.589Z",
  },
];

// Full top-replies for exchange event (all 5 options with weights)
export const mockExchangeTopReplies = [
  {
    id: 120,
    body: "Binance",
    weight_percent: 50.463868462014304,
    amount_satoshi: 18753296,
  },
  {
    id: 121,
    body: "Coinbase",
    weight_percent: 49.31754164515266,
    amount_satoshi: 18327300,
  },
  {
    id: 122,
    body: "Hyperliquid",
    weight_percent: 0.21858989283304364,
    amount_satoshi: 81232,
  },
  { id: 123, body: "Kraken", weight_percent: 0, amount_satoshi: 0 },
  { id: 124, body: "OKX", weight_percent: 0, amount_satoshi: 0 },
];

export const mockGetReceiptVerifyPubKeysRes: GetReceiptVerifyPubKeysRes[] = [
  {
    kid: "kvpub_1",
    public_key: "ED/kBYrzVcJp07jrGCMvRMvgSeJjdgidkiLF1TWVMyo=",
    alg: "ed25519",
    active: true,
    created_at: "2026-02-01T08:29:22Z",
  },
  {
    kid: "kvpub_2",
    public_key: "MCowBQYDK2VwAyEAAU6pF7U4/pJ9DW",
    alg: "ed25519",
    active: true,
    created_at: "2024-12-01T12:00:00Z",
  },
];
