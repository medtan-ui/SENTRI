import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import Icon from '../../../components/Icon/Icon'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import ModuleProgressList from '../../../components/ModuleProgressList/ModuleProgressList'
import RankMeter from '../../../components/Gamification/RankMeter'
import StreakTrack from '../../../components/Gamification/StreakTrack'
import BadgeShelf from '../../../components/Gamification/BadgeShelf'
import Leaderboard from '../../../components/Gamification/Leaderboard'
import { useAuth } from '../../../context/AuthContext'
import { useGamificationState } from '../../../context/GamificationContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import { aggregateStudentAnalytics, getStudentAnalytics } from '../../../services/analyticsService'
import { timeAgo } from '../../../utils/timeAgo'
import styles from './StudentProgressPage.module.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'leaderboard', label: 'Leaderboard' },
]

/**
 * StudentProgressPage — /student/progress
 *
 * Everything a student can know about their own training, which is now
 * enough material that it needs dividing. Three tabs:
 *
 *   Overview     — completion, scores, per-module bars, pre/post-test
 *                  movement and decision analytics. The page as it was.
 *   Achievements — the full badge catalog, earned and locked.
 *   Leaderboard  — the same board the dashboard previews, at full length.
 *
 * Tabs rather than more stacked sections because these are three
 * different questions ("how am I doing", "what have I unlocked", "how do
 * I compare"), and a student arrives with one of them in mind. Stacking
 * them would have made a page you scroll past two thirds of every visit.
 *
 * The rank and streak summary sits *above* the tabs, not inside one: it
 * is the answer to all three questions at once, and it is the thing the
 * navbar chip is a shortcut to.
 *
 * Panels that need a Cloud Function (the learning gain and decision
 * analytics) keep their existing on-demand refresh — nothing about their
 * behaviour changed here.
 */
export default function StudentProgressPage() {
  const { user } = useAuth()
  const { status, errorMessage, retry, modules } = useStudentModules()
  const { status: rewardStatus, gamification, catalog } = useGamificationState()
  const [tab, setTab] = useState('overview')
  const [analytics, setAnalytics] = useState(undefined) // undefined = loading, null = not yet aggregated
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    getStudentAnalytics(user.uid)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
  }, [user?.uid])

  async function refreshAnalytics() {
    setRefreshing(true)
    setAnalyticsError('')
    try {
      const summary = await aggregateStudentAnalytics()
      setAnalytics(summary)
    } catch (err) {
      setAnalyticsError(err?.message || 'Something went wrong refreshing your analytics. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  // Modules where the quiz is done but the post-test isn't — the students
  // most worth nudging, since their learning gain can't be computed until
  // they finish that last step.
  const pendingPostTests = modules.filter(
    (m) => m.progress?.quizCompleted && !m.progress?.postTestCompleted,
  )

  const completedCount = modules.filter((m) => m.status === MODULE_STATUS.COMPLETED).length
  const scores = modules.map((m) => m.progress?.score).filter((s) => typeof s === 'number')
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null
  const overallPct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0

  const rewardsReady = rewardStatus === 'success' && gamification
  const earnedBadges = gamification?.badges ?? []

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Progress</h1>
          <p className={styles.subtitle}>How far you've come across the whole curriculum.</p>
        </div>

        {/* ── Standing: true regardless of which tab is open ── */}
        {rewardsReady && (
          <Card className={styles.standing}>
            <div className={styles.standingRank}>
              <RankMeter
                points={gamification.points}
                level={gamification.level}
                rankName={gamification.rankName}
                rankFloor={gamification.rankFloor}
                nextRankAt={gamification.nextRankAt}
                nextRankName={gamification.nextRankName}
              />
            </div>
            <div className={styles.standingDivider} aria-hidden="true" />
            <div className={styles.standingStreak}>
              <StreakTrack
                currentStreak={gamification.currentStreak}
                longestStreak={gamification.longestStreak}
                lastActiveDate={gamification.lastActiveDate}
              />
            </div>
          </Card>
        )}

        {/* ── Tabs ── */}
        <div className={styles.tabs} role="tablist" aria-label="Progress views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              className={styles.tab}
              data-active={tab === item.id || undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            {status === 'loading' && <LoadingSkeleton blocks={2} rows={3} />}
            {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

            {status === 'success' && (
              <>
                <div className={styles.statsGrid}>
                  <Card className={styles.statCard}>
                    <p className={styles.statValue}>{completedCount} / {modules.length}</p>
                    <p className={styles.statLabel}>Modules completed</p>
                  </Card>
                  <Card className={styles.statCard}>
                    <p className={styles.statValue}>{overallPct}%</p>
                    <p className={styles.statLabel}>Curriculum complete</p>
                  </Card>
                  <Card className={styles.statCard}>
                    <p className={styles.statValue}>{avgScore === null ? '—' : `${avgScore}%`}</p>
                    <p className={styles.statLabel}>Average quiz score</p>
                  </Card>
                </div>

                <Card className={styles.panel}>
                  <h2 className={styles.panelTitle}>Module progress</h2>
                  <ModuleProgressList modules={modules} />
                </Card>

                {pendingPostTests.length > 0 && (
                  <Card className={styles.panel}>
                    <h2 className={styles.panelTitle}>Post-tests waiting</h2>
                    <p className={styles.emptyText}>
                      You've finished the quiz for {pendingPostTests.length} module
                      {pendingPostTests.length === 1 ? '' : 's'} but haven't taken the post-test yet. It's the same
                      short set of questions you answered at the start, and it's what shows you how much you picked
                      up.
                    </p>
                    <ul className={styles.pendingList}>
                      {pendingPostTests.map((m) => (
                        <li key={m.moduleId}>
                          <Link className={styles.pendingLink} to={`/student/modules/${m.moduleId}/post-test`}>
                            {m.title}: take the post-test
                            <Icon name="arrowRight" size={14} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Card className={styles.panel}>
                  <h2 className={styles.panelTitle}>What you've learned</h2>
                  {analytics === undefined && <p className={styles.emptyText}>Loading…</p>}
                  {analytics === null && (
                    <p className={styles.emptyText}>
                      Not yet aggregated. Use "Refresh My Analytics" below to compute.
                    </p>
                  )}
                  {analytics && !analytics.pairedCount && (
                    <p className={styles.emptyText}>
                      Nothing to compare yet. Once you've taken both the pre-test and the post-test for a module,
                      your before-and-after shows up here.
                    </p>
                  )}
                  {analytics && analytics.pairedCount > 0 && (
                    <>
                      <div className={styles.analyticsGrid}>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsValue}>{analytics.avgPreTestScore}%</span>
                          <span className={styles.analyticsLabel}>Average before</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsValue}>{analytics.avgPostTestScore}%</span>
                          <span className={styles.analyticsLabel}>Average after</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsValue}>
                            {analytics.behaviour?.firstAttemptSafeRate ?? 0}%
                          </span>
                          <span className={styles.analyticsLabel}>Safe on first try</span>
                        </div>
                      </div>

                      {Array.isArray(analytics.timeline) && analytics.timeline.length > 0 && (
                        <ul className={styles.timelineList}>
                          {analytics.timeline
                            .filter((point) => point.preTestScore !== null || point.postTestScore !== null)
                            .map((point) => {
                              const module = modules.find((m) => m.moduleId === point.moduleId)
                              return (
                                <li key={point.moduleId} className={styles.timelineRow}>
                                  <span className={styles.timelineName}>{module?.title || point.moduleId}</span>
                                  <span className={styles.timelineScores}>
                                    {point.preTestScore ?? '—'}% → {point.postTestScore ?? '—'}%
                                  </span>
                                </li>
                              )
                            })}
                        </ul>
                      )}
                    </>
                  )}
                </Card>

                <Card className={styles.panel}>
                  <div className={styles.panelHeaderRow}>
                    <h2 className={styles.panelTitle} style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                      Decision analytics
                    </h2>
                    <Button variant="ghost" onClick={refreshAnalytics} loading={refreshing} disabled={refreshing}>
                      Refresh My Analytics
                    </Button>
                  </div>

                  {analyticsError && (
                    <div className={styles.errorBanner} role="alert">
                      <Icon name="alert" size={15} /> {analyticsError}
                    </div>
                  )}

                  {analytics === undefined && <p className={styles.emptyText}>Loading…</p>}
                  {analytics === null && (
                    <p className={styles.emptyText}>Not yet aggregated. Click Refresh to compute.</p>
                  )}
                  {analytics && (
                    <div className={styles.analyticsGrid}>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.totalSafeChoices}</span>
                        <span className={styles.analyticsLabel}>Safe decisions</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>{analytics.totalRiskyChoices}</span>
                        <span className={styles.analyticsLabel}>Risky decisions</span>
                      </div>
                      <div className={styles.analyticsStat}>
                        <span className={styles.analyticsValue}>
                          {analytics.lastActivityAt ? timeAgo(analytics.lastActivityAt) : '—'}
                        </span>
                        <span className={styles.analyticsLabel}>Last activity</span>
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {/* ── Achievements ── */}
        {tab === 'achievements' && (
          <div role="tabpanel" id="panel-achievements" aria-labelledby="tab-achievements">
            <Card className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitle} style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                  Badges
                </h2>
                {rewardsReady && (
                  <span className={styles.countTag}>
                    {earnedBadges.length} of {catalog.length} earned
                  </span>
                )}
              </div>

              {rewardStatus === 'loading' && <p className={styles.emptyText}>Loading your badges…</p>}
              {rewardStatus === 'error' && (
                <p className={styles.emptyText}>Your badges could not be loaded right now.</p>
              )}
              {rewardsReady && <BadgeShelf catalog={catalog} earnedIds={earnedBadges} />}
            </Card>

            {rewardsReady && (
              <Card className={styles.panel}>
                <h2 className={styles.panelTitle}>How XP works</h2>
                <ul className={styles.xpList}>
                  <li><span>Pre-test</span><span>10 XP</span></li>
                  <li><span>Lesson finished</span><span>20 XP</span></li>
                  <li><span>Scenario cleared</span><span>40 XP</span></li>
                  <li><span>Quiz submitted</span><span>25 XP + half your score</span></li>
                  <li><span>Perfect quiz</span><span>25 XP bonus</span></li>
                  <li><span>Post-test</span><span>15 XP</span></li>
                  <li><span>Module completed</span><span>60 XP</span></li>
                </ul>
                <p className={styles.emptyText}>
                  Your total is recalculated from your actual progress, so nothing is ever lost and nothing can be
                  double counted.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* ── Leaderboard ── */}
        {tab === 'leaderboard' && (
          <div role="tabpanel" id="panel-leaderboard" aria-labelledby="tab-leaderboard">
            <Card className={styles.panel}>
              <h2 className={styles.panelTitle}>Standings</h2>
              <Leaderboard limit={20} />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
