// MSW handlers for API mocking
import type { ApiResponse } from "@/api";
import { http, HttpResponse } from "msw";
import {
  mockAdminSystemParameters,
  mockDepositStatus,
  mockEventDetail,
  mockEventList,
  mockGetEventListResponse,
  mockGetListRepliesResponse,
  mockHotHashtags,
  mockPayoutReport,
  mockSystemConfig,
  mockVerificationCsvContent,
} from "./data";

const API_BASE_URL = "/api/v1";

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
          e.description.toLowerCase().includes(search.toLowerCase())
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
      // Create detail from list item
      const detail = {
        ...mockEventDetail,
        id: eventFromList.id,
        event_id: eventFromList.event_id,
        title: eventFromList.title,
        description: eventFromList.description,
        event_type: eventFromList.event_type,
        total_reward_satoshi: eventFromList.total_reward_satoshi,
        participants_count: eventFromList.participants_count,
        total_stake_satoshi: eventFromList.total_stake_satoshi,
        hashtags: eventFromList.hashtags,
        created_at: eventFromList.created_at,
        started_at: eventFromList.started_at,
        deadline_at: eventFromList.deadline_at,
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

    // Return default mock event detail
    return HttpResponse.json<ApiResponse<typeof mockEventDetail>>({
      code: "200",
      success: true,
      message: null,
      data: mockEventDetail,
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
    }
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
          message: "Event activated",
          status: "activated",
        },
      });
    }
  ),

  // GET /events/:eventId/deposit-status - Get deposit status
  http.get(`${API_BASE_URL}/events/:eventId/deposit-status`, ({ params }) => {
    const { eventId } = params;

    return HttpResponse.json<ApiResponse<typeof mockDepositStatus>>({
      code: "200",
      success: true,
      message: null,
      data: {
        ...mockDepositStatus,
        event_id: eventId as string,
      },
    });
  }),

  // GET /events/:eventId/replies - Get event replies
  http.get(`${API_BASE_URL}/events/:eventId/replies`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const sortBy = url.searchParams.get("sortBy") || "balance";

    let replies = [...mockGetListRepliesResponse.replies];

    // Filter by search
    if (search) {
      replies = replies.filter(
        (r) =>
          r.content?.toLowerCase().includes(search.toLowerCase()) ||
          r.btc_address.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by balance or time
    if (sortBy === "balance") {
      replies.sort(
        (a, b) => b.balance_at_snapshot_satoshi - a.balance_at_snapshot_satoshi
      );
    } else if (sortBy === "time") {
      replies.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  // GET /events/:eventId/reply-plaintext - Get reply plaintext
  http.get(`${API_BASE_URL}/events/:eventId/reply-plaintext`, ({ params }) => {
    const { eventId } = params;

    return HttpResponse.json<ApiResponse<any>>({
      code: "200",
      success: true,
      message: null,
      data: {
        event_id: eventId,
        btc_address: "bc1qmockaddress123",
        plaintext: `Koinvote Event Reply\nEvent ID: ${eventId}\nTimestamp: ${Date.now()}`,
        nonce_timestamp: Date.now(),
        random_code: Math.random().toString(36).substring(7),
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
        `[Mock] Generating verification CSV for event ${eventId}, plan ${planId}`
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
    }
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
];
