import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Icon from '../../../components/Icon/Icon'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { getLeaderboard } from '../../../services/gamificationService'
import { useGamification } from '../../../hooks/useGamification'
import { useGamificationState } from '../../../context/GamificationContext'
import { useAuth } from '../../../context/AuthContext'
import LeaderboardCustomizationModal from '../../../components/Gamification/LeaderboardCustomizationModal'
import {
  getLeaderboardCustomization,
  resolveBadge,
} from '../../../services/showcaseBadgeService'
import styles from './StudentLeaderboardPage.module.css'

/**
 * StudentLeaderboardPage — /student/leaderboard
 * A dedicated standings and ranking page for students.
 * Displays overall student rankings, top-performer podium,
 * personalized XP standing, and point-earning mechanics.
 * Includes trainee self-customization for featuring up to 3 showcase badges
 * and a personalized title/motto.
 */
export default function StudentLeaderboardPage() {
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [board, setBoard] = useState(null)
  const [sliceFilter, setSliceFilter] = useState('all') // '10' | '25' | 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [isCustomizing, setIsCustomizing] = useState(false)

  const { user } = useAuth()
  const userId = user?.uid ?? null

  const gamificationCtx = useGamificationState()
  const gamificationHook = useGamification()
  const gamification = gamificationCtx?.gamification ?? gamificationHook?.gamification
  const catalog = gamificationCtx?.catalog?.length ? gamificationCtx.catalog : gamificationHook?.catalog ?? []

  const earnedBadgeIds = useMemo(() => gamification?.badges ?? [], [gamification?.badges])

  const [customization, setCustomization] = useState(() =>
    getLeaderboardCustomization(userId, earnedBadgeIds, catalog),
  )

  useEffect(() => {
    if (userId) {
      setCustomization(getLeaderboardCustomization(userId, earnedBadgeIds, catalog))
    }
  }, [userId, earnedBadgeIds, catalog])

  // Up to 3 showcase badge objects
  const showcaseBadges = useMemo(() => {
    const ids = customization?.badgeIds || []
    return ids.map((id) => resolveBadge(id, catalog))
  }, [customization?.badgeIds, catalog])

  const loadData = useCallback(() => {
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')
    getLeaderboard({ limit: 50 })
      .then((data) => {
        if (cancelled) return
        setBoard(data)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Could not load leaderboard data.')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered entries according to search query and slice filter
  const displayedEntries = useMemo(() => {
    if (!board?.entries) return []
    let list = board.entries

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((e) => e.displayName.toLowerCase().includes(q))
    }

    if (sliceFilter === '10') return list.slice(0, 10)
    if (sliceFilter === '25') return list.slice(0, 25)
    return list
  }, [board, searchQuery, sliceFilter])

  // Top 3 for the podium showcase (derived from full unfiltered board)
  const topThree = useMemo(() => {
    if (!board?.entries) return []
    return board.entries.slice(0, 3)
  }, [board])

  const youEntry = board?.you
  const isYouVisible = displayedEntries.some((e) => e.isYou)

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        {/* ── Page Header ── */}
        <div className={styles.header}>
          <span className={styles.badge}>
            <Icon name="trophy" size={14} /> Training Standings
          </span>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            Compete with fellow trainees, celebrate achievements, and climb the cybersecurity ranks.
          </p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={4} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={loadData} />}

        {status === 'success' && (
          <>
            {/* ── Personal Standing Highlight ── */}
            {youEntry && (
              <div className={styles.personalCard}>
                <div className={styles.personalTopRow}>
                  <div className={styles.personalLeft}>
                    <div className={styles.rankCircle}>
                      <span className={styles.rankLabel}>Rank</span>
                      <span className={styles.rankNumber}>#{youEntry.rank}</span>
                    </div>
                    <div className={styles.personalMeta}>
                      <span className={styles.personalGreeting}>Your Current Standing</span>
                      <div className={styles.personalNameRow}>
                        <span className={styles.personalName}>{youEntry.displayName}</span>
                        <span className={styles.tierTag}>{youEntry.rankName}</span>
                      </div>
                      <div className={styles.personalPills}>
                        {youEntry.currentStreak > 0 && (
                          <span className={`${styles.pillItem} ${styles.flameItem}`}>
                            <Icon name="flame" size={14} filled />
                            {youEntry.currentStreak} Day Streak
                          </span>
                        )}
                        <span className={styles.pillItem}>
                          <Icon name="star" size={14} />
                          {youEntry.badgeCount ?? gamification?.badges?.length ?? 0} Badges
                        </span>
                        <span className={styles.pillItem}>
                          Rank {youEntry.rank} of {board.totalRanked} students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.personalRight}>
                    <span className={styles.xpTotal}>{youEntry.points.toLocaleString()}</span>
                    <span className={styles.xpSub}>Total XP Points</span>
                    {gamification?.nextRankAt && (
                      <div className={styles.nextRankProgress}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  ((gamification.points - gamification.rankFloor) /
                                    (gamification.nextRankAt - gamification.rankFloor)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className={styles.progressText}>
                          {gamification.nextRankAt - gamification.points} XP to {gamification.nextRankName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Badge Showcase Bar ── */}
                <div className={styles.showcaseSection}>
                  <div className={styles.showcaseHeaderRow}>
                    <div className={styles.showcaseTitleGroup}>
                      <span className={styles.showcaseLabel}>
                        <Icon name="star" size={14} /> Featured Badges
                      </span>
                      <span className={styles.showcaseCountTag}>
                        {showcaseBadges.length} of 3 equipped
                      </span>
                      {customization.title && (
                        <span className={styles.mottoFlair}>"{customization.title}"</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.customizeBtn}
                      onClick={() => setIsCustomizing(true)}
                      aria-label="Customize badge showcase"
                    >
                      <Icon name="target" size={13} />
                      <span>Customize Badges</span>
                    </button>
                  </div>

                  <div className={styles.showcaseSlotsRow}>
                    {Array.from({ length: 3 }).map((_, idx) => {
                      const badge = showcaseBadges[idx]
                      if (badge) {
                        return (
                          <div
                            key={badge.id}
                            className={styles.showcaseSlotFilled}
                            data-tier={badge.tier}
                            onClick={() => setIsCustomizing(true)}
                            role="button"
                            tabIndex={0}
                            title={`${badge.name} (${badge.tier}) — Click to change badge`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setIsCustomizing(true)
                              }
                            }}
                          >
                            <span className={styles.showcaseDisc} data-tier={badge.tier}>
                              <Icon name={badge.icon} size={15} />
                            </span>
                            <div className={styles.showcaseSlotMeta}>
                              <span className={styles.showcaseSlotName}>{badge.name}</span>
                              <span className={styles.showcaseSlotTier}>{badge.tier}</span>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={`slot-empty-${idx}`}
                          type="button"
                          className={styles.showcaseSlotEmpty}
                          onClick={() => setIsCustomizing(true)}
                          title={`Slot ${idx + 1} empty — Click to select badge`}
                        >
                          <span className={styles.slotEmptyPlus}>+</span>
                          <span>Slot {idx + 1} (Empty)</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Top 3 Podium ── */}
            {topThree.length >= 1 && (
              <div className={styles.podiumContainer}>
                <h2 className={styles.sectionHeading}>Top Performers</h2>
                <div className={styles.podium}>
                  {/* 2nd Place */}
                  {topThree[1] ? (
                    <div className={styles.podiumStep}>
                      <span className={`${styles.medalBadge} ${styles.silverMedal}`}>🥈</span>
                      <div className={`${styles.podiumAvatar} ${styles.silverAvatar}`}>
                        {topThree[1].displayName?.[0]?.toUpperCase() ?? '2'}
                      </div>
                      <span className={styles.podiumName}>{topThree[1].displayName}</span>
                      {topThree[1].isYou && <span className={styles.podiumYouBadge}>You</span>}
                      <span className={styles.podiumRankName}>{topThree[1].rankName}</span>
                      <span className={styles.podiumPoints}>{topThree[1].points.toLocaleString()} XP</span>
                      {topThree[1].isYou && showcaseBadges.length > 0 && (
                        <div className={styles.podiumShowcaseRow} title={`Your Showcase: ${showcaseBadges.map((b) => b.name).join(', ')}`}>
                          {showcaseBadges.map((badge) => (
                            <span
                              key={badge.id}
                              className={styles.podiumBadgeDisc}
                              data-tier={badge.tier}
                              title={`${badge.name} (${badge.tier})`}
                            >
                              <Icon name={badge.icon} size={12} />
                            </span>
                          ))}
                        </div>
                      )}
                      {topThree[1].currentStreak > 0 && (
                        <span className={styles.podiumStreak}>
                          <Icon name="flame" size={12} filled /> {topThree[1].currentStreak}d
                        </span>
                      )}
                    </div>
                  ) : <div />}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <div className={`${styles.podiumStep} ${styles.firstPlace}`}>
                      <span className={`${styles.medalBadge} ${styles.goldMedal}`}>🥇</span>
                      <div className={`${styles.podiumAvatar} ${styles.goldAvatar}`}>
                        {topThree[0].displayName?.[0]?.toUpperCase() ?? '1'}
                      </div>
                      <span className={styles.podiumName}>{topThree[0].displayName}</span>
                      {topThree[0].isYou && <span className={styles.podiumYouBadge}>You</span>}
                      <span className={styles.podiumRankName}>{topThree[0].rankName}</span>
                      <span className={styles.podiumPoints}>{topThree[0].points.toLocaleString()} XP</span>
                      {topThree[0].isYou && showcaseBadges.length > 0 && (
                        <div className={styles.podiumShowcaseRow} title={`Your Showcase: ${showcaseBadges.map((b) => b.name).join(', ')}`}>
                          {showcaseBadges.map((badge) => (
                            <span
                              key={badge.id}
                              className={styles.podiumBadgeDisc}
                              data-tier={badge.tier}
                              title={`${badge.name} (${badge.tier})`}
                            >
                              <Icon name={badge.icon} size={12} />
                            </span>
                          ))}
                        </div>
                      )}
                      {topThree[0].currentStreak > 0 && (
                        <span className={styles.podiumStreak}>
                          <Icon name="flame" size={12} filled /> {topThree[0].currentStreak}d
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] ? (
                    <div className={styles.podiumStep}>
                      <span className={`${styles.medalBadge} ${styles.bronzeMedal}`}>🥉</span>
                      <div className={`${styles.podiumAvatar} ${styles.bronzeAvatar}`}>
                        {topThree[2].displayName?.[0]?.toUpperCase() ?? '3'}
                      </div>
                      <span className={styles.podiumName}>{topThree[2].displayName}</span>
                      {topThree[2].isYou && <span className={styles.podiumYouBadge}>You</span>}
                      <span className={styles.podiumRankName}>{topThree[2].rankName}</span>
                      <span className={styles.podiumPoints}>{topThree[2].points.toLocaleString()} XP</span>
                      {topThree[2].isYou && showcaseBadges.length > 0 && (
                        <div className={styles.podiumShowcaseRow} title={`Your Showcase: ${showcaseBadges.map((b) => b.name).join(', ')}`}>
                          {showcaseBadges.map((badge) => (
                            <span
                              key={badge.id}
                              className={styles.podiumBadgeDisc}
                              data-tier={badge.tier}
                              title={`${badge.name} (${badge.tier})`}
                            >
                              <Icon name={badge.icon} size={12} />
                            </span>
                          ))}
                        </div>
                      )}
                      {topThree[2].currentStreak > 0 && (
                        <span className={styles.podiumStreak}>
                          <Icon name="flame" size={12} filled /> {topThree[2].currentStreak}d
                        </span>
                      )}
                    </div>
                  ) : <div />}
                </div>
              </div>
            )}

            {/* ── Directory Table & Filters ── */}
            <Card className={styles.tableCard}>
              <div className={styles.controlsRow}>
                <div className={styles.filterGroup}>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${sliceFilter === 'all' ? styles.filterActive : ''}`}
                    onClick={() => setSliceFilter('all')}
                  >
                    All Ranked ({board.totalRanked})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${sliceFilter === '10' ? styles.filterActive : ''}`}
                    onClick={() => setSliceFilter('10')}
                  >
                    Top 10
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${sliceFilter === '25' ? styles.filterActive : ''}`}
                    onClick={() => setSliceFilter('25')}
                  >
                    Top 25
                  </button>
                </div>

                <div className={styles.searchBox}>
                  <Icon name="eye" size={16} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Filter by name…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {displayedEntries.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No trainees matched your filter.</p>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.boardTable}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Trainee</th>
                        <th>Rank Tier</th>
                        <th>Streak</th>
                        <th>Badges</th>
                        <th>Total XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedEntries.map((entry) => {
                        const isMedal1 = entry.rank === 1
                        const isMedal2 = entry.rank === 2
                        const isMedal3 = entry.rank === 3

                        return (
                          <tr key={entry.userId} className={styles.tableRow} data-you={entry.isYou}>
                            <td className={`${styles.tableCell} ${styles.rankCell}`}>
                              {isMedal1 ? (
                                <span className={`${styles.rankIcon} ${styles.rank1}`}>🥇</span>
                              ) : isMedal2 ? (
                                <span className={`${styles.rankIcon} ${styles.rank2}`}>🥈</span>
                              ) : isMedal3 ? (
                                <span className={`${styles.rankIcon} ${styles.rank3}`}>🥉</span>
                              ) : (
                                <span className={`${styles.rankIcon} ${styles.rankOther}`}>#{entry.rank}</span>
                              )}
                            </td>
                            <td className={`${styles.tableCell} ${styles.traineeCell}`}>
                              <span className={styles.tableAvatar}>
                                {entry.displayName?.[0]?.toUpperCase() ?? 'U'}
                              </span>
                              <div className={styles.traineeNameCol}>
                                <div className={styles.traineeNameRow}>
                                  <span className={styles.traineeName}>{entry.displayName}</span>
                                  {entry.isYou && <span className={styles.youBadge}>You</span>}
                                </div>
                                {entry.isYou && customization.title && (
                                  <span className={styles.traineeMottoText}>"{customization.title}"</span>
                                )}
                              </div>
                            </td>
                            <td className={`${styles.tableCell} ${styles.tierCell}`}>
                              {entry.rankName}
                            </td>
                            <td className={styles.tableCell}>
                              {entry.currentStreak > 0 ? (
                                <span className={styles.streakCell}>
                                  <Icon name="flame" size={13} filled />
                                  {entry.currentStreak}d
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-light)', fontSize: '13px' }}>—</span>
                              )}
                            </td>
                            <td className={styles.tableCell}>
                              {entry.isYou && showcaseBadges.length > 0 ? (
                                <div
                                  className={styles.tableShowcaseCell}
                                  title={`Showcase: ${showcaseBadges.map((b) => b.name).join(', ')}`}
                                >
                                  <div className={styles.tableShowcaseBadges}>
                                    {showcaseBadges.map((badge) => (
                                      <span
                                        key={badge.id}
                                        className={styles.tableBadgeDisc}
                                        data-tier={badge.tier}
                                        title={`${badge.name} (${badge.tier})`}
                                      >
                                        <Icon name={badge.icon} size={12} />
                                      </span>
                                    ))}
                                  </div>
                                  <span className={styles.tableTotalBadgeCount}>
                                    <Icon name="star" size={11} />
                                    {entry.badgeCount ?? 0}
                                  </span>
                                </div>
                              ) : (
                                <span className={styles.badgeCountCell}>
                                  <Icon name="star" size={13} />
                                  {entry.badgeCount ?? 0}
                                </span>
                              )}
                            </td>
                            <td className={`${styles.tableCell} ${styles.pointsCell}`}>
                              {entry.points.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pinned Standing Footer if you are not currently in the displayed rows */}
              {youEntry && !isYouVisible && (
                <div className={styles.pinnedRow}>
                  <div className={styles.pinnedLeft}>
                    <span>Your Standing: Rank #{youEntry.rank} of {board.totalRanked}</span>
                    <span className={styles.tierTag}>{youEntry.rankName}</span>
                    {customization.title && (
                      <span className={styles.pinnedMotto}>"{customization.title}"</span>
                    )}
                    {showcaseBadges.length > 0 && (
                      <div className={styles.pinnedShowcaseRow}>
                        {showcaseBadges.map((badge) => (
                          <span
                            key={badge.id}
                            className={styles.tableBadgeDisc}
                            data-tier={badge.tier}
                            title={`${badge.name} (${badge.tier})`}
                          >
                            <Icon name={badge.icon} size={11} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={styles.pinnedPoints}>{youEntry.points.toLocaleString()} XP</span>
                </div>
              )}
            </Card>

            {/* ── How to Earn XP / Scoring Guide ── */}
            <div className={styles.guideSection}>
              <h2 className={styles.sectionHeading}>How XP & Ranks Work</h2>
              <div className={styles.guideGrid}>
                <Card className={styles.guideCard}>
                  <span className={styles.guideIcon}>📖</span>
                  <h3 className={styles.guideTitle}>Lesson Completion</h3>
                  <span className={styles.guideReward}>+50 XP</span>
                  <p className={styles.guideDesc}>Read and complete core lessons in each cybersecurity training module.</p>
                </Card>

                <Card className={styles.guideCard}>
                  <span className={styles.guideIcon}>🛡️</span>
                  <h3 className={styles.guideTitle}>Simulations</h3>
                  <span className={styles.guideReward}>+100 XP</span>
                  <p className={styles.guideDesc}>Solve interactive defense scenarios and make the safe choices.</p>
                </Card>

                <Card className={styles.guideCard}>
                  <span className={styles.guideIcon}>📝</span>
                  <h3 className={styles.guideTitle}>Knowledge Quizzes</h3>
                  <span className={styles.guideReward}>Up to +150 XP</span>
                  <p className={styles.guideDesc}>Score high on module quizzes to earn maximum points and pass the gate.</p>
                </Card>

                <Card className={styles.guideCard}>
                  <span className={styles.guideIcon}>🔥</span>
                  <h3 className={styles.guideTitle}>Daily Training Streak</h3>
                  <span className={styles.guideReward}>+10 XP / day</span>
                  <p className={styles.guideDesc}>Log in and train every day to grow your active streak and climb faster.</p>
                </Card>
              </div>
            </div>

            {/* ── Badge & Profile Customization Modal ── */}
            <LeaderboardCustomizationModal
              open={isCustomizing}
              onClose={() => setIsCustomizing(false)}
              userId={userId}
              earnedBadgeIds={earnedBadgeIds}
              catalog={catalog}
              initialCustomization={customization}
              onSave={(updated) => setCustomization(updated)}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
