'use client'

import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddVeiculoForm from '@/components/AddVeiculoForm'
import EditVeiculoForm from '@/components/EditVeiculoForm'
import Image from 'next/image'

/** Tipo partilhado com os formulários */
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
  image_url: string
  image_public_id?: string
}

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [editing, setEditing] = useState<Veiculo | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const vehiclesRef = useMemo(() => collection(db, 'vehicles'), [])

  /** Carrega os veículos uma vez (simples e robusto para admin) */
  const fetchVehicles = async () => {
    setLoading(true)
    setError('')
    try {
      const q = query(vehiclesRef, orderBy('brand', 'asc'))
      const snap = await getDocs(q)
      const list: Veiculo[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Veiculo, 'id'>
        return {
          id: d.id,
          brand: String(data.brand ?? ''),
          category: String(data.category ?? ''),
          model: String(data.model ?? ''),
          price: Number(data.price ?? 0),
          speed_original: Number(data.speed_original ?? 0),
          speed_tuned:
            data.speed_tuned !== undefined ? Number(data.speed_tuned) : undefined,
          trunk_capacity:
            data.trunk_capacity !== undefined
              ? Number(data.trunk_capacity)
              : undefined,
          stock: Boolean(data.stock),
          image_url: String(data.image_url ?? ''),
          image_public_id:
            data.image_public_id !== undefined
              ? String(data.image_public_id)
              : undefined,
        }
      })
      setVehicles(list)
    } catch (error) {
      console.error('Erro a carregar veículos:', error)
      setError('Não foi possível carregar os veículos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // carregar à entrada
    void fetchVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tens a certeza que queres remover este veículo?')
    if (!confirmed) return
    setDeletingId(id)
    setError('')
    try {
      await deleteDoc(doc(db, 'vehicles', id))
      await fetchVehicles()
    } catch (error) {
      console.error('Erro ao apagar veículo:', error)
      setError('Não foi possível apagar o veículo.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddSuccess = () => {
    setShowAdd(false)
    void fetchVehicles()
  }

  const handleEditSuccess = () => {
    setEditing(null)
    void fetchVehicles()
  }

  return (
    <main className="px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#002447]">Admin • Veículos</h1>
          <p className="text-sm text-gray-600">
            Gerir catálogo (adicionar, editar e remover veículos).
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-md bg-[#002447] text-white hover:bg-[#003366] transition"
        >
          Adicionar veículo
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">A carregar…</div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-md border border-gray-200 p-6 text-gray-600">
          Ainda não há veículos. Clica em <strong>Adicionar veículo</strong>.
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <article
              key={v.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-48">
                <Image
                  src={
                    v.image_url && /^https?:\/\//i.test(v.image_url)
                      ? v.image_url
                      : 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
                  }
                  alt={`${v.brand} ${v.model}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-[#002447]">
                  {v.brand} {v.model}
                </h3>
                <p className="text-sm text-gray-600">{v.category}</p>

                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                  <div>
                    <span className="block text-xs text-gray-500">Preço</span>
                    <span>€ {v.price.toLocaleString('pt-PT')}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Stock</span>
                    <span className={v.stock ? 'text-emerald-700' : 'text-rose-700'}>
                      {v.stock ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Veloc. Orig.</span>
                    <span>{v.speed_original} km/h</span>
                  </div>
                  {v.speed_tuned !== undefined && (
                    <div>
                      <span className="block text-xs text-gray-500">Veloc. Tunada</span>
                      <span>{v.speed_tuned} km/h</span>
                    </div>
                  )}
                  {v.trunk_capacity !== undefined && (
                    <div>
                      <span className="block text-xs text-gray-500">Mala</span>
                      <span>{v.trunk_capacity} Kg</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setEditing(v)}
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deletingId === v.id}
                    className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-60"
                  >
                    {deletingId === v.id ? 'A remover…' : 'Remover'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Modal Adicionar */}
      {showAdd && (
        <AddVeiculoForm onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
      )}

      {/* Modal Editar */}
      {editing && (
        <EditVeiculoForm
          veiculo={editing}
          onClose={() => setEditing(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </main>
  )
}
