# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⛔ 部署帳號與金鑰：不要自行清理

本專案 dev/prod 都部署在 GCE VM 上，部署身分是 Linux 帳號 **`koinvote-web-deploy`**
（secrets `GCE_USER` / `PROD_GCE_USER`），它同時擁有 `/var/www/koinvote`，
prod 上還負責執行 og-meta-server。**這不是殘留帳號，刪掉或移除它的 SSH 金鑰，
自動部署會立刻失效，prod 的分享預覽圖也會壞。**

權威清冊在 backend repo 的 `doc/identities.md`（本機 `~/Desktop/backend/doc/identities.md`）。
動任何帳號、SSH 金鑰或 GCE metadata 前先讀那份文件。

git 作者欄裡的**已離職成員姓名是歷史紀錄，不是安全問題**；已決定不改寫 git 歷史。

## Project Overview

KoinVote is a React + TypeScript voting/event platform built with Vite. The application supports creating and managing events with cryptocurrency-based voting, featuring both public-facing pages and an admin dashboard.

## Development Commands

```bash
# Development server with hot reload
npm run dev

# Development server with mock API (MSW)
npm run dev:mock

# Build for development environment
npm run build:dev

# Build for production
npm run build

# Lint code
npm run lint

# Run the Vitest suite once (what CI runs)
npm run test

# Run Vitest in watch mode
npm run test:watch

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
- **i18n**: react-i18next (English/Chinese/Japanese/Korean translations in `src/locals/`)

### Project Structure

```
src/
├── api/              # API layer with axios clients
│   ├── http.ts       # Base http client and adminHttp client
│   ├── index.ts      # API endpoints (API and AdminAPI objects)
│   ├── request.ts    # Request type definitions
│   └── response.ts   # Response type definitions
├── admin/            # Admin dashboard
│   ├── pages/        # Admin pages (rewardRules, fee, refund, withdrawal, etc.)
│   └── component/    # Admin-specific reusable components
├── components/       # Shared UI components
│   └── base/         # Base components like Toast
├── hooks/            # Custom React hooks
├── layout/           # Layout components (Layout, AdminLayout)
├── locals/           # i18n translation files (en.json, zh.json, ja.json, ko.json)
├── mocks/            # MSW mock API handlers and data (dev only)
├── pages/            # Public-facing pages
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── router.tsx        # Route definitions
└── App.tsx           # Root component with providers
```

### Key Architectural Patterns

#### API Layer
- Full API documentation: `.claude/docs/api_doc.md`
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
- Translation files: `src/locals/en.json`, `src/locals/zh.json`, `src/locals/ja.json`, `src/locals/ko.json`
- Default language: English
- **Adding a language**: add its JSON file and one entry to `SUPPORTED_LANGUAGES` in `src/i18n.ts`. The switcher in the menu footer renders that list, so nothing else needs touching.
- `src/locals/locales.test.ts` holds every file to English key by key: same keys, same `{{placeholders}}`, same `<a>`/`<a1>`/`<a2>` cross-policy links, balanced markup tags, no empty strings. Which phrase a translation puts in `<bold>` is the translator's call and is not compared — the Chinese pages deliberately bold more than the English ones.
- `src/pages/terms/legalPages.test.tsx` renders the four policy pages in **every** language; add new ones to its `languages` list along with the wording that page uses for "last updated".
- Access translations via `useTranslation()` hook from react-i18next
- **IMPORTANT**: Always provide a default fallback string when using `t()` function:
  ```typescript
  // ✅ Correct - always include fallback
  t("createEvent.alertTitleRequired", "Please enter a title.")

  // ❌ Wrong - never omit fallback
  t("createEvent.alertTitleRequired")
  ```
- **IMPORTANT**: Reuse existing i18n keys whenever the wording is identical — don't duplicate strings across namespaces. Before adding a new key, check `common.*` and other relevant namespaces for an existing match. If the same wording is needed in multiple places, extract it to a shared namespace (e.g., `common`, `creatorSign`) rather than duplicating it. Example: `common.change` is used for "Change" buttons across pages; `creatorSign.*` holds shared strings for the creator signing flow.

#### Toast Notifications
- Custom toast system in `src/components/base/Toast/`
- `ToastProvider` wraps the app in `App.tsx`
- Use `registerToast()` to set up global toast handler
- Call toast via the registered function (see `App.tsx` for pattern)

#### Path Aliases
- `@/` maps to `src/` directory (configured in `vite.config.ts`)
- Always use `@/` imports instead of relative paths

### Environment Configuration

Three environment files:
- `.env.development`: Development config (`VITE_COMING_SOON=false`)
- `.env.production`: Production config (`VITE_COMING_SOON=true`)
- `.env.mock`: Mock mode config (`VITE_USE_MOCK=true`, used by `npm run dev:mock`)

Environment variables:
- `VITE_COMING_SOON`: Toggle coming soon mode (shows ComingSoon page for all public routes)
- `VITE_API_BASE_URL`: API base URL (set to `/api/v1`, proxied in dev via vite.config.ts)
- `VITE_USE_MOCK`: Enable MSW mock API (`true`/`false`, see `MOCK_GUIDE.md` for details)

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
- Split components into separate files whenever possible — avoid large single-file pages with many inline components
- Admin (backend) and public (frontend) pages should use consistent, similar styling patterns
- **Prefer Tailwind utility classes over custom CSS classes whenever possible.** When you encounter custom/shorthand classes (e.g. `tx-14`, `fw-m`, `lh-20`), replace them with their Tailwind equivalents (e.g. `text-sm`, `font-medium`, `leading-5`). Only use custom classes (defined in `global.css`) when there is no suitable Tailwind equivalent.
