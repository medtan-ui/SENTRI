import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  loginWithEmail,
  logoutUser,
  subscribeToAuthChanges,
  sendResetEmail,
  refreshCurrentUser,
  resendVerificationEmail,
  verifyResetCode,
  confirmReset,
  changeOwnPassword as changeOwnPasswordService,
  updateOwnPassword as updateOwnPasswordService,
  updateOwnNickname as updateOwnNicknameService,
  registerStudentAccount as registerStudentAccountService,
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
    const nextUser = await loginWithEmail(email, password, rememberMe)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  // Public self-registration (RegisterAccountPage). Creates the account,
  // then signs in immediately as it — same shape as login() — so a new
  // student doesn't have to retype what they just entered. The freshly
  // signed-in user has emailVerified: false, so ProtectedRoute's existing
  // EmailVerificationGate takes over from here automatically.
  const register = useCallback(async (input) => {
    await registerStudentAccountService(input)
    const nextUser = await loginWithEmail(input.email, input.password, true)
    setUser(nextUser)
    return nextUser
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

  const changeOwnPassword = useCallback(async (newPassword) => {
    await changeOwnPasswordService(newPassword)
    // Re-reads the Firestore profile so user.mustChangePassword flips to
    // false and ProtectedRoute stops rendering the forced-change gate.
    const nextUser = await refreshCurrentUser()
    setUser(nextUser)
    return nextUser
  }, [])

  // Self-service password change from Profile — distinct from
  // changeOwnPassword above (that one's for the forced temporary-password
  // flow). No mustChangePassword involved, so no profile refresh needed.
  const updateOwnPassword = useCallback(async (currentPassword, newPassword) => {
    await updateOwnPasswordService(currentPassword, newPassword)
  }, [])

  const updateNickname = useCallback(async (nickname) => {
    await updateOwnNicknameService(nickname)
    // Re-reads the Firestore profile so user.nickname reflects the change
    // immediately everywhere it's displayed, without a re-login.
    const nextUser = await refreshCurrentUser()
    setUser(nextUser)
    return nextUser
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    resendVerification,
    refreshUser,
    changeOwnPassword,
    updateOwnPassword,
    updateNickname,
    // Password-reset link completion (public /reset-password page).
    verifyResetCode,
    confirmReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth
 * @returns {{
 *   user: { uid, email, role, displayName, nickname, emailVerified } | null,
 *   loading: boolean,
 *   login: (email: string, password: string, rememberMe?: boolean) => Promise<object>,
 *   register: (input: { displayName: string, nickname: string, email: string, password: string }) => Promise<object>,
 *   logout: () => Promise<void>,
 *   resetPassword: (email: string) => Promise<void>,
 *   resendVerification: () => Promise<void>,
 *   refreshUser: () => Promise<object|null>,
 *   changeOwnPassword: (newPassword: string) => Promise<object|null>,
 *   updateOwnPassword: (currentPassword: string, newPassword: string) => Promise<void>,
 *   updateNickname: (nickname: string) => Promise<object|null>,
 *   verifyResetCode: (oobCode: string) => Promise<string>,
 *   confirmReset: (oobCode: string, newPassword: string) => Promise<void>,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
