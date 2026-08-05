/**
 * Unit tests for the reward layer's pure logic — the scoring, the rank
 * ladder, the badge predicates, and the streak arithmetic. None of these
 * touch Firestore; every one of them is a function of data in and data
 * out, which is the whole reason the design puts them there.
 *
 * The cases below are chosen around the ways a points system quietly goes
 * wrong rather than around happy paths: a score that inflates when a
 * function runs twice, an admin-granted retry that costs a student the
 * points they already earned, a streak that a second visit on the same
 * day advances, and a badge that gets taken away by a module reset.
 */
import {
  BADGES,
  GamificationTotals,
  POINTS,
  RANKS,
  badgeCatalogForClient,
  earnedBadgeIds,
  rankFor,
} from '../../src/modules/gamification/catalog'
import { manilaDate, nextStreak, pointsForModule, pointsFrom, totalsFrom } from '../../src/modules/gamification/service'
import { ModuleProgressDoc } from '../../src/modules/progress/models'

function makeProgress(overrides: Partial<ModuleProgressDoc> = {}): ModuleProgressDoc {
  return {
    userId: 'student-1',
    moduleId: 'password-security',
    moduleOrder: 1,
    isUnlocked: true,
    lessonStarted: false,
    lessonCompleted: false,
    simulationCompleted: false,
    quizCompleted: false,
    moduleCompleted: false,
    score: null,
    attempts: 0,
    lastAccessed: null as never,
    completionDate: null,
    createdAt: null as never,
    ...overrides,
  }
}

const NO_TOTALS: GamificationTotals = {
  lessonsCompleted: 0,
  simulationsCompleted: 0,
  quizzesCompleted: 0,
  modulesCompleted: 0,
  pretestsCompleted: 0,
  posttestsCompleted: 0,
  perfectQuizzes: 0,
  bestQuizScore: null,
  averageQuizScore: null,
  currentStreak: 0,
  longestStreak: 0,
  flawlessSimulations: 0,
  bestNormalizedGain: null,
}

describe('pointsForModule', () => {
  it('awards nothing for a module that has only been unlocked', () => {
    expect(pointsForModule(makeProgress())).toBe(0)
  })

  it('adds each completed step exactly once', () => {
    const progress = makeProgress({ lessonCompleted: true, simulationCompleted: true })
    expect(pointsForModule(progress)).toBe(POINTS.LESSON + POINTS.SIMULATION)
  })

  it('scales the quiz award by the score and pays a perfect bonus only at 100', () => {
    const at80 = makeProgress({ quizCompleted: true, score: 80 })
    const at100 = makeProgress({ quizCompleted: true, score: 100 })

    expect(pointsForModule(at80)).toBe(POINTS.QUIZ_BASE + 40)
    expect(pointsForModule(at100)).toBe(POINTS.QUIZ_BASE + 50 + POINTS.QUIZ_PERFECT_BONUS)
  })

  it('still counts a quiz whose completion flag was cleared by an admin-granted retry', () => {
    // grantQuizRetry sets quizCompleted back to false but leaves the
    // recorded score in place. A student mid-appeal must not lose points
    // they already earned as the price of appealing.
    const midAppeal = makeProgress({ quizCompleted: false, score: 60 })
    expect(pointsForModule(midAppeal)).toBe(POINTS.QUIZ_BASE + 30)
  })

  it('is a pure function of state — running it repeatedly never inflates the total', () => {
    const progress = makeProgress({
      pretestCompleted: true,
      lessonCompleted: true,
      simulationCompleted: true,
      quizCompleted: true,
      score: 90,
      postTestCompleted: true,
      moduleCompleted: true,
    })
    const once = pointsForModule(progress)
    expect(pointsForModule(progress)).toBe(once)
    expect(pointsForModule(progress)).toBe(once)
  })

  it('values a flawlessly finished module at the documented maximum', () => {
    const perfect = makeProgress({
      pretestCompleted: true,
      lessonCompleted: true,
      simulationCompleted: true,
      quizCompleted: true,
      score: 100,
      postTestCompleted: true,
      moduleCompleted: true,
    })
    // 10 + 20 + 40 + (25 + 50 + 25) + 15 + 60
    expect(pointsForModule(perfect)).toBe(245)
  })
})

describe('pointsFrom', () => {
  it('sums every module the student has touched', () => {
    const rows = [
      makeProgress({ lessonCompleted: true }),
      makeProgress({ moduleId: 'phishing-awareness', lessonCompleted: true, simulationCompleted: true }),
    ]
    expect(pointsFrom(rows)).toBe(POINTS.LESSON * 2 + POINTS.SIMULATION)
  })

  it('is zero for a student with no progress rows at all', () => {
    expect(pointsFrom([])).toBe(0)
  })
})

describe('totalsFrom', () => {
  it('derives per-step counts and score summaries', () => {
    const rows = [
      makeProgress({ lessonCompleted: true, quizCompleted: true, score: 100, moduleCompleted: true }),
      makeProgress({ moduleId: 'phishing-awareness', lessonCompleted: true, quizCompleted: true, score: 70 }),
      makeProgress({ moduleId: 'safe-browsing' }),
    ]
    const totals = totalsFrom(rows, 3, 9)

    expect(totals.lessonsCompleted).toBe(2)
    expect(totals.quizzesCompleted).toBe(2)
    expect(totals.modulesCompleted).toBe(1)
    expect(totals.perfectQuizzes).toBe(1)
    expect(totals.bestQuizScore).toBe(100)
    expect(totals.averageQuizScore).toBe(85)
    expect(totals.currentStreak).toBe(3)
    expect(totals.longestStreak).toBe(9)
  })

  it('reports null rather than zero when no quiz has been scored yet', () => {
    // A zero average would be indistinguishable from a student who took
    // three quizzes and got everything wrong.
    const totals = totalsFrom([makeProgress({ lessonCompleted: true })], 0, 0)
    expect(totals.bestQuizScore).toBeNull()
    expect(totals.averageQuizScore).toBeNull()
  })

  it('takes the best normalized gain across every module that has one', () => {
    const rows = [
      makeProgress({ normalizedGain: 0.4 }),
      makeProgress({ moduleId: 'phishing-awareness', normalizedGain: 1 }),
      makeProgress({ moduleId: 'safe-browsing' }),
    ]
    expect(totalsFrom(rows, 0, 0).bestNormalizedGain).toBe(1)
  })
})

/**
 * The clean-run count is the one total that cannot come from a progress
 * document — a progress row records that a simulation finished, never
 * how cleanly — so it is joined from the learningAnalytics counters.
 *
 * This replaces a predicate in the badge system that used to live beside
 * this one, which read a field name (`is_safe`) that nothing writes; the
 * real field is `is_safe_choice`. The comparison silently evaluated to
 * `undefined === false`, so its "no risky choices" badge was awarded to
 * anyone who finished any simulation at all. Hence the deliberately
 * unkind cases below.
 */
describe('totalsFrom — flawless simulations', () => {
  const clean = { moduleId: 'password-security', safeChoices: 4, riskyChoices: 0 }
  const messy = { moduleId: 'phishing-awareness', safeChoices: 5, riskyChoices: 2 }

  it('counts a finished simulation with no risky choice', () => {
    const rows = [makeProgress({ simulationCompleted: true })]
    expect(totalsFrom(rows, 0, 0, [clean]).flawlessSimulations).toBe(1)
  })

  it('does not count a simulation that had a risky choice', () => {
    const rows = [makeProgress({ moduleId: 'phishing-awareness', simulationCompleted: true })]
    expect(totalsFrom(rows, 0, 0, [messy]).flawlessSimulations).toBe(0)
  })

  it('does not count a module whose simulation was never finished', () => {
    // Zero risky choices because zero choices. Vacuously clean is not clean.
    const rows = [makeProgress({ simulationCompleted: false })]
    expect(totalsFrom(rows, 0, 0, [{ ...clean, safeChoices: 0 }]).flawlessSimulations).toBe(0)
  })

  it('does not count a finished simulation with no behaviour row at all', () => {
    // Decision recording fails soft by design (see
    // scenarioDecisionService), so a missing row is an absence of
    // evidence, not evidence of a clean run.
    const rows = [makeProgress({ simulationCompleted: true })]
    expect(totalsFrom(rows, 0, 0, []).flawlessSimulations).toBe(0)
  })

  it('scores each module independently rather than globally', () => {
    // The predicate this replaced looked at every decision the student
    // had ever made at once, so a single risky click in any module would
    // have blocked the badge forever.
    const rows = [
      makeProgress({ simulationCompleted: true }),
      makeProgress({ moduleId: 'phishing-awareness', simulationCompleted: true }),
    ]
    expect(totalsFrom(rows, 0, 0, [clean, messy]).flawlessSimulations).toBe(1)
  })
})

describe('rankFor', () => {
  it('starts everyone at the first rank', () => {
    const rank = rankFor(0)
    expect(rank.level).toBe(1)
    expect(rank.rankName).toBe(RANKS[0].name)
    expect(rank.rankFloor).toBe(0)
  })

  it('promotes exactly at a threshold, not one point after it', () => {
    const second = RANKS[1]
    expect(rankFor(second.minPoints - 1).level).toBe(1)
    expect(rankFor(second.minPoints).level).toBe(2)
  })

  it('measures progress against the current rank, not the whole ladder', () => {
    const [first, second] = RANKS
    const midpoint = first.minPoints + Math.floor((second.minPoints - first.minPoints) / 2)
    expect(rankFor(midpoint).progressPct).toBe(50)
  })

  it('reports a full bar and no next rank at the top', () => {
    const top = RANKS[RANKS.length - 1]
    const rank = rankFor(top.minPoints + 500)
    expect(rank.nextRankAt).toBeNull()
    expect(rank.nextRankName).toBeNull()
    expect(rank.progressPct).toBe(100)
  })

  it('is reachable: a perfect run of all six modules clears the final threshold', () => {
    const top = RANKS[RANKS.length - 1]
    expect(245 * 6).toBeGreaterThanOrEqual(top.minPoints)
  })
})

describe('badges', () => {
  it('awards nothing to a student who has done nothing', () => {
    expect(earnedBadgeIds(NO_TOTALS)).toEqual([])
  })

  it('unlocks the first-lesson badge on the first completed lesson', () => {
    expect(earnedBadgeIds({ ...NO_TOTALS, lessonsCompleted: 1 })).toContain('first-steps')
  })

  it('requires a genuine 100 for the perfect-quiz badge', () => {
    expect(earnedBadgeIds({ ...NO_TOTALS, bestQuizScore: 99 })).not.toContain('flawless')
    expect(earnedBadgeIds({ ...NO_TOTALS, perfectQuizzes: 1, bestQuizScore: 100 })).toContain('flawless')
  })

  it('needs three quizzes before a high average counts as consistency', () => {
    const twoGoodQuizzes = { ...NO_TOTALS, quizzesCompleted: 2, averageQuizScore: 95 }
    const threeGoodQuizzes = { ...NO_TOTALS, quizzesCompleted: 3, averageQuizScore: 95 }
    expect(earnedBadgeIds(twoGoodQuizzes)).not.toContain('consistent')
    expect(earnedBadgeIds(threeGoodQuizzes)).toContain('consistent')
  })

  it('judges streak badges on the longest run, so a broken streak keeps what it earned', () => {
    const brokenButHistoric = { ...NO_TOTALS, currentStreak: 1, longestStreak: 7 }
    const earned = earnedBadgeIds(brokenButHistoric)
    expect(earned).toContain('streak-3')
    expect(earned).toContain('streak-7')
    expect(earned).not.toContain('streak-14')
  })

  it('awards the full sweep only once every module is complete', () => {
    expect(earnedBadgeIds({ ...NO_TOTALS, modulesCompleted: 5 })).not.toContain('full-sweep')
    expect(earnedBadgeIds({ ...NO_TOTALS, modulesCompleted: 6 })).toContain('full-sweep')
  })

  it('awards First Defender for one clean run, not for finishing a run', () => {
    expect(earnedBadgeIds({ ...NO_TOTALS, simulationsCompleted: 3 })).not.toContain('first-defender')
    expect(earnedBadgeIds({ ...NO_TOTALS, flawlessSimulations: 1 })).toContain('first-defender')
  })

  it('awards Perfect Gain only at a full normalized gain', () => {
    expect(earnedBadgeIds({ ...NO_TOTALS, bestNormalizedGain: 0.99 })).not.toContain('perfect-gain')
    expect(earnedBadgeIds({ ...NO_TOTALS, bestNormalizedGain: 1 })).toContain('perfect-gain')
  })

  it('has no badge whose name implies a criterion it does not test', () => {
    // The system this one absorbed shipped a flame-iconed badge called
    // "Streak Hero" whose actual criterion was three completed modules.
    // Every badge here that is named or iconed for streaks must key off
    // a streak field, and no other badge may claim the flame.
    const streakFields: Array<keyof GamificationTotals> = ['currentStreak', 'longestStreak']
    for (const badge of BADGES.filter((b) => b.icon === 'flame' || /streak/i.test(b.id))) {
      const earnedByStreakAlone = streakFields.some((field) =>
        badge.earned({ ...NO_TOTALS, [field]: 999 }),
      )
      const earnedByEverythingElse = badge.earned({
        ...NO_TOTALS,
        lessonsCompleted: 9, simulationsCompleted: 9, quizzesCompleted: 9, modulesCompleted: 9,
        pretestsCompleted: 9, posttestsCompleted: 9, perfectQuizzes: 9, flawlessSimulations: 9,
        bestQuizScore: 100, averageQuizScore: 100, bestNormalizedGain: 1,
      })
      expect(earnedByStreakAlone).toBe(true)
      expect(earnedByEverythingElse).toBe(false)
    }
  })

  it('exposes a client catalog with no predicates and no missing badges', () => {
    const catalog = badgeCatalogForClient()
    expect(catalog).toHaveLength(BADGES.length)
    for (const badge of catalog) {
      expect(badge).not.toHaveProperty('earned')
      expect(badge.id).toBeTruthy()
      expect(badge.description).toBeTruthy()
    }
  })

  it('has no duplicate badge ids', () => {
    const ids = BADGES.map((badge) => badge.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('nextStreak', () => {
  it('starts a streak at one for a student with no history', () => {
    const result = nextStreak(null, 0, 0, '2026-03-10')
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: '2026-03-10',
      extended: true,
    })
  })

  it('does nothing on a second visit the same day', () => {
    const result = nextStreak('2026-03-10', 4, 9, '2026-03-10')
    expect(result.currentStreak).toBe(4)
    expect(result.longestStreak).toBe(9)
    expect(result.extended).toBe(false)
  })

  it('extends a streak from the previous day', () => {
    const result = nextStreak('2026-03-09', 4, 4, '2026-03-10')
    expect(result.currentStreak).toBe(5)
    expect(result.longestStreak).toBe(5)
  })

  it('resets after a missed day but keeps the personal best', () => {
    const result = nextStreak('2026-03-07', 12, 12, '2026-03-10')
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(12)
  })

  it('crosses a month boundary without breaking the run', () => {
    const result = nextStreak('2026-02-28', 3, 3, '2026-03-01')
    expect(result.currentStreak).toBe(4)
  })

  it('crosses a leap day correctly', () => {
    // 2028 is a leap year, so 29 February really is the day after the 28th.
    expect(nextStreak('2028-02-28', 2, 2, '2028-02-29').currentStreak).toBe(3)
    expect(nextStreak('2028-02-29', 3, 3, '2028-03-01').currentStreak).toBe(4)
  })

  it('crosses a year boundary without breaking the run', () => {
    const result = nextStreak('2026-12-31', 6, 6, '2027-01-01')
    expect(result.currentStreak).toBe(7)
  })
})

describe('manilaDate', () => {
  it('uses the Manila day, not the UTC one, late in the evening', () => {
    // 2026-03-10 17:00 UTC is 2026-03-11 01:00 in Manila. A student
    // training at 1am should be credited with that day, not the previous
    // one, or their streak breaks on nothing but a timezone.
    expect(manilaDate(new Date('2026-03-10T17:00:00.000Z'))).toBe('2026-03-11')
  })

  it('still reports the previous day just before the Manila rollover', () => {
    expect(manilaDate(new Date('2026-03-10T15:59:59.000Z'))).toBe('2026-03-10')
  })
})
