import { NextRequest, NextResponse } from 'next/server'
import { dbLite } from '@/lib/firebase'
import {
  collection, getDocs, getDoc, query, where,
  limit as fsLimit, startAfter, doc, type QueryConstraint,
} from 'firebase/firestore/lite'
import { z } from 'zod'

export const runtime = 'nodejs'

const Schema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  stock: z.string().optional(), // '' | 'true' | 'false'
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
  cursor: z.string().nullable().optional(),
})

async function listVehicles(input: z.infer<typeof Schema>) {
  const col = collection(dbLite, 'vehicles')
  const cs: QueryConstraint[] = []

  // OBRIGATÓRIO para respeitar os rules
  cs.push(where('published', '==', true))

  if (input.category?.trim()) cs.push(where('category', '==', input.category.trim()))
  if (input.stock === 'true' || input.stock === 'false') cs.push(where('stock', '==', input.stock === 'true'))

  if (input.cursor) {
    const last = await getDoc(doc(dbLite, 'vehicles', input.cursor))
    if (last.exists()) cs.push(startAfter(last))
  }

  cs.push(fsLimit(input.pageSize))

  const snap = await getDocs(query(col, ...cs))
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const nextCursor = snap.size < input.pageSize ? null : snap.docs[snap.docs.length - 1].id
  return { items, nextCursor }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const parsed = Schema.safeParse(payload)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
    return NextResponse.json(await listVehicles(parsed.data))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('POST /api/vehicles:', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const parsed = Schema.safeParse({
      search: sp.get('search') ?? undefined,
      category: sp.get('category') ?? undefined,
      stock: sp.get('stock') ?? undefined,
      minPrice: sp.get('minPrice') ?? undefined,
      maxPrice: sp.get('maxPrice') ?? undefined,
      pageSize: sp.get('pageSize') ? Number(sp.get('pageSize')) : undefined,
      cursor: sp.get('cursor'),
    })
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
    return NextResponse.json(await listVehicles(parsed.data))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/vehicles:', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
