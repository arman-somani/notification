import React, { createContext, useState, useEffect } from 'react';
import {
  auth, db
} from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const AuthContext = createContext();

const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const LOCAL_USER_KEY = 'nexus_local_user';

const providers = {
  google: new GoogleAuthProvider(),
  facebook: new FacebookAuthProvider(),
  github: new GithubAuthProvider()
};

const makeLocalUser = (username) => {
  const id = `local_${Math.random().toString(36).slice(2, 11)}`;
  const user = { _id: id, username, isLocalDev: true, createdAt: new Date().toISOString() };
  try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user)); } catch (e) { /* noop */ }
  return user;
};

const getLocalUser = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveSocialUser = async (credential) => {
  const user = credential.user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.slice(0, 6)}`,
      email: user.email,
      avatar: user.photoURL,
      provider: user.providerData[0]?.providerId,
      createdAt: new Date().toISOString()
    });
  }
  return user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_LOCAL) {
      const stored = getLocalUser();
      if (stored) setUser(stored);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ _id: firebaseUser.uid, ...userDoc.data() });
        } else {
          setUser({ _id: firebaseUser.uid, username: firebaseUser.isAnonymous ? `Guest_${firebaseUser.uid.substring(0, 5)}` : firebaseUser.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      if (IS_LOCAL) {
        const localUser = makeLocalUser(`Guest_${Date.now().toString(36).slice(-5)}`);
        setUser(localUser);
        setLoading(false);
        return { user: localUser };
      }
      const result = await signInAnonymously(auth);
      await setDoc(doc(db, 'users', result.user.uid), {
        username: `Guest_${result.user.uid.substring(0, 5)}`,
        isGuest: true,
        online: true,
        lastSeen: serverTimestamp()
      });
      // Mark offline when tab closes
      window.addEventListener('beforeunload', () => {
        updateDoc(doc(db, 'users', result.user.uid), { online: false, lastSeen: serverTimestamp() });
      });
      return result;
    } catch (error) {
      console.error('Failed to auto-login as guest', error);
      throw new Error(error?.message || 'Guest login failed');
    } finally {
      if (!IS_LOCAL) setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    if (IS_LOCAL) {
      try {
        return await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const localUser = makeLocalUser(email.split('@')[0] || 'dev_user');
        setUser(localUser);
        return { user: localUser };
      }
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, 'users', result.user.uid), { online: true, lastSeen: serverTimestamp() });
    window.addEventListener('beforeunload', () => {
      updateDoc(doc(db, 'users', result.user.uid), { online: false, lastSeen: serverTimestamp() });
    });
    return result;
  };

  const registerUser = async (email, password, username) => {
    if (IS_LOCAL) {
      const localUser = makeLocalUser(username || email.split('@')[0]);
      setUser(localUser);
      return { user: localUser };
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username, email, online: true, lastSeen: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    window.addEventListener('beforeunload', () => {
      updateDoc(doc(db, 'users', userCredential.user.uid), { online: false, lastSeen: serverTimestamp() });
    });
    return userCredential;
  };

  const loginWithProvider = async (providerName) => {
    if (IS_LOCAL) {
      const localUser = makeLocalUser(providerName === 'google' ? 'Google User' : providerName === 'facebook' ? 'Facebook User' : 'GitHub User');
      setUser(localUser);
      return { user: localUser };
    }
    const provider = providers[providerName];
    if (!provider) throw new Error(`Unknown provider: ${providerName}`);
    const result = await signInWithPopup(auth, provider);
    await saveSocialUser(result);
    await updateDoc(doc(db, 'users', result.user.uid), { online: true, lastSeen: serverTimestamp() });
    window.addEventListener('beforeunload', () => {
      updateDoc(doc(db, 'users', result.user.uid), { online: false, lastSeen: serverTimestamp() });
    });
    return result;
  };

  const logout = async () => {
    if (IS_LOCAL) {
      try { localStorage.removeItem(LOCAL_USER_KEY); } catch { /* noop */ }
      setUser(null);
      window.location.reload();
      return;
    }
    if (user?._id) {
      await updateDoc(doc(db, 'users', user._id), { online: false, lastSeen: serverTimestamp() });
    }
    await signOut(auth);
    window.location.reload();
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    if (IS_LOCAL && updatedUser) {
      try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser)); } catch { /* noop */ }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginUser,
      registerUser,
      logout,
      loginAsGuest,
      loginWithProvider,
      updateUser,
      loading,
      isLocalDev: IS_LOCAL
    }}>
      {children}
    </AuthContext.Provider>
  );
};
