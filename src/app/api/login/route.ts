import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(req: Request) {
  const { name, password } = await req.json()

  const q = query(collection(db, 'admins'), where('name', '==', name))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return NextResponse.json({ message: 'Nome não encontrado.' }, { status: 401 })
  }

  const adminDoc = snapshot.docs[0]
  const adminData = adminDoc.data()

  if (adminData.password !== password) {
    return NextResponse.json({ message: 'Senha incorreta.' }, { status: 401 })
  }

  const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET || 'supersegredoseguroseguroseguro')

  const token = await new SignJWT({ name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret)

  return NextResponse.json({ token })
}
