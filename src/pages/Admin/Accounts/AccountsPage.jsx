import React, { useEffect, useState } from 'react'
import Icon from '../../../components/Icon/Icon'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import Input from '../../../components/Input/Input'
import { useAuth } from '../../../context/AuthContext'
import {
  deleteUserAccount,
  resetUserPassword,
  listUsers,
  getAuditLog,
  setUserAccountStatus,
} from '../../../services/adminService'
import { validatePassword } from '../../../utils/passwordPolicy'
import styles from './AccountsPage.module.css'

const AUDIT_ACTION_LABELS = {
  create_user: 'Created account',
  delete_user: 'Deleted account',
  reset_password: 'Reset password',
  deactivate_user: 'Deactivated account',
  activate_user: 'Reactivated account',
}

/**
 * AccountsPage
 * Admin-only account management: view/reset-password/deactivate/delete for
 * student and admin accounts, plus a read-only view of the audit trail.
 * Student accounts are self-registered at the public /register page, not
 * created here — this page's only creation entry point is for other admin
 * accounts (Create Admin Account), a deliberately separate flow so the two
 * never get conflated again. All authorization is re-checked server-side
 * in functions/src — this page only calls through
 * src/services/adminService.js.
 */
export default function AccountsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('accounts') // 'accounts' | 'audit'

  // ── Accounts ──
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [notice, setNotice] = useState('')

  const [resetTargetUid, setResetTargetUid] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const [showResetPwd, setShowResetPwd] = useState(false)

  const [busyUid, setBusyUid] = useState('') // delete in flight
  const [statusBusyUid, setStatusBusyUid] = useState('') // deactivate/activate in flight

  // ── Audit log ──
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState('')
  const [logsLoaded, setLogsLoaded] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (tab === 'audit' && !logsLoaded) {
      loadLogs()
    }
  }, [tab, logsLoaded])

  async function loadUsers() {
    setUsersLoading(true)
    setUsersError('')
    try {
      const result = await listUsers()
      setUsers(result)
    } catch (err) {
      setUsersError(err.message)
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadLogs() {
    setLogsLoading(true)
    setLogsError('')
    try {
      const result = await getAuditLog(100)
      setLogs(result)
      setLogsLoaded(true)
    } catch (err) {
      setLogsError(err.message)
    } finally {
      setLogsLoading(false)
    }
  }

  function openResetFor(uid) {
    setNotice('')
    setResetError('')
    setResetPassword('')
    setResetTargetUid(uid === resetTargetUid ? '' : uid)
  }

  async function handleResetSubmit(e, uid) {
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
      setResetTargetUid('')
      setResetPassword('')
      setLogsLoaded(false)
    } catch (err) {
      setResetError(err.message)
    } finally {
      setResetSubmitting(false)
    }
  }

  async function handleDelete(target) {
    if (target.uid === user?.uid) return
    const confirmed = window.confirm(`Permanently delete ${target.displayName} (${target.email})? This cannot be undone.`)
    if (!confirmed) return

    setNotice('')
    setUsersError('')
    setBusyUid(target.uid)
    try {
      await deleteUserAccount(target.uid)
      setNotice(`${target.email} was deleted.`)
      setUsers((prev) => prev.filter((u) => u.uid !== target.uid))
      setLogsLoaded(false)
    } catch (err) {
      setUsersError(err.message)
    } finally {
      setBusyUid('')
    }
  }

  async function handleStatusToggle(target) {
    if (target.uid === user?.uid) return
    const nextStatus = target.status === 'disabled' ? 'active' : 'disabled'
    const verb = nextStatus === 'disabled' ? 'Deactivate' : 'Reactivate'
    const confirmed = window.confirm(`${verb} ${target.displayName} (${target.email})?`)
    if (!confirmed) return

    setNotice('')
    setUsersError('')
    setStatusBusyUid(target.uid)
    try {
      await setUserAccountStatus(target.uid, nextStatus)
      setNotice(`${target.email} was ${nextStatus === 'disabled' ? 'deactivated' : 'reactivated'}.`)
      setUsers((prev) => prev.map((u) => (u.uid === target.uid ? { ...u, status: nextStatus } : u)))
      setLogsLoaded(false)
    } catch (err) {
      setUsersError(err.message)
    } finally {
      setStatusBusyUid('')
    }
  }

  // ── Show/Hide password toggle (mirrors LoginPage) ──
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

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'disabled' ? u.status === 'disabled' : u.status !== 'disabled')
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      u.displayName?.toLowerCase().includes(q) ||
      u.nickname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    return matchesRole && matchesStatus && matchesSearch
  })

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Accounts</h1>
            <p className={styles.subtitle}>View, update, and remove student and admin accounts.</p>
          </div>
          <div className={styles.tabs} role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'accounts'}
              className={`${styles.tabBtn} ${tab === 'accounts' ? styles.tabActive : ''}`}
              onClick={() => setTab('accounts')}
            >
              Accounts
            </button>
            <button
              role="tab"
              aria-selected={tab === 'audit'}
              className={`${styles.tabBtn} ${tab === 'audit' ? styles.tabActive : ''}`}
              onClick={() => setTab('audit')}
            >
              Audit Log
            </button>
          </div>
        </div>

        {notice && (
          <div className={styles.successBanner} role="status">
            <span aria-hidden="true">✓</span> {notice}
          </div>
        )}

        {tab === 'accounts' && (
          <>
            <div className={styles.toolbar}>
              <Input
                id="userSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, nickname, or email"
                className={styles.searchInput}
              />
              <select
                className={styles.roleSelect}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="all">All roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>
              <select
                className={styles.roleSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Deactivated</option>
              </select>
              <Button variant="primary" onClick={() => navigate('/admin/accounts/create-admin')}>
                + Create Admin Account
              </Button>
            </div>

            {usersError && (
              <div className={styles.errorBanner} role="alert">
                <span aria-hidden="true">⚠</span> {usersError}
              </div>
            )}

            <Card className={styles.tableCard}>
              {usersLoading ? (
                <p className={styles.emptyState}>Loading accounts…</p>
              ) : filteredUsers.length === 0 ? (
                <p className={styles.emptyState}>No accounts match your filters.</p>
              ) : (
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <React.Fragment key={u.uid}>
                          <tr className={u.status === 'disabled' ? styles.rowDisabled : undefined}>
                            <td>
                              {u.nickname || u.displayName}
                              {u.nickname && u.nickname !== u.displayName && (
                                <div className={styles.nicknameSub}>{u.displayName}</div>
                              )}
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleStudent}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${u.status === 'disabled' ? styles.statusDisabled : styles.statusActive}`}>
                                {u.status === 'disabled' ? 'Disabled' : 'Active'}
                              </span>
                            </td>
                            <td className={styles.mutedCell}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td>
                              <div className={styles.actionsCell}>
                                <button className={styles.linkBtn} onClick={() => navigate(`/admin/accounts/${u.uid}`)}>
                                  View
                                </button>
                                <button className={styles.linkBtn} onClick={() => openResetFor(u.uid)}>
                                  {resetTargetUid === u.uid ? 'Cancel' : 'Reset password'}
                                </button>
                                <button
                                  className={styles.linkBtn}
                                  onClick={() => handleStatusToggle(u)}
                                  disabled={u.uid === user?.uid || statusBusyUid === u.uid}
                                  title={u.uid === user?.uid ? "You can't deactivate your own account" : undefined}
                                >
                                  {statusBusyUid === u.uid ? 'Updating…' : u.status === 'disabled' ? 'Activate' : 'Deactivate'}
                                </button>
                                <button
                                  className={`${styles.linkBtn} ${styles.linkDanger}`}
                                  onClick={() => handleDelete(u)}
                                  disabled={u.uid === user?.uid || busyUid === u.uid}
                                  title={u.uid === user?.uid ? "You can't delete your own account" : undefined}
                                >
                                  {busyUid === u.uid ? 'Deleting…' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {resetTargetUid === u.uid && (
                            <tr className={styles.resetRow}>
                              <td colSpan={6}>
                                <form onSubmit={(e) => handleResetSubmit(e, u.uid)} className={styles.resetForm}>
                                  {resetError && (
                                    <div className={styles.errorBanner} role="alert">
                                      <span aria-hidden="true">⚠</span> {resetError}
                                    </div>
                                  )}
                                  <Input
                                    id={`resetPw-${u.uid}`}
                                    label={`New password for ${u.email}`}
                                    type={showResetPwd ? 'text' : 'password'}
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    rightElement={ResetPwdToggleBtn}
                                  />
                                  <div className={styles.resetActions}>
                                    <Button type="submit" size="sm" variant="primary" loading={resetSubmitting} disabled={resetSubmitting}>
                                      Set Password
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setResetTargetUid('')}>
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'audit' && (
          <Card className={styles.tableCard}>
            <div className={styles.auditHeader}>
              <h2 className={styles.cardTitle}>Recent Admin Actions</h2>
              <Button size="sm" variant="ghost" onClick={loadLogs} loading={logsLoading} disabled={logsLoading}>
                Refresh
              </Button>
            </div>
            {logsError && (
              <div className={styles.errorBanner} role="alert">
                <span aria-hidden="true">⚠</span> {logsError}
              </div>
            )}
            {logsLoading ? (
              <p className={styles.emptyState}>Loading audit log…</p>
            ) : logs.length === 0 ? (
              <p className={styles.emptyState}>No admin actions recorded yet.</p>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Action</th>
                      <th>Admin</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className={styles.mutedCell}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                        </td>
                        <td>{AUDIT_ACTION_LABELS[log.action] || log.action}</td>
                        <td>{log.actorEmail}</td>
                        <td>
                          {log.targetEmail || '—'}
                          {log.details?.role ? <span className={styles.mutedCell}> ({log.details.role})</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
