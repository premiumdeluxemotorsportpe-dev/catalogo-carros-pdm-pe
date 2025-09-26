import admin from 'firebase-admin'

/**
 * Inicialização lazy do Firebase Admin.
 * Só tenta ler credenciais quando for realmente chamado (evita falhas no build).
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
      // ignore
    }
  }

  // Caso: JSON completo na variável
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

  // Lança erro tipado (sem any)
  type AdminInitError = Error & { code?: string }
  const err: AdminInitError = new Error('FIREBASE_ADMIN_MISSING_CREDS')
  err.code = 'FIREBASE_ADMIN_MISSING_CREDS'
  throw err
}

export function getAdminDb() {
  return getAdminApp().firestore()
}

export function getAdminAuth() {
  return getAdminApp().auth()
}
