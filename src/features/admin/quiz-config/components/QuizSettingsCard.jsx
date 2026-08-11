import React from 'react'
import Card from '../../../../components/Card/Card'
import forms from '../styles/formControls.module.css'
import styles from './QuizSettingsCard.module.css'

/**
 * QuizSettingsCard
 * The one dedicated card for this quiz's settings — passing score,
 * instructions, and availability. There is exactly one quiz per module and
 * exactly one attempt per student, so there is nothing here to select or
 * switch between.
 *
 * There is deliberately no time limit field. One used to sit here and be
 * saved to the quiz document, but nothing ever read it: no countdown, no
 * server-side cutoff. A setting that silently does nothing is worse than
 * no setting, because an admin reasonably assumes a saved limit applies.
 * SENTRI's assessments are untimed, and now say so by omission.
 */
export default function QuizSettingsCard({ settings, onChange }) {
  return (
    <Card className={styles.card}>
      <h3 className={styles.heading}>Quiz Settings</h3>

      <div className={styles.grid}>
        <div className={forms.fieldGroup}>
          <label className={forms.fieldLabel} htmlFor="passingScore">Passing Score (%)</label>
          <input
            id="passingScore"
            type="number"
            min={0}
            max={100}
            className={forms.numberInput}
            value={settings.passingScore}
            onChange={(e) => onChange({ passingScore: Number(e.target.value) })}
          />
        </div>

      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor="quizInstructions">Quiz Instructions</label>
        <textarea
          id="quizInstructions"
          className={forms.textarea}
          rows={3}
          value={settings.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
        />
      </div>

      <div className={forms.fieldGroup}>
        <span className={forms.fieldLabel}>Quiz Availability</span>
        <div className={forms.toggleRow}>
          <button
            type="button"
            role="switch"
            aria-checked={settings.available}
            className={forms.toggleSwitch}
            data-on={settings.available}
            onClick={() => onChange({ available: !settings.available })}
          >
            <span className={forms.toggleKnob} />
          </button>
          <span className={forms.toggleLabel}>
            {settings.available ? 'Available to students' : 'Not available to students'}
          </span>
        </div>
      </div>
    </Card>
  )
}
