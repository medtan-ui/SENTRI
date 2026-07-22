import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button'
import styles from './ModuleConfigurationPage.module.css'

/**
 * QuizTab
 * Read-only display of the module's quiz. "Configure Quiz" is a
 * navigation placeholder only — the quiz editor doesn't exist yet.
 */
export default function QuizTab({ moduleId, quiz }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Quiz Title</span>
          <span className={styles.infoValue}>{quiz.title}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Passing Score</span>
          <span className={styles.infoValue}>{quiz.passingScore}%</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Number of Questions</span>
          <span className={styles.infoValue}>{quiz.numberOfQuestions} questions</span>
        </div>
      </div>

      <Button variant="primary" onClick={() => navigate(`/admin/modules/${moduleId}/quiz`)}>
        Configure Quiz
      </Button>
    </div>
  )
}
