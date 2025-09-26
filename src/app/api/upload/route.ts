import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function POST(req: NextRequest) {
  let file: File | null = null

  try {
    const data = await req.formData()
    file = data.get('file') as File | null
  } catch {
    return NextResponse.json({ error: 'Erro ao ler o formulário' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'Ficheiro não enviado' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<unknown>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'gta-vehicles' }, (error, result) => {
          if (error) return reject(error)
          resolve(result)
        })
        .end(buffer)
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro no upload:', error);
    return new Response('Erro no upload', { status: 500 });
  }
}
