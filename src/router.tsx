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
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "about", element: <About /> },
      { path: "charges-refunds", element: <Chargesnrefunds /> },
      { path: "help-faq", element: <HelpnFaq /> },
      { path: "privacy", element: <Privacy /> },
      { path: "terms", element: <Terms /> },
      {
        path: "terms-reward-distribution",
        element: <TermsOfRewardDistribution />,
      },
      { path: "subscribe", element: <Subscribe /> },
      { path: "support", element: <Support /> },
      { path: "verification-tool", element: <VerificaionTool /> },
      { path: "create-event", element: <CreateEvent /> },
      { path: "preview-event", element: <PreviewEvent /> },
      { path: "confirm-sign/:eventId", element: <ConfirmSign /> },
      { path: "confirm-pay/:eventId/payment", element: <ConfirmPay /> },
      { path: "event/:eventId", element: <EventDetail /> },
      { path: "event/:eventId/reply", element: <ReplyPage /> },
      { path: "event/:eventId/report", element: <PayoutReport /> },

      // TODO: test route, remove later
      { path: "event-share/:eventId", element: <EventDetail /> },
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
          { index: true, element: <AdminRewardRulesPage /> },
          { path: "reward-rules", element: <AdminRewardRulesPage /> },
          { path: "fees", element: <AdminFeesPage /> },
          { path: "refunds", element: <AdminRefundsPage /> },
          { path: "withdrawal", element: <AdminWithdrawal /> },
          { path: "announcements", element: <AdminAnnouncementsPage /> },
          { path: "subscribers", element: <AdminSubscribersPage /> },
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
