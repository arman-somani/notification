import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ _id: firebaseUser.uid, ...userDoc.data() });
        } else {
          // Fallback if not in Firestore (e.g., anonymous)
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
      const result = await signInAnonymously(auth);
      await setDoc(doc(db, 'users', result.user.uid), {
        username: `Guest_${result.user.uid.substring(0, 5)}`,
        isGuest: true
      });
    } catch (error) {
      console.error('Failed to auto-login as guest', error);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerUser = async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: username,
      email: email,
      createdAt: new Date().toISOString()
    });
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, registerUser, logout, loginAsGuest, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
