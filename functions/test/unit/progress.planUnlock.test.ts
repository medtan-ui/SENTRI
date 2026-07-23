import { planUnlock } from '../../src/modules/progress/service'
import { ModuleDoc } from '../../src/shared/moduleGuards'
import { ModuleProgressDoc } from '../../src/modules/progress/models'

function fakeSnapshot(exists: boolean, data?: Partial<ModuleProgressDoc>): FirebaseFirestore.DocumentSnapshot {
  return {
    exists,
    data: () => data as ModuleProgressDoc,
  } as unknown as FirebaseFirestore.DocumentSnapshot
}

const nextModule: ModuleDoc = {
  moduleId: 'phishing-awareness',
  moduleOrder: 2,
  status: 'Enabled',
  prerequisite: 'password-security',
}

describe('modules/progress/service planUnlock', () => {
  it('creates a fresh, unlocked progress doc when none exists yet', () => {
    const plan = planUnlock(nextModule, fakeSnapshot(false), 'student-1')
    expect(plan.mode).toBe('create')
    expect(plan.data).toMatchObject({ userId: 'student-1', moduleId: 'phishing-awareness', isUnlocked: true })
  })

  it('updates isUnlocked when a progress doc exists but is still locked', () => {
    const plan = planUnlock(nextModule, fakeSnapshot(true, { isUnlocked: false }), 'student-1')
    expect(plan.mode).toBe('update')
    expect(plan.data.isUnlocked).toBe(true)
  })

  it('is a no-op when the module is already unlocked', () => {
    const plan = planUnlock(nextModule, fakeSnapshot(true, { isUnlocked: true }), 'student-1')
    expect(plan.mode).toBe('noop')
  })
})
