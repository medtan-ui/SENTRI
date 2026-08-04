/**
 * modules/badges/badges.ts
 * Evaluation and storage engine for gamification badges in SENTRI.
 */
import { admin, db } from '../../shared/admin'

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  category: 'scenario' | 'quiz' | 'gain' | 'milestone'
  iconName: string
}

export const BADGE_CATALOG: Record<string, BadgeDefinition> = {
  FIRST_DEFENDER: {
    id: 'FIRST_DEFENDER',
    title: 'First Defender',
    description: 'Completed a simulation scenario without making any risky choices.',
    category: 'scenario',
    iconName: 'ShieldCheck',
  },
  PHISHING_SENTINEL: {
    id: 'PHISHING_SENTINEL',
    title: 'Phishing Sentinel',
    description: 'Achieved a perfect 100% score on the Phishing Awareness Quiz.',
    category: 'quiz',
    iconName: 'MailCheck',
  },
  PERFECT_GAIN: {
    id: 'PERFECT_GAIN',
    title: 'Perfect Gain',
    description: 'Closed 100% of the knowledge gap (g = 1.0) on a module post-test.',
    category: 'gain',
    iconName: 'TrendingUp',
  },
  STREAK_HERO: {
    id: 'STREAK_HERO',
    title: 'Streak Hero',
    description: 'Successfully completed 3 cybersecurity training modules.',
    category: 'milestone',
    iconName: 'Flame',
  },
  SENTRI_MASTER: {
    id: 'SENTRI_MASTER',
    title: 'SENTRI Master',
    description: 'Completed all six cybersecurity awareness modules.',
    category: 'milestone',
    iconName: 'Award',
  },
}

export interface UserBadgeItem {
  id: string
  title: string
  description: string
  category: string
  iconName: string
  unlockedAt: string
}

export async function getUserBadgesDoc(userId: string): Promise<UserBadgeItem[]> {
  const docRef = db.collection('userBadges').doc(userId)
  const snap = await docRef.get()
  if (!snap.exists) return []
  return (snap.data()?.badges ?? []) as UserBadgeItem[]
}

/**
 * Evaluates and awards any newly unlocked badges for a given user.
 */
export async function evaluateAndAwardBadges(userId: string): Promise<UserBadgeItem[]> {
  if (!userId) return []

  const existingBadges = await getUserBadgesDoc(userId)
  const existingIds = new Set(existingBadges.map((b) => b.id))
  const newBadges: UserBadgeItem[] = []
  const nowIso = new Date().toISOString()

  // 1. Fetch user's progress across all modules
  const progressSnap = await db
    .collection('moduleProgress')
    .where('userId', '==', userId)
    .get()

  const progressDocs = progressSnap.docs.map((d) => d.data())
  const completedModulesCount = progressDocs.filter((p) => p.moduleCompleted).length

  // Check SENTRI_MASTER
  if (completedModulesCount >= 6 && !existingIds.has('SENTRI_MASTER')) {
    const def = BADGE_CATALOG.SENTRI_MASTER
    newBadges.push({ ...def, unlockedAt: nowIso })
    existingIds.add('SENTRI_MASTER')
  }

  // Check STREAK_HERO
  if (completedModulesCount >= 3 && !existingIds.has('STREAK_HERO')) {
    const def = BADGE_CATALOG.STREAK_HERO
    newBadges.push({ ...def, unlockedAt: nowIso })
    existingIds.add('STREAK_HERO')
  }

  // Check PERFECT_GAIN
  const hasPerfectGain = progressDocs.some(
    (p) => typeof p.normalizedGain === 'number' && p.normalizedGain >= 1.0,
  )
  if (hasPerfectGain && !existingIds.has('PERFECT_GAIN')) {
    const def = BADGE_CATALOG.PERFECT_GAIN
    newBadges.push({ ...def, unlockedAt: nowIso })
    existingIds.add('PERFECT_GAIN')
  }

  // Check PHISHING_SENTINEL
  const phishingProgress = progressDocs.find((p) => p.moduleId === 'phishing-awareness')
  if (phishingProgress?.quizCompleted && phishingProgress.score === 100 && !existingIds.has('PHISHING_SENTINEL')) {
    const def = BADGE_CATALOG.PHISHING_SENTINEL
    newBadges.push({ ...def, unlockedAt: nowIso })
    existingIds.add('PHISHING_SENTINEL')
  }

  // Check FIRST_DEFENDER (check scenario_decision_records for safe choices)
  if (!existingIds.has('FIRST_DEFENDER')) {
    const decisionsSnap = await db
      .collection('scenario_decision_records')
      .where('user_id', '==', userId)
      .get()

    if (!decisionsSnap.empty) {
      const records = decisionsSnap.docs.map((d) => d.data())
      const anyRiskyChoice = records.some((r) => r.is_safe === false)
      const hasCompletedSimulation = progressDocs.some((p) => p.simulationCompleted)
      if (hasCompletedSimulation && !anyRiskyChoice) {
        const def = BADGE_CATALOG.FIRST_DEFENDER
        newBadges.push({ ...def, unlockedAt: nowIso })
        existingIds.add('FIRST_DEFENDER')
      }
    }
  }

  if (newBadges.length > 0) {
    const updatedList = [...existingBadges, ...newBadges]
    await db.collection('userBadges').doc(userId).set(
      {
        userId,
        badges: updatedList,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    return updatedList
  }

  return existingBadges
}
