
import {
    type EventSummary,
    type GetEventsParams,
    type PaginatedResult
  } from './types/index'
  import { applySearchFilter, applyHashtagFilter, applySort } from '@/utils/eventQueryUtils'
  
  const MOCK_EVENTS: EventSummary[] = [
    // === Ongoing 1 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'How will the upcoming Bitcoin halving affect mining profitability?',
      description:
        "With the next halving approaching, I'm trying to understand the implications for mining operations. Looking for insights on expected hashrate changes, miner capitulation risk, and price dynamics.",
      state: 'ACTIVE',
      hashtags: ['#bitcoin', '#mining', '#halving', '#defi'],
      created_at: '2024-11-01T10:00:00Z',
      deadline_at: '2024-11-25T12:00:00Z',
      total_reward_btc: '0.01000000',
      participants_count: 8,
      total_stake_btc: '0.01200000',
      top_replies: [
        {
          reply_id: 'r1',
          body:
            'Based on historical data, we typically see a 20–30% drop in hashrate initially, followed by gradual recovery.',
          weight_percent: 42,
          amount_btc: '0.00400000',
        },
        {
          reply_id: 'r2',
          body:
            'Smaller, less efficient miners will be forced out unless fees pick up significantly.',
          weight_percent: 31,
          amount_btc: '0.00300000',
        },
      ],
    },
  
    // === Ongoing 2 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440001',
      title: "What's the best Lightning Network wallet for small businesses in 2024?",
      description:
        "I'm looking for recommendations on Lightning wallets that would work well for a small coffee shop. We need something reliable, with good UX for staff and customers.",
      state: 'ACTIVE',
      hashtags: ['#lightning', '#wallet', '#payments', '#adoption'],
      created_at: '2024-11-05T09:00:00Z',
      deadline_at: '2024-11-28T18:00:00Z',
      total_reward_btc: '0.01000000',
      participants_count: 8,
      total_stake_btc: '0.01200000',
      top_replies: [
        {
          reply_id: 'r3',
          body:
            'Breez is a solid choice if you want non-custodial with decent UX.',
          weight_percent: 45,
          amount_btc: '0.00500000',
        },
        {
          reply_id: 'r4',
          body:
            'If you prefer something simpler for staff, Phoenix might be easier to train on.',
          weight_percent: 27,
          amount_btc: '0.00300000',
        },
      ],
    },
  
    // === Completed 1 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Post-halving BTC price range by the end of 2025?',
      description:
        'Looking for data-backed scenarios for BTC price by the end of 2025. Please include assumptions about macro, ETF flows, and L2 adoption.',
      state: 'CLOSED',
      hashtags: ['#bitcoin', '#macro', '#etf', '#prediction'],
      created_at: '2024-05-10T08:00:00Z',
      deadline_at: '2024-09-01T00:00:00Z',
      ended_at: '2024-09-01T00:00:00Z',
      total_reward_btc: '0.02000000',
      participants_count: 15,
      total_stake_btc: '0.03000000',
      top_replies: [
        {
          reply_id: 'r5',
          body: 'Most likely range 80k–120k if ETF flows remain strong.',
          weight_percent: 38,
          amount_btc: '0.01100000',
        },
        {
          reply_id: 'r6',
          body:
            'Base case around 60k–90k with periods of high volatility and deep corrections.',
          weight_percent: 26,
          amount_btc: '0.00800000',
        },
      ],
    },
  
    // === Ongoing 3 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Best strategy to manage channel liquidity for a routing node?',
      description:
        "Running a mid-size Lightning routing node and looking for concrete strategies to manage inbound/outbound liquidity efficiently without constantly babysitting channels.",
      state: 'ACTIVE',
      hashtags: ['#lightning', '#routing', '#liquidity', '#node'],
      created_at: '2024-11-07T11:30:00Z',
      deadline_at: '2024-11-30T23:59:00Z',
      total_reward_btc: '0.00700000',
      participants_count: 5,
      total_stake_btc: '0.00950000',
      top_replies: [
        {
          reply_id: 'r7',
          body:
            'Use loop-out + circular rebalances scheduled during low-fee windows.',
          weight_percent: 52,
          amount_btc: '0.00490000',
        },
        {
          reply_id: 'r8',
          body:
            'Automate with LNDg or similar tools and set clear target policies per peer.',
          weight_percent: 29,
          amount_btc: '0.00280000',
        },
      ],
    },
  
    // === Ongoing 4 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'Impact of Ordinals and inscriptions on long-term fee market?',
      description:
        'Ordinals and other non-monetary use cases have pushed fees up in some periods. Curious about long-term sustainability and whether this changes security assumptions.',
      state: 'ACTIVE',
      hashtags: ['#ordinals', '#fees', '#security', '#blockspace'],
      created_at: '2024-10-20T15:00:00Z',
      deadline_at: '2024-12-10T16:00:00Z',
      total_reward_btc: '0.00500000',
      participants_count: 6,
      total_stake_btc: '0.00680000',
      top_replies: [
        {
          reply_id: 'r9',
          body:
            'Expect periodic spikes but not a permanent new floor until more L2 activity settles on-chain.',
          weight_percent: 41,
          amount_btc: '0.00280000',
        },
        {
          reply_id: 'r10',
          body:
            'As long as blockspace is scarce, any competing use case helps bootstrap a real fee market.',
          weight_percent: 33,
          amount_btc: '0.00220000',
        },
      ],
    },
  
    // === Ongoing 5 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Designing a non-custodial BTC savings setup for normies',
      description:
        'Looking for practical multi-step setups (hardware, multisig, inheritance) that normal non-technical users can actually follow and maintain.',
      state: 'ACTIVE',
      hashtags: ['#selfcustody', '#security', '#ux', '#wallet'],
      created_at: '2024-11-09T09:15:00Z',
      deadline_at: '2024-12-15T20:00:00Z',
      total_reward_btc: '0.01200000',
      participants_count: 10,
      total_stake_btc: '0.01800000',
      top_replies: [
        {
          reply_id: 'r11',
          body:
            'Single hardware wallet today, with a clear path to 2-of-3 multisig later when balance grows.',
          weight_percent: 47,
          amount_btc: '0.00840000',
        },
        {
          reply_id: 'r12',
          body:
            'Focus on solid backups and inheritance instructions before fancy multisig setups.',
          weight_percent: 30,
          amount_btc: '0.00540000',
        },
      ],
    },
  
    // === Completed 2 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440006',
      title: 'Real-world Taproot usage patterns in 2024',
      description:
        'After Taproot activation, how much of on-chain activity actually benefits from it? Looking for data and concrete examples rather than theory.',
      state: 'CLOSED',
      hashtags: ['#taproot', '#onchain', '#analytics'],
      created_at: '2023-12-15T12:00:00Z',
      deadline_at: '2024-06-01T00:00:00Z',
      ended_at: '2024-06-02T08:30:00Z',
      total_reward_btc: '0.00600000',
      participants_count: 9,
      total_stake_btc: '0.01000000',
      top_replies: [
        {
          reply_id: 'r13',
          body:
            'Most usage is still aggregating key-path spends; script-path usage remains niche but growing.',
          weight_percent: 44,
          amount_btc: '0.00440000',
        },
        {
          reply_id: 'r14',
          body:
            'Wallet support is the main bottleneck; large custodians are slower to adopt.',
          weight_percent: 28,
          amount_btc: '0.00280000',
        },
      ],
    },
  
    // === Completed 3 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440007',
      title: 'Share of L2 vs on-chain usage for small payments',
      description:
        'By mid-2024, what share of sub-$50 payments do you expect to be done on Lightning or other L2s vs directly on the base layer?',
      state: 'CLOSED',
      hashtags: ['#lightning', '#l2', '#payments', '#scaling'],
      created_at: '2024-01-05T09:00:00Z',
      deadline_at: '2024-07-01T00:00:00Z',
      ended_at: '2024-07-01T05:00:00Z',
      total_reward_btc: '0.00800000',
      participants_count: 12,
      total_stake_btc: '0.01500000',
      top_replies: [
        {
          reply_id: 'r15',
          body:
            'Roughly 70–80% on L2s in markets with mature Lightning infrastructure.',
          weight_percent: 40,
          amount_btc: '0.00600000',
        },
        {
          reply_id: 'r16',
          body:
            'On-chain payments below $50 will be rare outside of very low-fee periods.',
          weight_percent: 25,
          amount_btc: '0.00380000',
        },
      ],
    },
  
    // === Completed 4 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440008',
      title: 'Custodial vs non-custodial wallet share among new users',
      description:
        'For users who started with Bitcoin in 2023–2024, what percentage stay in custodial exchanges vs migrate to non-custodial setups within a year?',
      state: 'CLOSED',
      hashtags: ['#selfcustody', '#exchanges', '#onboarding'],
      created_at: '2023-11-10T14:00:00Z',
      deadline_at: '2024-05-15T00:00:00Z',
      ended_at: '2024-05-15T09:45:00Z',
      total_reward_btc: '0.00500000',
      participants_count: 11,
      total_stake_btc: '0.00900000',
      top_replies: [
        {
          reply_id: 'r17',
          body:
            'Rough estimate: 60–70% remain fully custodial after 12 months.',
          weight_percent: 37,
          amount_btc: '0.00330000',
        },
        {
          reply_id: 'r18',
          body:
            'Only a minority move to self-custody unless there is a strong local education push.',
          weight_percent: 29,
          amount_btc: '0.00260000',
        },
      ],
    },
  
    // === Completed 5 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440009',
      title: 'Energy mix of global Bitcoin mining after China ban',
      description:
        'What is the realistic renewable vs non-renewable split of global mining hashrate post-China ban, based on public data?',
      state: 'CLOSED',
      hashtags: ['#mining', '#energy', '#environment'],
      created_at: '2023-09-01T10:00:00Z',
      deadline_at: '2024-03-01T00:00:00Z',
      ended_at: '2024-03-01T07:00:00Z',
      total_reward_btc: '0.00400000',
      participants_count: 7,
      total_stake_btc: '0.00650000',
      top_replies: [
        {
          reply_id: 'r19',
          body:
            'Most credible estimates put renewables and stranded energy at 45–60% of total hashrate.',
          weight_percent: 48,
          amount_btc: '0.00310000',
        },
        {
          reply_id: 'r20',
          body:
            'Numbers vary widely by methodology; transparency from large public miners skews the sample.',
          weight_percent: 24,
          amount_btc: '0.00160000',
        },
      ],
    },
  
    // === Completed 6 ===
    {
      event_id: '550e8400-e29b-41d4-a716-446655440010',
      title: 'Effectiveness of privacy tools against common chain analysis',
      description:
        'Looking for realistic assessments of how well CoinJoin, collaborative spends, and simple best practices actually work against standard on-chain analytics.',
      state: 'CLOSED',
      hashtags: ['#privacy', '#coinjoin', '#analysis'],
      created_at: '2023-10-12T11:30:00Z',
      deadline_at: '2024-04-10T00:00:00Z',
      ended_at: '2024-04-10T06:30:00Z',
      total_reward_btc: '0.00650000',
      participants_count: 10,
      total_stake_btc: '0.01100000',
      top_replies: [
        {
          reply_id: 'r21',
          body:
            'They raise the cost of analysis significantly but are far from a magic shield, especially with reused addresses.',
          weight_percent: 39,
          amount_btc: '0.00420000',
        },
        {
          reply_id: 'r22',
          body:
            'The biggest leaks still come from KYC endpoints and poor operational security, not the on-chain graph alone.',
          weight_percent: 32,
          amount_btc: '0.00350000',
        },
      ],
    },
  ]
  
  // --- 對外 mock API ---
  
  export async function mockFetchEvents(
    params: GetEventsParams,
  ): Promise<PaginatedResult<EventSummary>> {
    const {
      status,
      search,
      sortField = 'time',
      sortOrder = 'asc',
      hashtag,
      offset = 0,
      limit = 20,
    } = params
  
    // 狀態過濾
    let filtered = MOCK_EVENTS.filter((ev) =>
      status === 'ongoing' ? ev.state === 'ACTIVE' : ev.state === 'CLOSED',
    )
  
    filtered = applySearchFilter(filtered, search)
    filtered = applyHashtagFilter(filtered, hashtag)
    filtered = applySort(filtered, sortField, sortOrder)
  
    const total = filtered.length
    const items = filtered.slice(offset, offset + limit)
    const hasMore = offset + limit < total
  
    // 模擬網路延遲
    await new Promise((res) => setTimeout(res, 300))
  
    return {
      items,
      total,
      limit,
      offset,
      hasMore,
    }
  }
  
  // 給熱門 hashtag 用
  export async function mockFetchPopularHashtags(limit = 12): Promise<string[]> {
    const counts: Record<string, number> = {}
  
    MOCK_EVENTS.forEach((ev) => {
      ev.hashtags.forEach((tag) => {
        const key = tag.toLowerCase()
        counts[key] = (counts[key] || 0) + 1
      })
    })
  
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag)
  
    await new Promise((res) => setTimeout(res, 100))
    return sorted
  }
  