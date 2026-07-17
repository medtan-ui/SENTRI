/**
 * authService.js
 * ─────────────────────────────────────────────────────────────
 * Mock authentication service.
 *
 * Swap the contents of `_authenticate` with Firebase Auth calls
 * (signInWithEmailAndPassword) and this file's public API stays
 * identical — the Login component never needs to change.
 *
 * SECURITY NOTES
 *  • Credentials are never logged to the console.
 *  • Passwords are contained only in this service file.
 *  • The returned user object never includes the password.
 * ─────────────────────────────────────────────────────────────
 */

// ── Mock credential store (replace with Firebase in next phase) ──
const MOCK_USERS = [
  {
    email: 'student@test.com',
    // In production this would be hashed; Firebase handles it server-side.
    _password: 'password123',
    role: 'student',
    displayName: 'Student',
  },
  {
    email: 'admin@test.com',
    _password: 'password123',
    role: 'admin',
    displayName: 'Administrator',
  },
]

/**
 * Internal: find a matching user record.
 * @param {string} email
 * @param {string} password
 * @returns {{ email, role, displayName } | null}
 */
function _authenticate(email, password) {
  const found = MOCK_USERS.find(
    (u) => u.email === email && u._password === password
  )
  if (!found) return null
  // Strip the internal password field before returning
  const { _password, ...safeUser } = found
  return safeUser
}

// ── In-memory session (replace with Firebase currentUser / context) ──
let _currentUser = null

/**
 * Attempt login with provided credentials.
 *
 * @param {string} email     Raw email from input (will be trimmed here)
 * @param {string} password
 * @returns {Promise<{ user: { email, role, displayName } }>}
 * @throws {Error} with a user-friendly message on failure
 */
export async function login(email, password) {
  // Simulate async network call (≈ 500 ms)
  await _delay(500)

  const trimmedEmail = (email || '').trim().toLowerCase()

  const user = _authenticate(trimmedEmail, password)
  if (!user) {
    throw new Error('Incorrect email or password. Please try again.')
  }

  _currentUser = user
  // Persist a lightweight session token (not the password)
  sessionStorage.setItem('sentri_user', JSON.stringify(user))

  return { user }
}

/**
 * Sign the current user out.
 * @returns {Promise<void>}
 */
export async function logout() {
  await _delay(200)
  _currentUser = null
  sessionStorage.removeItem('sentri_user')
}

/**
 * Return the currently authenticated user, or null.
 * Reads from the in-memory store first, then sessionStorage fallback.
 * @returns {{ email, role, displayName } | null}
 */
export function getCurrentUser() {
  if (_currentUser) return _currentUser
  try {
    const stored = sessionStorage.getItem('sentri_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// ── Helpers ──
function _delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
