import { createBrowserRouter } from 'react-router'
import { Root } from './Root'
import { ErrorPage } from '@/error/index'
import  Layout  from '@/components/Layout'
import Home from '@/page/home'
import About from '@/page/about'


export const router = createBrowserRouter([
    {
      element: <Root />,
      errorElement: <ErrorPage />,
      children: [
        {
          element: <Layout />,
          children: [
            { index: true, element: <Home /> },
            { path: 'about', element: <About /> },
            // 如果要把 '/' 導去 '/dashboard'，把上一行改成：
            // { index: true, element: <Navigate to="dashboard" replace /> },
            // 其他子頁：
            // { path: 'dashboard', element: <Dashboard /> },
            // { path: 'about', element: <About /> },
          ],
        },
      ],
    },
  ])