# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KoinVote is a React + TypeScript voting/event platform built with Vite. The application supports creating and managing events with cryptocurrency-based voting, featuring both public-facing pages and an admin dashboard.

## Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for development environment
npm run build:dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router 7
- **State Management**: Zustand (stores in `src/stores/`)
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS 4 + Ant Design
- **i18n**: react-i18next (English/Chinese translations in `src/locals/`)

### Project Structure

```
src/
├── api/              # API layer with axios clients
│   ├── http.ts       # Base http client and adminHttp client
│   ├── index.ts      # API endpoints (API and AdminAPI objects)
│   ├── request.ts    # Request type definitions
│   └── response.ts   # Response type definitions
├── admin/            # Admin dashboard
│   ├── pages/        # Admin pages (fees, refunds, system settings, etc.)
│   └── component/    # Admin-specific reusable components
├── components/       # Shared UI components
│   └── base/         # Base components like Toast
├── hooks/            # Custom React hooks
├── layout/           # Layout components (Layout, AdminLayout)
├── locals/           # i18n translation files (en.json, zh.json)
├── pages/            # Public-facing pages
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── router.tsx        # Route definitions
└── App.tsx           # Root component with providers
```

### Key Architectural Patterns

#### API Layer
- Two separate axios instances: `http` for public APIs and `adminHttp` for authenticated admin APIs
- `adminHttp` automatically injects Bearer token from localStorage (`koinvote:admin_token`)
- Response interceptor unwraps `response.data` automatically
- API endpoints defined as functions in `src/api/index.ts` using helper factories (`get`, `post`, `adminGet`, `adminPost`, etc.)
- All API responses follow `ApiResponse<T>` structure with `{ code, success, message, data }`

#### State Management
- **Zustand stores** for global state (`src/stores/`):
  - `systemParametersStore`: System configuration with auto-refresh every 60s (started in App.tsx)
  - `languagesStore`: i18n language state
  - `homeStore`: Home page event data
- **TanStack Query** for server state and caching (not all API calls use this pattern)

#### Routing
- Defined in `src/router.tsx` using React Router's `createBrowserRouter`
- Two main route sections:
  1. **Public routes** under `Layout` component (home, about, event pages, create-event flow)
  2. **Admin routes** under `AdminLayout` (requires authentication)
- Coming soon mode: When `VITE_COMING_SOON=true`, all public routes show ComingSoon page

#### Authentication
- Admin authentication uses JWT stored in localStorage as `koinvote:admin_token`
- Token management via `getAdminToken()`, `setAdminToken()`, `removeAdminToken()` in `src/api/http.ts`
- Admin routes should check for token presence/validity

#### Internationalization
- i18next configured in `src/i18n.ts`
- Translation files: `src/locals/en.json` and `src/locals/zh.json`
- Default language: English
- Access translations via `useTranslation()` hook from react-i18next
- **IMPORTANT**: Always provide a default fallback string when using `t()` function:
  ```typescript
  // ✅ Correct - always include fallback
  t("createEvent.alertTitleRequired", "Please enter a title.")

  // ❌ Wrong - never omit fallback
  t("createEvent.alertTitleRequired")
  ```

#### Toast Notifications
- Custom toast system in `src/components/base/Toast/`
- `ToastProvider` wraps the app in `App.tsx`
- Use `registerToast()` to set up global toast handler
- Call toast via the registered function (see `App.tsx` for pattern)

#### Path Aliases
- `@/` maps to `src/` directory (configured in `vite.config.ts`)
- Always use `@/` imports instead of relative paths

### Environment Configuration

Two environment files:
- `.env.development`: Development config (`VITE_COMING_SOON=false`)
- `.env.production`: Production config (`VITE_COMING_SOON=true`)

Environment variables:
- `VITE_COMING_SOON`: Toggle coming soon mode (shows ComingSoon page for all public routes)
- `VITE_API_BASE_URL`: API base URL (set to `/api/v1`, proxied in dev via vite.config.ts)

Dev proxy in `vite.config.ts` forwards `/api/v1` to `http://35.229.204.234:8080`

### Event Creation Flow

Multi-step process across separate route pages:
1. `/create-event` - CreateEvent.tsx (form to create event)
2. `/preview-event` - PreviewEvent.tsx (preview before signing)
3. `/confirm-sign/:eventId` - ConfirmSign.tsx (signature confirmation)
4. `/confirm-pay/:eventId/payment` - ConfirmPay.tsx (payment/deposit)

These pages likely pass data via route state or query params.

### Code Style Notes
- SVG imports supported via `vite-plugin-svgr` (can import as React components)
- ESLint configured with React hooks and React Refresh plugins
- TypeScript strict mode enabled
- Prefer functional components with hooks
- Use `class-variance-authority` (cva) and `tailwind-merge` (twMerge) for dynamic styling
