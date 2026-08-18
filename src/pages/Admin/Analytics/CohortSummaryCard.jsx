import React from 'react'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import styles from './AdminAnalyticsPage.module.css'

function formatGain(gain) {
  if (gain === null || gain === undefined) return '—'
  return gain.toFixed(2)
}

/**
 * Hake's conventional bands. Reported alongside the number because a bare
 * "0.41" tells an instructor nothing on its own, and the whole point of
 * normalized gain is to be comparable against a known scale.
 */
function gainBand(gain) {
  if (gain === null || gain === undefined) return 'Not yet measurable'
  if (gain >= 0.7) return 'High gain'
  if (gain >= 0.3) return 'Medium gain'
  if (gain > 0) return 'Low gain'
  return 'No measured gain'
}

function TrendChart({ points }) {
  if (!points || points.length === 0) return null
  const max = Math.max(1, ...points.map((p) => p.modulesCompleted))

  return (
    <div className={styles.trendWrap}>
      <div className={styles.trendChart} role="img" aria-label="Module completions per day over the last 30 days">
        {points.map((p) => (
          <div
            key={p.date}
            className={styles.trendBar}
            style={{ height: `${Math.round((p.modulesCompleted / max) * 100)}%` }}
            title={`${p.date}: ${p.modulesCompleted} module${p.modulesCompleted === 1 ? '' : 's'} completed, ${p.quizzesSubmitted} quiz submission${p.quizzesSubmitted === 1 ? '' : 's'}`}
          />
        ))}
      </div>
      <div className={styles.trendAxis}>
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  )
}


/**
 * BadgeDistribution
 * How many students hold each badge, rarest first. Rarest first because
 * that ordering answers the question an instructor actually has when
 * looking at this: which achievements are out of reach for most of the
 * class, and therefore which ones are worth talking about or worth
 * re-tuning. The same figures are what a student sees on their own shelf
 * as "12% have this", so the two views can never disagree.
 */
function BadgeDistribution({ rows, totalStudents }) {
  if (!rows || rows.length === 0) {
    return <p className={styles.emptyText}>No badge data yet. Refresh the cohort to compute it.</p>
  }
  const sorted = [...rows].sort((a, b) => a.earnedCount - b.earnedCount)

  return (
    <ul className={styles.badgeStatList}>
      {sorted.map((row) => (
        <li key={row.badgeId} className={styles.badgeStatRow}>
          <span className={styles.badgeStatName}>{row.name}</span>
          <span className={styles.badgeStatBarTrack} aria-hidden="true">
            <span className={styles.badgeStatBarFill} style={{ width: `${Math.min(100, row.earnedPct)}%` }} />
          </span>
          <span className={styles.badgeStatValue}>
            {row.earnedCount}
            <span className={styles.badgeStatTotal}> / {totalStudents}</span>
            <span className={styles.badgeStatPct}>{row.earnedPct}%</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * CohortSummaryCard
 * The class-level view: how the whole cohort is moving, whether awareness
 * measurably improved, how students behave in the simulations, and
 * whether that behaviour carries across modules.
 *
 * Everything here comes from the aggregateCohortAnalytics Cloud Function
 * — this component computes nothing, it only formats. That matters
 * because these are the figures the capstone's own objectives are
 * reported against, and they should have exactly one derivation.
 */
export default function CohortSummaryCard({ summary, refreshing, onRefresh }) {
  return (
    <Card className={styles.cohortCard}>
      <div className={styles.cohortHeader}>
        <div>
          <h2 className={styles.cohortTitle}>Cohort Overview</h2>
          <p className={styles.cohortSubtitle}>
            Class-wide learning gain, behaviour, and cross-module transfer.
          </p>
        </div>
        <Button variant="ghost" data-print-hide onClick={onRefresh} loading={refreshing} disabled={refreshing}>
          Refresh Cohort
        </Button>
      </div>

      {!summary ? (
        <p className={styles.emptyText}>Not yet aggregated. Click Refresh Cohort to compute.</p>
      ) : (
        <>
          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{summary.activeStudents}</span>
              <span className={styles.statLabel}>Active / {summary.totalStudents} students</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{summary.avgModulesCompleted}</span>
              <span className={styles.statLabel}>Avg. modules done</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{summary.studentsCompletedAll}</span>
              <span className={styles.statLabel}>Finished all six</span>
            </div>
          </div>

          {/* ── Learning: did awareness improve? ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Awareness Improvement</h3>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{summary.avgPreTestScore}%</span>
                <span className={styles.statLabel}>Avg. pre-test</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{summary.avgPostTestScore}%</span>
                <span className={styles.statLabel}>Avg. final assessment</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{formatGain(summary.normalizedGain)}</span>
                <span className={styles.statLabel}>Normalized gain</span>
              </div>
            </div>
            <p className={styles.sectionNote}>
              {gainBand(summary.normalizedGain)} · based on {summary.pairedCount} student
              {summary.pairedCount === 1 ? '' : 's'} with both a pre-test and a final assessment on record.
            </p>
          </section>

          {/* ── Behaviour: Kirkpatrick Level 3 ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Behaviour in Simulations</h3>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{summary.behaviour.firstAttemptSafeRate}%</span>
                <span className={styles.statLabel}>First-attempt safe</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{summary.behaviour.consequenceTriggerRate}%</span>
                <span className={styles.statLabel}>Consequences triggered</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {summary.behaviour.medianTimeToDecideMs === null
                    ? '—'
                    : `${Math.round(summary.behaviour.medianTimeToDecideMs / 1000)}s`}
                </span>
                <span className={styles.statLabel}>Median time to decide</span>
              </div>
            </div>
            <p className={styles.sectionNote}>
              Of the risky choices made, {summary.behaviour.fastWrongCount} were quicker than the median
              decision (acting without looking) and {summary.behaviour.slowWrongCount} were slower
              (looking, then misjudging).
            </p>
          </section>

          {/* ── Transfer ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Cross-Module Transfer</h3>
            {summary.transfer.behaviouralTransfer === null ? (
              <p className={styles.emptyText}>
                Not measurable yet. This needs simulation decisions across at least two modules.
              </p>
            ) : (
              <p className={styles.sectionNote}>
                Students arrive at later modules{' '}
                <strong>
                  {summary.transfer.behaviouralTransfer > 0 ? '+' : ''}
                  {summary.transfer.behaviouralTransfer} points
                </strong>{' '}
                {summary.transfer.behaviouralTransfer >= 0 ? 'safer' : 'less safe'} on their first attempt
                than they were in the earlier half of the curriculum.
              </p>
            )}

            {summary.transfer.sharedTopics.length > 0 && (
              <ul className={styles.transferList}>
                {summary.transfer.sharedTopics.map((t) => (
                  <li key={t.topic} className={styles.transferItem}>
                    <span className={styles.transferTopic}>{t.topic}</span>
                    <span className={styles.transferDelta} data-positive={t.delta >= 0}>
                      {t.earlierCorrectRate}% → {t.laterCorrectRate}% ({t.delta >= 0 ? '+' : ''}
                      {t.delta})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Trend ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Activity, Last 30 Days</h3>
            <TrendChart points={summary.completionTrend} />
          </section>

          {/* ── Achievements: who is actually reaching what ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Badges Earned</h3>
            <BadgeDistribution
              rows={summary.badgeDistribution}
              totalStudents={summary.totalStudents}
            />
          </section>
        </>
      )}
    </Card>
  )
}
