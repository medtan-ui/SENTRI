/**
 * modules/gamification/catalog.ts
 * The rulebook: what earns points, what each rank is called, and what a
 * badge is awarded for. Everything here is pure data plus pure functions
 * over that data — no Firestore, no clock, no request context — so the
 * whole reward scheme can be read (and unit-tested) in one place instead
 * of being scattered through the code that happens to write it.
 *
 * Two properties this file is built around:
 *
 *   1. Points are a *function of a student's progress state*, never a
 *      running tally that gets incremented. Recomputing from scratch
 *      always produces the same number, so a retried trigger, a granted
 *      quiz retry, or an admin resetting a module can never inflate or
 *      strand a score. See service.recomputeFromProgress.
 *   2. A badge is a predicate over the same derived totals. Once earned it
 *      is kept forever (service.ts unions rather than replaces), because a
 *      badge is a record of something that happened, not a description of
 *      the present.
 */

/** What each completed step is worth. */
export const POINTS = {
  PRETEST: 10,
  LESSON: 20,
  SIMULATION: 40,
  /** Every submitted quiz earns this much before the score bonus. */
  QUIZ_BASE: 25,
  /** Plus half the percentage scored, so a 100% quiz is worth 75. */
  QUIZ_SCORE_MULTIPLIER: 0.5,
  /** One-off bonus on top for a flawless quiz. */
  QUIZ_PERFECT_BONUS: 25,
  POSTTEST: 15,
  MODULE: 60,
} as const

/**
 * Ranks, lowest first. The top threshold is deliberately just under what
 * a perfect run of all six modules yields (6 x 245 = 1470), so the last
 * rank is reachable by finishing the curriculum well rather than being
 * permanently out of reach.
 */
export interface Rank {
  level: number
  name: string
  minPoints: number
}

export const RANKS: readonly Rank[] = [
  { level: 1, name: 'Trainee', minPoints: 0 },
  { level: 2, name: 'Cadet', minPoints: 120 },
  { level: 3, name: 'Analyst', minPoints: 300 },
  { level: 4, name: 'Specialist', minPoints: 550 },
  { level: 5, name: 'Sentinel', minPoints: 850 },
  { level: 6, name: 'Guardian', minPoints: 1150 },
  { level: 7, name: 'Vanguard', minPoints: 1450 },
] as const

export interface RankProgress {
  level: number
  rankName: string
  /** Points at which the current rank started. */
  rankFloor: number
  /** Points needed for the next rank, or null at the top rank. */
  nextRankAt: number | null
  nextRankName: string | null
  /** 0-100, how far through the current rank the student is. 100 at the top rank. */
  progressPct: number
}

export function rankFor(points: number): RankProgress {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (points >= rank.minPoints) current = rank
  }
  const next = RANKS.find((r) => r.minPoints > current.minPoints) ?? null
  const span = next ? next.minPoints - current.minPoints : 0
  return {
    level: current.level,
    rankName: current.name,
    rankFloor: current.minPoints,
    nextRankAt: next ? next.minPoints : null,
    nextRankName: next ? next.name : null,
    progressPct: next && span > 0 ? Math.min(100, Math.round(((points - current.minPoints) / span) * 100)) : 100,
  }
}

/**
 * The totals every badge rule is written against. Derived once from a
 * student's six moduleProgress documents (plus their streak), so a badge
 * rule never has to know how progress is stored.
 */
export interface GamificationTotals {
  lessonsCompleted: number
  simulationsCompleted: number
  quizzesCompleted: number
  modulesCompleted: number
  pretestsCompleted: number
  posttestsCompleted: number
  perfectQuizzes: number
  bestQuizScore: number | null
  averageQuizScore: number | null
  currentStreak: number
  longestStreak: number
}

/**
 * `icon` names a shape in the frontend's badge icon set
 * (src/components/Icon), not an image file — badges render as CSS
 * medallions so there is nothing to load and nothing to keep in sync.
 * `tier` only drives that medallion's colour.
 */
export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: 'book' | 'shield' | 'target' | 'star' | 'flame' | 'trophy' | 'bolt' | 'check'
  tier: 'bronze' | 'silver' | 'gold'
  earned: (totals: GamificationTotals) => boolean
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Finish your first lesson.',
    icon: 'book',
    tier: 'bronze',
    earned: (t) => t.lessonsCompleted >= 1,
  },
  {
    id: 'baseline-set',
    name: 'Baseline Set',
    description: 'Take your first pre-test, so you have a before to compare against.',
    icon: 'target',
    tier: 'bronze',
    earned: (t) => t.pretestsCompleted >= 1,
  },
  {
    id: 'field-ready',
    name: 'Field Ready',
    description: 'Get through your first interactive scenario.',
    icon: 'shield',
    tier: 'bronze',
    earned: (t) => t.simulationsCompleted >= 1,
  },
  {
    id: 'one-down',
    name: 'One Down',
    description: 'Complete a whole module, lesson to quiz.',
    icon: 'check',
    tier: 'bronze',
    earned: (t) => t.modulesCompleted >= 1,
  },
  {
    id: 'show-your-work',
    name: 'Show Your Work',
    description: 'Finish a post-test and see how far you moved.',
    icon: 'bolt',
    tier: 'silver',
    earned: (t) => t.posttestsCompleted >= 1,
  },
  {
    id: 'halfway-there',
    name: 'Halfway There',
    description: 'Complete three of the six modules.',
    icon: 'star',
    tier: 'silver',
    earned: (t) => t.modulesCompleted >= 3,
  },
  {
    id: 'sharp-eye',
    name: 'Sharp Eye',
    description: 'Score 90% or better on a quiz.',
    icon: 'target',
    tier: 'silver',
    earned: (t) => (t.bestQuizScore ?? 0) >= 90,
  },
  {
    id: 'flawless',
    name: 'Flawless',
    description: 'Get a perfect score on any quiz.',
    icon: 'star',
    tier: 'gold',
    earned: (t) => t.perfectQuizzes >= 1,
  },
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Average 85% or better across three or more quizzes.',
    icon: 'bolt',
    tier: 'gold',
    earned: (t) => t.quizzesCompleted >= 3 && (t.averageQuizScore ?? 0) >= 85,
  },
  {
    id: 'streak-3',
    name: 'Three in a Row',
    description: 'Train three days running.',
    icon: 'flame',
    tier: 'bronze',
    earned: (t) => t.longestStreak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Keep a seven day streak alive.',
    icon: 'flame',
    tier: 'silver',
    earned: (t) => t.longestStreak >= 7,
  },
  {
    id: 'streak-14',
    name: 'Unbroken',
    description: 'Two solid weeks without missing a day.',
    icon: 'flame',
    tier: 'gold',
    earned: (t) => t.longestStreak >= 14,
  },
  {
    id: 'full-sweep',
    name: 'Full Sweep',
    description: 'Complete every module in the curriculum.',
    icon: 'trophy',
    tier: 'gold',
    earned: (t) => t.modulesCompleted >= 6,
  },
]

/** Badge ids a student qualifies for right now, in catalog order. */
export function earnedBadgeIds(totals: GamificationTotals): string[] {
  return BADGES.filter((badge) => badge.earned(totals)).map((badge) => badge.id)
}

/**
 * The catalog as the client renders it — every badge, earned or not, so a
 * locked badge can show what it takes rather than being invisible.
 * `earned` is intentionally dropped: a predicate can't cross the wire.
 */
export function badgeCatalogForClient(): Array<Omit<BadgeDefinition, 'earned'>> {
  return BADGES.map(({ id, name, description, icon, tier }) => ({ id, name, description, icon, tier }))
}
