import React from 'react'
import Input from '../../../components/Input/Input'
import { DIFFICULTY_OPTIONS } from './mockConfigData'
import styles from './ModuleConfigurationPage.module.css'

/**
 * OverviewTab
 * Module name is read-only; description, estimated time, difficulty,
 * and the enable/disable toggle are editable (local state only).
 */
export default function OverviewTab({ moduleName, description, estimatedTime, difficulty, enabled, onChange }) {
  return (
    <div className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Module Name</label>
        <div className={styles.readonlyValue}>{moduleName}</div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="overviewDescription">Description</label>
        <textarea
          id="overviewDescription"
          className={styles.textarea}
          rows={4}
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Short description shown on the curriculum card"
        />
      </div>

      <div className={styles.formRow}>
        <Input
          id="overviewEstimatedTime"
          label="Estimated Completion Time"
          value={estimatedTime}
          onChange={(e) => onChange({ estimatedTime: e.target.value })}
          placeholder="e.g., 15 min"
        />

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="overviewDifficulty">Difficulty</label>
          <select
            id="overviewDifficulty"
            className={styles.select}
            value={difficulty}
            onChange={(e) => onChange({ difficulty: e.target.value })}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Module Status</label>
        <div className={styles.toggleRow}>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            className={styles.toggleSwitch}
            data-on={enabled}
            onClick={() => onChange({ enabled: !enabled })}
          >
            <span className={styles.toggleKnob} />
          </button>
          <span className={styles.toggleLabel}>{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
    </div>
  )
}
