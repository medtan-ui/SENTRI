import React from 'react'
import Card from '../../../../components/Card/Card'
import styles from './QuizSummaryCard.module.css'

const MINUTES_PER_QUESTION = 1

/**
 * QuizSummaryCard
 * Read-only, derived stats — never a separate source of truth. Total
 * Questions and Maximum Score come straight from the question list;
 * Estimated Completion Time is a simple per-question estimate, distinct
 * from the hard Time Limit set in QuizSettingsCard.
 */
export default function QuizSummaryCard({ questions, passingScore }) {
  const totalQuestions = questions.length
  const estimatedMinutes = Math.max(1, Math.round(totalQuestions * MINUTES_PER_QUESTION))
  const maxScore = totalQuestions

  return (
    <Card className={styles.card}>
      <h3 className={styles.heading}>Quiz Summary</h3>
      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.value}>{totalQuestions}</span>
          <span className={styles.label}>Total Questions</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.value}>~{estimatedMinutes} min</span>
          <span className={styles.label}>Estimated Completion Time</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.value}>{passingScore}%</span>
          <span className={styles.label}>Passing Percentage</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.value}>{maxScore} pts</span>
          <span className={styles.label}>Maximum Score</span>
        </div>
      </div>
    </Card>
  )
}
