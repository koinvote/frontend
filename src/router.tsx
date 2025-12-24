// router.tsx (or whatever your router file is)
import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { ErrorPage } from "@/error";
// public layout + pages
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

// admin
import AdminLayout from "@/layout/AdminLayout";
import AdminLogin from "@/admin/component/AdminLogin";
import AdminRewardRulesPage from "@/admin/pages/rewardRules";
import AdminFeesPage from "@/admin/pages/fee";
import AdminRefundsPage from "@/admin/pages/refund";
import AdminSystemSettingPage from "@/admin/pages/systemSetting";
import AdminAnnouncementsPage from "@/admin/pages/announcement";
import AdminSubscribersPage from "@/admin/pages/subscribe";

const isComingSoonMode = import.meta.env.VITE_COMING_SOON === "true";

const publicChildren = isComingSoonMode
  ? [
      // public home -> coming soon
      { index: true, element: <ComingSoon /> },

      // IMPORTANT: wildcard only inside Layout => does NOT affect /admin/*
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
    ];

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { path: "admin/login", element: <AdminLogin /> },
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
        element: <Layout />,
        children: publicChildren,
      },
    ],
  },
]);
