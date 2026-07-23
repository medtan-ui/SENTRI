/**
 * shared/admin.ts
 * Single Admin SDK app instance, shared by every module. Guarded against
 * double-init because several files (and the Jest test setup) import this
 * module independently.
 */
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const db = admin.firestore()
export const authAdmin = admin.auth()
export { admin }
