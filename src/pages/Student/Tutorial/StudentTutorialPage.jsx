import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import InteractionDemo from '../../../features/scenario/engine/InteractionDemo'
import { useAuth } from '../../../context/AuthContext'
import { markTutorialDone } from '../../../components/TutorialCard/TutorialCard'
import styles from './StudentTutorialPage.module.css'

const HOW_IT_WORKS = [
  { icon: '📖', title: 'Read the Lesson', text: 'A short lesson opens every module. Read through it, it unlocks the scenario.' },
  { icon: '🎬', title: 'Play the Scenario', text: 'A real-looking inbox, chat, or webpage appears. Click and type to make your choice.' },
  { icon: '✎', title: 'Take the Quiz', text: 'A short quiz checks what stuck. One attempt, so take your time in the scenario.' },
]

const TIPS = [
  { icon: '✅', text: 'Read each screen before you act. Nothing advances until you choose.' },
  { icon: '🖱️', text: 'Buttons and fields with a gold glow are the ones you can click or type into.' },
  { icon: '⚠️', text: 'Watch for urgency and pressure. That is usually the risky choice.' },
]

/**
 * StudentTutorialPage — /student/tutorial ("Module 0")
 * A fast, press-Next showcase of how the real curriculum works, not a
 * real graded module. Nothing here touches Firestore, "completed" is
 * just a localStorage flag (see TutorialCard) for a checkmark. Mirrors
 * the same Card + Previous/Next pagination the real Lesson Viewer uses,
 * so it feels like part of the app rather than a one-off screen.
 */
export default function StudentTutorialPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [clicked, setClicked] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  const SLIDES = [
    {
      eyebrow: 'Welcome',
      icon: '🧭',
      title: 'Welcome to SENTRI',
      body: (
        <p className={styles.slideText}>
          This is a two-minute tour of how your training works, before you meet the real thing in Module 1. No
          grades here, just click through.
        </p>
      ),
    },
    {
      eyebrow: 'How it works',
      icon: '📚',
      title: 'Every module has 3 parts',
      body: (
        <div className={styles.howList}>
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.title} className={styles.howItem}>
              <span className={styles.howNumber}>{i + 1}</span>
              <span className={styles.howIcon} aria-hidden="true">{s.icon}</span>
              <div>
                <h3 className={styles.howTitle}>{s.title}</h3>
                <p className={styles.howText}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      eyebrow: 'Watch',
      icon: '🎮',
      title: 'Buttons and forms respond to you',
      body: (
        <>
          <p className={styles.slideText}>
            In a real scenario, a gold glow means something is clickable or typeable. Watch how it works below.
          </p>
          <InteractionDemo />
          <ul className={styles.tipList}>
            {TIPS.map((t) => (
              <li key={t.text} className={styles.tipItem}>
                <span aria-hidden="true">{t.icon}</span> {t.text}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      eyebrow: 'Your turn',
      icon: '🖱️',
      title: 'Now you try it for real',
      body: (
        <div className={styles.practice}>
          <p className={styles.slideText}>
            These actually respond, this is exactly how every scenario reacts to you.
          </p>
          <div className={styles.practiceRow}>
            <button type="button" className={styles.practiceButton} onClick={() => setClicked(true)}>
              Try clicking me
            </button>
            {clicked && <span className={styles.practiceHint}>✅ Nice. Just like that.</span>}
          </div>
          <div className={styles.practiceRow}>
            <label className={styles.practiceLabel} htmlFor="tutorial-practice-input">
              Try typing something
            </label>
            <input
              id="tutorial-practice-input"
              type="text"
              className={styles.practiceInput}
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder="Type anything…"
            />
            {typedValue.trim().length >= 3 && (
              <span className={styles.practiceHint}>✅ Typed. Forms work just like this too.</span>
            )}
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'Ready',
      icon: '🎉',
      title: "You're ready to start",
      body: (
        <p className={styles.slideText}>
          That's everything. Head back to your dashboard and start Module 1 whenever you're ready.
        </p>
      ),
    },
  ]

  const totalSteps = SLIDES.length
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const slide = SLIDES[stepIndex]
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)

  function handleFinish() {
    markTutorialDone(user?.uid)
    navigate('/student/dashboard')
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Module 0 · Tutorial</span>
          <h1 className={styles.title}>Getting Started</h1>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <Card className={styles.slideCard}>
          <span className={styles.stepCount}>Step {stepIndex + 1} of {totalSteps}</span>
          <span className={styles.slideIcon} aria-hidden="true">{slide.icon}</span>
          <h2 className={styles.slideTitle}>{slide.title}</h2>
          <div className={styles.slideBody}>{slide.body}</div>

          <div className={styles.nav}>
            <Button variant="ghost" onClick={() => setStepIndex((i) => i - 1)} disabled={isFirst}>
              ← Previous
            </Button>
            {isLast ? (
              <Button variant="primary" onClick={handleFinish}>
                Finish · Back to Dashboard →
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setStepIndex((i) => i + 1)}>
                Next →
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
