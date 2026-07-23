import React, { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useModule } from '../../../hooks/useModule'
import { useAssignments } from '../../../hooks/useAssignments'
import { MODULE_CONFIG } from './mockConfigData'
import OverviewTab from './OverviewTab'
import LessonContentTab from './LessonEditor/LessonContentTab'
import ScenarioTab from './ScenarioTab'
import QuizTab from './QuizTab'
import AssignmentsTab from './AssignmentsTab'
import styles from './ModuleConfigurationPage.module.css'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'lesson', label: 'Lesson Content' },
  { key: 'scenario', label: 'Scenario' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'assignments', label: 'Assignments' },
]

/**
 * ModuleConfigurationPage
 * Opened via "Manage" on a curriculum card (/admin/modules/:moduleId/configure),
 * or via a module-picker page deep-linking straight to a tab
 * (?tab=scenario / ?tab=quiz — see ScenarioManagerPage/QuizManagerPage).
 * Configures one of the six fixed modules' content and settings — no
 * create/delete, and no curriculum ordering (that lives on the Modules
 * list page — see ModulesPage's reorder controls). Overview is backed by
 * useModule(), Assignments by useAssignments() (both Firestore, via
 * moduleService / assignmentService); Lesson Content, Scenario, and Quiz
 * each manage their own Firestore-backed data independently inside their
 * own tabs. This page's Save/Discard buttons cover Overview + Assignments
 * together.
 */
export default function ModuleConfigurationPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const requested = searchParams.get('tab')
    return TABS.some((t) => t.key === requested) ? requested : 'overview'
  })

  const moduleHook = useModule(moduleId)
  const assignmentsHook = useAssignments(moduleId)

  const config = MODULE_CONFIG[moduleId]

  const dirty = moduleHook.dirty || assignmentsHook.dirty
  const saving = moduleHook.saveState === 'saving' || assignmentsHook.saveState === 'saving'
  const notice = moduleHook.notice || assignmentsHook.notice

  const pageStatus =
    moduleHook.status === 'error' || assignmentsHook.status === 'error'
      ? 'error'
      : moduleHook.status === 'loading' || assignmentsHook.status === 'loading'
        ? 'loading'
        : moduleHook.status === 'not-found'
          ? 'not-found'
          : 'ready'

  if (pageStatus === 'loading') {
    return (
      <DashboardLayout role="admin">
        <div className={styles.page}>
          <LoadingSkeleton blocks={2} rows={4} />
        </div>
      </DashboardLayout>
    )
  }

  if (pageStatus === 'error') {
    return (
      <DashboardLayout role="admin">
        <div className={styles.page}>
          <ErrorState
            message={moduleHook.errorMessage || assignmentsHook.errorMessage}
            onRetry={() => {
              moduleHook.retry()
              assignmentsHook.retry()
            }}
          />
        </div>
      </DashboardLayout>
    )
  }

  if (pageStatus === 'not-found' || !moduleHook.module || !config) {
    return (
      <DashboardLayout role="admin">
        <div className={styles.page}>
          <Card className={styles.tabCard}>
            <h1 className={styles.title}>Module not found</h1>
            <p className={styles.subtitle}>This module doesn't exist in the curriculum.</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="primary" onClick={() => navigate('/admin/modules')}>
                ← Back to Curriculum
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const module = moduleHook.module
  const assignments = assignmentsHook.assignments

  async function handleSave() {
    await Promise.all([
      moduleHook.dirty ? moduleHook.actions.save() : Promise.resolve(true),
      assignmentsHook.dirty ? assignmentsHook.actions.save() : Promise.resolve(true),
    ])
  }

  function handleDiscard() {
    moduleHook.actions.cancel()
    assignmentsHook.actions.cancel()
  }

  function handleBackToCurriculum() {
    if (dirty) {
      const confirmed = window.confirm('You have unsaved changes. Discard them and return to the curriculum?')
      if (!confirmed) return
    }
    navigate('/admin/modules')
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.topActions}>
          <Button variant="ghost" onClick={handleBackToCurriculum}>← Back to Curriculum</Button>
          <div className={styles.topActionsRight}>
            <Button variant="ghost" onClick={handleDiscard} disabled={!dirty || saving}>Discard Changes</Button>
            <Button variant="primary" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>{module.title}</h1>
          <p className={styles.subtitle}>Configure this cybersecurity training module.</p>
        </div>

        {notice && (
          <div className={styles.successBanner} role="status">
            <span aria-hidden="true">✓</span> {notice}
          </div>
        )}

        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className={styles.tabCard}>
          {activeTab === 'overview' && (
            <OverviewTab
              moduleName={module.title}
              description={module.description}
              estimatedTime={module.estimatedTime}
              difficulty={module.difficulty}
              onChange={(patch) => {
                const mapped = {}
                if ('description' in patch) mapped.description = patch.description
                if ('estimatedTime' in patch) mapped.estimatedTime = patch.estimatedTime
                if ('difficulty' in patch) mapped.difficulty = patch.difficulty
                moduleHook.actions.updateField(mapped)
              }}
            />
          )}

          {activeTab === 'lesson' && (
            <LessonContentTab moduleId={module.moduleId} />
          )}

          {activeTab === 'scenario' && (
            <ScenarioTab moduleId={module.moduleId} moduleName={module.title} scenario={config.scenario} />
          )}

          {activeTab === 'quiz' && (
            <QuizTab moduleId={module.moduleId} moduleName={module.title} quiz={config.quiz} />
          )}

          {activeTab === 'assignments' && assignments && (
            <AssignmentsTab
              assignmentType={assignments.assignmentType}
              selectedStudentIds={assignments.assignedStudentIds}
              onChange={(patch) => {
                const mapped = {}
                if ('assignmentType' in patch) mapped.assignmentType = patch.assignmentType
                if ('selectedStudentIds' in patch) mapped.assignedStudentIds = patch.selectedStudentIds
                assignmentsHook.actions.updateField(mapped)
              }}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
