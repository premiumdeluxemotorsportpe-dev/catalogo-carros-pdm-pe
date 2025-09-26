import { dbLite } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore/lite'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(req: Request) {
  const { name, password } = await req.json()

  const q = query(collection(dbLite, 'admins'), where('name', '==', name))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return NextResponse.json({ message: 'Nome não encontrado.' }, { status: 401 })
  }

  const doc = snapshot.docs[0]
  const adminData = doc.data() as { password: string; isAdmin?: boolean }

  if (adminData.password !== password) {
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
}
