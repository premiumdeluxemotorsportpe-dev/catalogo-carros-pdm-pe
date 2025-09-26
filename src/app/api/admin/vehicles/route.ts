// src/app/api/admin/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { FieldPath } from 'firebase-admin/firestore'
import { jwtVerify } from 'jose'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- Auth ----------
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.admin === true
  } catch {
    return false
  }
}

// ---------- Types ----------
export type Veiculo = {
  id: string
  brand: string
  category: string
  model: string
  price: number
  speed_original: number
  speed_tuned?: number
  trunk_capacity?: number
  stock: boolean
  image_url?: string
  image_public_id?: string
  published: boolean
}

// ---------- Validation ----------
const createSchema = z.object({
  brand: z.string().min(1),
  category: z.string().min(1),
  model: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  speed_original: z.coerce.number().nonnegative(),
  speed_tuned: z.coerce.number().nonnegative().optional(),
  trunk_capacity: z.coerce.number().nonnegative().optional(),
  stock: z.boolean().default(false),
  image_url: z.string().url().optional(),
  image_public_id: z.string().optional(),
  published: z.boolean().default(true),
})

const updateSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  speed_original: z.coerce.number().nonnegative().optional(),
  speed_tuned: z.coerce.number().nonnegative().optional(),
  trunk_capacity: z.coerce.number().nonnegative().optional(),
  stock: z.boolean().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  image_public_id: z.string().optional(),
  published: z.boolean().optional(),
})

// ---------- GET (list + paginação por id) ----------
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const { searchParams } = new URL(req.url)
    const pageSize = Math.min(Number(searchParams.get('pageSize') || 24), 200)
    const cursor = searchParams.get('cursor')

    let q = db
      .collection('vehicles')
      .orderBy(FieldPath.documentId())
      .limit(pageSize + 1) // +1 para saber se há próxima página

    if (cursor) {
      const curSnap = await db.collection('vehicles').doc(cursor).get()
      if (curSnap.exists) {
        q = q.startAfter(curSnap.ref)
      }
    }

    const snap = await q.get()
    const docs = snap.docs
    const items = docs.slice(0, pageSize).map((d) => {
      const data = d.data()
      return {
        id: d.id,
        brand: String(data.brand ?? ''),
        category: String(data.category ?? ''),
        model: String(data.model ?? ''),
        price: Number(data.price ?? 0),
        speed_original: Number(data.speed_original ?? 0),
        speed_tuned: data.speed_tuned !== undefined ? Number(data.speed_tuned) : undefined,
        trunk_capacity: data.trunk_capacity !== undefined ? Number(data.trunk_capacity) : undefined,
        stock: Boolean(data.stock),
        image_url: data.image_url ? String(data.image_url) : undefined,
        image_public_id: data.image_public_id ? String(data.image_public_id) : undefined,
        published: Boolean(data.published),
      } as Veiculo
    })

    const hasMore = docs.length > pageSize
    const nextCursor = hasMore ? docs[pageSize].id : null

    return NextResponse.json({ items, nextCursor })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro a obter veículos.'
    console.error('GET /api/admin/vehicles:', e)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

// ---------- POST (create) ----------
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
    }

    const db = getAdminDb()
    const toSave = parsed.data
    const ref = await db.collection('vehicles').add(toSave)
    return NextResponse.json({ id: ref.id })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro a criar veículo.'
    console.error('POST /api/admin/vehicles:', e)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

// ---------- PATCH (update) ----------
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
    }

    const { id, ...rest } = parsed.data
    const update: Record<string, unknown> = {}

    // copia apenas campos definidos (evitar apagar com undefined)
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined) update[k] = v
    })

    const db = getAdminDb()
    await db.collection('vehicles').doc(id).set(update, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro a atualizar veículo.'
    console.error('PATCH /api/admin/vehicles:', e)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

// ---------- DELETE ----------
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ message: 'Parâmetro "id" é obrigatório.' }, { status: 400 })
    }

    const db = getAdminDb()
    await db.collection('vehicles').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg =
      e instanceof Error && e.message === 'FIREBASE_ADMIN_MISSING_CREDS'
        ? 'Credenciais Firebase Admin em falta.'
        : 'Erro a apagar veículo.'
    console.error('DELETE /api/admin/vehicles:', e)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
