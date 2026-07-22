import React from 'react'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import styles from './ScenarioComplete.module.css'

/**
 * ScenarioComplete
 * Terminal screen shown once every scenario in a module's config has
 * been completed safely. Reports `result` upward via props only — it
 * never navigates on its own; the consumer decides what "Continue to
 * Quiz" does (or leaves it unhandled, since quizzes aren't built yet).
 */
export default function ScenarioComplete({ moduleTitle, result, onContinueToQuiz }) {
  return (
    <Card className={styles.card}>
      <span className={styles.icon} aria-hidden="true">🎉</span>
      <h2 className={styles.heading}>Congratulations</h2>
      <p className={styles.subheading}>Simulation Complete</p>
      <p className={styles.moduleTitle}>{moduleTitle}</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{result?.safeChoices ?? 0}</span>
          <span className={styles.statLabel}>Safe Choices</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{result?.riskyAttempts ?? 0}</span>
          <span className={styles.statLabel}>Risky Attempts</span>
        </div>
      </div>

      <p className={styles.ready}>Ready for Quiz</p>
      <Button variant="primary" onClick={() => onContinueToQuiz?.(result)}>
        Continue to Quiz →
      </Button>
    </Card>
  )
}
