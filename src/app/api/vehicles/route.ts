// src/app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

/** Helpers Zod para aceitar strings/boolean/empty e normalizar */
const boolish = z.preprocess((v) => {
  if (v === '' || v === undefined || v === null) return undefined
  if (v === true || v === false) return v
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  return v
}, z.boolean().optional())

const numberish = z.preprocess((v) => {
  if (v === '' || v === undefined || v === null) return undefined
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}, z.number().optional())

const cursorish = z.preprocess((v) => {
  if (v === '' || v === undefined || v === null) return undefined
  return v
}, z.string().optional())

const BodySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: numberish,
  maxPrice: numberish,
  minSpeed: numberish,
  maxSpeed: numberish,
  minTrunk: numberish,
  maxTrunk: numberish,
  stock: boolish, // aceita true/false, "true"/"false", "" e undefined
  sortField: z
    .enum(['brand', 'model', 'price', 'speed_original', 'speed_tuned', 'trunk_capacity'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.preprocess((v) => {
    if (v === '' || v === undefined || v === null) return 20
    const n = typeof v === 'string' ? Number(v) : Number(v)
    if (Number.isNaN(n)) return 20
    return Math.min(Math.max(n, 1), 50) // 1..50
  }, z.number().int()),
  cursor: cursorish, // aceita string, null, "", undefined
}).strict()

/**
 * POST: lista vehicles publicados com filtros, ordenação e paginação por cursor.
 * Body JSON: ver BodySchema acima.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}))
    const body = BodySchema.parse(json)

    const {
      search,
      category,
      minPrice,
      maxPrice,
      minSpeed,
      maxSpeed,
      minTrunk,
      maxTrunk,
      stock,
      sortField = 'price',
      sortOrder = 'asc',
      limit,
      cursor,
    } = body

    // Base query: publicados
    let q: FirebaseFirestore.Query = adminDb
      .collection('vehicles')
      .where('published', '==', true)

    // Filtros simples por igualdade
    if (category) q = q.where('category', '==', category)
    if (typeof stock === 'boolean') q = q.where('stock', '==', stock)

    // Range filters — precisam de índices se combinados
    if (minPrice !== undefined) q = q.where('price', '>=', minPrice)
    if (maxPrice !== undefined) q = q.where('price', '<=', maxPrice)

    if (minSpeed !== undefined) q = q.where('speed_original', '>=', minSpeed)
    if (maxSpeed !== undefined) q = q.where('speed_original', '<=', maxSpeed)

    if (minTrunk !== undefined) q = q.where('trunk_capacity', '>=', minTrunk)
    if (maxTrunk !== undefined) q = q.where('trunk_capacity', '<=', maxTrunk)

    // Ordenação
    q = q.orderBy(sortField, sortOrder)
    q = q.limit(limit)

    // Cursor (paginações seguintes)
    if (cursor) {
      const docSnap = await adminDb.collection('vehicles').doc(cursor).get()
      if (docSnap.exists) {
        q = q.startAfter(docSnap)
      }
    }

    // Executa query
    const snap = await q.get()
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Filtro por search (brand+model) — no cliente seria melhor, mas ok aqui também
    if (search && search.trim()) {
      const s = search.trim().toLowerCase()
      items = items.filter((v: any) =>
        `${v.brand ?? ''} ${v.model ?? ''}`.toLowerCase().includes(s)
      )
    }

    // nextCursor = id do último doc retornado (para paginação)
    const lastDoc = snap.docs[snap.docs.length - 1]
    const nextCursor = lastDoc ? lastDoc.id : undefined

    return NextResponse.json({ items, nextCursor })
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Mostra erros de validação de forma segura
      return NextResponse.json(
        { error: 'Invalid request', issues: err.issues },
        { status: 400 }
      )
    }
    console.error('Erro no /api/vehicles:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** GET simples (opcional) para testar rapidamente sem body */
export async function GET() {
  try {
    const snap = await adminDb
      .collection('vehicles')
      .where('published', '==', true)
      .orderBy('price', 'asc')
      .limit(20)
      .get()

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const lastDoc = snap.docs[snap.docs.length - 1]
    const nextCursor = lastDoc ? lastDoc.id : undefined

    return NextResponse.json({ items, nextCursor })
  } catch (err) {
    console.error('Erro no GET /api/vehicles:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
