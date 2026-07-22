import React from 'react'
import Input from '../../../../components/Input/Input'
import styles from './LessonContentTab.module.css'

function newReferenceId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ref-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/**
 * ReferencesEditor
 * Add/edit/remove list of { title, link } reference entries. Mock data
 * only — links are plain text, nothing is fetched or validated remotely.
 */
export default function ReferencesEditor({ references, onChange }) {
  function updateReference(id, key, value) {
    onChange(references.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  function addReference() {
    onChange([...references, { id: newReferenceId(), title: '', link: '' }])
  }

  function removeReference(id) {
    onChange(references.filter((r) => r.id !== id))
  }

  return (
    <div className={styles.referencesList}>
      {references.map((ref) => (
        <div key={ref.id} className={styles.referenceRow}>
          <Input
            label="Reference Title"
            value={ref.title}
            onChange={(e) => updateReference(ref.id, 'title', e.target.value)}
            placeholder="e.g., NIST Password Guidelines"
            className={styles.referenceInputGroup}
          />
          <Input
            label="Reference Link"
            value={ref.link}
            onChange={(e) => updateReference(ref.id, 'link', e.target.value)}
            placeholder="https://…"
            className={styles.referenceInputGroup}
          />
          <button
            type="button"
            className={styles.removeReferenceBtn}
            onClick={() => removeReference(ref.id)}
          >
            × Remove
          </button>
        </div>
      ))}
      <button type="button" className={styles.addItemBtn} onClick={addReference}>
        + Add Reference
      </button>
    </div>
  )
}
