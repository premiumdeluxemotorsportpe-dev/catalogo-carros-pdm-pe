import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

type DeleteBody = {
  public_id?: string
}

export async function POST(req: NextRequest) {
  let body: DeleteBody
  try {
    body = (await req.json()) as DeleteBody
  } catch (error) {
    return new Response('Erro ao apagar', { status: 500 });
  }

  const { public_id } = body

  if (!public_id || typeof public_id !== 'string') {
    return NextResponse.json({ error: 'public_id em falta ou inválido' }, { status: 400 })
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id)
    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Erro ao apagar imagem no Cloudinary:', err)
    return NextResponse.json({ error: 'Erro ao apagar imagem' }, { status: 500 })
  }
}
