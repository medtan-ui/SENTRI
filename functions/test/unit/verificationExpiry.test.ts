import { expireRegistration } from '../../src/auth/verificationExpiry'
import { authAdmin } from '../../src/shared/admin'
import { deleteStudentData } from '../../src/auth/repository'

jest.mock('../../src/shared/admin', () => ({
  authAdmin: { getUser: jest.fn(), deleteUser: jest.fn() },
  admin: { firestore: { FieldValue: { delete: () => 'delete-field' } } },
}))
jest.mock('../../src/auth/repository', () => ({ deleteStudentData: jest.fn() }))
const now = 10000
function profile(role = 'student', verificationDeadline: number | null = now) {
  return { id: 'student-id', data: () => ({ role, verificationDeadline }), ref: { update: jest.fn(), delete: jest.fn() } }
}
function run(p: ReturnType<typeof profile>) {
  return expireRegistration(p as unknown as FirebaseFirestore.QueryDocumentSnapshot, now)
}
beforeEach(() => jest.resetAllMocks())
it('ignores accounts before their deadline, accounts without deadlines, and admins', async () => {
  for (const p of [profile('student', now + 1), profile('student', null), profile('admin')]) await run(p)
  expect(authAdmin.getUser).not.toHaveBeenCalled()
})
it('retires the deadline for a verified registration', async () => {
  ;(authAdmin.getUser as jest.Mock).mockResolvedValue({ emailVerified: true })
  const p = profile()
  await run(p)
  expect(p.ref.update).toHaveBeenCalled()
  expect(authAdmin.deleteUser).not.toHaveBeenCalled()
})
it('deletes expired unverified accounts and their student data', async () => {
  ;(authAdmin.getUser as jest.Mock).mockResolvedValue({ emailVerified: false })
  const p = profile()
  await run(p)
  expect(authAdmin.deleteUser).toHaveBeenCalledWith(p.id)
  expect(deleteStudentData).toHaveBeenCalledWith(p.id)
  expect(p.ref.delete).toHaveBeenCalled()
})
it('retries cleanup after Auth deletion and keeps the profile until cleanup succeeds', async () => {
  ;(authAdmin.getUser as jest.Mock).mockRejectedValue({ code: 'auth/user-not-found' })
  ;(deleteStudentData as jest.Mock).mockRejectedValueOnce(new Error('temporary'))
  const p = profile()
  await expect(run(p)).rejects.toThrow('temporary')
  expect(p.ref.delete).not.toHaveBeenCalled()
  await run(p)
  expect(p.ref.delete).toHaveBeenCalled()
})
