import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import { MODULES, getModuleName } from './mockModules'
import styles from './ModulesPage.module.css'

/**
 * ModulesPage
 * SENTRI's cybersecurity curriculum is fixed — exactly six modules,
 * always present. Admins don't create, delete, duplicate, archive, or
 * publish modules here; this page is a read-only overview. Per-module
 * content/settings management happens on the Module Configuration page
 * (navigation only for now — that page doesn't exist yet).
 */
export default function ModulesPage() {
  const navigate = useNavigate()

  function openConfiguration(moduleId) {
    navigate(`/admin/modules/${moduleId}/configure`)
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cybersecurity Training Curriculum</h1>
          <p className={styles.subtitle}>Manage content and settings for the six core training modules.</p>
        </div>

        <div className={styles.grid}>
          {MODULES.map((m) => (
            <Card key={m.id} className={styles.moduleCard}>
              <div className={styles.cardHeader}>
                <span
                  className={styles.iconTile}
                  style={{ background: `${m.color}18`, color: m.color }}
                  aria-hidden="true"
                >
                  {m.icon}
                </span>
                <span className={styles.statusBadge} data-status={m.status.toLowerCase()}>{m.status}</span>
              </div>

              <h2 className={styles.moduleName}>{m.name}</h2>
              <p className={styles.moduleDescription}>{m.shortDescription}</p>

              <div className={styles.metaRow}>
                <span className={styles.difficultyBadge} data-difficulty={m.difficulty.toLowerCase()}>
                  {m.difficulty}
                </span>
                <span className={styles.timeText}>⏱ {m.estimatedTime}</span>
              </div>

              <div className={styles.divider} />

              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Assigned Students / Sections</span>
                {m.assignedGroups.length > 0 ? (
                  <>
                    <div className={styles.chipRow}>
                      {m.assignedGroups.map((g) => (
                        <span key={g} className={styles.chip}>{g}</span>
                      ))}
                    </div>
                    <p className={styles.studentCount}>{m.enrolledStudents} students enrolled</p>
                  </>
                ) : (
                  <p className={styles.emptyText}>No sections assigned yet</p>
                )}
              </div>

              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Prerequisite Module</span>
                <p className={styles.prereqText}>
                  {m.prerequisiteId ? getModuleName(m.prerequisiteId) : 'None — foundational module'}
                </p>
              </div>

              <Button variant="primary" fullWidth onClick={() => openConfiguration(m.id)}>
                Manage
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
