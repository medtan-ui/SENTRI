import React from 'react'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useStudentRoster } from '../../../hooks/useStudentRoster'
import styles from './ModuleConfigurationPage.module.css'

const TYPES = [
  { value: 'all', label: 'All Students' },
  { value: 'students', label: 'Individual Students' },
]

/**
 * AssignmentsTab
 * Kept simple by design: a module is assigned either to every student, or
 * to a hand-picked list of specific students — no sections/groups. The
 * student list is the real registered roster (useStudentRoster), not mock
 * data.
 */
export default function AssignmentsTab({ assignmentType, selectedStudentIds, onChange }) {
  const { status, errorMessage, retry, students } = useStudentRoster()

  function toggleStudent(uid) {
    const next = selectedStudentIds.includes(uid)
      ? selectedStudentIds.filter((s) => s !== uid)
      : [...selectedStudentIds, uid]
    onChange({ selectedStudentIds: next })
  }

  return (
    <div>
      <div className={styles.radioGroup} role="radiogroup" aria-label="Assignment type">
        {TYPES.map((t) => (
          <label
            key={t.value}
            className={`${styles.radioOption} ${assignmentType === t.value ? styles.radioOptionActive : ''}`}
          >
            <input
              type="radio"
              name="assignmentType"
              className={styles.radioInput}
              checked={assignmentType === t.value}
              onChange={() => onChange({ assignmentType: t.value })}
            />
            <span className={styles.radioText}>{t.label}</span>
          </label>
        ))}
      </div>

      {assignmentType === 'students' && (
        <>
          {status === 'loading' && <LoadingSkeleton blocks={1} rows={4} />}
          {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
          {status === 'success' && students.length === 0 && (
            <p className={styles.allStudentsNote}>
              <span aria-hidden="true">ℹ</span> No student accounts exist yet — create some on the Accounts page
              first.
            </p>
          )}
          {status === 'success' && students.length > 0 && (
            <div className={styles.checkboxGrid}>
              {students.map((student) => (
                <label key={student.uid} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={selectedStudentIds.includes(student.uid)}
                    onChange={() => toggleStudent(student.uid)}
                  />
                  {student.displayName} <span className={styles.studentMeta}>({student.email})</span>
                </label>
              ))}
            </div>
          )}
        </>
      )}

      {assignmentType === 'all' && (
        <p className={styles.allStudentsNote}>
          <span aria-hidden="true">ℹ</span> This module will be assigned to every enrolled student.
        </p>
      )}
    </div>
  )
}
