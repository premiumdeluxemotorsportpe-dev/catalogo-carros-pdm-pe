// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin'

/**
 * Inicialização lazy do Firebase Admin.
 * Só tenta ler credenciais quando realmente for chamado (evita falhas no build).
 */
export function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.app()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  // Alternativa: chave em Base64
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

  // Caso: JSON completo na variável (menos comum)
  if (privateKey && privateKey.trim().startsWith('{')) {
    const serviceAccount = JSON.parse(privateKey) as admin.ServiceAccount
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }

  // Caso padrão: 3 variáveis separadas
  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n')
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  // Último recurso: GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp()
  }

  // Não arrebentar o build com stacktrace gigante:
  const err = new Error('FIREBASE_ADMIN_MISSING_CREDS')
  ;(err as any).code = 'FIREBASE_ADMIN_MISSING_CREDS'
  throw err
}

export function getAdminDb() {
  getAdminApp()
  return admin.firestore()
}

export function getAdminAuth() {
  getAdminApp()
  return admin.auth()
}
