import { createUserAccountSchema, passwordSchema, roleSchema } from '../../src/auth/validators'

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
  const valid = { email: 'student@example.com', password: 'Str0ngPass', displayName: 'Ana Reyes', role: 'student' }

  it('accepts a fully valid payload', () => {
    expect(createUserAccountSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects a missing displayName', () => {
    expect(createUserAccountSchema.safeParse({ ...valid, displayName: '' }).success).toBe(false)
  })
})
