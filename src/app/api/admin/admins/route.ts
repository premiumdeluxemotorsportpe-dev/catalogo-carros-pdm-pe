import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { jwtVerify } from 'jose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function isAdmin(req: NextRequest) {
  const t = req.cookies.get('session')?.value
  if (!t) return false
  try { const { payload } = await jwtVerify(t, secret); return payload.admin === true } catch { return false }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  try {
    const db = getAdminDb()
    const snap = await db.collection('admins').get()
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
    return NextResponse.json({ items })
  } catch (e) {
    const msg = e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
      ? 'Credenciais Firebase Admin em falta.'
      : 'Erro ao listar admins.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
