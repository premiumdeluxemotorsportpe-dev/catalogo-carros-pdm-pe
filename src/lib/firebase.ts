import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore as getFirestoreWeb } from 'firebase/firestore'
import { getFirestore as getFirestoreLite } from 'firebase/firestore/lite'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Para componentes cliente
export const db = getFirestoreWeb(app)
// Para rotas (server) – sem streams/gRPC
export const dbLite = getFirestoreLite(app)
