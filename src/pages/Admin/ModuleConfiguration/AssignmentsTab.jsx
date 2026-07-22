import React from 'react'
import { MOCK_SECTIONS, MOCK_STUDENTS } from './mockConfigData'
import styles from './ModuleConfigurationPage.module.css'

const TYPES = [
  { value: 'individual', label: 'Individual Students' },
  { value: 'sections', label: 'Entire Sections' },
  { value: 'all', label: 'All Students' },
]

/**
 * AssignmentsTab
 * Mock-only assignment picker — local state, nothing persisted. Initial
 * selection mirrors what's already shown on the module's curriculum card.
 */
export default function AssignmentsTab({ assignmentType, selectedSections, selectedStudentIds, onChange }) {
  function toggleSection(section) {
    const next = selectedSections.includes(section)
      ? selectedSections.filter((s) => s !== section)
      : [...selectedSections, section]
    onChange({ selectedSections: next })
  }

  function toggleStudent(id) {
    const next = selectedStudentIds.includes(id)
      ? selectedStudentIds.filter((s) => s !== id)
      : [...selectedStudentIds, id]
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

      {assignmentType === 'sections' && (
        <div className={styles.checkboxGrid}>
          {MOCK_SECTIONS.map((section) => (
            <label key={section} className={styles.checkboxOption}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={selectedSections.includes(section)}
                onChange={() => toggleSection(section)}
              />
              {section}
            </label>
          ))}
        </div>
      )}

      {assignmentType === 'individual' && (
        <div className={styles.checkboxGrid}>
          {MOCK_STUDENTS.map((student) => (
            <label key={student.id} className={styles.checkboxOption}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={selectedStudentIds.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
              />
              {student.name} <span className={styles.studentMeta}>({student.section})</span>
            </label>
          ))}
        </div>
      )}

      {assignmentType === 'all' && (
        <p className={styles.allStudentsNote}>
          <span aria-hidden="true">ℹ</span> This module will be assigned to every enrolled student, regardless of section.
        </p>
      )}
    </div>
  )
}
