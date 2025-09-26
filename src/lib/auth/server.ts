// src/lib/auth.ts
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type AdminSession = { admin: boolean; name: string }

export async function requireAdmin(): Promise<AdminSession> {
  const jar = await cookies()
  const token = jar.get('session')?.value
  if (!token) throw new Error('Sem sessão')

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')
  const { payload } = await jwtVerify(token, secret)
  if (!payload || payload.admin !== true) throw new Error('Sessão inválida')

  return { admin: true, name: String(payload.name || '') }
}
