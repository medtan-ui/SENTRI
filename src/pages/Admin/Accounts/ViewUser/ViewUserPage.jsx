import React, { useCallback, useEffect, useState } from 'react'
import Icon from '../../../../components/Icon/Icon'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import Input from '../../../../components/Input/Input'
import LoadingSkeleton from '../../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../../components/ErrorState/ErrorState'
import ModuleProgressList from '../../../../components/ModuleProgressList/ModuleProgressList'
import QuizRetryPanel from './QuizRetryPanel'
import { useAuth } from '../../../../context/AuthContext'
import {
  listUsers,
  deleteUserAccount,
  resetUserPassword,
  setUserAccountStatus,
} from '../../../../services/adminService'
import { getStudentAnalytics, aggregateStudentAnalytics } from '../../../../services/analyticsService'
import { getStudentModuleProgressForAdmin } from '../../../../services/moduleProgressService'
import { validatePassword } from '../../../../utils/passwordPolicy'
import { timeAgo } from '../../../../utils/timeAgo'
import styles from './ViewUserPage.module.css'

/**
 * ViewUserPage — /admin/accounts/:uid
 * The dedicated "View" destination for Account Management: the selected
 * user's info plus, for students, an Individual Analytics section (the
 * same aggregate + per-module data the student sees about themself on
 * their own Progress page, computed here for another uid via the
 * already-admin-aware aggregateStudentAnalytics callable). Reset Password,
 * Deactivate/Activate, and Delete are all available inline so an admin
 * doesn't need to bounce back to the Accounts table to act.
 */
export default function ViewUserPage() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'notfound' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [targetUser, setTargetUser] = useState(null)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const [resetOpen, setResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [showResetPwd, setShowResetPwd] = useState(false)

  const [statusBusy, setStatusBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [analytics, setAnalytics] = useState(undefined) // undefined = loading, null = not yet aggregated
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  const [moduleStatus, setModuleStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [modules, setModules] = useState([])
  const [moduleErrorMessage, setModuleErrorMessage] = useState('')

  const loadUser = useCallback(() => {
    setStatus('loading')
    setErrorMessage('')
    listUsers()
      .then((result) => {
        const match = result.find((u) => u.uid === uid)
        if (!match) {
          setStatus('notfound')
          return
        }
        setTargetUser(match)
        setStatus('success')
      })
      .catch((err) => {
        setErrorMessage(err?.message || 'Something went wrong loading this account. Please try again.')
        setStatus('error')
      })
  }, [uid])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const loadModuleProgress = useCallback(() => {
    setModuleStatus('loading')
    setModuleErrorMessage('')
    getStudentModuleProgressForAdmin(uid)
      .then((result) => {
        setModules(result)
        setModuleStatus('success')
      })
      .catch((err) => {
        setModuleErrorMessage(err?.message || 'Something went wrong loading module progress. Please try again.')
        setModuleStatus('error')
      })
  }, [uid])

  useEffect(() => {
    if (status !== 'success' || targetUser?.role !== 'student') return
    getStudentAnalytics(uid).then(setAnalytics).catch(() => setAnalytics(null))
    loadModuleProgress()
  }, [status, targetUser, uid, loadModuleProgress])

  async function refreshAnalytics() {
    setAnalyticsRefreshing(true)
    setAnalyticsError('')
    try {
      const summary = await aggregateStudentAnalytics(uid)
      setAnalytics(summary)
    } catch (err) {
      setAnalyticsError(err?.message || 'Something went wrong refreshing analytics. Please try again.')
    } finally {
      setAnalyticsRefreshing(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    setResetError('')
    const { valid, errors } = validatePassword(resetPassword)
    if (!valid) {
      setResetError(`Password requirements not met: ${errors.join(', ')}.`)
      return
    }
    setResetSubmitting(true)
    try {
      await resetUserPassword(uid, resetPassword)
      setNotice('Password reset successfully.')
      setResetOpen(false)
      setResetPassword('')
    } catch (err) {
      setResetError(err.message)
    } finally {
      setResetSubmitting(false)
    }
  }

  async function handleStatusToggle() {
    const nextStatus = targetUser.status === 'disabled' ? 'active' : 'disabled'
    const verb = nextStatus === 'disabled' ? 'Deactivate' : 'Reactivate'
    const confirmed = window.confirm(`${verb} ${targetUser.displayName} (${targetUser.email})?`)
    if (!confirmed) return

    setNotice('')
    setActionError('')
    setStatusBusy(true)
    try {
      await setUserAccountStatus(uid, nextStatus)
      setTargetUser((prev) => ({ ...prev, status: nextStatus }))
      setNotice(`${targetUser.email} was ${nextStatus === 'disabled' ? 'deactivated' : 'reactivated'}.`)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setStatusBusy(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Permanently delete ${targetUser.displayName} (${targetUser.email})? This cannot be undone.`)
    if (!confirmed) return

    setActionError('')
    setDeleteBusy(true)
    try {
      await deleteUserAccount(uid)
      navigate('/admin/accounts')
    } catch (err) {
      setActionError(err.message)
      setDeleteBusy(false)
    }
  }

  const ResetPwdToggleBtn = (
    <button
      type="button"
      onClick={() => setShowResetPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showResetPwd ? 'Hide password' : 'Show password'}
    >
      {showResetPwd ? <Icon name="eyeOff" size={17} /> : <Icon name="eye" size={17} />}
    </button>
  )

  const isSelf = targetUser?.uid === user?.uid
  const initials = (targetUser?.nickname || targetUser?.displayName || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/admin/accounts')}>
          ← Back to Accounts
        </button>

        {status === 'loading' && <LoadingSkeleton blocks={2} rows={3} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={loadUser} />}

        {status === 'notfound' && (
          <Card className={styles.panel}>
            <p className={styles.emptyState}>
              This account no longer exists — it may have just been deleted, or the link is out of date.
            </p>
            <Button variant="primary" onClick={() => navigate('/admin/accounts')}>
              Back to Accounts
            </Button>
          </Card>
        )}

        {status === 'success' && targetUser && (
          <>
            <h1 className={styles.title}>Account Details</h1>

            {notice && (
              <div className={styles.successBanner} role="status">
                <span aria-hidden="true">✓</span> {notice}
              </div>
            )}

            <Card className={styles.identityCard}>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
              <div className={styles.identityInfo}>
                <h2 className={styles.name}>{targetUser.nickname}</h2>
                <p className={styles.fullName}>{targetUser.displayName}</p>
                <p className={styles.email}>{targetUser.email}</p>
                <div className={styles.badgeRow}>
                  <span className={`${styles.roleBadge} ${targetUser.role === 'admin' ? styles.roleAdmin : styles.roleStudent}`}>
                    {targetUser.role}
                  </span>
                  <span className={`${styles.statusBadge} ${targetUser.status === 'disabled' ? styles.statusDisabled : styles.statusActive}`}>
                    {targetUser.status === 'disabled' ? 'Disabled' : 'Active'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className={styles.panel}>
              <h2 className={styles.cardTitle}>Account Information</h2>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Full Name</span>
                  <span className={styles.detailValue}>{targetUser.displayName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Nickname</span>
                  <span className={styles.detailValue}>{targetUser.nickname}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email</span>
                  <span className={styles.detailValue}>{targetUser.email}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Role</span>
                  <span className={`${styles.detailValue} ${styles.capitalize}`}>{targetUser.role}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Account Created</span>
                  <span className={styles.detailValue}>
                    {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className={styles.panel}>
              <h2 className={styles.cardTitle}>Actions</h2>

              {actionError && (
                <div className={styles.errorBanner} role="alert">
                  <span aria-hidden="true">⚠</span> {actionError}
                </div>
              )}

              <div className={styles.actionsRow}>
                <Button variant="ghost" onClick={() => setResetOpen((v) => !v)}>
                  {resetOpen ? 'Cancel' : 'Reset Password'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleStatusToggle}
                  loading={statusBusy}
                  disabled={statusBusy || isSelf}
                  title={isSelf ? "You can't deactivate your own account" : undefined}
                >
                  {targetUser.status === 'disabled' ? 'Activate' : 'Deactivate'}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleteBusy}
                  disabled={deleteBusy || isSelf}
                  title={isSelf ? "You can't delete your own account" : undefined}
                >
                  Delete
                </Button>
              </div>

              {resetOpen && (
                <form onSubmit={handleResetSubmit} className={styles.resetForm}>
                  {resetError && (
                    <div className={styles.errorBanner} role="alert">
                      <span aria-hidden="true">⚠</span> {resetError}
                    </div>
                  )}
                  <Input
                    id="viewUserResetPw"
                    label={`New password for ${targetUser.email}`}
                    type={showResetPwd ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    rightElement={ResetPwdToggleBtn}
                  />
                  <Button type="submit" size="sm" variant="primary" loading={resetSubmitting} disabled={resetSubmitting}>
                    Set Password
                  </Button>
                </form>
              )}

            </Card>

            {targetUser.role === 'student' && (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Individual Analytics</h2>
                  <Button variant="ghost" onClick={refreshAnalytics} loading={analyticsRefreshing} disabled={analyticsRefreshing}>
                    Refresh Analytics
                  </Button>
                </div>

                {analyticsError && (
                  <div className={styles.errorBanner} role="alert">
                    <span aria-hidden="true">⚠</span> {analyticsError}
                  </div>
                )}

                <Card className={styles.panel}>
                  {analytics === undefined && <p className={styles.emptyState}>Loading…</p>}
                  {analytics === null && (
                    <p className={styles.emptyState}>Not yet aggregated — click Refresh Analytics to compute.</p>
                  )}
                  {analytics && (
                    <div className={styles.analyticsGrid}>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.modulesCompleted}</span>
                        <span className={styles.analyticsLabel}>Modules Completed</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.modulesInProgress}</span>
                        <span className={styles.analyticsLabel}>Modules In Progress</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.avgQuizScore}%</span>
                        <span className={styles.analyticsLabel}>Avg. Quiz Score</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.totalSafeChoices}</span>
                        <span className={styles.analyticsLabel}>Safe Decisions</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.totalRiskyChoices}</span>
                        <span className={styles.analyticsLabel}>Risky Decisions</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>
                          {analytics.lastActivityAt ? timeAgo(analytics.lastActivityAt) : '—'}
                        </span>
                        <span className={styles.analyticsLabel}>Last Activity</span>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className={styles.panel}>
                  <h2 className={styles.cardTitle}>Module Progress</h2>
                  {moduleStatus === 'loading' && <LoadingSkeleton blocks={1} rows={4} />}
                  {moduleStatus === 'error' && <ErrorState message={moduleErrorMessage} onRetry={loadModuleProgress} />}
                  {moduleStatus === 'success' && <ModuleProgressList modules={modules} />}
                </Card>

                {moduleStatus === 'success' && (
                  <QuizRetryPanel userId={uid} modules={modules} onGranted={loadModuleProgress} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
