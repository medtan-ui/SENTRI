import React from 'react'
import styles from './Input.module.css'

/**
 * Reusable controlled Input
 * Supports a rightElement slot for password toggles, icons, etc.
 */
export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  autoComplete,
  rightElement,
  className = '',
  ...rest
}) {
  return (
    <div className={`${styles.group} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${error ? styles.hasError : ''}`}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        {rightElement && (
          <span className={styles.rightElement}>{rightElement}</span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
