import React from 'react'
import styles from './LessonContentTab.module.css'

/**
 * EditableListField
 * Reusable add/edit/remove list of plain-text items — used for Learning
 * Objectives, Best Practices, and Key Takeaways.
 */
export default function EditableListField({ items, onChange, placeholder, addLabel }) {
  function updateItem(index, value) {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  function addItem() {
    onChange([...items, ''])
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.listField}>
      {items.map((item, i) => (
        <div key={i} className={styles.listRow}>
          <input
            type="text"
            className={styles.listInput}
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className={styles.removeItemBtn}
            onClick={() => removeItem(i)}
            disabled={items.length <= 1}
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className={styles.addItemBtn} onClick={addItem}>
        + {addLabel}
      </button>
    </div>
  )
}
