import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen/LoadingScreen'
import EmailVerificationGate from '../components/EmailVerificationGate/EmailVerificationGate'
import ForcedPasswordChangeGate from '../components/ForcedPasswordChangeGate/ForcedPasswordChangeGate'

// Pages (Lazy Loaded for Performance & Code Splitting)
const LoginPage              = React.lazy(() => import('../pages/Login/LoginPage'))
const ResetPasswordPage      = React.lazy(() => import('../pages/ResetPassword/ResetPasswordPage'))
const StudentDashboard       = React.lazy(() => import('../pages/Student/Dashboard/StudentDashboard'))
const AdminDashboard         = React.lazy(() => import('../pages/Admin/Dashboard/AdminDashboard'))
const RegisterAccountPage    = React.lazy(() => import('../pages/Register/RegisterAccountPage'))
const AccountsPage           = React.lazy(() => import('../pages/Admin/Accounts/AccountsPage'))
const ViewUserPage           = React.lazy(() => import('../pages/Admin/Accounts/ViewUser/ViewUserPage'))
const CreateAdminAccountPage = React.lazy(() => import('../pages/Admin/Accounts/CreateAdmin/CreateAdminAccountPage'))
const AdminProfilePage       = React.lazy(() => import('../pages/Admin/Profile/AdminProfilePage'))
const ModulesPage            = React.lazy(() => import('../pages/Admin/Modules/ModulesPage'))
const ModuleContentEditor    = React.lazy(() => import('../pages/Admin/ModuleEditor/ModuleContentEditor'))
const ModulePreviewPage      = React.lazy(() => import('../pages/Admin/ModulePreview/ModulePreviewPage'))
const ModuleConfigurationPage= React.lazy(() => import('../pages/Admin/ModuleConfiguration/ModuleConfigurationPage'))
const ScenarioManagerPage    = React.lazy(() => import('../pages/Admin/ScenarioManager/ScenarioManagerPage'))
const QuizManagerPage        = React.lazy(() => import('../pages/Admin/QuizManager/QuizManagerPage'))
const AdminAnalyticsPage     = React.lazy(() => import('../pages/Admin/Analytics/AdminAnalyticsPage'))
const StudentModulesPage     = React.lazy(() => import('../pages/Student/Modules/StudentModulesPage'))
const StudentLessonViewerPage= React.lazy(() => import('../pages/Student/Modules/LessonViewer/StudentLessonViewerPage'))
const ScenarioRunnerPage     = React.lazy(() => import('../pages/Student/Modules/ScenarioRunner/ScenarioRunnerPage'))
const SimulationCompletePage = React.lazy(() => import('../pages/Student/Modules/SimulationComplete/SimulationCompletePage'))
const StudentQuizPage        = React.lazy(() => import('../pages/Student/Modules/Quiz/StudentQuizPage'))
const StudentQuizOverviewPage= React.lazy(() => import('../pages/Student/Quiz/StudentQuizOverviewPage'))
const StudentProgressPage    = React.lazy(() => import('../pages/Student/Progress/StudentProgressPage'))
const StudentProfilePage     = React.lazy(() => import('../pages/Student/Profile/StudentProfilePage'))
const NotFound               = React.lazy(() => import('../pages/NotFound'))

/**
 * ProtectedRoute
 * Waits for the initial Firebase session check, then redirects to login
 * if no session exists. Unverified emails are gated behind
 * EmailVerificationGate first — nobody reaches a dashboard without
 * confirming their email. Accounts still on a temporary (admin-set)
 * password are gated behind ForcedPasswordChangeGate next. Both gates
 * read live from AuthContext's `user`, so completing one step (e.g.
 * clicking "I've verified — check again") re-renders straight into the
 * next gate in the same session — no re-login required between steps.
 * Otherwise redirects to the user's own dashboard if their role doesn't
 * match the route's requiredRole.
 *
 * An unauthenticated visit carries its own location as router state on
 * the redirect to "/", so LoginPage can send them back here after they
 * sign in instead of dropping them on their default dashboard (see the
 * Register Account link on LoginPage, the only current path that reaches
 * a protected route while logged out).
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }
  if (!user.emailVerified) {
    return <EmailVerificationGate />
  }
  if (user.mustChangePassword) {
    return <ForcedPasswordChangeGate />
  }
  if (requiredRole && user.role !== requiredRole) {
    // Wrong role — send to their own dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  return children
}

/**
 * PublicRoute
 * Keeps a signed-in user off the login page — refreshing "/" while
 * authenticated lands them back on their dashboard instead.
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  return children
}

export default function AppRouter() {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ── Public ── */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterAccountPage />} />

        {/* ── Student ── */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/modules"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentModulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/modules/:moduleId"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLessonViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/modules/:moduleId/scenario"
          element={
            <ProtectedRoute requiredRole="student">
              <ScenarioRunnerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/modules/:moduleId/simulation-complete"
          element={
            <ProtectedRoute requiredRole="student">
              <SimulationCompletePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/modules/:moduleId/quiz"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quiz"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentQuizOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ── Admin ── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounts"
          element={
            <ProtectedRoute requiredRole="admin">
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounts/create-admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateAdminAccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounts/:uid"
          element={
            <ProtectedRoute requiredRole="admin">
              <ViewUserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/modules"
          element={
            <ProtectedRoute requiredRole="admin">
              <ModulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/modules/editor"
          element={
            <ProtectedRoute requiredRole="admin">
              <ModuleContentEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/modules/preview"
          element={
            <ProtectedRoute requiredRole="admin">
              <ModulePreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/modules/:moduleId/configure"
          element={
            <ProtectedRoute requiredRole="admin">
              <ModuleConfigurationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scenarios"
          element={
            <ProtectedRoute requiredRole="admin">
              <ScenarioManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quizzes"
          element={
            <ProtectedRoute requiredRole="admin">
              <QuizManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  )
}
