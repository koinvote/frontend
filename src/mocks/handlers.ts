// MSW handlers for API mocking
import type { ApiResponse, ReplyReceiptData } from "@/api";
import { DepositStatus } from "@/api/types";
import CONSTS from "@/consts";
import { http, HttpResponse } from "msw";
import {
  mockAdminSystemParameters,
  mockDepositStatus,
  mockEventDetail,
  mockEventList,
  mockGetEventListResponse,
  mockGetListRepliesResponse,
  mockGetReceiptVerifyPubKeysRes,
  mockHotHashtags,
  mockPayoutReport,
  mockSystemConfig,
  mockVerificationCsvContent,
} from "./data";

const API_BASE_URL = "/api/v1";

// ============ 調整這裡控制狀態變化時間（分鐘）============
// PENDING_TIME: 幾分鐘後變成 UNCONFIRMED
// CONFIRM_TIME: 幾分鐘後變成 RECEIVED
const PENDING_TIME = 0.5; // 0.5 分鐘 = 30 秒
const CONFIRM_TIME = 10; // 10 分鐘
// ========================================================

// Track deposit status timing
let DEPOSIT_START_TIME: number | null = null;
let DEPOSIT_PENDING_TIMEOUT_AT: string | null = null; // 初始 PENDING 的到期時間
let DEPOSIT_FIRST_SEEN_AT: string | null = null;
let DEPOSIT_TIMEOUT_AT: string | null = null;

export const handlers = [
  // GET /system/parameters - Get system configuration
  http.get(`${API_BASE_URL}/system/parameters`, () => {
    return HttpResponse.json<ApiResponse<typeof mockSystemConfig>>({
      code: "200",
      success: true,
      message: null,
      data: mockSystemConfig,
    });
  }),

  // GET /events - Get event list with filters
  http.get(`${API_BASE_URL}/events`, ({ request }) => {
    const url = new URL(request.url);
    const tab = url.searchParams.get("tab") || "ongoing";
    const search = url.searchParams.get("q") || "";
    const tag = url.searchParams.get("tag");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Filter events based on tab (status)
    let filteredEvents = [...mockEventList];

    if (tab === "preheat") {
      filteredEvents = filteredEvents.filter((e) => e.status === 2);
    } else if (tab === "ongoing") {
      filteredEvents = filteredEvents.filter((e) => e.status === 3);
    } else if (tab === "completed") {
      filteredEvents = filteredEvents.filter((e) => e.status === 5);
    }

    // Filter by search query
    if (search) {
      filteredEvents = filteredEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by hashtag
    if (tag) {
      filteredEvents = filteredEvents.filter((e) => e.hashtags.includes(tag));
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedEvents = filteredEvents.slice(start, start + limit);

    return HttpResponse.json<ApiResponse<typeof mockGetEventListResponse>>({
      code: "200",
      success: true,
      message: null,
      data: {
        events: paginatedEvents,
        page,
        limit,
      },
    });
  }),

  // GET /events/:eventId - Get event detail
  http.get(`${API_BASE_URL}/events/:eventId`, ({ params }) => {
    const { eventId } = params;

    // Find matching event from list or return default detail
    const eventFromList = mockEventList.find((e) => e.event_id === eventId);

    if (eventFromList) {
      // Create detail from list item, including status
      const detail = {
        ...mockEventDetail,
        id: eventFromList.id,
        event_id: eventFromList.event_id,
        title: eventFromList.title,
        description: eventFromList.description,
        event_type: eventFromList.event_type,
        event_reward_type: eventFromList.event_reward_type,
        status: eventFromList.status,
        total_reward_satoshi: eventFromList.total_reward_satoshi,
        participants_count: eventFromList.participants_count,
        total_stake_satoshi: eventFromList.total_stake_satoshi,
        hashtags: eventFromList.hashtags,
        created_at: eventFromList.created_at,
        preheat_start_at: eventFromList.preheat_start_at,
        started_at: eventFromList.started_at,
        deadline_at: eventFromList.deadline_at,
        ended_at: eventFromList.ended_at,
        options: eventFromList.options,
        top_replies: eventFromList.top_replies.map((reply) => ({
          ...reply,
          btc_address: `bc1q${Math.random().toString(36).substring(2, 15)}`,
        })),
      };

      return HttpResponse.json<ApiResponse<typeof mockEventDetail>>({
        code: "200",
        success: true,
        message: null,
        data: detail,
      });
    }

    // For dynamically created events (e.g., from payment flow), return as ongoing
    const now = new Date();
    const startedAt = new Date(now.getTime() - 1000).toISOString(); // 1 second ago
    const deadlineAt = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    ).toISOString(); // 24 hours from now

    return HttpResponse.json<ApiResponse<typeof mockEventDetail>>({
      code: "200",
      success: true,
      message: null,
      data: {
        ...mockEventDetail,
        event_id: eventId as string,
        status: 3, // ACTIVE/ongoing
        created_at: now.toISOString(),
        started_at: startedAt,
        deadline_at: deadlineAt,
      },
    });
  }),

  // GET /hot-hashtags - Get trending hashtags
  http.get(`${API_BASE_URL}/hot-hashtags`, () => {
    return HttpResponse.json<ApiResponse<typeof mockHotHashtags>>({
      code: "200",
      success: true,
      message: null,
      data: mockHotHashtags,
    });
  }),

  // POST /events - Create new event
  http.post(`${API_BASE_URL}/events`, async ({ request }) => {
    const body = await request.json();
    console.log("[Mock] Creating event:", body);

    // Generate a new event ID
    const newEventId = `evt_${Date.now()}_mock`;

    return HttpResponse.json<ApiResponse<any>>({
      code: "201",
      success: true,
      message: "Event created successfully",
      data: {
        event_id: newEventId,
        ...body,
        status: "pending",
        deposit_address: "bc1qmockdepositaddress123456789",
        created_at: new Date().toISOString(),
      },
    });
  }),

  // GET /events/:eventId/signature-plaintext - Get signature plaintext
  http.get(
    `${API_BASE_URL}/events/:eventId/signature-plaintext`,
    ({ params }) => {
      const { eventId } = params;

      return HttpResponse.json<ApiResponse<any>>({
        code: "200",
        success: true,
        message: null,
        data: {
          event_id: eventId,
          plaintext: `Koinvote Event Signature\nEvent ID: ${eventId}\nTimestamp: ${Date.now()}`,
          timestamp: Date.now(),
        },
      });
    },
  ),

  // POST /events/:eventId/verify-signature - Verify signature
  http.post(
    `${API_BASE_URL}/events/:eventId/verify-signature`,
    async ({ params, request }) => {
      const { eventId } = params;
      const body = await request.json();
      console.log("[Mock] Verifying signature for event:", eventId, body);

      return HttpResponse.json<ApiResponse<any>>({
        code: "200",
        success: true,
        message: "Signature verified successfully",
        data: {
          event_id: eventId,
          message: "backendMessage.eventActivated",
          status: "activated",
        },
      });
    },
  ),

  // GET /events/:eventId/deposit-status - Get deposit status
  http.get(`${API_BASE_URL}/events/:eventId/deposit-status`, ({ params }) => {
    const { eventId } = params;
    const now = Date.now();

    // Initialize start time and pending timeout on first call
    if (!DEPOSIT_START_TIME) {
      DEPOSIT_START_TIME = now;
      // Set initial 15 min timeout for PENDING status
      DEPOSIT_PENDING_TIMEOUT_AT = new Date(now + 15 * 60 * 1000).toISOString();
    }

    // Calculate elapsed time in minutes
    const elapsedMinutes = (now - DEPOSIT_START_TIME) / (60 * 1000);

    // Determine status based on elapsed time
    let status: DepositStatus;
    if (elapsedMinutes < PENDING_TIME) {
      status = DepositStatus.PENDING;
    } else if (elapsedMinutes < CONFIRM_TIME) {
      status = DepositStatus.UNCONFIRMED;
    } else {
      status = DepositStatus.RECEIVED;
    }

    // When transitioning to UNCONFIRMED, set first_seen_at and timeout (+45 min)
    if (status === DepositStatus.UNCONFIRMED && !DEPOSIT_FIRST_SEEN_AT) {
      DEPOSIT_FIRST_SEEN_AT = new Date(
        DEPOSIT_START_TIME + PENDING_TIME * 60 * 1000,
      ).toISOString();
      DEPOSIT_TIMEOUT_AT = new Date(
        DEPOSIT_START_TIME + PENDING_TIME * 60 * 1000 + 45 * 60 * 1000,
      ).toISOString();
    }

    // For PENDING status, use stored pending timeout
    // For UNCONFIRMED/RECEIVED, use the stored timeout
    const depositTimeoutAt =
      status === DepositStatus.PENDING
        ? DEPOSIT_PENDING_TIMEOUT_AT!
        : DEPOSIT_TIMEOUT_AT || new Date(now + 45 * 60 * 1000).toISOString();

    // confirmed_at is set when status becomes RECEIVED
    const confirmedAt =
      status === DepositStatus.RECEIVED
        ? new Date(DEPOSIT_START_TIME + CONFIRM_TIME * 60 * 1000).toISOString()
        : null;

    return HttpResponse.json<ApiResponse<typeof mockDepositStatus>>({
      code: "200",
      success: true,
      message: null,
      data: {
        ...mockDepositStatus,
        deposit_timeout_at: depositTimeoutAt,
        first_seen_at:
          status === DepositStatus.PENDING ? null : DEPOSIT_FIRST_SEEN_AT,
        confirmed_at: confirmedAt,
        status,
        event_id: eventId as string,
      },
    });
  }),

  // GET /events/:eventId/deposit-extend - Extend deposit timeout by 30 minutes
  http.get(`${API_BASE_URL}/events/:eventId/deposit-extend`, ({ params }) => {
    const { eventId } = params;

    // Check if there's an existing timeout
    if (!DEPOSIT_TIMEOUT_AT) {
      return HttpResponse.json<ApiResponse<null>>(
        {
          code: "400000",
          success: false,
          message: "No deposit timeout to extend",
          data: null,
        },
        { status: 400 },
      );
    }

    // Check remaining time
    const now = Date.now();
    const currentTimeout = new Date(DEPOSIT_TIMEOUT_AT).getTime();
    const remainingMs = currentTimeout - now;
    const remainingMinutes = remainingMs / (60 * 1000);

    if (remainingMinutes >= CONSTS.EXTEND_BUTTON_THRESHOLD_MINUTES) {
      return HttpResponse.json<ApiResponse<null>>(
        {
          code: "400000",
          success: false,
          message: `Remaining time must be less than ${CONSTS.EXTEND_BUTTON_THRESHOLD_MINUTES} minutes`,
          data: null,
        },
        { status: 400 },
      );
    }

    // Extend by 30 minutes from current timeout
    const newTimeout = new Date(
      currentTimeout + CONSTS.DEPOSIT_EXTEND_TIME * 60 * 1000,
    ).toISOString();
    DEPOSIT_TIMEOUT_AT = newTimeout;

    return HttpResponse.json<ApiResponse<typeof mockDepositStatus>>({
      code: "200",
      success: true,
      message: null,
      data: {
        ...mockDepositStatus,
        deposit_timeout_at: newTimeout,
        first_seen_at: DEPOSIT_FIRST_SEEN_AT,
        confirmed_at: null,
        status: DepositStatus.UNCONFIRMED,
        event_id: eventId as string,
      },
    });
  }),

  // GET /replies?event_id={event_id} - Get event replies
  http.get(`${API_BASE_URL}/replies`, ({ request }) => {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("event_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const sortBy = url.searchParams.get("sortBy") || "balance";

    // Return empty if no event_id
    if (!eventId) {
      return HttpResponse.json<ApiResponse<any>>(
        {
          code: "400000",
          success: false,
          message: "event_id is required",
          data: null,
        },
        { status: 400 },
      );
    }

    let replies = [...mockGetListRepliesResponse.replies];

    // Filter by search
    if (search) {
      replies = replies.filter(
        (r) =>
          r.content?.toLowerCase().includes(search.toLowerCase()) ||
          r.btc_address.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Sort by balance or time
    if (sortBy === "balance") {
      replies.sort(
        (a, b) => b.balance_at_snapshot_satoshi - a.balance_at_snapshot_satoshi,
      );
    } else if (sortBy === "time") {
      replies.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedReplies = replies.slice(start, start + limit);

    return HttpResponse.json<ApiResponse<typeof mockGetListRepliesResponse>>({
      code: "200",
      success: true,
      message: null,
      data: {
        replies: paginatedReplies,
        page,
        limit,
      },
    });
  }),

  // POST /replies/generate-plaintext - Get reply plaintext
  http.post(`${API_BASE_URL}/replies/generate-plaintext`, () => {
    return HttpResponse.json<ApiResponse<any>>({
      code: "000000",
      success: true,
      message: "Plaintext generated successfully",
      data: {
        plaintext:
          "koinvote.com | type:single | Option A | EVT_20241203_ABC123 | 1701612345 | 123456",
        nonce_timestamp: "1701612345",
        random_code: "123456",
      },
    });
  }),

  // POST /replies - Post reply plaintext
  http.post(`${API_BASE_URL}/replies`, () => {
    return HttpResponse.json<ApiResponse<any>>({
      code: "000000",
      success: true,
      message: "Reply submitted successfully",
      data: {
        id: 123,
        event_id: "EVT_20241203_ABC123",
        btc_address: "tb1q...",
        option_id: 1,
        option_hash:
          "7f83627d02e5aca9a76b5fc57955376c3462792edfdd19bf113fcd414af2cd38",
        content: null,
        content_hash: null,
        plaintext:
          "koinvote.com | type:single | Option A | EVT_20241203_ABC123 | 1701612345 | 123456",
        signature: "H1234567890abcdef...",
        nonce_timestamp: "1701612345",
        random_code: "123456",
        is_reply_valid: true,
        balance_at_reply_satoshi: 100000,
        balance_at_snapshot_satoshi: null,
        balance_at_current_satoshi: null,
        balance_last_updated_at: null,
        is_hidden: false,
        created_at: "2024-12-03T10:15:30Z",
        created_by_ip: "192.168.1.1",
        updated_at: "2024-12-03T10:15:30Z",
      },
    });
  }),

  // GET /replies/:id/receipt - download reply receipt
  http.get(`${API_BASE_URL}/replies/:id/receipt`, () => {
    return HttpResponse.json<ReplyReceiptData>({
      version: "1.0",
      receipt_id: "rpt_01KFGXZ3PMACAKBFE67W1EVZFJ",
      event_id: "01KFFEBMQFJTV3SSKE0PZZM9C6",
      addr: "bc1pwkt0d3nq8f28008acaq5temmwdd7k0mf5hpv94ez7f2tqh866vzs823f7x",
      plaintext:
        "koinvote.com | type:single | hamburger | 01KFFEBMQFJTV3SSKE0PZZM9C6 | 1769021042 | b018923297",
      user_sig:
        "II56oF7Tj+kn0NYebyC0rc8xaH5Tq1JiMwgPKnE3jQz3f7c44/TzwxnemDWo8fePcDOR1LpUmLQe2jpF1OEMoKk=",
      timestamp: "2026-01-21T18:44:43Z",
      kid: "yzWe2Pq/uzm1epINIy7sd5cS2qaXWTecfKLep5Ki+ZI=",
      server_sig: {
        alg: "ed25519",
        sig: "NJ8wSIxqEo1HTzfsPg8T8ifrpWQlusgKXpZjNn5Pv24YCWgg+sBL7B5HPsyuQXD+mfziTCMkaUXKxd4uxVesAQ==",
        payload:
          "version=1.0|receipt_id=...|event_id=...|addr=...|plaintext=...|user_sig=...|timestamp=...|kid=...",
      },
    });
  }),

  // Admin API - POST /admin/login
  http.post(`${API_BASE_URL}/admin/login`, async ({ request }) => {
    const body = await request.json();
    console.log("[Mock] Admin login attempt:", body);

    return HttpResponse.json<ApiResponse<{ token: string }>>({
      code: "200",
      success: true,
      message: "Login successful",
      data: {
        token: "mock_admin_token_" + Date.now(),
      },
    });
  }),

  // Admin API - GET /admin/system-parameters
  http.get(`${API_BASE_URL}/admin/system-parameters`, () => {
    return HttpResponse.json<ApiResponse<typeof mockAdminSystemParameters>>({
      code: "200",
      success: true,
      message: null,
      data: mockAdminSystemParameters,
    });
  }),

  // Admin API - PUT /admin/system-parameters
  http.put(`${API_BASE_URL}/admin/system-parameters`, async ({ request }) => {
    const body = await request.json();
    console.log("[Mock] Updating system parameters:", body);

    return HttpResponse.json<ApiResponse<void>>({
      code: "200",
      success: true,
      message: "System parameters updated successfully",
      data: undefined as any,
    });
  }),

  // GET /events/:eventId/completed/top-replies - Get top replies for completed events
  http.get(
    `${API_BASE_URL}/events/:eventId/completed/top-replies`,
    ({ params, request }) => {
      const { eventId } = params;
      const url = new URL(request.url);
      const balanceType = url.searchParams.get("balance_type") || "snapshot";

      // Find event from list to get options
      const eventFromList = mockEventList.find((e) => e.event_id === eventId);

      // Generate different weight percentages based on balance type
      const isSnapshot = balanceType === "snapshot";

      // Generate different weight percentages for top_replies based on balance type
      const topReplies = eventFromList?.top_replies?.map((reply, index) => ({
        ...reply,
        weight_percent: isSnapshot
          ? reply.weight_percent
          : Math.max(0, reply.weight_percent + (index % 2 === 0 ? 15 : -15)),
        amount_satoshi: isSnapshot
          ? reply.amount_satoshi
          : reply.amount_satoshi + (index % 2 === 0 ? 30000 : -30000),
      }));

      return HttpResponse.json<ApiResponse<any>>({
        code: "000000",
        success: true,
        message: null,
        data: {
          event_id: eventId,
          balance_type: balanceType,
          top_replies: topReplies || [],
        },
      });
    },
  ),

  // GET /events/:eventId/payout-report - Get payout report
  http.get(`${API_BASE_URL}/events/:eventId/payout-report`, ({ params }) => {
    const { eventId } = params;

    // Return empty data for events without payout report
    if (eventId === "no-report") {
      return HttpResponse.json({
        code: "000000",
        success: true,
        message: null,
        data: {},
      });
    }

    // Return payout report for the event
    return HttpResponse.json<ApiResponse<typeof mockPayoutReport>>({
      code: "000000",
      success: true,
      message: null,
      data: {
        ...mockPayoutReport,
        event_id: eventId as string,
      },
    });
  }),

  // GET /events/:eventId/verification-csv - Get verification CSV
  http.get(
    `${API_BASE_URL}/events/:eventId/verification-csv`,
    ({ params, request }) => {
      const { eventId } = params;
      const url = new URL(request.url);
      const planId = url.searchParams.get("plan_id");

      console.log(
        `[Mock] Generating verification CSV for event ${eventId}, plan ${planId}`,
      );

      // Create a Blob from CSV content
      const csvBlob = new Blob([mockVerificationCsvContent], {
        type: "text/csv",
      });

      // Return CSV as binary stream with proper headers
      return new HttpResponse(csvBlob, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payout_verification_${eventId}.csv"`,
        },
      });
    },
  ),

  // POST /subscribe - Subscribe to email notifications
  http.post(`${API_BASE_URL}/subscribe`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    console.log("[Mock] Subscribe request:", body);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email)) {
      return HttpResponse.json<ApiResponse<void>>({
        code: "400000",
        success: false,
        message: "Invalid email format",
        data: undefined as unknown as void,
      });
    }

    return HttpResponse.json<ApiResponse<void>>({
      code: "000000",
      success: true,
      message: null,
      data: undefined as unknown as void,
    });
  }),

  // POST /contact-us - Contact us form submission
  http.post(`${API_BASE_URL}/contact-us`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      subject: string;
      message?: string;
    };
    console.log("[Mock] Contact us request:", body);

    return HttpResponse.json<ApiResponse<void>>({
      code: "000000",
      success: true,
      message: null,
      data: undefined as unknown as void,
    });
  }),

  http.get(`${API_BASE_URL}/receipt/pub-keys`, () => {
    return HttpResponse.json<
      ApiResponse<typeof mockGetReceiptVerifyPubKeysRes>
    >({
      code: "000000",
      success: true,
      message: null,
      data: [...mockGetReceiptVerifyPubKeysRes],
    });
  }),
];
