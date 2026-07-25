import {
  createUserAccountSchema,
  passwordSchema,
  registerStudentAccountSchema,
  roleSchema,
  setUserAccountStatusSchema,
  updateOwnNicknameSchema,
} from '../../src/auth/validators'

describe('auth/validators passwordSchema', () => {
  it('accepts a password with lower, upper, digit, and min length', () => {
    expect(passwordSchema.safeParse('Str0ngPass').success).toBe(true)
  })

  it.each([
    ['short', 'Ab1'],
    ['no uppercase', 'abcdefg1'],
    ['no lowercase', 'ABCDEFG1'],
    ['no digit', 'Abcdefgh'],
  ])('rejects %s', (_label, value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false)
  })
})

describe('auth/validators roleSchema', () => {
  it('accepts student and admin', () => {
    expect(roleSchema.safeParse('student').success).toBe(true)
    expect(roleSchema.safeParse('admin').success).toBe(true)
  })

  it('rejects anything else', () => {
    expect(roleSchema.safeParse('superadmin').success).toBe(false)
  })
})

describe('auth/validators createUserAccountSchema', () => {
  const valid = { email: 'student@tip.edu.ph', password: 'Str0ngPass', displayName: 'Ana Reyes', role: 'student' }

  it('accepts a fully valid payload', () => {
    expect(createUserAccountSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts an optional nickname', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, nickname: 'Ana' }).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects a missing displayName', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, displayName: '' }).success).toBe(false)
  })

  it('accepts a tip.edu.ph email regardless of case', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, email: 'Student@TIP.EDU.PH' }).success).toBe(true)
  })

  it('rejects an email outside the tip.edu.ph domain', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, email: 'student@gmail.com' }).success).toBe(false)
  })
})

describe('auth/validators registerStudentAccountSchema', () => {
  const valid = { email: 'student@tip.edu.ph', password: 'Str0ngPass', displayName: 'Ana Reyes', nickname: 'Ana' }

  it('accepts a fully valid payload', () => {
    expect(registerStudentAccountSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a missing nickname (required here, unlike createUserAccountSchema)', () => {
    const { nickname, ...withoutNickname } = valid
    expect(registerStudentAccountSchema.safeParse(withoutNickname).success).toBe(false)
    expect(registerStudentAccountSchema.safeParse({ ...valid, nickname: '' }).success).toBe(false)
  })

  it('rejects an email outside the tip.edu.ph domain', () => {
    expect(registerStudentAccountSchema.safeParse({ ...valid, email: 'student@gmail.com' }).success).toBe(false)
  })

  it('rejects a weak password', () => {
    expect(registerStudentAccountSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false)
  })

  it('has no role field to submit — this schema never accepts one', () => {
    const parsed = registerStudentAccountSchema.safeParse({ ...valid, role: 'admin' })
    expect(parsed.success).toBe(true)
    // zod strips unknown keys by default — a client-sent "role" is silently
    // dropped, never reaching the service layer, which hardcodes 'student'.
    expect(parsed.success && 'role' in parsed.data).toBe(false)
  })
})

describe('auth/validators setUserAccountStatusSchema', () => {
  it('accepts active and disabled', () => {
    expect(setUserAccountStatusSchema.safeParse({ uid: 'u1', status: 'active' }).success).toBe(true)
    expect(setUserAccountStatusSchema.safeParse({ uid: 'u1', status: 'disabled' }).success).toBe(true)
  })

  it('rejects a missing uid', () => {
    expect(setUserAccountStatusSchema.safeParse({ uid: '', status: 'active' }).success).toBe(false)
  })

  it('rejects an invalid status', () => {
    expect(setUserAccountStatusSchema.safeParse({ uid: 'u1', status: 'banned' }).success).toBe(false)
  })
})

describe('auth/validators updateOwnNicknameSchema', () => {
  it('accepts a trimmed, non-empty nickname', () => {
    expect(updateOwnNicknameSchema.safeParse({ nickname: 'Juan' }).success).toBe(true)
  })

  it('rejects an empty or whitespace-only nickname', () => {
    expect(updateOwnNicknameSchema.safeParse({ nickname: '' }).success).toBe(false)
    expect(updateOwnNicknameSchema.safeParse({ nickname: '   ' }).success).toBe(false)
  })

  it('rejects a nickname over 50 characters', () => {
    expect(updateOwnNicknameSchema.safeParse({ nickname: 'a'.repeat(51) }).success).toBe(false)
  })

  it('accepts a nickname at exactly 50 characters', () => {
    expect(updateOwnNicknameSchema.safeParse({ nickname: 'a'.repeat(50) }).success).toBe(true)
  })
})
