import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { jwtVerify } from 'jose'
import { z } from 'zod'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

async function assertAdmin(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.admin === true
  } catch {
    return false
  }
}

const VehicleSchema = z.object({
  id: z.string().optional(),
  brand: z.string().min(1),
  category: z.string().min(1),
  model: z.string().min(1),
  price: z.number().nonnegative().optional(),
  speed_original: z.number().nonnegative().optional(),
  speed_tuned: z.number().nonnegative().optional(),
  trunk_capacity: z.number().nonnegative().optional(),
  stock: z.boolean().default(false),
  image_url: z.string().url().optional().or(z.literal('')),
  image_public_id: z.string().optional(),
  published: z.boolean().default(true),
})

/** GET /api/admin/vehicles?pageSize=100&cursor=<docId> */
export async function GET(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const pageSize = Math.max(1, Math.min(Number(sp.get('pageSize') ?? 100), 200))
  const cursor = sp.get('cursor')

  let ref = adminDb.collection('vehicles').orderBy('brand', 'asc').limit(pageSize)

  if (cursor) {
    const last = await adminDb.collection('vehicles').doc(cursor).get()
    if (last.exists) {
      ref = ref.startAfter(last)
    }
  }

  const snap = await ref.get()
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const nextCursor = snap.size < pageSize ? null : snap.docs[snap.docs.length - 1].id

  return NextResponse.json({ items, nextCursor })
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const raw = await req.json()
  const parsed = VehicleSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }
  const docRef = await adminDb.collection('vehicles').add(parsed.data)
  return NextResponse.json({ id: docRef.id })
}

export async function PATCH(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const raw = await req.json()
  const { id, ...rest } = raw ?? {}
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }
  const parsed = VehicleSchema.partial().safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }
  await adminDb.collection('vehicles').doc(id).set(parsed.data, { merge: true })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const sp = req.nextUrl.searchParams
  const id = sp.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await adminDb.collection('vehicles').doc(id).delete()
  return NextResponse.json({ ok: true })
}
