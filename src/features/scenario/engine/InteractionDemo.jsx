import React, { useEffect, useRef, useState } from 'react'
import styles from './InteractionDemo.module.css'

const DEMO_TEXT = 'MyStr0ngP@ss!'

// Phase timeline for the looping cursor demo. `cursorAt` positions the
// demo cursor over the mock button or mock input; `pressed` briefly
// scales/flashes the button; `typed` is how many DEMO_TEXT characters
// are currently revealed in the mock input.
const PHASES = [
  { name: 'rest', ms: 500, cursorAt: 'rest', pressed: false, typed: 0 },
  { name: 'toButton', ms: 650, cursorAt: 'button', pressed: false, typed: 0 },
  { name: 'press', ms: 260, cursorAt: 'button', pressed: true, typed: 0 },
  { name: 'afterPress', ms: 350, cursorAt: 'button', pressed: false, typed: 0 },
  { name: 'toInput', ms: 650, cursorAt: 'input', pressed: false, typed: 0 },
  // 'typing' is expanded below into one phase per character
  { name: 'holdTyped', ms: 900, cursorAt: 'input', pressed: false, typed: DEMO_TEXT.length },
  { name: 'toRest', ms: 550, cursorAt: 'rest', pressed: false, typed: DEMO_TEXT.length },
  { name: 'pause', ms: 650, cursorAt: 'rest', pressed: false, typed: 0 },
]

const TYPE_CHAR_MS = 70
const TYPING_PHASES = Array.from({ length: DEMO_TEXT.length }, (_, i) => ({
  name: `typing-${i}`,
  ms: TYPE_CHAR_MS,
  cursorAt: 'input',
  pressed: false,
  typed: i + 1,
}))

const TIMELINE = [
  ...PHASES.slice(0, 5),
  ...TYPING_PHASES,
  ...PHASES.slice(5),
]

/**
 * InteractionDemo
 * A small looping, decorative animation: a cursor clicks a mock button
 * then types into a mock field. Shared by ScenarioIntroTutorial (shown
 * before a real module's scenario) and the Module 0 tutorial slideshow,
 * so the "this is what clicking/typing looks like" visual only exists
 * once. Purely presentational, no props, no real state.
 */
export default function InteractionDemo() {
  const [stepIndex, setStepIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    const step = TIMELINE[stepIndex]
    timerRef.current = setTimeout(() => {
      setStepIndex((i) => (i + 1) % TIMELINE.length)
    }, step.ms)
    return () => clearTimeout(timerRef.current)
  }, [stepIndex])

  const step = TIMELINE[stepIndex]
  const typedText = DEMO_TEXT.slice(0, step.typed)

  return (
    <div className={styles.demoPanel}>
      <div className={styles.demoButtonRow}>
        <span className={`${styles.demoButton} ${step.pressed ? styles.demoButtonPressed : ''}`}>
          Continue
          {step.pressed && <span className={styles.ripple} key={stepIndex} />}
        </span>
      </div>

      <div className={styles.demoInputRow}>
        <span className={styles.demoInputLabel}>Type your answer</span>
        <span className={styles.demoInput}>
          {typedText}
          <span className={styles.caret} />
        </span>
      </div>

      <span className={styles.demoCursor} data-at={step.cursorAt} aria-hidden="true">🖱️</span>
    </div>
  )
}
