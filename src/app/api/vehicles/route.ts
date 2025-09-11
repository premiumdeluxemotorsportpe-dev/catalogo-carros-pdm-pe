import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebaseAdmin'
import { allow } from '@/lib/rate'

export const runtime = 'nodejs'

const BodySchema = z.object({
  search: z.string().trim().toLowerCase().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  stock: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional(),
  minPrice: z.coerce.number().finite().optional(),
  maxPrice: z.coerce.number().finite().optional(),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
  cursor: z.string().optional(),
})

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown'
  if (!allow(ip, 120)) return new NextResponse('Too Many Requests', { status: 429 })

  const json = await req.json().catch(() => ({}))
  const body = BodySchema.parse(json)

  let q: FirebaseFirestore.Query = adminDb.collection('vehicles').where('published', '==', true)

  if (body.category) q = q.where('category', '==', body.category)
  if (body.stock !== undefined && body.stock !== '') {
    const s = body.stock === true || body.stock === 'true'
    q = q.where('stock', '==', s)
  }
  if (typeof body.minPrice !== 'undefined') q = q.where('price', '>=', body.minPrice)
  if (typeof body.maxPrice !== 'undefined') q = q.where('price', '<=', body.maxPrice)

  if (body.search && body.search.length >= 2) {
    const start = body.search
    const end = start.slice(0, -1) + String.fromCharCode(start.charCodeAt(start.length - 1) + 1)
    q = q.where('search_index', '>=', start).where('search_index', '<', end)
  }

  if (body.cursor) {
    const snapCursor = await adminDb.doc(`vehicles/${body.cursor}`).get()
    if (snapCursor.exists) q = q.startAfter(snapCursor)
  }

  q = q.limit(body.pageSize)

  const snap = await q.get()
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const nextCursor = snap.size === body.pageSize ? snap.docs[snap.size - 1].id : null

  return NextResponse.json({ items, nextCursor })
}
