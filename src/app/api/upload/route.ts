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

  let file: File | null = null
  try {
    const data = await req.formData()
    file = data.get('file') as File | null
  } catch {
    return NextResponse.json({ error: 'Erro ao ler o formulário' }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: 'Ficheiro não enviado' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'gta-vehicles' }, (error, result) => {
          if (error) return reject(error)
          resolve(result)
        })
        .end(buffer)
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
