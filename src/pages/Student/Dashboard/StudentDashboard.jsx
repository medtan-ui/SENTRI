import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import Icon from '../../../components/Icon/Icon'
import ModuleGrid, { MODULE_STATUS_META, moduleDestination } from '../../../components/ModuleGrid/ModuleGrid'
import TutorialCard from '../../../components/TutorialCard/TutorialCard'
import RankMeter from '../../../components/Gamification/RankMeter'
import StreakTrack from '../../../components/Gamification/StreakTrack'
import BadgeShelf from '../../../components/Gamification/BadgeShelf'
import Leaderboard from '../../../components/Gamification/Leaderboard'
import TourGuide from '../../../components/TourGuide/TourGuide'
import { useFirstRunTour } from '../../../components/TourGuide/useFirstRunTour'
import { useAuth } from '../../../context/AuthContext'
import { useGamificationState } from '../../../context/GamificationContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { useFinalAssessment } from '../../../hooks/useFinalAssessment'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import styles from './StudentDashboard.module.css'

/**
 * StudentDashboard — /student/dashboard
 *
 * ── Why this page is shorter than it was ─────────────────────────────
 * It used to carry six stacked blocks: a greeting hero, a tip banner, a
 * "continue where you left off" panel, four stat cards, the module grid,
 * then two more panels called "What's Next" and "Module Progress". Three
 * of those answered the same question. "What's Next" listed the modules
 * that weren't finished, "Module Progress" showed a bar per module, and
 * the module grid showed both of those things already, on cards, with the
 * buttons attached. A student scrolling this page met their next module
 * three times and could act on it in three different places.
 *
 * So the redundant panels are gone rather than restyled, and the space
 * they held now carries something the page genuinely didn't have:
 * rewards. The layout is four blocks.
 *
 *   1. Hero        — who you are, how far into your rank, your streak,
 *                    and the single button that resumes training. The old
 *                    hero, tip banner and continue panel collapsed into
 *                    one, because they were all the top of the page.
 *   2. Stat strip  — four figures, no icons, no colour tiles.
 *   3. Your Modules— the grid, which is the actual curriculum.
 *   4. Rewards row — badges and the leaderboard, side by side.
 *
 * The interaction tip that used to sit in a banner here now lives in the
 * scenario intro screen (ScenarioIntroTutorial), which is where a student
 * is about to need it rather than several clicks earlier.
 */
/**
 * The first-run walkthrough. Five steps, each anchored to something real
 * on this page or in the chrome around it (see `data-tour` attributes).
 *
 * The order is the order a student actually moves through the app —
 * where the training is, how to start it, what they earn, where the
 * earnings live — rather than a tour of the navigation for its own sake.
 * A step whose anchor is missing is dropped automatically, so a brand
 * new account with no resumable module shows a four-step tour rather
 * than pointing at a button that isn't there.
 */
const TOUR_STEPS = [
  {
    title: 'Welcome to SENTRI',
    body: "Here's a 30 second tour of where everything is. You can skip it and come back to it from your profile any time.",
  },
  {
    target: 'modules',
    title: 'Your training lives here',
    body: 'Six modules, each with a lesson, a hands-on scenario and a short quiz. They unlock in order as you finish them.',
  },
  {
    target: 'continue',
    title: 'One button to pick up where you left off',
    body: 'This always points at the next thing you have to do, so you never have to work out where you got to.',
  },
  {
    target: 'rewards',
    title: 'XP and your daily streak',
    body: 'You earn XP for every step you finish, and your streak grows on any day you train. Both follow you on every page.',
  },
  {
    target: 'nav-progress',
    title: 'Badges, ranks and the leaderboard',
    body: 'Progress has the full picture: how far you have come, every badge and how you compare with your class.',
  },
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules } = useStudentModules()
  const { status: rewardStatus, gamification, catalog } = useGamificationState()
  const {
    status: finalStatus,
    unlocked: finalUnlocked,
    completed: finalCompleted,
    progress: finalProgress,
  } = useFinalAssessment()
  const { showTour, finishTour } = useFirstRunTour({ uid: user?.uid, ready: status === 'success' })

  const name = user?.nickname || user?.displayName || 'Student'

  const inProgressOrNext = modules.find((m) =>
    [MODULE_STATUS.AVAILABLE, MODULE_STATUS.IN_PROGRESS, MODULE_STATUS.QUIZ_AVAILABLE].includes(m.status),
  )

  const completedModules = modules.filter((m) => m.status === MODULE_STATUS.COMPLETED)
  const scoredModules = modules.filter((m) => typeof m.progress?.score === 'number')
  const quizAverage =
    scoredModules.length > 0
      ? Math.round(scoredModules.reduce((sum, m) => sum + m.progress.score, 0) / scoredModules.length)
      : null
  const scenariosCompleted = modules.filter((m) => m.progress?.simulationCompleted).length
  const totalModules = modules.length || 6

  const rewardsReady = rewardStatus === 'success' && gamification
  const earnedBadges = gamification?.badges ?? []

  // Four figures, chosen so no two of them say the same thing: how much
  // of the curriculum is done, how much of the hands-on part is done, how
  // well the graded part went, and how much of the reward set is claimed.
  const stats = [
    { label: 'Modules completed', value: `${completedModules.length}`, suffix: `/ ${totalModules}` },
    { label: 'Scenarios cleared', value: `${scenariosCompleted}`, suffix: `/ ${totalModules}` },
    { label: 'Quiz average', value: quizAverage === null ? '—' : `${quizAverage}`, suffix: quizAverage === null ? '' : '%' },
    {
      label: 'Badges earned',
      value: rewardsReady ? `${earnedBadges.length}` : '—',
      suffix: catalog.length > 0 ? `/ ${catalog.length}` : '',
    },
  ]

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>

        {/* ── 1. Hero: identity, standing, and the one action ── */}
        <section className={styles.hero} data-surface="dark">
          <div className={styles.heroMain}>
            <span className={styles.heroEyebrow}>Welcome back</span>
            <h1 className={styles.heroTitle}>Hey, {name}</h1>

            {inProgressOrNext ? (
              <>
                <p className={styles.heroSubtitle}>
                  {inProgressOrNext.status === MODULE_STATUS.AVAILABLE
                    ? 'Next up in your training:'
                    : 'Pick up where you left off:'}{' '}
                  <strong>{inProgressOrNext.title}</strong>
                </p>
                <button
                  type="button"
                  className={styles.heroCta}
                  data-tour="continue"
                  onClick={() => navigate(moduleDestination(inProgressOrNext))}
                >
                  {MODULE_STATUS_META[inProgressOrNext.status].cta}
                  <Icon name="arrowRight" size={17} />
                </button>
              </>
            ) : (
              <p className={styles.heroSubtitle}>
                {status === 'success'
                  ? 'Every module is done. That is the whole curriculum cleared, nice work.'
                  : 'Loading your training.'}
              </p>
            )}
          </div>

          {rewardsReady && (
            <div className={styles.heroRewards}>
              <RankMeter
                variant="dark"
                points={gamification.points}
                level={gamification.level}
                rankName={gamification.rankName}
                rankFloor={gamification.rankFloor}
                nextRankAt={gamification.nextRankAt}
                nextRankName={gamification.nextRankName}
              />
              <div className={styles.heroDivider} aria-hidden="true" />
              <StreakTrack
                variant="dark"
                currentStreak={gamification.currentStreak}
                longestStreak={gamification.longestStreak}
                lastActiveDate={gamification.lastActiveDate}
              />
            </div>
          )}
        </section>

        {/* ── 2. Stat strip ── */}
        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <p className={styles.statValue}>
                {stat.value}
                {stat.suffix && <span className={styles.statSuffix}>{stat.suffix}</span>}
              </p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── 3. The curriculum ── */}
        <section className={styles.moduleSection} data-tour="modules">
          <h2 className={styles.sectionHeading}>Your modules</h2>

          <TutorialCard />

          {status === 'loading' && <LoadingSkeleton blocks={3} rows={2} />}
          {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
          {status === 'success' && <ModuleGrid modules={modules} />}

          {/* The final assessment sits under the grid rather than in it —
              it isn't a seventh module, it's the one thing left after all
              six. Shown only once they're finished, so it never reads as
              another locked card competing for attention. */}
          {status === 'success' && finalStatus === 'success' && finalUnlocked && (
            <div className={styles.finalCallout} data-done={finalCompleted}>
              <span className={styles.finalCalloutIcon} aria-hidden="true">
                <Icon name="trophy" size={22} strokeWidth={1.7} />
              </span>
              <div className={styles.finalCalloutText}>
                <h3 className={styles.finalCalloutTitle}>
                  {finalCompleted ? 'Final assessment complete' : 'Final assessment unlocked'}
                </h3>
                <p className={styles.finalCalloutBody}>
                  {finalCompleted
                    ? `You scored ${finalProgress?.score ?? 0}%. That's the whole curriculum finished.`
                    : "Every module is done. One last test covering all six, and you're through."}
                </p>
              </div>
              <button
                type="button"
                className={styles.finalCalloutCta}
                onClick={() => navigate('/student/final-assessment')}
              >
                {finalCompleted ? 'View result' : 'Start'}
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
          )}
        </section>

        {/* ── 4. Rewards ── */}
        <div className={styles.columns}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Badges</h2>
              <button type="button" className={styles.panelLink} onClick={() => navigate('/student/progress')}>
                See all
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
            {rewardStatus === 'loading' && <p className={styles.emptyText}>Loading your badges…</p>}
            {rewardStatus === 'error' && (
              <p className={styles.emptyText}>Your badges could not be loaded right now.</p>
            )}
            {rewardsReady && <BadgeShelf catalog={catalog} earnedIds={earnedBadges} limit={4} compact />}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Leaderboard</h2>
            </div>
            <Leaderboard scope="all" limit={5} />
          </section>
        </div>
      </div>

      {showTour && <TourGuide steps={TOUR_STEPS} onFinish={finishTour} />}
    </DashboardLayout>
  )
}
