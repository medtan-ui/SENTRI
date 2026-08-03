import React, { useState } from 'react'
import styles from './AdminAnalyticsPage.module.css'

const MAX_ITEMS_COLLAPSED = 5

function formatGain(gain) {
  if (gain === null || gain === undefined) return '—'
  return gain.toFixed(2)
}

/**
 * Why an item's discrimination index is missing. D is deliberately
 * suppressed until enough whole attempts exist for a 27% upper/lower split
 * to mean anything, so the honest reading of a blank D is "not enough data
 * yet", not "this failed to compute" — and an instructor can only tell
 * those apart if the shortfall is spelled out.
 */
function discriminationPendingLabel(item) {
  const needed = item.minAttemptsForDiscrimination
  if (typeof needed !== 'number' || typeof item.attemptCount !== 'number') {
    return 'Needs more attempts before this can be computed.'
  }
  const remaining = Math.max(0, needed - item.attemptCount)
  return remaining > 0
    ? `${item.attemptCount} of ${needed} attempts so far. ${remaining} more and this becomes reportable.`
    : `Held back until the upper/lower split has at least ${needed} attempts to work with.`
}

/**
 * ModuleLearningDetail
 * The per-module half of the Learning Analytics framework, folded into
 * each module card: the pre/post gain for this module, which topics
 * moved, and which individual items are behaving badly.
 *
 * Item analysis is collapsed by default and sorted hardest-first, because
 * the reason to open it is almost always "which questions are the class
 * failing", not "let me read all 25".
 */
export default function ModuleLearningDetail({ summary }) {
  const [showItems, setShowItems] = useState(false)

  const topics = summary.topicMastery || []
  const items = summary.itemAnalysis || []
  const behaviour = summary.behaviour

  return (
    <div className={styles.detail}>
      <section className={styles.detailSection}>
        <h3 className={styles.detailHeading}>Awareness Improvement</h3>
        <div className={styles.miniStatRow}>
          <span className={styles.miniStat}>
            <strong>{summary.avgPreTestScore}%</strong> pre
          </span>
          <span className={styles.miniArrow} aria-hidden="true">→</span>
          <span className={styles.miniStat}>
            <strong>{summary.avgPostTestScore}%</strong> post
          </span>
          <span className={styles.miniStat}>
            <strong>{formatGain(summary.normalizedGain)}</strong> gain
          </span>
        </div>
        <p className={styles.detailNote}>
          {summary.pairedCount} paired result{summary.pairedCount === 1 ? '' : 's'} ·{' '}
          {summary.postTestCompletedCount} post-test{summary.postTestCompletedCount === 1 ? '' : 's'} submitted
        </p>
      </section>

      {behaviour && behaviour.totalDecisions > 0 && (
        <section className={styles.detailSection}>
          <h3 className={styles.detailHeading}>Behaviour</h3>
          <p className={styles.detailNote}>
            {behaviour.firstAttemptSafeRate}% chose safely on their first attempt ·{' '}
            {behaviour.consequenceTriggerRate}% of decisions triggered a consequence
            {behaviour.medianTimeToDecideMs !== null &&
              ` · ${Math.round(behaviour.medianTimeToDecideMs / 1000)}s median decision`}
          </p>
        </section>
      )}

      {topics.length > 0 && (
        <section className={styles.detailSection}>
          <h3 className={styles.detailHeading}>Topic Mastery</h3>
          <ul className={styles.topicList}>
            {topics.map((t) => (
              <li key={t.topic} className={styles.topicRow}>
                <span className={styles.topicName}>{t.topic}</span>
                <span className={styles.topicBarTrack}>
                  <span className={styles.topicBarFill} style={{ width: `${t.postCorrectRate}%` }} />
                </span>
                <span className={styles.topicDelta} data-positive={(t.gain ?? 0) >= 0}>
                  {t.gain === null ? `${t.quizCorrectRate}% quiz` : `${t.gain >= 0 ? '+' : ''}${t.gain}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <section className={styles.detailSection}>
          <button type="button" className={styles.detailToggle} onClick={() => setShowItems((v) => !v)}>
            {showItems ? 'Hide item analysis' : `Item analysis (${items.length} items)`}
          </button>

          {showItems && (
            <ul className={styles.itemList}>
              {items.slice(0, showItems ? items.length : MAX_ITEMS_COLLAPSED).map((item) => (
                <li key={`${item.assessmentType}-${item.questionId}`} className={styles.itemRow}>
                  <span className={styles.itemMeta}>
                    {item.assessmentType} · {item.topic || 'untagged'}
                  </span>
                  <span className={styles.itemDifficulty} data-label={item.difficultyLabel}>
                    {item.difficultyLabel} ({Math.round(item.difficulty * 100)}%)
                  </span>
                  <span className={styles.itemDiscrimination}>
                    {item.discrimination === null ? (
                      <span className={styles.itemPending} title={discriminationPendingLabel(item)}>
                        D: pending ({item.attemptCount ?? 0}/{item.minAttemptsForDiscrimination ?? '—'})
                      </span>
                    ) : (
                      `D: ${item.discrimination.toFixed(2)}`
                    )}
                    {item.discrimination !== null && item.discrimination < 0.2 && (
                      <span className={styles.itemFlag} title="Low discrimination, so this item may need rewriting">
                        ⚠
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
