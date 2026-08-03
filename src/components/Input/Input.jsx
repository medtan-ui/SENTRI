import React from 'react'
import styles from './Input.module.css'

/**
 * Reusable controlled Input
 * Supports a rightElement slot for password toggles, icons, etc., and an
 * optional helperText line for fields whose purpose isn't obvious from
 * the label alone. An error replaces helper text rather than stacking
 * under it — two lines of guidance under one field is one too many.
 */
export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  required = false,
  autoComplete,
  rightElement,
  className = '',
  ...rest
}) {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

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
          aria-describedby={describedBy}
          {...rest}
        />
        {rightElement && (
          <span className={styles.rightElement}>{rightElement}</span>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className={styles.helperText}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
