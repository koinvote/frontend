// router.tsx
import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { ErrorPage } from "@/error";
import Layout from "@/layout/Layout";
import Home from "@/pages/home";
import About from "@/pages/about";
import Chargesnrefunds from "@/pages/chargesnrefunds";
import HelpnFaq from "@/pages/helpnFaq";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Subscribe from "@/pages/subscribe";
import Support from "@/pages/support";
import VerificaionTool from "@/pages/verificaionTool";
import TermsOfRewardDistribution from "./pages/terms/TermsOfRewardDistribution";
import ComingSoon from "./pages/comingSoon";
import CreateEvent from "@/pages/create-event/CreateEvent";
import PreviewEvent from "@/pages/create-event/PreviewEvent";
import ConfirmSign from "@/pages/create-event/ConfirmSign";
import ConfirmPay from "@/pages/create-event/ConfirmPay";
import EventDetail from "@/pages/event-detail";
import TestSafeArea from "@/pages/TestSafeArea";

// Admin imports...
import AdminLayout from "@/layout/AdminLayout";
import AdminLoginPage from "@/admin/pages/login";
import AdminRewardRulesPage from "@/admin/pages/rewardRules";
import AdminFeesPage from "@/admin/pages/fee";
import AdminRefundsPage from "@/admin/pages/refund";
import AdminSystemSettingPage from "@/admin/pages/systemSetting";
import AdminAnnouncementsPage from "@/admin/pages/announcement";
import AdminSubscribersPage from "@/admin/pages/subscribe";

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
          { path: "system-setting", element: <AdminSystemSettingPage /> },
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
