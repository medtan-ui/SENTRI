import React from 'react'
import styles from './LessonContentTab.module.css'

function generateSectionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `section-${crypto.randomUUID().slice(0, 8)}`
    : `section-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

/**
 * LessonSectionsEditor
 * Add / edit / reorder / remove the ordered reading sections that make up
 * a lesson. This is the shape the student Lesson Viewer actually renders:
 * one section per "page", with the table of contents and the required-
 * reading gate both derived from this list. Reordering matters — a
 * student unlocks the simulation by reaching the *last* section.
 */
export default function LessonSectionsEditor({ sections, onChange }) {
  function updateSection(index, patch) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addSection() {
    onChange([...sections, { id: generateSectionId(), title: '', content: '' }])
  }

  function removeSection(index) {
    onChange(sections.filter((_, i) => i !== index))
  }

  function moveSection(index, direction) {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className={styles.sectionsEditor}>
      {sections.map((section, index) => (
        <div key={section.id} className={styles.sectionRow}>
          <div className={styles.sectionRowHeader}>
            <span className={styles.sectionRowIndex}>Section {index + 1}</span>
            <div className={styles.sectionRowActions}>
              <button
                type="button"
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
                title="Move up"
                aria-label={`Move section ${index + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, 1)}
                disabled={index === sections.length - 1}
                title="Move down"
                aria-label={`Move section ${index + 1} down`}
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.removeItemBtn}
                onClick={() => removeSection(index)}
                disabled={sections.length <= 1}
                title={sections.length <= 1 ? 'A lesson needs at least one section' : 'Remove section'}
                aria-label={`Remove section ${index + 1}`}
              >
                ×
              </button>
            </div>
          </div>

          <input
            type="text"
            className={styles.listInput}
            value={section.title}
            onChange={(e) => updateSection(index, { title: e.target.value })}
            placeholder="Section title, e.g. Why Password Security Matters"
          />
          <textarea
            className={styles.textarea}
            rows={7}
            value={section.content}
            onChange={(e) => updateSection(index, { content: e.target.value })}
            placeholder="Section body. Blank lines become paragraph breaks for students."
          />
        </div>
      ))}

      <button type="button" className={styles.addItemBtn} onClick={addSection}>
        + Add Section
      </button>
    </div>
  )
}
