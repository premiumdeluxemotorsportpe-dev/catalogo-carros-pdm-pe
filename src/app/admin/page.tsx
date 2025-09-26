'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import AddVeiculoForm from '@/components/AddVeiculoForm'
import EditVeiculoForm, { type Veiculo } from '@/components/EditVeiculoForm'
import Image from 'next/image'

type ApiResp = { items: Veiculo[]; nextCursor: string | null }
type ApiErr = { message?: string; error?: string }
type Admin = { id: string; name: string }

function extractMsg(data: unknown, fallback: string) {
  if (data && typeof data === 'object') {
    const maybe = data as Record<string, unknown>
    if (typeof maybe.message === 'string') return maybe.message
    if (typeof maybe.error === 'string') return maybe.error
  }
  return fallback
}

export default function AdminPage() {
  const router = useRouter()

  // UI / estado
  const [activeTab, setActiveTab] = useState<'veiculos' | 'admins'>('veiculos')
  const [searchTerm, setSearchTerm] = useState('')

  // Veículos
  const [vehicles, setVehicles] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [editing, setEditing] = useState<Veiculo | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [cursor, setCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // Admins
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [adminsError, setAdminsError] = useState('')

  // --------- FETCHERS (API segura) ----------
  async function fetchVehicles(reset = true) {
    try {
      if (reset) {
        setLoading(true)
        setError('')
        setSelected([])
      }
      const url = new URL('/api/admin/vehicles', window.location.origin)
      if (!reset && cursor) url.searchParams.set('cursor', cursor)
      url.searchParams.set('pageSize', '100')

      const res = await fetch(url.toString(), { method: 'GET' })
      const data: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(extractMsg(data as ApiErr, 'Falha ao carregar veículos.'))
      }

      const parsed = data as ApiResp
      const items = parsed.items ?? []
      if (reset) setVehicles(items)
      else setVehicles((prev) => [...prev, ...items])

      setCursor(parsed.nextCursor ?? null)
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar os veículos.')
    } finally {
      if (reset) setLoading(false)
      setLoadingMore(false)
    }
  }

  async function fetchAdmins() {
    setLoadingAdmins(true)
    setAdminsError('')
    try {
      const res = await fetch('/api/admin/admins')
      const data: unknown = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(extractMsg(data as ApiErr, 'Falha ao carregar admins.'))
      const arr = (data as { items?: Admin[] }).items ?? []
      setAdmins(arr)
    } catch (e) {
      console.error(e)
      setAdminsError('Não foi possível carregar administradores.')
    } finally {
      setLoadingAdmins(false)
    }
  }

  useEffect(() => {
    void fetchVehicles(true)
    void fetchAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------- HANDLERS ----------
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tens a certeza que queres remover este veículo?')
    if (!confirmed) return
    setDeletingId(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/vehicles?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data: unknown = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(extractMsg(data as ApiErr, 'Falha ao apagar.'))
      await fetchVehicles(true)
    } catch (err) {
      console.error('Erro ao apagar veículo:', err)
      setError('Não foi possível apagar o veículo.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return
    const ok = window.confirm('Tens a certeza que queres eliminar os veículos selecionados?')
    if (!ok) return
    try {
      await Promise.all(
        selected.map(async (id) => {
          const res = await fetch(`/api/admin/vehicles?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error('DELETE falhou')
        })
      )
      setSelected([])
      await fetchVehicles(true)
    } catch (e) {
      console.error(e)
      setError('Algumas eliminações falharam.')
    }
  }

  const handleSelectAll = (checked: boolean, list: Veiculo[]) => {
    if (checked) setSelected(list.map((v) => v.id))
    else setSelected([])
  }

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  const handleAddSuccess = () => {
    setShowAdd(false)
    void fetchVehicles(true)
  }

  const handleEditSuccess = () => {
    setEditing(null)
    void fetchVehicles(true)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch {
      // ignore
    } finally {
      router.replace('/')
    }
  }

  // Filtragem local (tabela)
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return vehicles
    const q = searchTerm.toLowerCase()
    return vehicles.filter((v) => `${v.brand} ${v.model}`.toLowerCase().includes(q))
  }, [vehicles, searchTerm])

  return (
    <div className="min-h-screen bg-[#f2f2f2] px-4 sm:px-6 py-6 text-black">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#002447]">Painel de Administração</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setActiveTab('veiculos')}
            className={`w-full sm:w-auto px-4 py-2 rounded-md transition font-medium ${
              activeTab === 'veiculos'
                ? 'bg-[#002447] text-white shadow'
                : 'bg-white border border-gray-300'
            }`}
          >
            Veículos
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`w-full sm:w-auto px-4 py-2 rounded-md transition font-medium ${
              activeTab === 'admins'
                ? 'bg-[#002447] text-white shadow'
                : 'bg-white border border-gray-300'
            }`}
          >
            Administradores
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 transition-all duration-300 overflow-x-auto">
          {activeTab === 'veiculos' && (
            <>
              {/* Header da tabela */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">Lista de Veículos</h2>
                <button
                  onClick={() => setShowAdd(true)}
                  className="px-4 py-2 bg-[#002447] text-white rounded-md hover:bg-[#003366] transition"
                >
                  Adicionar Veículo
                </button>
              </div>

              {/* Pesquisa */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Pesquisar por marca ou modelo..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#002447] transition"
                />
              </div>

              {/* Erros / Loading */}
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-gray-600">A carregar…</div>
              ) : filtered.length === 0 ? (
                <div className="rounded-md border border-gray-200 p-6 text-gray-600">
                  Não há veículos (ou filtro vazio). Adiciona um novo ou usa a pesquisa.
                </div>
              ) : (
                <>
                  {/* Bulk delete */}
                  {selected.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="mb-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                      Eliminar Selecionados
                    </button>
                  )}

                  {/* Tabela */}
                  <div className="overflow-x-auto rounded-md border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#e5e7eb] text-[#002447] text-sm uppercase font-semibold">
                        <tr>
                          <th className="p-3 border-b text-center">
                            <input
                              type="checkbox"
                              checked={selected.length === filtered.length && filtered.length > 0}
                              onChange={(e) => handleSelectAll(e.target.checked, filtered)}
                            />
                          </th>
                          <th className="p-3 border-b text-center">Marca</th>
                          <th className="p-3 border-b text-center">Modelo</th>
                          <th className="p-3 border-b text-center">Categoria</th>
                          <th className="p-3 border-b text-center">Preço</th>
                          <th className="p-3 border-b text-center">Vel. Origem</th>
                          <th className="p-3 border-b text-center">Vel. Tunada</th>
                          <th className="p-3 border-b text-center">Stock</th>
                          <th className="p-3 border-b text-center">Mala</th>
                          <th className="p-3 border-b text-center">Publicado</th>
                          <th className="p-3 border-b text-center">Imagem</th>
                          <th className="p-3 border-b text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((v) => (
                          <tr
                            key={v.id}
                            className="hover:bg-[#f9fafb] transition text-center text-sm text-gray-800"
                          >
                            <td className="p-3 border-b">
                              <input
                                type="checkbox"
                                checked={selected.includes(v.id)}
                                onChange={(e) => handleRowSelect(v.id, e.target.checked)}
                              />
                            </td>
                            <td className="p-3 border-b">{v.brand}</td>
                            <td className="p-3 border-b">{v.model}</td>
                            <td className="p-3 border-b">{v.category}</td>
                            <td className="p-3 border-b">€ {Number(v.price ?? 0).toLocaleString('pt-PT')}</td>
                            <td className="p-3 border-b">{v.speed_original ?? '—'} km/h</td>
                            <td className="p-3 border-b">{v.speed_tuned ?? '—'} km/h</td>
                            <td className="p-3 border-b">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  v.stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {v.stock ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="p-3 border-b">
                              {v.trunk_capacity !== undefined ? `${v.trunk_capacity} Kg` : '—'}
                            </td>
                            <td className="p-3 border-b">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  v.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {v.published ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="p-3 border-b">
                              {v.image_url ? (
                                <div className="relative w-16 h-10 mx-auto rounded overflow-hidden shadow">
                                  <Image
                                    src={
                                      /^https?:\/\//i.test(v.image_url)
                                        ? v.image_url
                                        : 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
                                    }
                                    alt={v.model}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3 border-b">
                              {/* Ações com largura igual */}
                              <div className="grid grid-cols-2 gap-2 min-w-[200px] mx-auto">
                                <button
                                  onClick={() => setEditing(v)}
                                  className="w-full inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-[#002447] text-white hover:bg-[#003366] transition shadow-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(v.id)}
                                  disabled={deletingId === v.id}
                                  className="w-full inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {deletingId === v.id ? 'A remover…' : 'Remover'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {cursor && (
                    <div className="mt-6 flex justify-center">
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

              {/* Modais */}
              {showAdd && (
                <AddVeiculoForm onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
              )}
              {editing && (
                <EditVeiculoForm
                  veiculo={editing}
                  onClose={() => setEditing(null)}
                  onSuccess={handleEditSuccess}
                />
              )}
            </>
          )}

          {activeTab === 'admins' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Lista de Administradores</h2>
              </div>

              {adminsError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {adminsError}
                </div>
              )}

              {loadingAdmins ? (
                <div className="text-gray-600">A carregar…</div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#e5e7eb] text-[#002447] text-sm uppercase font-semibold">
                      <tr>
                        <th className="p-4 border-b text-left">Nome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a) => (
                        <tr key={a.id} className="hover:bg-[#f9fafb] transition text-sm text-gray-800">
                          <td className="p-4 border-b">{a.name}</td>
                        </tr>
                      ))}
                      {admins.length === 0 && (
                        <tr>
                          <td className="p-4 text-gray-600">Sem administradores para mostrar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
