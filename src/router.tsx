import { createBrowserRouter } from 'react-router'
import { Root } from './Root'
import { ErrorPage } from '@/error/index'
import Layout from '@/layout/Layout'
import Home from '@/pages/home'
import About from '@/pages/about'
import Chargesnrefunds from "@/pages/chargesnrefunds";
import HelpnFaq from "@/pages/helpnFaq";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Subscribe from "@/pages/subscribe";
import Support from "@/pages/support";
import VerificaionTool from "@/pages/verificaionTool";
import TermsOfRewardDistribution from './pages/terms/TermsOfRewardDistribution'
import ComingSoon from './pages/comingSoon'


export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <ComingSoon /> },
          { path: 'home', element: <Home /> },
          { path: 'about', element: <About /> },
          { path: 'charges-refunds', element: <Chargesnrefunds /> },
          { path: 'help-faq', element: <HelpnFaq /> },
          { path: 'privacy', element: <Privacy /> },
          { path: 'terms', element: <Terms /> },
          { path: 'terms-reward-distribution', element: <TermsOfRewardDistribution /> },
          { path: 'subscribe', element: <Subscribe /> },
          { path: 'support', element: <Support /> },
          { path: 'verification-tool', element: <VerificaionTool /> },
        ],
      },
    ],
  },
])