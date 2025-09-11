// Responsividade aplicada ao painel de administração (AdminPage)

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import AddVeiculoForm from '@/components/AddVeiculoForm'
import EditVeiculoForm from '@/components/EditVeiculoForm'
import { jwtVerify } from 'jose'

export type Veiculo = {
  id: string
  brand: string
  category: string
  image_url: string
  image_public_id?: string
  model: string
  price: number
  speed_original: number
  speed_tuned: number
  stock: boolean
  trunk_capacity: number
}

type Admin = {
  id: string
  name: string
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'veiculos' | 'admins'>('veiculos')
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [showAddVeiculo, setShowAddVeiculo] = useState(false)
  const [editVeiculo, setEditVeiculo] = useState<Veiculo | null>(null)
  const [selectedVeiculos, setSelectedVeiculos] = useState<string[]>([])
  const [tokenVerified, setTokenVerified] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const verifyAndFetch = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET || 'supersegredoseguroseguroseguro')
        await jwtVerify(token, secret)
        setTokenVerified(true)
        fetchVeiculos()
        fetchAdmins()
      } catch (err) {
        router.push('/login')
      }
    }

    verifyAndFetch()
  }, [router])

  const fetchVeiculos = async () => {
    const querySnapshot = await getDocs(collection(db, 'vehicles'))
    const data: Veiculo[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Veiculo, 'id'>),
    }))
    setVeiculos(data)
  }

  const fetchAdmins = async () => {
    const querySnapshot = await getDocs(collection(db, 'admins'))
    const data: Admin[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Admin, 'id'>),
    }))
    setAdmins(data)
  }

  const handleDeleteSelectedVeiculos = async () => {
    if (!window.confirm('Tens a certeza que queres eliminar os veículos selecionados?')) return

    for (const id of selectedVeiculos) {
      const veiculo = veiculos.find(v => v.id === id)

      if (veiculo?.image_public_id) {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: veiculo.image_public_id }),
        })
      }

      await deleteDoc(doc(db, 'vehicles', id))
    }

    setSelectedVeiculos([])
    fetchVeiculos()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const filteredVeiculos = veiculos.filter((v) =>
    `${v.brand} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!tokenVerified) return null

  return (
    <div className="min-h-screen bg-[#f2f2f2] px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#002447]">Painel de Administração</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setActiveTab('veiculos')}
            className={`w-full sm:w-auto px-4 py-2 rounded-md transition font-medium ${activeTab === 'veiculos' ? 'bg-[#002447] text-white shadow' : 'bg-white border border-gray-300 text-black'}`}
          >
            Veículos
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`w-full sm:w-auto px-4 py-2 rounded-md transition font-medium ${activeTab === 'admins' ? 'bg-[#002447] text-white shadow' : 'bg-white border border-gray-300 text-black'}`}
          >
            Administradores
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 transition-all duration-300 text-black overflow-x-auto">
          {activeTab === 'veiculos' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">Lista de Veículos</h2>
                <button
                  onClick={() => setShowAddVeiculo(true)}
                  className="px-4 py-2 bg-[#002447] text-white rounded-md hover:bg-[#003366] transition"
                >
                  Adicionar Veículo
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Pesquisar por marca ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#002447] transition"
                />
              </div>

              {selectedVeiculos.length > 0 && (
                <button
                  onClick={handleDeleteSelectedVeiculos}
                  className="mb-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Eliminar Selecionados
                </button>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#e5e7eb] text-[#002447] text-sm uppercase font-semibold">
                    <tr>
                      <th className="p-2 sm:p-4 text-center border-b"><input type="checkbox" checked={selectedVeiculos.length === veiculos.length && veiculos.length > 0} onChange={(e) => setSelectedVeiculos(e.target.checked ? veiculos.map((v) => v.id) : [])} /></th>
                      <th className="p-2 sm:p-4 text-center border-b">Marca</th>
                      <th className="p-2 sm:p-4 text-center border-b">Modelo</th>
                      <th className="p-2 sm:p-4 text-center border-b">Categoria</th>
                      <th className="p-2 sm:p-4 text-center border-b">Preço</th>
                      <th className="p-2 sm:p-4 text-center border-b">Vel. de Origem</th>
                      <th className="p-2 sm:p-4 text-center border-b">Vel. Full Tuned</th>
                      <th className="p-2 sm:p-4 text-center border-b">Stock</th>
                      <th className="p-2 sm:p-4 text-center border-b">Mala</th>
                      <th className="p-2 sm:p-4 text-center border-b">Imagem</th>
                      <th className="p-2 sm:p-4 text-center border-b">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVeiculos.map((v) => (
                      <tr key={v.id} className="hover:bg-[#f9fafb] transition text-center text-sm text-gray-800">
                        <td className="p-2 sm:p-4 border-b"><input type="checkbox" checked={selectedVeiculos.includes(v.id)} onChange={(e) => e.target.checked ? setSelectedVeiculos(prev => [...prev, v.id]) : setSelectedVeiculos(prev => prev.filter(id => id !== v.id))} /></td>
                        <td className="p-2 sm:p-4 border-b">{v.brand}</td>
                        <td className="p-2 sm:p-4 border-b">{v.model}</td>
                        <td className="p-2 sm:p-4 border-b">{v.category}</td>
                        <td className="p-2 sm:p-4 border-b">{v.price} $</td>
                        <td className="p-2 sm:p-4 border-b">{v.speed_original} km/h</td>
                        <td className="p-2 sm:p-4 border-b">{v.speed_tuned} km/h</td>
                        <td className="p-2 sm:p-4 border-b"><span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${v.stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v.stock ? 'Sim' : 'Não'}</span></td>
                        <td className="p-2 sm:p-4 border-b">{v.trunk_capacity} L</td>
                        <td className="p-2 sm:p-4 border-b">{v.image_url ? <img src={v.image_url} alt={v.model} className="w-16 h-10 object-cover rounded shadow" /> : '—'}</td>
                        <td className="p-2 sm:p-4 border-b">
                          <button
                            onClick={() => setEditVeiculo(v)}
                            className="px-3 py-1 bg-[#002447] text-white rounded-md hover:bg-[#003366] transition"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showAddVeiculo && (
                <AddVeiculoForm onClose={() => setShowAddVeiculo(false)} onSuccess={fetchVeiculos} />
              )}
              {editVeiculo && (
                <EditVeiculoForm veiculo={editVeiculo} onClose={() => setEditVeiculo(null)} onSuccess={() => { fetchVeiculos(); setEditVeiculo(null) }} />
              )}
            </>
          )}

          {activeTab === 'admins' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Lista de Administradores</h2>
              </div>
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
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
