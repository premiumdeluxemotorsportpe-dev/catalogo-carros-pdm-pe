'use client'

import { useEffect, useState } from 'react'
import type React from 'react'
import AddVeiculoForm from '@/components/AddVeiculoForm'
import EditVeiculoForm, { type Veiculo } from '@/components/EditVeiculoForm'
import Image from 'next/image'

type ApiResp = { items: Veiculo[]; nextCursor: string | null }

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [editing, setEditing] = useState<Veiculo | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [cursor, setCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  async function fetchVehicles(reset = true) {
    try {
      if (reset) {
        setLoading(true)
        setError('')
      }
      const url = new URL('/api/admin/vehicles', window.location.origin)
      if (!reset && cursor) url.searchParams.set('cursor', cursor)
      url.searchParams.set('pageSize', '100')

      const res = await fetch(url, { method: 'GET' })
      const data = (await res.json().catch(() => ({}))) as ApiResp
      if (!res.ok) {
        throw new Error((data as any)?.message || 'Falha a carregar.')
      }

      if (reset) {
        setVehicles(data.items ?? [])
      } else {
        setVehicles((prev) => [...prev, ...(data.items ?? [])])
      }
      setCursor(data.nextCursor ?? null)
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar os veículos.')
    } finally {
      if (reset) setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void fetchVehicles(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tens a certeza que queres remover este veículo?')
    if (!confirmed) return
    setDeletingId(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/vehicles?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as any)?.message || 'Falha ao apagar.')
      }
      await fetchVehicles(true)
    } catch (error) {
      console.error('Erro ao apagar veículo:', error)
      setError('Não foi possível apagar o veículo.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddSuccess = () => {
    setShowAdd(false)
    void fetchVehicles(true)
  }

  const handleEditSuccess = () => {
    setEditing(null)
    void fetchVehicles(true)
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
          Não há veículos ou estão todos por publicar. Adiciona um novo ou define <strong>Publicado</strong> em algum existente.
        </div>
      ) : (
        <>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#002447]">
                      {v.brand} {v.model}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        v.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                      title={v.published ? 'Publicado' : 'Rascunho'}
                    >
                      {v.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{v.category}</p>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                    <div>
                      <span className="block text-xs text-gray-500">Preço</span>
                      <span>€ {Number(v.price ?? 0).toLocaleString('pt-PT')}</span>
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

          {cursor && (
            <div className="mt-8 flex justify-center">
              <button
                className="px-4 py-2 rounded-full bg-[#002447] text-white disabled:opacity-50"
                onClick={() => {
                  setLoadingMore(true)
                  void fetchVehicles(false)
                }}
                disabled={loadingMore}
              >
                {loadingMore ? 'A carregar…' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Adicionar */}
      {showAdd && (
        <AddVeiculoForm onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
      )}

      {/* Modal Editar */}
      {editing ? (
        <EditVeiculoForm
          veiculo={editing}
          onClose={() => setEditing(null)}
          onSuccess={handleEditSuccess}
        />
      ) : null}
    </main>
  )
}
