import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import { MODULES } from '../Modules/mockModules'
import { MODULE_CONFIG, DIFFICULTY_FROM_CURRICULUM } from './mockConfigData'
import OverviewTab from './OverviewTab'
import LessonContentTab from './LessonEditor/LessonContentTab'
import ScenarioTab from './ScenarioTab'
import QuizTab from './QuizTab'
import AssignmentsTab from './AssignmentsTab'
import PrerequisitesTab from './PrerequisitesTab'
import styles from './ModuleConfigurationPage.module.css'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'lesson', label: 'Lesson Content' },
  { key: 'scenario', label: 'Scenario' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'prerequisites', label: 'Prerequisites' },
]

function buildInitialFormState(module) {
  return {
    description: module.shortDescription,
    estimatedTime: module.estimatedTime,
    difficulty: DIFFICULTY_FROM_CURRICULUM[module.difficulty] || 'Medium',
    enabled: module.status === 'Enabled',
    assignmentType: 'sections',
    selectedSections: [...module.assignedGroups],
    selectedStudentIds: [],
    prerequisiteIds: module.prerequisiteId ? [module.prerequisiteId] : [],
  }
}

/**
 * ModuleConfigurationPage
 * Opened via "Manage" on a curriculum card (/admin/modules/:moduleId/configure).
 * Configures one of the six fixed modules' content and settings — no
 * create/delete, no Firestore, no backend. All changes are local state;
 * Save/Discard only affect this in-memory form.
 */
export default function ModuleConfigurationPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()

  const module = MODULES.find((m) => m.id === moduleId)
  const config = module ? MODULE_CONFIG[moduleId] : null

  const [activeTab, setActiveTab] = useState('overview')
  const [formState, setFormState] = useState(() => (module ? buildInitialFormState(module) : null))
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  if (!module || !formState) {
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

  function updateForm(patch) {
    setFormState((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }

  function handleSave() {
    setDirty(false)
    setNotice('Changes saved locally.')
  }

  function handleDiscard() {
    setFormState(buildInitialFormState(module))
    setDirty(false)
    setNotice('Changes discarded.')
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
            <Button variant="ghost" onClick={handleDiscard} disabled={!dirty}>Discard Changes</Button>
            <Button variant="primary" onClick={handleSave} disabled={!dirty}>Save Changes</Button>
          </div>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>{module.name}</h1>
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
              moduleName={module.name}
              description={formState.description}
              estimatedTime={formState.estimatedTime}
              difficulty={formState.difficulty}
              enabled={formState.enabled}
              onChange={updateForm}
            />
          )}

          {activeTab === 'lesson' && (
            <LessonContentTab moduleId={module.id} />
          )}

          {activeTab === 'scenario' && (
            <ScenarioTab moduleId={module.id} scenario={config.scenario} />
          )}

          {activeTab === 'quiz' && (
            <QuizTab moduleId={module.id} quiz={config.quiz} />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsTab
              assignmentType={formState.assignmentType}
              selectedSections={formState.selectedSections}
              selectedStudentIds={formState.selectedStudentIds}
              onChange={updateForm}
            />
          )}

          {activeTab === 'prerequisites' && (
            <PrerequisitesTab
              modules={MODULES}
              currentModuleId={module.id}
              prerequisiteIds={formState.prerequisiteIds}
              onChange={updateForm}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
