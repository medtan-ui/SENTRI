import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  loginWithEmail,
  completeMfaSignIn,
  logoutUser,
  subscribeToAuthChanges,
  sendResetEmail,
  refreshCurrentUser,
  resendVerificationEmail,
  verifyResetCode,
  confirmReset,
  startTotpEnrollment,
  confirmTotpEnrollment,
  getEnrolledFactors,
  unenrollFactor,
} from '../services/authService'

/**
 * AuthContext
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for the signed-in user across the app.
 *
 * Wraps Firebase's onAuthStateChanged so every consumer (Navbar,
 * Sidebar, dashboards, ProtectedRoute) reads from one place instead of
 * hitting Firebase/Firestore directly. `loading` stays true until the
 * very first auth check resolves, which lets ProtectedRoute avoid
 * bouncing a persisted session back to the login page on refresh.
 *
 * `login()` can reject with an `{ mfaRequired: true, resolver, hintUid }`
 * error instead of a plain failure — callers (LoginPage) must check for
 * that shape and route to a code-entry step, calling completeMfaLogin()
 * once the user has a 6-digit code.
 * ─────────────────────────────────────────────────────────────
 */
const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (email, password, rememberMe) => {
    // Does NOT catch mfaRequired here — LoginPage needs the raw error to
    // read err.resolver/err.hintUid and switch to the code-entry step.
    const nextUser = await loginWithEmail(email, password, rememberMe)
    setUser(nextUser)
    return nextUser
  }, [])

  const completeMfaLogin = useCallback(async (resolver, hintUid, code) => {
    const nextUser = await completeMfaSignIn(resolver, hintUid, code)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const resetPassword = useCallback(async (email) => {
    await sendResetEmail(email)
  }, [])

  const resendVerification = useCallback(async () => {
    await resendVerificationEmail()
  }, [])

  const refreshUser = useCallback(async () => {
    const nextUser = await refreshCurrentUser()
    setUser(nextUser)
    return nextUser
  }, [])

  const value = {
    user,
    loading,
    login,
    completeMfaLogin,
    logout,
    resetPassword,
    resendVerification,
    refreshUser,
    // Password-reset link completion (public /reset-password page).
    verifyResetCode,
    confirmReset,
    // TOTP multi-factor management (Security page).
    startTotpEnrollment,
    confirmTotpEnrollment,
    getEnrolledFactors,
    unenrollFactor,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth
 * @returns {{
 *   user: { uid, email, role, displayName, emailVerified } | null,
 *   loading: boolean,
 *   login: (email: string, password: string, rememberMe?: boolean) => Promise<object>,
 *   completeMfaLogin: (resolver: object, hintUid: string, code: string) => Promise<object>,
 *   logout: () => Promise<void>,
 *   resetPassword: (email: string) => Promise<void>,
 *   resendVerification: () => Promise<void>,
 *   refreshUser: () => Promise<object|null>,
 *   verifyResetCode: (oobCode: string) => Promise<string>,
 *   confirmReset: (oobCode: string, newPassword: string) => Promise<void>,
 *   startTotpEnrollment: () => Promise<object>,
 *   confirmTotpEnrollment: (totpSecret: object, code: string, label?: string) => Promise<void>,
 *   getEnrolledFactors: () => Array<object>,
 *   unenrollFactor: (factorUid: string) => Promise<void>,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
