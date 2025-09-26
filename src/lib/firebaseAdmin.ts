// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin'

let appInstance: admin.app.App | null = null

function buildAppFromEnv(): admin.app.App {
  // Se já existir, reutiliza
  if (admin.apps.length) return admin.app()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  // Alternativa BASE64
  if (!privateKey && process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(
        process.env.FIREBASE_PRIVATE_KEY_BASE64,
        'base64'
      ).toString('utf8')
    } catch {
      // ignora
    }
  }

  // Normaliza \n
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  // Caso: 3 envs separados
  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  // Caso: GOOGLE_APPLICATION_CREDENTIALS (menos comum em serverless)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp()
  }

  // Não fazer throw no import — apenas quando for usado num handler.
  throw new Error('FIREBASE_ADMIN_MISSING_CREDS')
}

/** Obtém (ou cria) a app Admin. Lança erro **apenas** quando usada sem envs. */
export function getAdminApp(): admin.app.App {
  if (appInstance) return appInstance
  appInstance = buildAppFromEnv()
  return appInstance
}

export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore()
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth()
}
