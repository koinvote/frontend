// MSW handlers for API mocking
import type { ApiResponse, ReplyReceiptData } from "@/api";
import type {
  CreateWithdrawalRes,
  EventDataRes,
  GenerateChangeVisibilityPlaintextRes,
  GenerateUnlockPricePlaintextRes,
  GetCompletedTopRepliesRes,
  GetReplyPlainTextRes,
  GetSignaturePlainTextRes,
  UnlockDepositStatusRes,
  UnlockEventRes,
  VerifySignatureRes,
} from "@/api/response";
import { DepositStatus } from "@/api/types";
import CONSTS from "@/consts";
import { http, HttpResponse } from "msw";
import {
  mockAdminSystemParameters,
  mockDepositStatus,
  mockEventDetail,
  mockEventList,
  mockExchangeEventReplies,
  mockExchangeTopReplies,
  mockScrollEventReplies,
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
const PENDING_TIME = 0.1; // 0.5 分鐘 = 30 秒
const CONFIRM_TIME = 1; // 1 分鐘
// ========================================================

// Track deposit status timing (reset per eventId to simulate fresh sessions)
let DEPOSIT_EVENT_ID: string | null = null;
let DEPOSIT_START_TIME: number | null = null;
let DEPOSIT_PENDING_TIMEOUT_AT: string | null = null; // 初始 PENDING 的到期時間（15 分鐘）
let DEPOSIT_FIRST_SEEN_AT: string | null = null;
let DEPOSIT_TIMEOUT_AT: string | null = null; // 偵測到 UNCONFIRMED 後的到期時間（+45 分鐘）

// Track unlock deposit status timing (separate from event deposit)
let UNLOCK_START_TIME: number | null = null;
let UNLOCK_PENDING_TIMEOUT_AT: string | null = null;
let UNLOCK_FIRST_SEEN_AT: string | null = null;
let UNLOCK_TIMEOUT_AT: string | null = null;
let UNLOCK_EMAIL: string | null = null;

// Emails confirmed as paid — seeded with the test email, grows at runtime
const PAID_UNLOCK_EMAILS = new Set(["paid@test.com", "creator@test.com"]);

// Creator email for the mock event
const CREATOR_EMAIL = "creator@test.com";

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
    const eventRewardType = url.searchParams.getAll("event_reward_type");
    const eventType = url.searchParams.getAll("event_type");
    const resultVisibility = url.searchParams.getAll("result_visibility");

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

    // Filter by reward type
    if (eventRewardType.length > 0) {
      filteredEvents = filteredEvents.filter((e) =>
        eventRewardType.includes(e.event_reward_type),
      );
    }

    // Filter by event type
    if (eventType.length > 0) {
      filteredEvents = filteredEvents.filter((e) =>
        eventType.includes(e.event_type),
      );
    }

    // Filter by result visibility
    if (resultVisibility.length > 0) {
      filteredEvents = filteredEvents.filter(
        (e) =>
          e.result_visibility !== undefined &&
          resultVisibility.includes(e.result_visibility),
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedEvents = filteredEvents.slice(start, start + limit);

    const maskedEvents = paginatedEvents.map((e) => {
      const isRestricted =
        e.result_visibility === "paid_only" ||
        e.result_visibility === "creator_only";
      if (!isRestricted) return e;
      return {
        ...e,
        options: (e.options ?? []).map((opt) =>
          typeof opt === "object" && opt !== null
            ? { ...opt, weight_percent: 0, total_stake_satoshi: 0 }
            : opt,
        ),
        top_replies: (e.top_replies ?? []).map((r) => ({
          ...r,
          weight_percent: 0,
          amount_satoshi: 0,
        })),
      };
    });

    return HttpResponse.json<ApiResponse<typeof mockGetEventListResponse>>({
      code: "200",
      success: true,
      message: null,
      data: {
        events: maskedEvents,
        page,
        limit,
      },
    });
  }),

  // GET /events/:eventId - Get event detail
  http.get(`${API_BASE_URL}/events/:eventId`, ({ params, request }) => {
    const { eventId } = params;
    const url = new URL(request.url);
    const unlockEmail = url.searchParams.get("unlock_email") || "";

    // Find matching event from list or return default detail
    const eventFromList = mockEventList.find((e) => e.event_id === eventId);

    if (eventFromList) {
      const isRestricted =
        eventFromList.result_visibility === "paid_only" ||
        eventFromList.result_visibility === "creator_only";
      const isUnlocked = !isRestricted || PAID_UNLOCK_EMAILS.has(unlockEmail);

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
        result_visibility: eventFromList.result_visibility,
        unlock_price_satoshi: eventFromList.unlock_price_satoshi,
        unlock_count: eventFromList.unlock_count,
        last_unlock_confirmed_at: eventFromList.last_unlock_confirmed_at,
        options: isUnlocked
          ? eventFromList.options
          : (eventFromList.options ?? []).map((opt) =>
              typeof opt === "object" && opt !== null
                ? { ...opt, weight_percent: 0, total_stake_satoshi: 0 }
                : opt,
            ),
        top_replies: isUnlocked
          ? eventFromList.top_replies.map((reply) => ({
              ...reply,
              btc_address: `bc1q${Math.random().toString(36).substring(2, 15)}`,
            }))
          : eventFromList.top_replies.map((reply) => ({
              ...reply,
              btc_address: `bc1q${Math.random().toString(36).substring(2, 15)}`,
              weight_percent: 0,
              amount_satoshi: 0,
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

    return HttpResponse.json<ApiResponse<EventDataRes>>({
      code: "201",
      success: true,
      message: "Event created successfully",
      data: {
        event_id: newEventId,
        ...(body as Partial<EventDataRes>),
        status: "pending",
        deposit_address: "bc1qmockdepositaddress123456789",
        created_at: new Date().toISOString(),
      } as EventDataRes,
    });
  }),

  // GET /events/:eventId/signature-plaintext - Get signature plaintext
  http.get(
    `${API_BASE_URL}/events/:eventId/signature-plaintext`,
    ({ params }) => {
      const { eventId } = params;

      return HttpResponse.json<ApiResponse<GetSignaturePlainTextRes>>({
        code: "200",
        success: true,
        message: null,
        data: {
          event_id: eventId as string,
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

      return HttpResponse.json<ApiResponse<VerifySignatureRes>>({
        code: "200",
        success: true,
        message: "Signature verified successfully",
        data: {
          event_id: eventId as string,
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

    // Reset timing state when a new eventId is detected (new payment session)
    if (eventId !== DEPOSIT_EVENT_ID) {
      DEPOSIT_EVENT_ID = eventId as string;
      DEPOSIT_START_TIME = null;
      DEPOSIT_PENDING_TIMEOUT_AT = null;
      DEPOSIT_FIRST_SEEN_AT = null;
      DEPOSIT_TIMEOUT_AT = null;
    }

    // Initialize on first call: set start time and 15-min PENDING timeout
    if (!DEPOSIT_START_TIME) {
      DEPOSIT_START_TIME = now;
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

    // When transitioning to UNCONFIRMED, record first_seen_at and set 45-min timeout
    if (status === DepositStatus.UNCONFIRMED && !DEPOSIT_FIRST_SEEN_AT) {
      DEPOSIT_FIRST_SEEN_AT = new Date(
        DEPOSIT_START_TIME + PENDING_TIME * 60 * 1000,
      ).toISOString();
      DEPOSIT_TIMEOUT_AT = new Date(now + 45 * 60 * 1000).toISOString();
    }

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
    const balanceType = url.searchParams.get("balance_type") || "snapshot";
    const unlockEmail = url.searchParams.get("unlock_email") || "";

    // Return empty if no event_id
    if (!eventId) {
      return HttpResponse.json<ApiResponse<null>>(
        {
          code: "400000",
          success: false,
          message: "event_id is required",
          data: null,
        },
        { status: 400 },
      );
    }

    // Check if this event requires unlock (paid_only result visibility)
    const eventFromList = mockEventList.find((e) => e.event_id === eventId);
    const eventResultVisibility =
      eventFromList?.result_visibility ??
      (eventId === mockEventDetail.event_id
        ? mockEventDetail.result_visibility
        : null);
    if (
      (eventResultVisibility === "paid_only" ||
        eventResultVisibility === "creator_only") &&
      (!unlockEmail || !PAID_UNLOCK_EMAILS.has(unlockEmail))
    ) {
      return HttpResponse.json<ApiResponse<null>>(
        {
          code: "403101",
          success: false,
          message: "locked",
          data: null,
        },
        { status: 403 },
      );
    }

    let replies =
      eventId === "01KK0NP9AV6CQWG3TM4DJ5RFEZ"
        ? [...mockExchangeEventReplies]
        : eventId === "evt_scroll_mock"
          ? [...mockScrollEventReplies]
          : [...mockGetListRepliesResponse.replies];

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
      if (balanceType === "current") {
        replies.sort(
          (a, b) => b.balance_at_current_satoshi - a.balance_at_current_satoshi,
        );
      } else {
        replies.sort(
          (a, b) =>
            b.balance_at_snapshot_satoshi - a.balance_at_snapshot_satoshi,
        );
      }
    } else if (sortBy === "time") {
      replies.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedReplies = replies.slice(start, start + limit);

    const isCreator = unlockEmail === CREATOR_EMAIL ? 1 : 0;

    return HttpResponse.json<ApiResponse<typeof mockGetListRepliesResponse>>({
      code: "200",
      success: true,
      message: null,
      data: {
        replies: paginatedReplies,
        is_creator: isCreator,
        page,
        limit,
      },
    });
  }),

  // POST /replies/generate-plaintext - Get reply plaintext
  http.post(`${API_BASE_URL}/replies/generate-plaintext`, () => {
    return HttpResponse.json<ApiResponse<GetReplyPlainTextRes>>({
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
    return HttpResponse.json<ApiResponse<{ id: number }>>({
      code: "000000",
      success: true,
      message: "Reply submitted successfully",
      data: { id: 123 },
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

    return HttpResponse.json<ApiResponse<null>>({
      code: "200",
      success: true,
      message: "System parameters updated successfully",
      data: null,
    });
  }),

  // GET /events/:eventId/completed/top-replies - Get top replies for completed events
  http.get(
    `${API_BASE_URL}/events/:eventId/completed/top-replies`,
    ({ params, request }) => {
      const { eventId } = params;
      const url = new URL(request.url);
      const balanceType = url.searchParams.get("balance_type") || "snapshot";
      const unlockEmail = url.searchParams.get("unlock_email") || "";

      // Use real top-replies data for the exchange event
      if (eventId === "01KK0NP9AV6CQWG3TM4DJ5RFEZ") {
        return HttpResponse.json<ApiResponse<GetCompletedTopRepliesRes>>({
          code: "000000",
          success: true,
          message: null,
          data: {
            event_id: eventId as string,
            balance_type: balanceType as "snapshot" | "current",
            top_replies: mockExchangeTopReplies,
          },
        });
      }

      // For other events: generate different weight percentages based on balance type
      const eventFromList = mockEventList.find((e) => e.event_id === eventId);
      const isRestricted =
        eventFromList?.result_visibility === "paid_only" ||
        eventFromList?.result_visibility === "creator_only";
      const isUnlocked = !isRestricted || PAID_UNLOCK_EMAILS.has(unlockEmail);
      const isSnapshot = balanceType === "snapshot";

      const topReplies = eventFromList?.top_replies?.map((reply, index) => {
        if (!isUnlocked) {
          return { ...reply, weight_percent: 0, amount_satoshi: 0 };
        }
        return {
          ...reply,
          weight_percent: isSnapshot
            ? reply.weight_percent
            : Math.max(0, reply.weight_percent + (index % 2 === 0 ? 15 : -15)),
          amount_satoshi: isSnapshot
            ? reply.amount_satoshi
            : reply.amount_satoshi + (index % 2 === 0 ? 30000 : -30000),
        };
      });

      return HttpResponse.json<ApiResponse<GetCompletedTopRepliesRes>>({
        code: "000000",
        success: true,
        message: null,
        data: {
          event_id: eventId as string,
          balance_type: balanceType as "snapshot" | "current",
          top_replies: topReplies ?? [],
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

  // Admin API - POST /admin/withdrawals
  http.post(`${API_BASE_URL}/admin/withdrawals`, async ({ request }) => {
    const body = (await request.json()) as {
      admin_address: string;
      hash_key: string;
      signature: string;
    };

    // Simulate signature validation failure if signature is "invalid"
    if (body.signature === "invalid") {
      return HttpResponse.json<ApiResponse<null>>(
        {
          code: "400000",
          success: false,
          message: "Invalid signature",
          data: null,
        },
        { status: 400 },
      );
    }

    return HttpResponse.json<ApiResponse<CreateWithdrawalRes>>({
      code: "000000",
      success: true,
      message: null,
      data: {
        id: 12,
        to_address: "bc1qexamplewithdrawaddress123456789",
        amount_satoshi: 50000,
        fee_satoshi: 250,
        txid: "abc123def456789012345678901234567890abcdef1234567890abcdef123456",
        status: "completed",
      },
    });
  }),

  // Admin API - GET /admin/withdrawals/info
  http.get(`${API_BASE_URL}/admin/withdrawals/info`, () => {
    return HttpResponse.json<
      ApiResponse<{
        platform_amount_satoshi: number;
        withdrawable_amount_satoshi: number;
        withdraw_address: string;
        fee_satoshi: number;
        hash_key: string;
      }>
    >({
      code: "000000",
      success: true,
      message: null,
      data: {
        platform_amount_satoshi: 250000,
        withdrawable_amount_satoshi: 50000,
        withdraw_address: "bc1qexamplewithdrawaddress123456789",
        fee_satoshi: 250,
        hash_key:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
    });
  }),

  // Admin API - GET /admin/withdrawals (withdrawal records)
  http.get(`${API_BASE_URL}/admin/withdrawals`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    const statuses = ["completed", "processing", "failed"] as const;
    const addresses = [
      "bc1q9u0h6s9m8l6e8y7r8j2h0k9k0q0q6s5xk8m8y4d0u3q2p0a6v",
      "bc1qabc123def456ghi789jkl012mno345pqr678stu",
      "bc1qxyz789abc012def345ghi678jkl901mno234pqr",
    ];
    const toAddresses = [
      "1AUSGLKM2cyse7hJjmz5zGvZvh5aTwJQNk",
      "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    ];

    const allRecords = Array.from({ length: 38 }, (_, i) => {
      const id = i + 1;
      // Spread records across multiple dates (Dec 1–15, 2025)
      const day = 15 - Math.floor(i / 3);
      const hour = 9 + (i % 8);
      return {
        id,
        from_address: addresses[i % addresses.length],
        to_address: toAddresses[i % toAddresses.length],
        txid: `0x${id.toString(16).padStart(4, "0")}a1e9403f1792d959f6e73d877c1a0e55a49e0a5c7ff02c02e364a0c5c0${id.toString(16).padStart(2, "0")}`,
        amount: 1000000 + id * 234567,
        fee: 800 + id * 73,
        ticket_id: `194${7000 + id}`,
        status: statuses[i % statuses.length],
        timestamp: `2025-12-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
      };
    });

    const limit = 15;
    const start = (page - 1) * limit;
    const paged = allRecords.slice(start, start + limit);

    return HttpResponse.json({
      code: "000000",
      success: true,
      message: null,
      data: {
        withdrawals: paged,
      },
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

  // POST /events/:eventId/unlock — initiate unlock payment, returns unlock_id
  http.post(
    `${API_BASE_URL}/events/:eventId/unlock`,
    async ({ params, request }) => {
      const { eventId } = params;
      const body = (await request.json()) as { email: string };
      console.log("[Mock] Unlock event:", eventId, body);

      // Reset unlock deposit timing on each new unlock
      UNLOCK_START_TIME = null;
      UNLOCK_PENDING_TIMEOUT_AT = null;
      UNLOCK_FIRST_SEEN_AT = null;
      UNLOCK_TIMEOUT_AT = null;
      UNLOCK_EMAIL = body.email ?? null;

      const newUnlockId = `unlock_${String(eventId)}_${Date.now()}`;
      const now = Date.now();
      return HttpResponse.json<ApiResponse<UnlockEventRes>>({
        code: "000000",
        success: true,
        message: null,
        data: {
          unlock_id: newUnlockId,
          event_id: String(eventId),
          unlock_email: body.email,
          deposit_address:
            "bc1qepehnttrsje​ed45kgz3hv79qqeg83m4s6dxjczzl45dls80hpxeq7rsewn",
          expected_amount_satoshi: 950000,
          received_amount_satoshi: 0,
          status: "pending",
          deposit_timeout_at: new Date(now + 15 * 60 * 1000).toISOString(),
          is_creator: 0,
        },
      });
    },
  ),

  // GET /events/unlock/:unlockId/deposit-status
  http.get(
    `${API_BASE_URL}/events/unlock/:unlockId/deposit-status`,
    ({ params }) => {
      const { unlockId } = params;
      const now = Date.now();

      // Initialize timing on first call (same pattern as event deposit-status)
      if (!UNLOCK_START_TIME) {
        UNLOCK_START_TIME = now;
        UNLOCK_PENDING_TIMEOUT_AT = new Date(
          now + 15 * 60 * 1000,
        ).toISOString();
      }

      const elapsedMinutes = (now - UNLOCK_START_TIME) / (60 * 1000);

      let status: DepositStatus | "unlocked";
      if (elapsedMinutes < PENDING_TIME) {
        status = DepositStatus.PENDING;
      } else if (elapsedMinutes < CONFIRM_TIME) {
        status = DepositStatus.UNCONFIRMED;
      } else {
        status = "unlocked";
      }

      if (status === DepositStatus.UNCONFIRMED && !UNLOCK_FIRST_SEEN_AT) {
        UNLOCK_FIRST_SEEN_AT = new Date(
          UNLOCK_START_TIME + PENDING_TIME * 60 * 1000,
        ).toISOString();
        UNLOCK_TIMEOUT_AT = new Date(
          UNLOCK_START_TIME + PENDING_TIME * 60 * 1000 + 45 * 60 * 1000,
        ).toISOString();
      }

      const depositTimeoutAt =
        status === DepositStatus.PENDING
          ? UNLOCK_PENDING_TIMEOUT_AT!
          : UNLOCK_TIMEOUT_AT || new Date(now + 45 * 60 * 1000).toISOString();

      const confirmedAt =
        status === DepositStatus.RECEIVED
          ? new Date(UNLOCK_START_TIME + CONFIRM_TIME * 60 * 1000).toISOString()
          : null;

      // Register email as paid once payment is confirmed
      if (status === "unlocked" && UNLOCK_EMAIL) {
        PAID_UNLOCK_EMAILS.add(UNLOCK_EMAIL);
      }

      return HttpResponse.json<ApiResponse<UnlockDepositStatusRes>>({
        code: "000000",
        success: true,
        message: null,
        data: {
          unlock_id: unlockId as string,
          event_id: String(unlockId).split("_")[1] ?? "unknown",
          unlock_email: UNLOCK_EMAIL ?? "",
          deposit_address:
            "bc1qepehnttrsje​ed45kgz3hv79qqeg83m4s6dxjczzl45dls80hpxeq7rsewn",
          expected_amount_satoshi: 950000,
          received_amount_satoshi: 0,
          status: status as UnlockDepositStatusRes["status"],
          received_txid: null,
          deposit_timeout_at: depositTimeoutAt,
          first_seen_at:
            status === DepositStatus.PENDING ? null : UNLOCK_FIRST_SEEN_AT,
          confirmed_at: confirmedAt,
        },
      });
    },
  ),

  // POST /events/:eventId/result-visibility/generate-plaintext
  http.post(
    `${API_BASE_URL}/events/:eventId/result-visibility/generate-plaintext`,
    async ({ params, request }) => {
      const { eventId } = params as { eventId: string };
      const body = (await request.json()) as {
        email: string;
        result_visibility: string;
        unlock_price_satoshi?: number;
      };
      const timestamp = Math.floor(Date.now() / 1000);
      const randomCode = Math.random().toString(36).slice(2, 12);
      let plaintext = "";
      if (body.result_visibility === "paid_only") {
        const priceBtc = body.unlock_price_satoshi
          ? body.unlock_price_satoshi / 1e8
          : 0;
        plaintext = `koinvote.com | ${eventId} | paid_only | ${priceBtc} | ${timestamp} | ${randomCode}`;
      } else {
        plaintext = `koinvote.com | ${eventId} | public | ${timestamp} | ${randomCode}`;
      }
      return HttpResponse.json<ApiResponse<GenerateChangeVisibilityPlaintextRes>>({
        code: "000000",
        success: true,
        message: null,
        data: { plaintext },
      });
    },
  ),

  // POST /events/:eventId/result-visibility/verify-plaintext
  http.post(
    `${API_BASE_URL}/events/:eventId/result-visibility/verify-plaintext`,
    async ({ params, request }) => {
      const { eventId } = params as { eventId: string };
      const body = (await request.json()) as {
        email: string;
        plaintext: string;
        signature: string;
      };
      console.log("[Mock] Verify change visibility plaintext:", eventId, body);
      return HttpResponse.json<
        ApiResponse<{ event_id: string; valid: boolean }>
      >({
        code: "000000",
        success: true,
        message: null,
        data: { event_id: eventId, valid: true },
      });
    },
  ),

  // POST /events/:eventId/result-visibility
  http.post(
    `${API_BASE_URL}/events/:eventId/result-visibility`,
    async ({ params, request }) => {
      const { eventId } = params;
      const body = (await request.json()) as {
        result_visibility: string;
        unlock_price_satoshi?: number;
      };
      console.log("[Mock] Change result visibility:", eventId, body);
      return HttpResponse.json<ApiResponse<null>>({
        code: "000000",
        success: true,
        message: null,
        data: null,
      });
    },
  ),

  // POST /events/:eventId/unlock-price/generate-plaintext
  http.post(
    `${API_BASE_URL}/events/:eventId/unlock-price/generate-plaintext`,
    async ({ params, request }) => {
      const { eventId } = params as { eventId: string };
      const body = (await request.json()) as {
        email: string;
        unlock_price_satoshi: number;
      };
      const timestamp = Math.floor(Date.now() / 1000);
      const randomCode = Math.random().toString(36).slice(2, 12);
      const priceBtc = body.unlock_price_satoshi / 1e8;
      const plaintext = `koinvote.com | event_id:${eventId} | action:update_unlock_price | unlock_price_satoshi:${body.unlock_price_satoshi} | price_btc:${priceBtc} | ts:${timestamp} | nonce:${randomCode}`;
      return HttpResponse.json<ApiResponse<GenerateUnlockPricePlaintextRes>>({
        code: "000000",
        success: true,
        message: null,
        data: { plaintext },
      });
    },
  ),

  // POST /events/:eventId/unlock-price
  http.post(
    `${API_BASE_URL}/events/:eventId/unlock-price`,
    async ({ params, request }) => {
      const { eventId } = params;
      const body = (await request.json()) as {
        email: string;
        unlock_price_satoshi: number;
      };
      console.log("[Mock] Update unlock price:", eventId, body);
      return HttpResponse.json<ApiResponse<null>>({
        code: "000000",
        success: true,
        message: null,
        data: null,
      });
    },
  ),

  // GET /events/unlock/:unlockId/deposit-extend
  http.get(
    `${API_BASE_URL}/events/unlock/:unlockId/deposit-extend`,
    ({ params }) => {
      const { unlockId } = params;

      if (!UNLOCK_TIMEOUT_AT) {
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

      const now = Date.now();
      const currentTimeout = new Date(UNLOCK_TIMEOUT_AT).getTime();
      const remainingMinutes = (currentTimeout - now) / (60 * 1000);

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

      const newTimeout = new Date(
        currentTimeout + CONSTS.DEPOSIT_EXTEND_TIME * 60 * 1000,
      ).toISOString();
      UNLOCK_TIMEOUT_AT = newTimeout;

      return HttpResponse.json<ApiResponse<UnlockDepositStatusRes>>({
        code: "000000",
        success: true,
        message: null,
        data: {
          unlock_id: unlockId as string,
          event_id: String(unlockId).split("_")[1] ?? "unknown",
          unlock_email: UNLOCK_EMAIL ?? "",
          deposit_address:
            "bc1qepehnttrsje​ed45kgz3hv79qqeg83m4s6dxjczzl45dls80hpxeq7rsewn",
          expected_amount_satoshi: 950000,
          received_amount_satoshi: 0,
          status: DepositStatus.UNCONFIRMED,
          received_txid: null,
          deposit_timeout_at: newTimeout,
          first_seen_at: UNLOCK_FIRST_SEEN_AT,
          confirmed_at: null,
        },
      });
    },
  ),
];
