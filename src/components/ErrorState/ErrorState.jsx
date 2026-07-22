import React from 'react'
import Card from '../Card/Card'
import Button from '../Button/Button'
import styles from './ErrorState.module.css'

/**
 * ErrorState
 * Friendly error card with a Retry button — shown whenever a Training
 * Curriculum hook's Firestore fetch fails, instead of a blank page or a
 * raw error message.
 */
export default function ErrorState({
  message = 'Something went wrong loading this data.',
  onRetry,
}) {
  return (
    <Card className={styles.card} role="alert">
      <span className={styles.icon} aria-hidden="true">⚠️</span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Card>
  )
}
