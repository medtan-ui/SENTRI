/**
 * showcaseBadgeService.js
 * Manages leaderboard self-customization for students:
 * - Badge showcase (up to 3 featured badges)
 * - Custom trainee motto / title
 *
 * Persisted in localStorage per student UID, with fallback to their
 * top earned badges so trainees always start with a tailored showcase.
 */

const STORAGE_PREFIX = 'sentri:leaderboard_customization:'

export const MAX_SHOWCASE_BADGES = 3

/**
 * Fallback catalog definitions if the full catalog has not yet loaded
 * or in offline / testing mode.
 */
export const FALLBACK_CATALOG = [
  { id: 'first-steps', name: 'First Steps', description: 'Finish your first lesson.', icon: 'book', tier: 'bronze' },
  { id: 'baseline-set', name: 'Baseline Set', description: 'Take your first pre-test.', icon: 'target', tier: 'bronze' },
  { id: 'field-ready', name: 'Field Ready', description: 'Get through your first interactive scenario.', icon: 'shield', tier: 'bronze' },
  { id: 'one-down', name: 'One Down', description: 'Complete a whole module, lesson to quiz.', icon: 'check', tier: 'bronze' },
  { id: 'show-your-work', name: 'Show Your Work', description: 'Finish the final assessment.', icon: 'bolt', tier: 'silver' },
  { id: 'halfway-there', name: 'Halfway There', description: 'Complete three of the six modules.', icon: 'star', tier: 'silver' },
  { id: 'clean-sheet', name: 'Clean Sheet', description: 'Finish an interactive scenario with zero risky clicks.', icon: 'shield', tier: 'silver' },
  { id: 'on-a-roll', name: 'On a Roll', description: 'Build a seven-day training streak.', icon: 'flame', tier: 'silver' },
  { id: 'flawless', name: 'Flawless', description: 'Score 100% on a module quiz.', icon: 'star', tier: 'gold' },
  { id: 'full-sweep', name: 'Full Sweep', description: 'Complete every module in the curriculum.', icon: 'trophy', tier: 'gold' },
  { id: 'ironclad', name: 'Ironclad', description: 'Maintain a 14-day training streak.', icon: 'flame', tier: 'gold' },
  { id: 'mastery', name: 'Mastery', description: 'Pass the final assessment with a top score.', icon: 'trophy', tier: 'gold' },
]

/**
 * Resolves a badge object by ID using the provided catalog or fallback catalog.
 *
 * @param {string} badgeId
 * @param {Array<object>} catalog
 * @returns {object}
 */
export function resolveBadge(badgeId, catalog = []) {
  const fromCatalog = (catalog || []).find((b) => b.id === badgeId)
  if (fromCatalog) return fromCatalog

  const fromFallback = FALLBACK_CATALOG.find((b) => b.id === badgeId)
  if (fromFallback) return fromFallback

  // Graceful fallback for any unknown badge id
  return {
    id: badgeId,
    name: badgeId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: 'Special achievement badge',
    icon: 'star',
    tier: 'bronze',
  }
}

/**
 * Returns default up to 3 earned badges, prioritizing gold > silver > bronze.
 *
 * @param {string[]} earnedBadgeIds
 * @param {Array<object>} catalog
 * @returns {string[]}
 */
export function getDefaultShowcaseBadges(earnedBadgeIds = [], catalog = []) {
  if (!Array.isArray(earnedBadgeIds) || earnedBadgeIds.length === 0) return []

  const tierWeight = { gold: 3, silver: 2, bronze: 1 }
  const catalogMap = new Map((catalog || []).map((b) => [b.id, b]))

  const sorted = [...earnedBadgeIds].sort((a, b) => {
    const itemA = catalogMap.get(a) || FALLBACK_CATALOG.find((x) => x.id === a)
    const itemB = catalogMap.get(b) || FALLBACK_CATALOG.find((x) => x.id === b)
    const weightA = tierWeight[itemA?.tier] || 1
    const weightB = tierWeight[itemB?.tier] || 1
    return weightB - weightA
  })

  return sorted.slice(0, MAX_SHOWCASE_BADGES)
}

/**
 * Reads leaderboard customization for a given user from localStorage.
 * If none has been configured, returns smart defaults based on earned badges.
 *
 * @param {string} userId
 * @param {string[]} earnedBadgeIds
 * @param {Array<object>} catalog
 * @returns {{ badgeIds: string[], title: string }}
 */
export function getLeaderboardCustomization(userId, earnedBadgeIds = [], catalog = []) {
  const defaults = {
    badgeIds: getDefaultShowcaseBadges(earnedBadgeIds, catalog),
    title: '',
  }

  if (!userId) return defaults

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      const earnedSet = new Set(earnedBadgeIds)

      // Filter to badges the user actually holds (if earned badges provided)
      let validBadges = Array.isArray(parsed.badgeIds) ? parsed.badgeIds : []
      if (earnedSet.size > 0) {
        validBadges = validBadges.filter((id) => earnedSet.has(id))
      }

      // If user had customized but cleared or none valid, use customized array if explicitly set
      const badgeIds = validBadges.slice(0, MAX_SHOWCASE_BADGES)

      return {
        badgeIds: parsed.hasConfigured ? badgeIds : (badgeIds.length > 0 ? badgeIds : defaults.badgeIds),
        title: typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 40) : '',
        hasConfigured: Boolean(parsed.hasConfigured),
      }
    }
  } catch (err) {
    console.warn('[showcaseBadgeService] Failed to read customization:', err)
  }

  return defaults
}

/**
 * Saves leaderboard customization to localStorage.
 *
 * @param {string} userId
 * @param {{ badgeIds: string[], title?: string }} customization
 */
export function saveLeaderboardCustomization(userId, customization) {
  if (!userId) return

  try {
    const toSave = {
      badgeIds: (customization.badgeIds || []).slice(0, MAX_SHOWCASE_BADGES),
      title: (customization.title || '').trim().slice(0, 40),
      hasConfigured: true,
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(toSave))
    window.dispatchEvent(
      new CustomEvent('sentri:leaderboard_customization_change', {
        detail: { userId, ...toSave },
      }),
    )
  } catch (err) {
    console.warn('[showcaseBadgeService] Failed to save customization:', err)
  }
}
