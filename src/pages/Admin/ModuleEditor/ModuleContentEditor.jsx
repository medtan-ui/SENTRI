import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import Input from '../../../components/Input/Input'
import Modal from '../../../components/Modal/Modal'
import SectionPreview from './SectionPreview'
import { INITIAL_MODULE_TITLE, INITIAL_SECTIONS } from './mockLesson'
import styles from './ModuleContentEditor.module.css'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

const BLANK_SECTION = () => ({
  id: newId(),
  title: 'New Section',
  content: '',
  imageName: null,
  imagePreviewUrl: null,
  videoUrl: '',
  attachments: [],
  learningTip: '',
  importantNote: '',
})

/**
 * ModuleContentEditor
 * Admin-only lesson authoring surface for a single module's learning
 * content (sections of text, media placeholders, tips/notes). Works
 * entirely against local mock state — no Firestore, no backend calls.
 * Separate from Module Management (create/organize modules) — this page
 * is where a module's actual student-facing content gets written.
 */
export default function ModuleContentEditor() {
  const navigate = useNavigate()

  const [moduleTitle, setModuleTitle] = useState(INITIAL_MODULE_TITLE)
  const [sections, setSections] = useState(INITIAL_SECTIONS)
  const [activeSectionId, setActiveSectionId] = useState(INITIAL_SECTIONS[0].id)
  const [status, setStatus] = useState('Draft')
  const [notice, setNotice] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const imageInputRef = useRef(null)
  const attachmentInputRef = useRef(null)
  const sectionsRef = useRef(sections)

  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  // Best-effort cleanup of any object URLs created for image previews.
  useEffect(() => {
    return () => {
      sectionsRef.current.forEach((s) => {
        if (s.imagePreviewUrl) URL.revokeObjectURL(s.imagePreviewUrl)
      })
    }
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0]

  function updateField(key, value) {
    setSections((prev) => prev.map((s) => (s.id === activeSectionId ? { ...s, [key]: value } : s)))
  }

  function selectSection(id) {
    setActiveSectionId(id)
  }

  function addSection() {
    const section = BLANK_SECTION()
    setSections((prev) => [...prev, section])
    setActiveSectionId(section.id)
  }

  function deleteSection(id) {
    if (sections.length <= 1) return
    const target = sections.find((s) => s.id === id)
    const confirmed = window.confirm(`Delete section "${target?.title || 'Untitled section'}"? This cannot be undone.`)
    if (!confirmed) return

    if (target?.imagePreviewUrl) URL.revokeObjectURL(target.imagePreviewUrl)
    const next = sections.filter((s) => s.id !== id)
    setSections(next)
    if (activeSectionId === id) setActiveSectionId(next[0]?.id)
    setNotice(`"${target?.title || 'Section'}" was removed.`)
  }

  function moveSection(id, direction) {
    const index = sections.findIndex((s) => s.id === id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const next = [...sections]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    setSections(next)
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setSections((prev) => prev.map((s) => {
      if (s.id !== activeSectionId) return s
      if (s.imagePreviewUrl) URL.revokeObjectURL(s.imagePreviewUrl)
      return { ...s, imageName: file.name, imagePreviewUrl: url }
    }))
    e.target.value = ''
  }

  function handleAttachmentChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSections((prev) => prev.map((s) => (
      s.id === activeSectionId ? { ...s, attachments: [...s.attachments, { id: newId(), name: file.name }] } : s
    )))
    e.target.value = ''
  }

  function removeAttachment(attachmentId) {
    setSections((prev) => prev.map((s) => (
      s.id === activeSectionId ? { ...s, attachments: s.attachments.filter((a) => a.id !== attachmentId) } : s
    )))
  }

  function handleSaveDraft() {
    setStatus('Draft')
    setNotice('Draft saved locally.')
  }

  function handlePublish() {
    setStatus('Published')
    setNotice(`"${moduleTitle || 'Module'}" was published.`)
  }

  function handleCancel() {
    const confirmed = window.confirm('Discard changes and return to Module Management?')
    if (!confirmed) return
    navigate('/admin/modules')
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Module Content Editor</h1>
            <p className={styles.subtitle}>Create and organize learning content for a cybersecurity module.</p>
          </div>
          <div className={styles.topActions}>
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button variant="ghost" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button variant="ghost" onClick={handleSaveDraft}>Save Draft</Button>
            <Button variant="primary" onClick={handlePublish}>Publish</Button>
          </div>
        </div>

        {notice && (
          <div className={styles.successBanner} role="status">
            <span aria-hidden="true">✓</span> {notice}
          </div>
        )}

        <Card className={styles.titleCard}>
          <label htmlFor="moduleTitle" className={styles.moduleTitleLabel}>Module Title</label>
          <div className={styles.moduleTitleRow}>
            <Input
              id="moduleTitle"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g., Recognizing Phishing Emails"
              className={styles.moduleTitleInput}
            />
            <span className={styles.statusPill} data-status={status.toLowerCase()}>{status}</span>
          </div>
        </Card>

        <div className={styles.layout}>
          {/* ── Left Sidebar ── */}
          <Card className={styles.sidebarCard}>
            <h2 className={styles.panelHeading}>Sections</h2>
            <ul className={styles.sectionList}>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`${styles.sectionItem} ${s.id === activeSectionId ? styles.sectionItemActive : ''}`}
                    onClick={() => selectSection(s.id)}
                  >
                    <span className={styles.sectionIndex}>{i + 1}</span>
                    <span className={styles.sectionItemTitle}>{s.title || 'Untitled section'}</span>
                  </button>
                  <div className={styles.sectionItemActions}>
                    <button
                      type="button"
                      className={styles.miniBtn}
                      title="Move up"
                      onClick={() => moveSection(s.id, -1)}
                      disabled={i === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.miniBtn}
                      title="Move down"
                      onClick={() => moveSection(s.id, 1)}
                      disabled={i === sections.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                      title="Delete section"
                      onClick={() => deleteSection(s.id)}
                      disabled={sections.length <= 1}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" fullWidth onClick={addSection}>+ Add Section</Button>
          </Card>

          {/* ── Main Editor ── */}
          <Card className={styles.editorCard}>
            {activeSection && (
              <div className={styles.editorForm}>
                <Input
                  id="sectionTitle"
                  label="Section Title"
                  value={activeSection.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Section title"
                />

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="sectionContent">Content</label>
                  <textarea
                    id="sectionContent"
                    className={styles.contentTextarea}
                    rows={10}
                    value={activeSection.content}
                    onChange={(e) => updateField('content', e.target.value)}
                    placeholder="Write the lesson content for this section…"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Image</label>
                    <div className={styles.dropzone} onClick={() => imageInputRef.current?.click()}>
                      {activeSection.imagePreviewUrl ? (
                        <img src={activeSection.imagePreviewUrl} alt="" className={styles.dropzonePreview} />
                      ) : (
                        <>
                          <span className={styles.dropzoneIcon} aria-hidden="true">🖼</span>
                          <p className={styles.dropzoneText}>Click to upload an image</p>
                          <p className={styles.dropzoneHint}>Placeholder only — not uploaded</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={handleImageChange}
                    />
                  </div>

                  <Input
                    id="videoUrl"
                    label="Video URL"
                    value={activeSection.videoUrl}
                    onChange={(e) => updateField('videoUrl', e.target.value)}
                    placeholder="https://…"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Attachments</label>
                  {activeSection.attachments.length > 0 && (
                    <ul className={styles.attachmentList}>
                      {activeSection.attachments.map((a) => (
                        <li key={a.id} className={styles.attachmentItem}>
                          <span aria-hidden="true">📎</span> {a.name}
                          <button
                            type="button"
                            className={styles.attachmentRemoveBtn}
                            onClick={() => removeAttachment(a.id)}
                            aria-label={`Remove ${a.name}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className={styles.addAttachmentBtn} onClick={() => attachmentInputRef.current?.click()}>
                    + Add attachment
                  </button>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className={styles.hiddenInput}
                    onChange={handleAttachmentChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="learningTip">Learning Tip</label>
                  <textarea
                    id="learningTip"
                    className={`${styles.smallTextarea} ${styles.tipTextarea}`}
                    rows={2}
                    value={activeSection.learningTip}
                    onChange={(e) => updateField('learningTip', e.target.value)}
                    placeholder="A helpful tip for students…"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="importantNote">Important Note</label>
                  <textarea
                    id="importantNote"
                    className={`${styles.smallTextarea} ${styles.noteTextarea}`}
                    rows={2}
                    value={activeSection.importantNote}
                    onChange={(e) => updateField('importantNote', e.target.value)}
                    placeholder="Something students must not overlook…"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* ── Right Preview Panel ── */}
          <Card className={styles.previewCard}>
            <h2 className={styles.panelHeading}>Live Preview</h2>
            <SectionPreview moduleTitle={moduleTitle} section={activeSection} />
          </Card>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview — ${moduleTitle || 'Untitled Module'}`}
        size="lg"
        footer={<Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>}
      >
        <div className={styles.fullPreview}>
          {sections.map((s) => (
            <SectionPreview key={s.id} section={s} />
          ))}
        </div>
      </Modal>
    </DashboardLayout>
  )
}
