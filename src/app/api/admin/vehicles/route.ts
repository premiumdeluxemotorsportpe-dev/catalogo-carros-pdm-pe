import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { jwtVerify } from 'jose'

export const runtime = 'nodejs'
// Isto evita tentativas de pre-render/prefetch que puxem o módulo no build.
export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function isAdmin(req: NextRequest) {
  const t = req.cookies.get('session')?.value
  if (!t) return false
  try {
    const { payload } = await jwtVerify(t, secret)
    return payload.admin === true
  } catch {
    return false
  }
}

function badRequest(msg: string) {
  return NextResponse.json({ message: msg }, { status: 400 })
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const { searchParams } = new URL(req.url)
    const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') || '50'), 1), 200)
    const cursor = searchParams.get('cursor')

    let q: FirebaseFirestore.Query = db.collection('vehicles').orderBy('brand').limit(pageSize)
    if (cursor) {
      const cursorDoc = await db.collection('vehicles').doc(cursor).get()
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc)
      }
    }

    const snap = await q.get()
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
    const nextCursor = snap.size === pageSize ? snap.docs[snap.docs.length - 1].id : null

    return NextResponse.json({ items, nextCursor })
  } catch (e) {
    // Quando os envs não estão definidos em runtime, aqui é que lançará — não no build.
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta. Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY (ou *_BASE64).'
        : 'Erro ao listar veículos.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const body = (await req.json()) as Record<string, unknown>

    const data = {
      brand: String(body.brand ?? ''),
      category: String(body.category ?? ''),
      model: String(body.model ?? ''),
      price: Number(body.price ?? 0),
      speed_original: body.speed_original !== undefined ? Number(body.speed_original) : undefined,
      speed_tuned: body.speed_tuned !== undefined ? Number(body.speed_tuned) : undefined,
      trunk_capacity: body.trunk_capacity !== undefined ? Number(body.trunk_capacity) : undefined,
      stock: Boolean(body.stock),
      image_url: String(body.image_url ?? ''),
      image_public_id: body.image_public_id ? String(body.image_public_id) : undefined,
      published: body.published !== undefined ? Boolean(body.published) : true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Limpa undefined/NaN
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => !(v === undefined || (typeof v === 'number' && Number.isNaN(v))))
    )

    if (!cleaned.brand || !cleaned.model || !cleaned.category) {
      return badRequest('Campos obrigatórios: brand, model, category')
    }

    const ref = await db.collection('vehicles').add(cleaned)
    return NextResponse.json({ ok: true, id: ref.id })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro ao criar veículo.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const body = (await req.json()) as Record<string, unknown>
    const id = String(body.id ?? '')
    if (!id) return badRequest('Falta o id')

    const update = {
      brand: body.brand !== undefined ? String(body.brand) : undefined,
      category: body.category !== undefined ? String(body.category) : undefined,
      model: body.model !== undefined ? String(body.model) : undefined,
      price: body.price !== undefined ? Number(body.price) : undefined,
      speed_original: body.speed_original !== undefined ? Number(body.speed_original) : undefined,
      speed_tuned: body.speed_tuned !== undefined ? Number(body.speed_tuned) : undefined,
      trunk_capacity: body.trunk_capacity !== undefined ? Number(body.trunk_capacity) : undefined,
      stock: body.stock !== undefined ? Boolean(body.stock) : undefined,
      image_url: body.image_url !== undefined ? String(body.image_url) : undefined,
      image_public_id: body.image_public_id !== undefined ? String(body.image_public_id) : undefined,
      published: body.published !== undefined ? Boolean(body.published) : undefined,
      updatedAt: Date.now(),
    }

    const cleaned = Object.fromEntries(
      Object.entries(update).filter(([_, v]) => !(v === undefined || (typeof v === 'number' && Number.isNaN(v))))
    )

    await db.collection('vehicles').doc(id).set(cleaned, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro ao atualizar veículo.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return badRequest('Falta o id')
    await db.collection('vehicles').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro ao apagar veículo.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
