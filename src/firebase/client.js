import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured, missingFirebaseConfig } from './config'

// Keep the existing chat UI usable while local Firebase configuration is incomplete.
const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const firebaseApp = app
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const realtimeDb = app ? getDatabase(app) : null
export const firebaseReady = Boolean(app)
export { isFirebaseConfigured, missingFirebaseConfig }
