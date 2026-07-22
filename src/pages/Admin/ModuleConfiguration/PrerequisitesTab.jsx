import React from 'react'
import styles from './ModuleConfigurationPage.module.css'

/**
 * PrerequisitesTab
 * Checkbox list of the other five modules — the current module is shown
 * but disabled so it can never be selected as its own prerequisite.
 * Mock-only: selections are local state, nothing persisted.
 */
export default function PrerequisitesTab({ modules, currentModuleId, prerequisiteIds, onChange }) {
  function toggle(id) {
    if (id === currentModuleId) return
    const next = prerequisiteIds.includes(id)
      ? prerequisiteIds.filter((p) => p !== id)
      : [...prerequisiteIds, id]
    onChange({ prerequisiteIds: next })
  }

  return (
    <div className={styles.prereqList}>
      {modules.map((m) => {
        const isCurrent = m.id === currentModuleId
        return (
          <label
            key={m.id}
            className={`${styles.prereqOption} ${isCurrent ? styles.prereqOptionDisabled : ''}`}
          >
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={isCurrent ? false : prerequisiteIds.includes(m.id)}
              disabled={isCurrent}
              onChange={() => toggle(m.id)}
            />
            <span className={styles.prereqName}>{m.name}</span>
            {isCurrent && <span className={styles.prereqCurrentTag}>(current module)</span>}
          </label>
        )
      })}
    </div>
  )
}
