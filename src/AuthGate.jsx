import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db, firebaseReady, missingFirebaseConfig } from './firebase/client'
import AuthScreen from './AuthScreen'
import LandingPage from './LandingPage'
import ChatApp from './App'

export default function AuthGate() {
  const [showAuth, setShowAuth] = useState(false)
  const [session, setSession] = useState({ loading: true, user: null, profile: null, error: '' })

  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setSession({ loading: false, user: null, profile: null, error: '' })
      return undefined
    }

    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return
      if (!user) {
        setSession({ loading: false, user: null, profile: null, error: '' })
        return
      }

      setSession({ loading: true, user, profile: null, error: '' })
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', user.uid))
        if (!active) return
        setSession({
          loading: false,
          user,
          profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
          error: '',
        })
      } catch {
        if (!active) return
        setSession({ loading: false, user, profile: null, error: 'We could not load your profile. Check your connection and try again.' })
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
          <div className="auth-brand"><span className="auth-brand-mark">N</span><span>notification<span>.</span></span></div>
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
    return <AuthScreen user={session.user} initialError={session.error} onProfileSaved={handleProfileSaved} onBack={() => setShowAuth(false)} />
  }

  return <ChatApp profile={session.profile} onLogout={() => signOut(auth)} />
}
