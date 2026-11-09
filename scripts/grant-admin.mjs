import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const ADMIN_EMAIL = 'armansomani786@gmail.com'
const PROJECT_ID = 'notification-32ea1'

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of a Firebase service-account JSON file.')
  console.error('Keep that JSON file private and never commit it to GitHub.')
  process.exit(1)
}

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
})

const adminAuth = getAuth()

try {
  const user = await adminAuth.getUserByEmail(ADMIN_EMAIL)

  if ((user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    throw new Error('The account email does not match the designated admin email.')
  }

  if (!user.emailVerified) {
    const verificationLink = await adminAuth.generateEmailVerificationLink(ADMIN_EMAIL)
    console.log('This account must verify its Gmail address before admin access is granted.')
    console.log('Open this verification link in a browser signed in as the designated account:')
    console.log(verificationLink)
    process.exitCode = 1
  } else {
    const existingClaims = user.customClaims || {}
    await adminAuth.setCustomUserClaims(user.uid, { ...existingClaims, admin: true })
    console.log('Admin claim granted successfully.')
    console.log('Account:', ADMIN_EMAIL)
    console.log('Firebase UID:', user.uid)
    console.log('Next: sign out of Converly and sign in again to refresh the ID token.')
  }
} catch (error) {
  console.error(error?.code === 'auth/user-not-found'
    ? 'No Firebase Authentication account exists for the designated admin email. Register this Gmail address in Converly first, then run this script again.'
    : error?.message || 'Could not grant admin access.')
  process.exitCode = 1
}
