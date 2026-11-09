import { useEffect, useRef, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getIdTokenResult, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db, firebaseReady, missingFirebaseConfig } from './firebase/client'
import AuthScreen from './AuthScreen'
import LandingPage from './LandingPage'
import ChatApp from './App'
import ChatAppErrorBoundary from './ChatAppErrorBoundary'
import { isDesignatedAdminEmail } from './adminConfig'

const isGmailAddress = (value) => new RegExp('^[^\\s@]+@gmail\\.com$', 'i').test(String(value || '').trim())

export default function AuthGate() {
  const [showAuth, setShowAuth] = useState(false)
  const [session, setSession] = useState({ loading: true, user: null, profile: null, isAdmin: false, error: '' })
  const rejectedAccountMessage = useRef('')

  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setSession({ loading: false, user: null, profile: null, isAdmin: false, error: '' })
      return undefined
    }

    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return
      if (!user) {
        setSession({ loading: false, user: null, profile: null, isAdmin: false, error: rejectedAccountMessage.current })
        return
      }

      if (!isGmailAddress(user.email)) {
        rejectedAccountMessage.current = 'Only @gmail.com accounts can use Converly. Please sign in with a Gmail address.'
        setShowAuth(true)
        try { await signOut(auth) } catch { /* The app remains locked out unless a Gmail account signs in. */ }
        if (active) setSession({ loading: false, user: null, profile: null, isAdmin: false, error: rejectedAccountMessage.current })
        return
      }

      rejectedAccountMessage.current = ''
      setSession({ loading: true, user, profile: null, isAdmin: false, error: '' })
      try {
        // Admin access is restricted to the exact, Firebase-verified owner email.
        // This avoids requiring a separately provisioned custom claim.
        await getIdTokenResult(user, true)
        const isAdmin = isDesignatedAdminEmail(user.email) && user.emailVerified
        const profileSnapshot = await getDoc(doc(db, 'users', user.uid))
        if (!active) return
        setSession({
          loading: false,
          user,
          profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
          isAdmin,
          error: '',
        })
      } catch {
        if (!active) return
        setSession({ loading: false, user, profile: null, isAdmin: false, error: 'We could not load your profile. Check your connection and try again.' })
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const handleProfileSaved = (profile) => {
    setSession((current) => ({ ...current, loading: false, profile, error: '' }))
  }

  if (!firebaseReady) {
    if (!showAuth) return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand"><span className="auth-brand-mark">C</span><span>converly<span>.</span></span></div>
          <p className="auth-eyebrow">LOCAL CONFIGURATION REQUIRED</p>
          <h1>Connect your Firebase project</h1>
          <p className="auth-description">The app is ready for authentication, but these local environment values are missing:</p>
          <ul className="auth-missing-list">{missingFirebaseConfig.map((key) => <li key={key}><code>{key}</code></li>)}</ul>
          <p className="auth-footnote">Add the values to <code>.env.local</code> in your project folder, then restart Vite. Never paste private keys or passwords into chat.</p>
        </section>
      </main>
    )
  }

  if (session.loading) {
    return <main className="auth-page"><div className="auth-loading"><span className="auth-spinner" /> Checking your secure session…</div></main>
  }

  if (!session.user || !session.profile) {
    if (!session.user && !showAuth) return <LandingPage onGetStarted={() => setShowAuth(true)} />
    return <AuthScreen user={session.user} initialError={session.error} onProfileSaved={handleProfileSaved} onBack={!session.user ? () => { rejectedAccountMessage.current = ''; setSession({ loading: false, user: null, profile: null, error: '' }); setShowAuth(false) } : undefined} />
  }

  return <ChatAppErrorBoundary><ChatApp profile={session.profile} isAdmin={session.isAdmin} onLogout={() => signOut(auth)} /></ChatAppErrorBoundary>
}
