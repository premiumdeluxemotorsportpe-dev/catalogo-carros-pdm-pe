import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { adminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function isAdmin(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.admin === true
  } catch {
    return false
  }
}

type AdminDoc = { name?: string }

export async function GET(req: NextRequest) {
  // exige sessão de admin (mesma cookie criada em /api/login)
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const snap = await adminDb.collection('admins').get()
    const items = snap.docs.map((d) => {
      const data = (d.data() as AdminDoc) ?? {}
      return { id: d.id, name: String(data.name ?? '') }
    })
    return NextResponse.json({ items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
