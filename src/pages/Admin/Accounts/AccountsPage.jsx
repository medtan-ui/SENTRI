import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import Input from '../../../components/Input/Input'
import { useAuth } from '../../../context/AuthContext'
import { createUserAccount, deleteUserAccount, resetUserPassword, listUsers, getAuditLog } from '../../../services/adminService'
import { validatePassword, passwordStrength } from '../../../utils/passwordPolicy'
import styles from './AccountsPage.module.css'

const POLICY_RULES = ['At least 8 characters', 'One lowercase letter', 'One uppercase letter', 'One number']

const AUDIT_ACTION_LABELS = {
  create_user: 'Created account',
  delete_user: 'Deleted account',
  reset_password: 'Reset password',
}

const EMPTY_FORM = { displayName: '', email: '', role: 'student', password: '' }

/**
 * AccountsPage
 * Admin-only account management: create/delete/reset-password for
 * student and admin accounts, plus a read-only view of the audit trail.
 * All authorization is re-checked server-side in functions/index.js —
 * this page only calls through src/services/adminService.js.
 */
export default function AccountsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('accounts') // 'accounts' | 'audit'

  // ── Accounts ──
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [notice, setNotice] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const [resetTargetUid, setResetTargetUid] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showResetPwd, setShowResetPwd] = useState(false)

  const [busyUid, setBusyUid] = useState('')

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

  const { errors: createPolicyErrors } = validatePassword(form.password)
  const createStrength = passwordStrength(form.password)

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')

    if (!form.displayName.trim() || !form.email.trim()) {
      setCreateError('Name and email are required.')
      return
    }
    if (createPolicyErrors.length > 0) {
      setCreateError(`Password requirements not met: ${createPolicyErrors.join(', ')}.`)
      return
    }

    setCreating(true)
    try {
      await createUserAccount({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        role: form.role,
      })
      setNotice(`Account created for ${form.email.trim()}.`)
      setForm(EMPTY_FORM)
      setShowCreateForm(false)
      await loadUsers()
      setLogsLoaded(false)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
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

  // ── Show/Hide password toggles (mirrors LoginPage) ──
  const NewPwdToggleBtn = (
    <button
      type="button"
      onClick={() => setShowNewPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showNewPwd ? 'Hide password' : 'Show password'}
    >
      {showNewPwd ? '🙈' : '👁'}
    </button>
  )

  const ResetPwdToggleBtn = (
    <button
      type="button"
      onClick={() => setShowResetPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showResetPwd ? 'Hide password' : 'Show password'}
    >
      {showResetPwd ? '🙈' : '👁'}
    </button>
  )

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Accounts</h1>
            <p className={styles.subtitle}>Create, update, and remove student and admin accounts.</p>
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
                placeholder="Search by name or email"
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
              <Button variant="primary" onClick={() => { setShowCreateForm((v) => !v); setCreateError('') }}>
                {showCreateForm ? 'Cancel' : '+ Add Account'}
              </Button>
            </div>

            {showCreateForm && (
              <Card className={styles.formCard}>
                <h2 className={styles.cardTitle}>New Account</h2>
                {createError && (
                  <div className={styles.errorBanner} role="alert">
                    <span aria-hidden="true">⚠</span> {createError}
                  </div>
                )}
                <form onSubmit={handleCreate} className={styles.form}>
                  <div className={styles.formRow}>
                    <Input
                      id="newName"
                      label="Full Name"
                      value={form.displayName}
                      onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                      required
                    />
                    <Input
                      id="newEmail"
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.selectGroup}>
                      <label htmlFor="newRole" className={styles.selectLabel}>Role</label>
                      <select
                        id="newRole"
                        className={styles.roleSelect}
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Input
                      id="newPassword"
                      label="Temporary Password"
                      type={showNewPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      autoComplete="new-password"
                      required
                      rightElement={NewPwdToggleBtn}
                    />
                  </div>

                  {form.password && (
                    <div className={styles.strengthRow}>
                      <div className={styles.strengthTrack}>
                        <div
                          className={styles.strengthFill}
                          data-score={createStrength.score}
                          style={{ width: `${(createStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={styles.strengthLabel}>{createStrength.label}</span>
                    </div>
                  )}
                  <ul className={styles.policyList}>
                    {POLICY_RULES.map((rule) => (
                      <li key={rule} className={createPolicyErrors.includes(rule) ? styles.policyPending : styles.policyMet}>
                        {createPolicyErrors.includes(rule) ? '○' : '✓'} {rule}
                      </li>
                    ))}
                  </ul>

                  <Button type="submit" variant="primary" loading={creating} disabled={creating}>
                    Create Account
                  </Button>
                </form>
              </Card>
            )}

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
                          <tr>
                            <td>{u.displayName}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleStudent}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span className={styles.statusBadge}>{u.status}</span>
                            </td>
                            <td className={styles.mutedCell}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className={styles.actionsCell}>
                              <button className={styles.linkBtn} onClick={() => openResetFor(u.uid)}>
                                {resetTargetUid === u.uid ? 'Cancel' : 'Reset password'}
                              </button>
                              <button
                                className={`${styles.linkBtn} ${styles.linkDanger}`}
                                onClick={() => handleDelete(u)}
                                disabled={u.uid === user?.uid || busyUid === u.uid}
                                title={u.uid === user?.uid ? "You can't delete your own account" : undefined}
                              >
                                {busyUid === u.uid ? 'Deleting…' : 'Delete'}
                              </button>
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
