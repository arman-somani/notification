import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithPopup, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
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
    case 'auth/operation-not-allowed': return 'This sign-in method is not enabled in Firebase Authentication yet.'
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled. You can try again whenever you are ready.'
    case 'auth/popup-blocked': return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.'
    case 'auth/cancelled-popup-request': return 'A Google sign-in window is already open. Finish that window or try again.'
    case 'auth/account-exists-with-different-credential': return 'An account already exists with this Gmail address. Sign in using your existing password first.'
    case 'auth/unauthorized-domain': return 'This website domain is not authorized in Firebase Authentication. Add the current domain under Authentication → Settings → Authorized domains.'
    case 'auth/credential-already-in-use': return 'This Google account is already linked to another Converly account.'
    case 'auth/web-storage-unsupported': return 'Your browser is blocking the storage required for Google sign-in. Enable cookies/site storage and try again.'
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
  const [profileStep, setProfileStep] = useState(1)
  const [gender, setGender] = useState('male')
  const [avatarId, setAvatarId] = useState('male-01')
  const avatarLabels = ['Classic', 'Curly', 'Side part', 'Buzz cut', 'Wavy', 'Textured', 'Modern', 'Tousled', 'Sleek', 'Casual']
  const avatarChoices = avatarLabels.map((label, index) => ({ id: gender + '-' + String(index + 1).padStart(2, '0'), label }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (user) { setMode('profile'); setProfileStep(1) }
  }, [user])

  const handleGoogleSignIn = async () => {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const credential = await signInWithPopup(auth, provider)
      const googleUser = credential.user
      if (!isGmailAddress(googleUser.email)) {
        await signOut(auth)
        throw new Error('Only Google accounts ending in @gmail.com can use Converly. Choose a personal Gmail account.')
      }
      // AuthGate loads existing profiles or routes first-time users to profile setup.
    } catch (caught) {
      setError(explainAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

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
        gender,
        avatarId,
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
      gender,
      avatarId,
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
      if (user && profileStep === 1) {
        setProfileStep(2)
        setBusy(false)
        return
      }
      if (user) {
        await saveFirstProfile(user)
      } else if (mode === 'register') {
        if (password.length < 6) throw new Error('Use a password with at least 6 characters.')
        await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        setMode('profile')
        setProfileStep(1)
        setNotice('Account created. Complete your profile details next.')
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
        <p className="auth-eyebrow">{profileSetup ? (profileStep === 1 ? 'STEP 1 OF 2' : 'STEP 2 OF 2') : 'YOUR PRIVATE SPACE'}</p>
        <h1>{profileSetup ? (profileStep === 1 ? 'Create your profile' : 'Choose your avatar') : isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-description">{profileSetup ? (profileStep === 1 ? 'Choose your display name and permanent username.' : 'Select your gender and one of the 10 matching avatars.') : isRegister ? 'A calmer place for the conversations that matter.' : 'Sign in to continue to your conversations.'}</p>

        {!profileSetup && (
          <>
            <button className="auth-google-button" type="button" onClick={handleGoogleSignIn} disabled={busy}>
              <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.4 37.96 46.98 31.8 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>
          </>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          {profileSetup && profileStep === 2 ? (
            <div className="auth-avatar-step">
              <div className="auth-gender-options">
                <button type="button" className={gender === 'male' ? 'selected' : ''} onClick={() => { setGender('male'); setAvatarId('male-01') }}>Male</button>
                <button type="button" className={gender === 'female' ? 'selected' : ''} onClick={() => { setGender('female'); setAvatarId('female-01') }}>Female</button>
              </div>
              <div className="auth-avatar-grid">
                {avatarChoices.map((avatar, index) => <button type="button" key={avatar.id} className={avatarId === avatar.id ? 'selected' : ''} onClick={() => setAvatarId(avatar.id)}><span className={'auth-avatar-preview auth-avatar-' + gender}><b>{gender === 'male' ? '♂' : '♀'}</b></span><strong>{avatar.label}</strong><small>Avatar {index + 1}</small></button>)}
              </div>
              <button type="button" className="auth-back-step" onClick={() => setProfileStep(1)}>← Back to profile details</button>
            </div>
          ) : profileSetup ? (
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
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : profileSetup ? (profileStep === 1 ? 'Continue to gender & avatar' : 'Create my profile') : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>

        {!profileSetup && !isRegister && <button className="auth-text-button" type="button" onClick={handleResetPassword} disabled={busy}>Forgot password?</button>}
        {!profileSetup && (
          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Converly?'} <button type="button" onClick={() => { setMode(isRegister ? 'signin' : 'register'); setError(''); setNotice('') }}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
        )}
        {profileSetup && <p className="auth-footnote">Your username, gender and avatar are saved to your Firebase profile. Your username cannot be claimed by another account.</p>}
      </section>
    </main>
  )
}
