import admin from 'firebase-admin'

function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.app()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!privateKey && process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    } catch { /* ignore */ }
  }

  if (privateKey && privateKey.trim().startsWith('{')) {
    const serviceAccount = JSON.parse(privateKey)
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    })
  }

  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n')
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp()
  }

  throw new Error('Firebase Admin: credenciais em falta.')
}

const app = getAdminApp()
export const adminDb = admin.firestore()
export const adminAuth = admin.auth()

export default app
export { app as adminApp } // opcional para scripts
