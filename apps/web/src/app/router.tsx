import {
  DashboardPage,
  LandingPage,
  LoadingFallback,
  PAGE_ROUTES,
  SidebarLayout,
  SignInPage,
  TasksPage,
} from '@onsaero/shared'
import { createBrowserRouter, Outlet } from 'react-router'
import { RedirectPage } from '@/pages/redirect'
import { WEB_PAGE_ROUTES } from '@/shared/config'
import { protectedLoader } from './loader/protected-loader'
import { unauthenticatedLoader } from './loader/unauthenticated-loader'

export const router = createBrowserRouter([
  {
    loader: protectedLoader,
    element: (
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    ),
    children: [
      {
        path: PAGE_ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: PAGE_ROUTES.GOALS,
        element: <DashboardPage />,
      },
      {
        path: PAGE_ROUTES.TASKS,
        element: <TasksPage />,
      },
    ],
    hydrateFallbackElement: <LoadingFallback text="Loading..." />,
  },
  {
    loader: unauthenticatedLoader,
    children: [
      {
        path: PAGE_ROUTES.LANDING,
        element: <LandingPage />,
      },
      {
        path: PAGE_ROUTES.SIGN_IN,
        element: <SignInPage />,
      },
      {
        path: WEB_PAGE_ROUTES.REDIRECT,
        element: <RedirectPage />,
      },
    ],
    hydrateFallbackElement: <LoadingFallback text="Loading..." />,
  },
])
