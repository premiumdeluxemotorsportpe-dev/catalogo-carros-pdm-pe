import { getAdminApp } from '@/lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'

async function run() {
  const [, , uid, flag] = process.argv
  if (!uid) {
    console.error('Uso: ts-node scripts/setAdminClaim.ts <uid> <true|false>')
    process.exit(1)
  }
  const isAdmin = String(flag).toLowerCase() === 'true'

  const app = getAdminApp()
  const auth = getAuth(app)

  await auth.setCustomUserClaims(uid, { admin: isAdmin })
  console.log(`Custom claim admin=${isAdmin} aplicado ao utilizador ${uid}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
