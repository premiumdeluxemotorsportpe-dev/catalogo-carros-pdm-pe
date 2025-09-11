import 'server-only'
import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function verifySession(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      uid: payload.sub as string,
      isAdmin: payload['admin'] === true,
    }
  } catch {
    return null
  }
}
