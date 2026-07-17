import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'

// Pages
import LoginPage         from '../pages/Login/LoginPage'
import StudentDashboard  from '../pages/Student/Dashboard/StudentDashboard'
import AdminDashboard    from '../pages/Admin/Dashboard/AdminDashboard'
import ComingSoon        from '../pages/ComingSoon'
import NotFound          from '../pages/NotFound'

/**
 * ProtectedRoute
 * Redirects to login if no session exists, or if the user's role doesn't match.
 */
function ProtectedRoute({ children, requiredRole }) {
  const user = getCurrentUser()
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (requiredRole && user.role !== requiredRole) {
    // Wrong role — send to their own dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  return children
}

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<LoginPage />} />

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
