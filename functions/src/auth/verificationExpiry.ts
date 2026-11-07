import { onSchedule } from 'firebase-functions/v2/scheduler'
import { admin, authAdmin, db } from '../shared/admin'
import { COLLECTIONS } from '../shared/constants'
import { deleteStudentData } from './repository'

// Only self-registration writes this deadline. Keep the profile until all
// cleanup succeeds so a later run can retry even if Auth is already gone.
export async function expireRegistration(profile: FirebaseFirestore.QueryDocumentSnapshot, now: number) {
  const data = profile.data()
  if (data.role !== 'student' || typeof data.verificationDeadline !== 'number' || data.verificationDeadline > now) return
  try {
    const user = await authAdmin.getUser(profile.id)
    if (user.emailVerified) {
      await profile.ref.update({ verificationDeadline: admin.firestore.FieldValue.delete() })
      return
    }
    await authAdmin.deleteUser(profile.id)
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err
  }
  await deleteStudentData(profile.id)
  await profile.ref.delete()
}

export const expireUnverifiedRegistrations = onSchedule(
  { schedule: 'every 1 minutes', maxInstances: 1, concurrency: 1 },
  async () => {
    const now = Date.now()
    const due = await db.collection(COLLECTIONS.USERS).where('verificationDeadline', '<=', now).limit(100).get()
    for (const profile of due.docs) {
      try { await expireRegistration(profile, now) }
      catch (err) { console.error('Verification cleanup will retry', profile.id, err) }
    }
  },
)
