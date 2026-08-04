import React from 'react'
import Icon from '../Icon/Icon'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './TutorialCard.module.css'

function tutorialKey(uid) {
  return `sentri_tutorial_done_${uid || 'guest'}`
}

export function isTutorialDone(uid) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(tutorialKey(uid)) === 'true'
}

export function markTutorialDone(uid) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(tutorialKey(uid), 'true')
}

/**
 * TutorialCard
 * "Module 0" entry point — a client-only practice walkthrough that
 * teaches students how the interactive scenario UI works before they
 * touch a real, graded module. Deliberately not part of the Firestore
 * `modules` collection or the curriculum's moduleOrder/gating system:
 * it's always available, never locked, and its "completed" state is
 * just a localStorage flag for a checkmark, nothing is recorded server
 * side. Shared by the Dashboard and the Modules directory page.
 */
export default function TutorialCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const done = isTutorialDone(user?.uid)

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <span className={styles.iconTile} aria-hidden="true"><Icon name="play" size={22} strokeWidth={1.6} /></span>
        <div>
          <span className={styles.badge}>Module 0 · Tutorial</span>
          <h3 className={styles.title}>
            {done ? 'Getting Started (you can replay this anytime)' : 'New here? Start with the tutorial'}
          </h3>
          <p className={styles.desc}>
            A quick, hands-on walkthrough of how buttons, forms, and choices work in an interactive scenario.
            No grades, no pressure, just practice.
          </p>
        </div>
      </div>
      <button type="button" className={styles.cta} onClick={() => navigate('/student/tutorial')}>
        {done ? 'Review tutorial' : 'Start tutorial'}
        <Icon name="arrowRight" size={16} />
      </button>
    </div>
  )
}
