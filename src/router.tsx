// router.tsx
import { createBrowserRouter } from "react-router";

import { ErrorPage } from "@/error";
import Layout from "@/layout/Layout";
import About from "@/pages/about";
import Chargesnrefunds from "@/pages/chargesnrefunds";
import ConfirmPay from "@/pages/create-event/ConfirmPay";
import ConfirmSign from "@/pages/create-event/ConfirmSign";
import CreateEvent from "@/pages/create-event/CreateEvent";
import PreviewEvent from "@/pages/create-event/PreviewEvent";
import EventDetail from "@/pages/event-detail";
import UnlockPayment from "@/pages/unlock-payment";
import HelpnFaq from "@/pages/helpnFaq";
import Home from "@/pages/home";
import PayoutReport from "@/pages/payout-report";
import Privacy from "@/pages/privacy";
import ReplyPage from "@/pages/reply";
import Subscribe from "@/pages/subscribe";
import Support from "@/pages/support";
import Terms from "@/pages/terms";
import TestSafeArea from "@/pages/TestSafeArea";
import VerificaionTool from "@/pages/verificaionTool";
import ComingSoon from "./pages/comingSoon";
import TermsOfRewardDistribution from "./pages/terms/TermsOfRewardDistribution";
import { Root } from "./Root";

// Admin imports...
import AdminAnnouncementsPage from "@/admin/pages/announcement";
import AdminFeesPage from "@/admin/pages/fee";
import AdminLoginPage from "@/admin/pages/login";
import AdminRefundsPage from "@/admin/pages/refund";
import AdminRewardRulesPage from "@/admin/pages/rewardRules";
import AdminSubscribersPage from "@/admin/pages/subscribe";
import AdminWithdrawal from "@/admin/pages/withdrawal";
import AdminLayout from "@/layout/AdminLayout";

const isComingSoonMode = import.meta.env.VITE_COMING_SOON === "true";

const publicChildren = isComingSoonMode
  ? [
      { index: true, element: <ComingSoon /> },
      { path: "*", element: <ComingSoon /> },
    ]
  : [
      { index: true, element: <Home />, handle: { title: "Koinvote" } },
      { path: "home", element: <Home />, handle: { title: "Koinvote" } },
      { path: "about", element: <About />, handle: { title: "About | Koinvote" } },
      { path: "charges-refunds", element: <Chargesnrefunds />, handle: { title: "Charges & Refunds | Koinvote" } },
      { path: "help-faq", element: <HelpnFaq />, handle: { title: "Help & FAQ | Koinvote" } },
      { path: "privacy", element: <Privacy />, handle: { title: "Privacy Policy | Koinvote" } },
      { path: "terms", element: <Terms />, handle: { title: "Terms of Use | Koinvote" } },
      {
        path: "terms-reward-distribution",
        element: <TermsOfRewardDistribution />,
        handle: { title: "Terms of Reward Distribution | Koinvote" },
      },
      { path: "subscribe", element: <Subscribe />, handle: { title: "Subscribe | Koinvote" } },
      { path: "support", element: <Support />, handle: { title: "Support | Koinvote" } },
      { path: "verification-tool", element: <VerificaionTool />, handle: { title: "Verification Tool | Koinvote" } },
      { path: "create-event", element: <CreateEvent />, handle: { title: "Create Event | Koinvote" } },
      { path: "preview-event", element: <PreviewEvent />, handle: { title: "Preview Event | Koinvote" } },
      { path: "confirm-sign/:eventId", element: <ConfirmSign />, handle: { title: "Confirm Sign | Koinvote" } },
      { path: "confirm-pay/:eventId/payment", element: <ConfirmPay />, handle: { title: "Confirm Payment | Koinvote" } },
      // title: null → event detail page sets its own title from event data
      { path: "event/:eventId", element: <EventDetail />, handle: { title: null } },
      { path: "event/:eventId/unlock-payment", element: <UnlockPayment />, handle: { title: "Unlock Payment | Koinvote" } },
      { path: "event/:eventId/reply", element: <ReplyPage />, handle: { title: "Reply | Koinvote" } },
      { path: "event/:eventId/report", element: <PayoutReport />, handle: { title: "Payout Report | Koinvote" } },

      // TODO: test route, remove later
      { path: "event-share/:eventId", element: <EventDetail />, handle: { title: null } },
    ];

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { path: "test-safe-area", element: <TestSafeArea /> },
      { path: "admin/login", element: <AdminLoginPage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminRewardRulesPage />, handle: { title: "Reward Rules | Koinvote Admin" } },
          { path: "reward-rules", element: <AdminRewardRulesPage />, handle: { title: "Reward Rules | Koinvote Admin" } },
          { path: "fees", element: <AdminFeesPage />, handle: { title: "Fees | Koinvote Admin" } },
          { path: "refunds", element: <AdminRefundsPage />, handle: { title: "Refunds | Koinvote Admin" } },
          { path: "withdrawal", element: <AdminWithdrawal />, handle: { title: "Withdrawal | Koinvote Admin" } },
          { path: "announcements", element: <AdminAnnouncementsPage />, handle: { title: "Announcements | Koinvote Admin" } },
          { path: "subscribers", element: <AdminSubscribersPage />, handle: { title: "Subscribers | Koinvote Admin" } },
        ],
      },
      {
        path: "*",
        element: <Layout />,
        children: publicChildren,
      },
    ],
  },
]);
