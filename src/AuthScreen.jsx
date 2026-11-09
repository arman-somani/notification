import { useState } from 'react'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase/client'
import './AuthScreen.css'

const isGmailAddress = (value) => new RegExp('^[^\\s@]+@gmail\\.com$', 'i').test(String(value || '').trim())

const explainAuthError = (error) => {
  switch (error?.code) {
    case 'auth/email-already-in-use': return 'An account already exists with this email. Sign in instead.'
    case 'auth/invalid-email': return 'Enter a valid email address.'
    case 'auth/weak-password': return 'Use a password with at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'The email or password is incorrect.'
    case 'auth/too-many-requests': return 'Too many attempts. Wait a little and try again.'
    case 'auth/operation-not-allowed': return 'Email/password sign-in is not enabled in Firebase Authentication yet.'
    case 'auth/network-request-failed': return 'Network error. Check your internet connection.'
    default: return error?.message || 'Something went wrong. Please try again.'
  }
}

export default function AuthScreen({ user, initialError = '', onProfileSaved, onBack }) {
  const [mode, setMode] = useState(user ? 'profile' : 'signin')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [notice, setNotice] = useState('')

  const saveFirstProfile = async (currentUser) => {
    const cleanName = displayName.trim()
    const normalizedUsername = username.trim().toLowerCase().replace(/^@/, '')
    if (!cleanName || cleanName.length > 48) throw new Error('Enter a display name between 1 and 48 characters.')
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) throw new Error('Username must be 3–20 characters using lowercase letters, numbers or underscores.')

    const userRef = doc(db, 'users', currentUser.uid)
    const usernameRef = doc(db, 'usernames', normalizedUsername)
    await runTransaction(db, async (transaction) => {
      const profileSnapshot = await transaction.get(userRef)
      const usernameSnapshot = await transaction.get(usernameRef)
      if (profileSnapshot.exists()) throw new Error('Your profile is already set up. Please sign in again.')
      if (usernameSnapshot.exists()) throw new Error('That username is already taken. Choose another one.')

      transaction.set(usernameRef, { uid: currentUser.uid, createdAt: serverTimestamp() })
      transaction.set(userRef, {
        displayName: cleanName,
        username: normalizedUsername,
        avatarId: 'male-01',
        bio: '',
        privacy: { whoCanMessage: 'everyone', whoCanSeeLastSeen: 'contacts', whoCanAddToGroups: 'contacts', discoverable: true },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    try { await updateProfile(currentUser, { displayName: cleanName }) } catch { /* Firestore is the profile source of truth. */ }
    onProfileSaved({
      displayName: cleanName,
      username: normalizedUsername,
      avatarId: 'male-01',
      bio: '',
      privacy: { whoCanMessage: 'everyone', whoCanSeeLastSeen: 'contacts', whoCanAddToGroups: 'contacts', discoverable: true },
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const normalizedEmail = String(user?.email || email).trim().toLowerCase()
      if (!isGmailAddress(normalizedEmail)) {
        throw new Error('Only Gmail addresses ending in @gmail.com can register or sign in to Converly.')
      }
      if (user) {
        await saveFirstProfile(user)
      } else if (mode === 'register') {
        if (password.length < 6) throw new Error('Use a password with at least 6 characters.')
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        await saveFirstProfile(credential.user)
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password)
      }
    } catch (caught) {
      setError(explainAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  const handleResetPassword = async () => {
    setError('')
    setNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) { setError('Enter your Gmail address first.'); return }
    if (!isGmailAddress(normalizedEmail)) { setError('Password reset is available only for @gmail.com addresses.'); return }
    setBusy(true)
    try {
      await sendPasswordResetEmail(auth, normalizedEmail)
      setNotice('Password reset email sent. Check your inbox.')
    } catch (caught) {
      setError(explainAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  const profileSetup = Boolean(user)
  const isRegister = mode === 'register' && !profileSetup

  return (
    <main className="auth-page">
      <section className="auth-card">
        {onBack && <button className="auth-back-button" type="button" onClick={onBack}>← Back to home</button>}
        <div className="auth-brand"><span className="auth-brand-mark">C</span><span>converly<span>.</span></span></div>
        <p className="auth-eyebrow">{profileSetup ? 'ONE LAST STEP' : 'YOUR PRIVATE SPACE'}</p>
        <h1>{profileSetup ? 'Create your profile' : isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-description">{profileSetup ? 'Choose your display name and a username. Your username is permanent after this step.' : isRegister ? 'A calmer place for the conversations that matter.' : 'Sign in to continue to your conversations.'}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {profileSetup ? (
            <>
              <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={48} autoComplete="name" required /></label>
              <label>Username<div className="auth-username-input"><span>@</span><input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))} minLength={3} maxLength={20} autoComplete="username" required /></div><small>3–20 lowercase letters, numbers or underscores. Cannot be changed later.</small></label>
              <label>Email<input value={user.email || ''} readOnly /></label>
            </>
          ) : (
            <>
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@gmail.com" autoComplete="email" autoCapitalize="none" required /><small>Use a Gmail address ending in @gmail.com.</small></label>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} autoComplete={isRegister ? 'new-password' : 'current-password'} required /></label>
            </>
          )}
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : profileSetup ? 'Save permanent username' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>

        {!profileSetup && !isRegister && <button className="auth-text-button" type="button" onClick={handleResetPassword} disabled={busy}>Forgot password?</button>}
        {!profileSetup && (
          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Converly?'} <button type="button" onClick={() => { setMode(isRegister ? 'signin' : 'register'); setError(''); setNotice('') }}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
        )}
        {profileSetup && <p className="auth-footnote">Your username reservation and profile are saved together in Firebase. The username cannot be claimed by another account.</p>}
      </section>
    </main>
  )
}
