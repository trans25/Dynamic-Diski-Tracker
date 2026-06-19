import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { CoachLayout } from './components/layout/CoachLayout'
import { PlayerLayout } from './components/layout/PlayerLayout'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { GuestRoute } from './auth/GuestRoute'
import { ParentProtectedRoute } from './auth/ParentProtectedRoute'
import { RoleRoute } from './auth/RoleRoute'
import { UserRole } from './api/types'
import { SignInPage } from './features/auth/SignInPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { SignUpSuccessPage } from './features/auth/SignUpSuccessPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { ParentSignInPage } from './features/auth/ParentSignInPage'
import { ParentMagicLinkPage } from './features/auth/ParentMagicLinkPage'
import { PlayerParentOTPSignInPage } from './features/auth/PlayerParentOTPSignInPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TenantsPage } from './features/tenants/TenantsPage'
import { UsersPage } from './features/users/UsersPage'
import { BillingPage } from './features/billing/BillingPage'
import { AdminDashboardPage } from './features/admin/AdminDashboardPage'
import { AdminSportTemplates } from './features/admin/AdminSportTemplates'
import { AdminPendingRequests } from './features/admin/AdminPendingRequests'
import { TemplatesPage } from './features/templates/TemplatesPage'
import { HealthPage } from './features/health/HealthPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { CoachOverviewPage } from './features/coach/CoachOverviewPage'
import { CoachTeamsPage } from './features/coach/CoachTeamsPage'
import { CoachSchedulePage } from './features/coach/CoachSchedulePage'
import { CoachMatchHistoryPage } from './features/coach/CoachMatchHistoryPage'
import { LiveMatch } from './features/coach/LiveMatch'
import { MatchOperationsPage } from './features/coach/MatchOperationsPage'
import { CoachInjuriesPage } from './features/coach/CoachInjuriesPage'
import { CoachAnnouncementsPage } from './features/coach/CoachAnnouncementsPage'
import { CoachAnalyticsPage } from './features/coach/CoachAnalyticsPage'
import { CoachProfilePage } from './features/coach/CoachProfilePage'
import { ParentPortalPage } from './features/parent/ParentPortalPage'
import { PlayerDashboardPage } from './features/player/PlayerDashboardPage'
import { AccessDeniedPage } from './features/errors/AccessDeniedPage'
import { NotFoundPage } from './features/errors/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/access-denied', element: <AccessDeniedPage /> },

  // Parent magic-link auth routes
  { path: '/parent/sign-in', element: <ParentSignInPage /> },
  { path: '/parent/magic', element: <ParentMagicLinkPage /> },

  // Player/Parent OTP auth route
  { path: '/player/sign-in', element: <PlayerParentOTPSignInPage /> },

  {
    element: <ParentProtectedRoute />,
    children: [{ path: '/parent/portal', element: <ParentPortalPage /> }],
  },

  // Public auth routes (only for guests)
  {
    element: <GuestRoute />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
      { path: '/sign-up/success', element: <SignUpSuccessPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Protected app routes
  {
    element: <ProtectedRoute />,
    children: [
      // Coach portal (distinct layout + navigation from Super Admin)
      {
        element: <RoleRoute allow={[UserRole.Coach, UserRole.SchoolAdmin]} />,
        children: [
          {
            element: <CoachLayout />,
            children: [
              { path: '/coach', element: <CoachOverviewPage /> },
              { path: '/coach/teams', element: <CoachTeamsPage /> },
              { path: '/coach/schedule', element: <CoachSchedulePage /> },
              { path: '/coach/match-history', element: <CoachMatchHistoryPage /> },
              { path: '/coach/live-match/:matchId', element: <LiveMatch /> },
              { path: '/coach/match-ops/:matchId', element: <MatchOperationsPage /> },
              { path: '/coach/communication', element: <CoachAnnouncementsPage /> },
              { path: '/coach/injuries', element: <CoachInjuriesPage /> },
              {
                path: '/coach/announcements',
                element: <Navigate to="/coach/communication" replace />,
              },
              { path: '/coach/analytics', element: <CoachAnalyticsPage /> },
              { path: '/coach/profile', element: <CoachProfilePage /> },
            ],
          },
        ],
      },

      {
        element: <RoleRoute allow={[UserRole.Player]} />,
        children: [
          {
            element: <PlayerLayout />,
            children: [{ path: '/player', element: <PlayerDashboardPage /> }],
          },
        ],
      },

      // Super Admin / platform management portal
      {
        element: <RoleRoute allow={[UserRole.SuperAdmin]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/sports', element: <AdminSportTemplates /> },
              { path: '/admin/pending-requests', element: <AdminPendingRequests /> },
              { path: '/tenants', element: <TenantsPage /> },
              { path: '/users', element: <UsersPage /> },
              { path: '/billing', element: <BillingPage /> },
              { path: '/templates', element: <TemplatesPage /> },
              { path: '/health', element: <HealthPage /> },
              { path: '/profile', element: <ProfilePage /> },
            ],
          },
        ],
      },

      { path: '/404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
])
