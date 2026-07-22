import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen/LoadingScreen'
import EmailVerificationGate from '../components/EmailVerificationGate/EmailVerificationGate'

// Pages
import LoginPage         from '../pages/Login/LoginPage'
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage'
import StudentDashboard  from '../pages/Student/Dashboard/StudentDashboard'
import AdminDashboard    from '../pages/Admin/Dashboard/AdminDashboard'
import SecurityPage      from '../pages/Account/Security/SecurityPage'
import ComingSoon        from '../pages/ComingSoon'
import NotFound          from '../pages/NotFound'

/**
 * ProtectedRoute
 * Waits for the initial Firebase session check, then redirects to login
 * if no session exists. Unverified emails are gated behind
 * EmailVerificationGate before requiredRole is even checked — nobody
 * reaches a dashboard without confirming their email first. Otherwise
 * redirects to the user's own dashboard if their role doesn't match the
 * route's requiredRole.
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

      {/* ── Account (any authenticated role) ── */}
      <Route
        path="/account/security"
        element={
          <ProtectedRoute>
            <SecurityPage />
          </ProtectedRoute>
        }
      />

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
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/scenarios"
        element={
          <ProtectedRoute requiredRole="student">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz"
        element={
          <ProtectedRoute requiredRole="student">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute requiredRole="student">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute requiredRole="student">
            <ComingSoon />
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
        path="/admin/students"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/modules"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scenarios"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quizzes"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <ComingSoon />
          </ProtectedRoute>
        }
      />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
