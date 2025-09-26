import { NextRequest, NextResponse } from 'next/server'
import { dbLite } from '@/lib/firebase'
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  limit as fsLimit,
  startAfter,
  doc,
  type QueryConstraint,
} from 'firebase/firestore/lite'
import { z } from 'zod'

export const runtime = 'nodejs'

const Schema = z.object({
  search: z.string().optional(),     // filtrado no cliente
  category: z.string().optional(),
  stock: z.string().optional(),      // '' | 'true' | 'false'
  minPrice: z.string().optional(),   // filtrado no cliente
  maxPrice: z.string().optional(),   // filtrado no cliente
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
  cursor: z.string().nullable().optional(),
})
type Filters = z.infer<typeof Schema>

async function listVehicles(input: Filters) {
  const col = collection(dbLite, 'vehicles')
  const constraints: QueryConstraint[] = []

  if (input.category?.trim()) constraints.push(where('category', '==', input.category.trim()))
  if (input.stock === 'true' || input.stock === 'false') {
    constraints.push(where('stock', '==', input.stock === 'true'))
  }

  if (input.cursor) {
    const last = await getDoc(doc(dbLite, 'vehicles', input.cursor))
    if (last.exists()) constraints.push(startAfter(last))
  }

  constraints.push(fsLimit(input.pageSize))

  const snap = await getDocs(query(col, ...constraints))
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const nextCursor = snap.size < input.pageSize ? null : snap.docs[snap.docs.length - 1].id
  return { items, nextCursor }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const parsed = Schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
    }
    const result = await listVehicles(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error)
    console.error('POST /api/vehicles:', error)
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
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
    }
    const result = await listVehicles(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error)
    console.error('GET /api/vehicles:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
