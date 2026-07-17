import React from 'react'
import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className={styles.link}>← Back to Login</Link>
      </div>
    </div>
  )
}
