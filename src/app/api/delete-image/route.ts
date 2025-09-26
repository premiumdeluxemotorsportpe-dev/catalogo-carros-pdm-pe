import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { jwtVerify } from 'jose'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function assertAdmin(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try { const { payload } = await jwtVerify(token, secret); return payload.admin === true }
  catch { return false }
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin(req))) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: { public_id?: string }
  try {
    body = (await req.json()) as { public_id?: string }
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  const { public_id } = body
  if (!public_id) return NextResponse.json({ error: 'public_id em falta' }, { status: 400 })

  try {
    const result = await cloudinary.uploader.destroy(public_id)
    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Erro ao apagar imagem no Cloudinary:', err)
    return NextResponse.json({ error: 'Erro ao apagar imagem' }, { status: 500 })
  }
}
