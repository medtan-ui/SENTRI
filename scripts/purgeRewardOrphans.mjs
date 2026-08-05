/**
 * scripts/purgeRewardOrphans.mjs
 * ─────────────────────────────────────────────────────────────
 * TEMPORARY — delete this file, functions/src/modules/gamification/
 * cleanupController.ts, and its export in functions/src/index.ts once
 * the purge has been run.
 *
 * Calls the admin-only purgeRewardOrphans callable. This environment has
 * no service account and no application default credentials, so a
 * standalone firebase-admin script cannot authenticate against the live
 * project; signing in as a real admin through the client SDK and calling
 * a guarded callable is the working route.
 *
 * Usage, from the project root:
 *
 *   node scripts/purgeRewardOrphans.mjs <admin-email> <password>
 *       → dry run. Prints exactly what would be deleted, deletes nothing.
 *
 *   node scripts/purgeRewardOrphans.mjs <admin-email> <password> --commit
 *       → performs the deletion.
 *
 * Read the dry run before committing. The orphan list names each
 * account, so a row you recognise as a live student means stop.
 * ─────────────────────────────────────────────────────────────
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { readFileSync } from 'node:fs'

const [email, password, ...flags] = process.argv.slice(2)
const commit = flags.includes('--commit')

if (!email || !password) {
  console.error('Usage: node scripts/purgeRewardOrphans.mjs <admin-email> <password> [--commit]')
  process.exit(1)
}

// Reads the same VITE_* config the web app uses, straight out of .env,
// rather than duplicating the project's keys into this script.
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()]
    }),
)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

await signInWithEmailAndPassword(getAuth(app), email, password)

const call = httpsCallable(getFunctions(app, 'us-central1'), 'purgeRewardOrphans')
const { data } = await call({ dryRun: !commit })

console.log('')
console.log(data.dryRun ? '── DRY RUN (nothing deleted) ──' : '── COMMITTED ──')
console.log('')
console.log(`userBadges documents:        ${data.userBadges.found} found, ${data.userBadges.deleted} deleted`)
if (data.userBadges.ids.length) console.log(`  ids: ${data.userBadges.ids.join(', ')}`)
console.log('')
console.log(`gamification documents:      ${data.gamificationTotal} total`)
console.log(`orphaned (no user profile):  ${data.gamificationOrphans.found} found, ${data.gamificationOrphans.deleted} deleted`)
for (const row of data.gamificationOrphans.rows) {
  console.log(`  ${row.displayName.padEnd(24)} ${String(row.points).padStart(6)} XP   uid=${row.userId}`)
}
console.log('')
if (data.dryRun) console.log('Re-run with --commit to delete the rows listed above.')

process.exit(0)
