import React from 'react'
import Card from '../../../../components/Card/Card'
import forms from '../styles/formControls.module.css'
import styles from './QuizSettingsCard.module.css'

/**
 * QuizSettingsCard
 * The one dedicated card for this quiz's settings — passing score, time
 * limit, instructions, and availability. There is exactly one quiz per
 * module and exactly one attempt per student, so there is nothing here to
 * select or switch between.
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

        <div className={forms.fieldGroup}>
          <label className={forms.fieldLabel} htmlFor="timeLimit">Time Limit (minutes)</label>
          <input
            id="timeLimit"
            type="number"
            min={1}
            className={forms.numberInput}
            value={settings.timeLimitMinutes}
            onChange={(e) => onChange({ timeLimitMinutes: Number(e.target.value) })}
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
