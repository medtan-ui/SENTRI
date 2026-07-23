import { CallableRequest } from 'firebase-functions/v2/https'

/**
 * Builds a minimal CallableRequest for driving an exported callable's
 * `.run()` directly (see firebase-functions' CallableFunction.run — "Used
 * for unit testing"). This exercises the real controller -> service ->
 * repository stack, including requireAuth/requireAdmin, against whatever
 * Firestore/Auth the Admin SDK is currently pointed at (the emulator, per
 * test/jest.setup.ts).
 */
export function makeRequest<T>(data: T, uid?: string): CallableRequest<T> {
  return {
    data,
    auth: uid ? { uid, token: { uid, email: `${uid}@test.local` } as any } : undefined,
    rawRequest: {} as any,
  } as CallableRequest<T>
}
