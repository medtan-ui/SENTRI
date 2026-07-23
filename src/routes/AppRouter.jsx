import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen/LoadingScreen'
import EmailVerificationGate from '../components/EmailVerificationGate/EmailVerificationGate'
import ForcedPasswordChangeGate from '../components/ForcedPasswordChangeGate/ForcedPasswordChangeGate'

// Pages
import LoginPage         from '../pages/Login/LoginPage'
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage'
import StudentDashboard  from '../pages/Student/Dashboard/StudentDashboard'
import AdminDashboard    from '../pages/Admin/Dashboard/AdminDashboard'
import SettingsPage      from '../pages/Account/Settings/SettingsPage'
import AccountsPage      from '../pages/Admin/Accounts/AccountsPage'
import ModulesPage       from '../pages/Admin/Modules/ModulesPage'
import ModuleContentEditor from '../pages/Admin/ModuleEditor/ModuleContentEditor'
import ModulePreviewPage from '../pages/Admin/ModulePreview/ModulePreviewPage'
import ModuleConfigurationPage from '../pages/Admin/ModuleConfiguration/ModuleConfigurationPage'
import ScenarioManagerPage from '../pages/Admin/ScenarioManager/ScenarioManagerPage'
import QuizManagerPage   from '../pages/Admin/QuizManager/QuizManagerPage'
import AdminAnalyticsPage from '../pages/Admin/Analytics/AdminAnalyticsPage'
import StudentModulesPage from '../pages/Student/Modules/StudentModulesPage'
import StudentLessonViewerPage from '../pages/Student/Modules/LessonViewer/StudentLessonViewerPage'
import ScenarioRunnerPage from '../pages/Student/Modules/ScenarioRunner/ScenarioRunnerPage'
import SimulationCompletePage from '../pages/Student/Modules/SimulationComplete/SimulationCompletePage'
import StudentQuizPage from '../pages/Student/Modules/Quiz/StudentQuizPage'
import StudentQuizOverviewPage from '../pages/Student/Quiz/StudentQuizOverviewPage'
import StudentProgressPage from '../pages/Student/Progress/StudentProgressPage'
import StudentProfilePage from '../pages/Student/Profile/StudentProfilePage'
import NotFound          from '../pages/NotFound'

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
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }
  if (!user) {
    return <Navigate to="/" replace />
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
      <Route
        path="/student/settings"
        element={
          <ProtectedRoute requiredRole="student">
            <SettingsPage />
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
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
