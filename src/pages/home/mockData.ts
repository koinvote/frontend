import {
  type BackendEvent,
  type BackendGetEventsResponse,
  type EventSummary,
  type HomeSortField,
  type  HomeSortOrder,
  type HomeStatusFilter,
  type PaginatedResult,
} from './types'
import {
  mapBackendEventToEventSummary,
} from '@/utils/eventTransform'
import {
  applySearchFilter,
  applyHashtagFilter,
  applySort,
} from '@/utils/eventQueryUtils'
  
export const MOCK_BACKEND_EVENTS: BackendEvent[] = [
  // === Ongoing 1 ===
  {
    id: 1,
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'How will the upcoming Bitcoin halving affect mining profitability?',
    description:
      "With the next halving approaching, I'm trying to understand the implications for mining operations. Looking for insights on expected hashrate changes, miner capitulation risk, and price dynamics.",
    state: 1, // ACTIVE
    hashtags: ['bitcoin', 'mining', 'halving', 'defi'],
    created_at: '2024-11-01T10:00:00Z',
    deadline_at: '2024-11-25T12:00:00Z',
    total_reward_btc: 1_000_000, // 0.01000000
    participants_count: 8,
    total_stake_btc: 1_200_000, // 0.01200000
    top_replies: [
      {
        id: 1,
        body:
          'Based on historical data, we typically see a 20–30% drop in hashrate initially, followed by gradual recovery.',
        weight_percent: 42,
        amount_btc: 400_000, // 0.00400000
      },
      {
        id: 2,
        body:
          'Smaller, less efficient miners will be forced out unless fees pick up significantly.',
        weight_percent: 31,
        amount_btc: 300_000, // 0.00300000
      },
    ],
  },

  // === Ongoing 2 ===
  {
    id: 2,
    event_id: '550e8400-e29b-41d4-a716-446655440001',
    title: "What's the best Lightning Network wallet for small businesses in 2024?",
    description:
      "I'm looking for recommendations on Lightning wallets that would work well for a small coffee shop. We need something reliable, with good UX for staff and customers.",
    state: 1, // ACTIVE
    hashtags: ['lightning', 'wallet', 'payments', 'adoption'],
    created_at: '2024-11-05T09:00:00Z',
    deadline_at: '2024-11-28T18:00:00Z',
    total_reward_btc: 1_000_000, // 0.01000000
    participants_count: 8,
    total_stake_btc: 1_200_000, // 0.01200000
    top_replies: [
      {
        id: 3,
        body: 'Breez is a solid choice if you want non-custodial with decent UX.',
        weight_percent: 45,
        amount_btc: 500_000, // 0.00500000
      },
      {
        id: 4,
        body:
          'If you prefer something simpler for staff, Phoenix might be easier to train on.',
        weight_percent: 27,
        amount_btc: 300_000, // 0.00300000
      },
    ],
  },

  // === Completed 1 ===
  {
    id: 3,
    event_id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Post-halving BTC price range by the end of 2025?',
    description:
      'Looking for data-backed scenarios for BTC price by the end of 2025. Please include assumptions about macro, ETF flows, and L2 adoption.',
    state: 0, // CLOSED
    hashtags: ['bitcoin', 'macro', 'etf', 'prediction'],
    created_at: '2024-05-10T08:00:00Z',
    deadline_at: '2024-09-01T00:00:00Z',
    ended_at: '2024-09-01T00:00:00Z',
    total_reward_btc: 2_000_000, // 0.02000000
    participants_count: 15,
    total_stake_btc: 3_000_000, // 0.03000000
    top_replies: [
      {
        id: 5,
        body: 'Most likely range 80k–120k if ETF flows remain strong.',
        weight_percent: 38,
        amount_btc: 1_100_000, // 0.01100000
      },
      {
        id: 6,
        body:
          'Base case around 60k–90k with periods of high volatility and deep corrections.',
        weight_percent: 26,
        amount_btc: 800_000, // 0.00800000
      },
    ],
  },

  // === Ongoing 3 ===
  {
    id: 4,
    event_id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Best strategy to manage channel liquidity for a routing node?',
    description:
      'Running a mid-size Lightning routing node and looking for concrete strategies to manage inbound/outbound liquidity efficiently without constantly babysitting channels.',
    state: 1, // ACTIVE
    hashtags: ['lightning', 'routing', 'liquidity', 'node'],
    created_at: '2024-11-07T11:30:00Z',
    deadline_at: '2024-11-30T23:59:00Z',
    total_reward_btc: 700_000, // 0.00700000
    participants_count: 5,
    total_stake_btc: 950_000, // 0.00950000
    top_replies: [
      {
        id: 7,
        body:
          'Use loop-out + circular rebalances scheduled during low-fee windows.',
        weight_percent: 52,
        amount_btc: 490_000, // 0.00490000
      },
      {
        id: 8,
        body:
          'Automate with LNDg or similar tools and set clear target policies per peer.',
        weight_percent: 29,
        amount_btc: 280_000, // 0.00280000
      },
    ],
  },

  // === Ongoing 4 ===
  {
    id: 5,
    event_id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Impact of Ordinals and inscriptions on long-term fee market?',
    description:
      'Ordinals and other non-monetary use cases have pushed fees up in some periods. Curious about long-term sustainability and whether this changes security assumptions.',
    state: 1, // ACTIVE
    hashtags: ['ordinals', 'fees', 'security', 'blockspace'],
    created_at: '2024-10-20T15:00:00Z',
    deadline_at: '2024-12-10T16:00:00Z',
    total_reward_btc: 500_000, // 0.00500000
    participants_count: 6,
    total_stake_btc: 680_000, // 0.00680000
    top_replies: [
      {
        id: 9,
        body:
          'Expect periodic spikes but not a permanent new floor until more L2 activity settles on-chain.',
        weight_percent: 41,
        amount_btc: 280_000, // 0.00280000
      },
      {
        id: 10,
        body:
          'As long as blockspace is scarce, any competing use case helps bootstrap a real fee market.',
        weight_percent: 33,
        amount_btc: 220_000, // 0.00220000
      },
    ],
  },

  // === Ongoing 5 ===
  {
    id: 6,
    event_id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Designing a non-custodial BTC savings setup for normies',
    description:
      'Looking for practical multi-step setups (hardware, multisig, inheritance) that normal non-technical users can actually follow and maintain.',
    state: 1, // ACTIVE
    hashtags: ['selfcustody', 'security', 'ux', 'wallet'],
    created_at: '2024-11-09T09:15:00Z',
    deadline_at: '2024-12-15T20:00:00Z',
    total_reward_btc: 1_200_000, // 0.01200000
    participants_count: 10,
    total_stake_btc: 1_800_000, // 0.01800000
    top_replies: [
      {
        id: 11,
        body:
          'Single hardware wallet today, with a clear path to 2-of-3 multisig later when balance grows.',
        weight_percent: 47,
        amount_btc: 840_000, // 0.00840000
      },
      {
        id: 12,
        body:
          'Focus on solid backups and inheritance instructions before fancy multisig setups.',
        weight_percent: 30,
        amount_btc: 540_000, // 0.00540000
      },
    ],
  },

  // === Completed 2 ===
  {
    id: 7,
    event_id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Real-world Taproot usage patterns in 2024',
    description:
      'After Taproot activation, how much of on-chain activity actually benefits from it? Looking for data and concrete examples rather than theory.',
    state: 0, // CLOSED
    hashtags: ['taproot', 'onchain', 'analytics'],
    created_at: '2023-12-15T12:00:00Z',
    deadline_at: '2024-06-01T00:00:00Z',
    ended_at: '2024-06-02T08:30:00Z',
    total_reward_btc: 600_000, // 0.00600000
    participants_count: 9,
    total_stake_btc: 1_000_000, // 0.01000000
    top_replies: [
      {
        id: 13,
        body:
          'Most usage is still aggregating key-path spends; script-path usage remains niche but growing.',
        weight_percent: 44,
        amount_btc: 440_000, // 0.00440000
      },
      {
        id: 14,
        body:
          'Wallet support is the main bottleneck; large custodians are slower to adopt.',
        weight_percent: 28,
        amount_btc: 280_000, // 0.00280000
      },
    ],
  },

  // === Completed 3 ===
  {
    id: 8,
    event_id: '550e8400-e29b-41d4-a716-446655440007',
    title: 'Share of L2 vs on-chain usage for small payments',
    description:
      'By mid-2024, what share of sub-$50 payments do you expect to be done on Lightning or other L2s vs directly on the base layer?',
    state: 0, // CLOSED
    hashtags: ['lightning', 'l2', 'payments', 'scaling'],
    created_at: '2024-01-05T09:00:00Z',
    deadline_at: '2024-07-01T00:00:00Z',
    ended_at: '2024-07-01T05:00:00Z',
    total_reward_btc: 800_000, // 0.00800000
    participants_count: 12,
    total_stake_btc: 1_500_000, // 0.01500000
    top_replies: [
      {
        id: 15,
        body:
          'Roughly 70–80% on L2s in markets with mature Lightning infrastructure.',
        weight_percent: 40,
        amount_btc: 600_000, // 0.00600000
      },
      {
        id: 16,
        body:
          'On-chain payments below $50 will be rare outside of very low-fee periods.',
        weight_percent: 25,
        amount_btc: 380_000, // 0.00380000
      },
    ],
  },

  // === Completed 4 ===
  {
    id: 9,
    event_id: '550e8400-e29b-41d4-a716-446655440008',
    title: 'Custodial vs non-custodial wallet share among new users',
    description:
      'For users who started with Bitcoin in 2023–2024, what percentage stay in custodial exchanges vs migrate to non-custodial setups within a year?',
    state: 0, // CLOSED
    hashtags: ['selfcustody', 'exchanges', 'onboarding'],
    created_at: '2023-11-10T14:00:00Z',
    deadline_at: '2024-05-15T00:00:00Z',
    ended_at: '2024-05-15T09:45:00Z',
    total_reward_btc: 500_000, // 0.00500000
    participants_count: 11,
    total_stake_btc: 900_000, // 0.00900000
    top_replies: [
      {
        id: 17,
        body:
          'Rough estimate: 60–70% remain fully custodial after 12 months.',
        weight_percent: 37,
        amount_btc: 330_000, // 0.00330000
      },
      {
        id: 18,
        body:
          'Only a minority move to self-custody unless there is a strong local education push.',
        weight_percent: 29,
        amount_btc: 260_000, // 0.00260000
      },
    ],
  },

  // === Completed 5 ===
  {
    id: 10,
    event_id: '550e8400-e29b-41d4-a716-446655440009',
    title: 'Energy mix of global Bitcoin mining after China ban',
    description:
      'What is the realistic renewable vs non-renewable split of global mining hashrate post-China ban, based on public data?',
    state: 0, // CLOSED
    hashtags: ['mining', 'energy', 'environment'],
    created_at: '2023-09-01T10:00:00Z',
    deadline_at: '2024-03-01T00:00:00Z',
    ended_at: '2024-03-01T07:00:00Z',
    total_reward_btc: 400_000, // 0.00400000
    participants_count: 7,
    total_stake_btc: 650_000, // 0.00650000
    top_replies: [
      {
        id: 19,
        body:
          'Most credible estimates put renewables and stranded energy at 45–60% of total hashrate.',
        weight_percent: 48,
        amount_btc: 310_000, // 0.00310000
      },
      {
        id: 20,
        body:
          'Numbers vary widely by methodology; transparency from large public miners skews the sample.',
        weight_percent: 24,
        amount_btc: 160_000, // 0.00160000
      },
    ],
  },

  // === Completed 6 ===
  {
    id: 11,
    event_id: '550e8400-e29b-41d4-a716-446655440010',
    title: 'Effectiveness of privacy tools against common chain analysis',
    description:
      'Looking for realistic assessments of how well CoinJoin, collaborative spends, and simple best practices actually work against standard on-chain analytics.',
    state: 0, // CLOSED
    hashtags: ['privacy', 'coinjoin', 'analysis'],
    created_at: '2023-10-12T11:30:00Z',
    deadline_at: '2024-04-10T00:00:00Z',
    ended_at: '2024-04-10T06:30:00Z',
    total_reward_btc: 650_000, // 0.00650000
    participants_count: 10,
    total_stake_btc: 1_100_000, // 0.01100000
    top_replies: [
      {
        id: 21,
        body:
          'They raise the cost of analysis significantly but are far from a magic shield, especially with reused addresses.',
        weight_percent: 39,
        amount_btc: 420_000, // 0.00420000
      },
      {
        id: 22,
        body:
          'The biggest leaks still come from KYC endpoints and poor operational security, not the on-chain graph alone.',
        weight_percent: 32,
        amount_btc: 350_000, // 0.00350000
      },
    ],
  },
]
  
  // --- 對外 mock API ---
  export async function mockBackendGetEvents(
    params: {
      page: number // 1-based
      limit: number
      state: 0 | 1 | null        // null = all
      sortBy: 'time' | 'bounty' | 'participation'
      orderBy: HomeSortOrder
      search?: string
      hashtag?: string | null
    },
  ): Promise<BackendGetEventsResponse> {
    const {
      page,
      limit,
      state,
      sortBy,
      orderBy,
      search,
      hashtag,
    } = params
  
    let list = [...MOCK_BACKEND_EVENTS]
  
    if (state !== null) {
      list = list.filter((ev) => ev.state === state)
    }
  
    // search / hashtag 還是先在前端模擬
    list = applySearchFilter(
      list.map(mapBackendEventToEventSummary),
      search,
    ).map((ev) => {
      // 再從 EventSummary 找回 BackendEvent 的 id（只在 mock，用不到效能）
      const backend = MOCK_BACKEND_EVENTS.find(
        (b) => b.event_id === ev.event_id,
      )!
      return backend
    })
  
    list = applyHashtagFilter(
      list.map(mapBackendEventToEventSummary),
      hashtag,
    ).map((ev) => {
      const backend = MOCK_BACKEND_EVENTS.find(
        (b) => b.event_id === ev.event_id,
      )!
      return backend
    })
  
    list = applySort(
      list.map(mapBackendEventToEventSummary),
      sortBy as HomeSortField,
      orderBy,
    ).map((ev) => {
      const backend = MOCK_BACKEND_EVENTS.find(
        (b) => b.event_id === ev.event_id,
      )!
      return backend
    })
  
   
    const offset = (page - 1) * limit
    const sliced = list.slice(offset, offset + limit)
  
    await new Promise((r) => setTimeout(r, 300))
  
    return {
      code: '000000',
      success: true,
      message: null,
      data: sliced,
    }
  }
  
  // === 給目前 HomePage 用的 fetch 封裝（仍然回傳 EventSummary） ===
  export async function mockFetchEventsForHome(
    params: {
      status: HomeStatusFilter
      search?: string
      sortField: HomeSortField
      sortOrder: HomeSortOrder
      hashtag?: string | null
      page: number
      limit: number
    },
  ): Promise<PaginatedResult<EventSummary>> {
    const { status, search, sortField, sortOrder, hashtag, page, limit } = params
  
    const stateCode: 0 | 1 =
      status === 'ongoing' ? 1 : 0
  
    const sortBy: 'time' | 'bounty' | 'participation' = sortField
  
    const res = await mockBackendGetEvents({
      page,
      limit,
      state: stateCode,
      sortBy,
      orderBy: sortOrder,
      search,
      hashtag,
    })
  
    const items = res.data.map(mapBackendEventToEventSummary)
    const total = MOCK_BACKEND_EVENTS.filter(
      (ev) => ev.state === stateCode,
    ).length
    const offset = (page - 1) * limit
    const hasMore = offset + items.length < total
  
    return {
      items,
      total,
      limit,
      offset,
      hasMore,
    }
  }