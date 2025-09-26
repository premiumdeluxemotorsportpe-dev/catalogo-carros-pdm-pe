// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin'

function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.app()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  // Alternativa: private key em Base64
  if (!privateKey && process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(
        process.env.FIREBASE_PRIVATE_KEY_BASE64,
        'base64'
      ).toString('utf8')
    } catch {
      /* ignore */
    }
  }

  // Caso: JSON inteiro da service account numa variável
  if (privateKey && privateKey.trim().startsWith('{')) {
    const serviceAccount = JSON.parse(privateKey)
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    })
  }

  // Caso padrão: 3 variáveis separadas
  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  // Último recurso: GOOGLE_APPLICATION_CREDENTIALS (ficheiro JSON)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp()
  }

  throw new Error(
    'Firebase Admin: credenciais em falta. Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY (ou *_BASE64 / GOOGLE_APPLICATION_CREDENTIALS).'
  )
}

const app = getAdminApp() // <- const, não let

export const adminDb = admin.firestore()
export const adminAuth = admin.auth()
export default app
