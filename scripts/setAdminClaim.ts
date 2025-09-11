import { adminApp } from '@/lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'

async function run() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: ts-node scripts/setAdminClaim.ts user@example.com')
    process.exit(1)
  }
  const user = await getAuth(adminApp).getUserByEmail(email)
  await getAuth(adminApp).setCustomUserClaims(user.uid, { admin: true })
  console.log('Admin claim set for', email)
}
run()
