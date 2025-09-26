// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { SignJWT } from 'jose'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LoginSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
})

type AdminDoc = { name?: string; password?: string }

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null)
    const parsed = LoginSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Payload inválido.' }, { status: 400 })
    }
    const { name, password } = parsed.data

    const db = getAdminDb()
    const snap = await db.collection('admins').where('name', '==', name).limit(1).get()
    if (snap.empty) {
      return NextResponse.json({ message: 'Nome não encontrado.' }, { status: 401 })
    }

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
      maxAge: 60 * 60 * 2, // 2h
    })
    return res
  } catch (error) {
    const msg =
      error instanceof Error && error.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'Erro no login'
    console.error('POST /api/login:', error)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
