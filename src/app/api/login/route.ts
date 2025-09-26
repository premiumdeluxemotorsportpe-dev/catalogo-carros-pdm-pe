import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { SignJWT } from 'jose'

export const runtime = 'nodejs'

type AdminDoc = { name?: string; password?: string }

export async function POST(req: Request) {
  try {
    const { name, password } = (await req.json()) as { name: string; password: string }

    const snap = await adminDb.collection('admins').where('name', '==', name).limit(1).get()
    if (snap.empty) return NextResponse.json({ message: 'Nome não encontrado.' }, { status: 401 })

    const data = snap.docs[0].data() as AdminDoc
    if ((data.password ?? '') !== password) {
      return NextResponse.json({ message: 'Senha incorreta.' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')
    const token = await new SignJWT({ admin: true, name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret)

    const res = NextResponse.json({ ok: true })
    res.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2,
    })
    return res
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : 'Erro no login'
    console.error('POST /api/login:', error)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
