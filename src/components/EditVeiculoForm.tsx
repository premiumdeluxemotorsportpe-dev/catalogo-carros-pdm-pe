'use client'

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Veiculo } from '@/app/admin/page'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  veiculo: Veiculo
  onClose: () => void
  onSuccess: () => void
}

export default function EditVeiculoForm({ veiculo, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<Veiculo>(veiculo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const val =
      type === 'checkbox'
        ? checked
        : type === 'number'
        ? (value === '' ? '' : parseFloat(value))
        : value

    setFormData((prev) => ({ ...prev, [name]: val as any }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // validação simples do URL (se preenchido)
      const url = (formData as any).image_url ? String((formData as any).image_url).trim() : ''
      if (url && !/^https?:\/\/.+/i.test(url)) {
        setError('Coloca um URL válido (http:// ou https://).')
        setLoading(false)
        return
      }

      const updatedData: Partial<Veiculo> = {
        brand: formData.brand,
        model: formData.model,
        category: formData.category,
        price: Number(formData.price),
        speed_original: Number(formData.speed_original),
        speed_tuned: Number(formData.speed_tuned),
        trunk_capacity: Number(formData.trunk_capacity),
        stock: Boolean(formData.stock),
        image_url: url,            // guarda o URL diretamente
        // image_public_id: ''      // remove se não usares este campo na coleção
      }

      // remove undefined / NaN
      const cleanedData = Object.fromEntries(
        Object.entries(updatedData).filter(
          ([_, value]) => value !== undefined && value !== null && value !== (Number as any).NaN
        )
      )

      await updateDoc(doc(db, 'vehicles', veiculo.id), cleanedData)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erro ao atualizar veículo:', err)
      setError('Erro ao atualizar veículo. Verifica os dados e tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative border border-gray-200"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-[#002447]">Editar Veículo</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['brand', 'model', 'category'].map((field) => (
              <div key={field} className="flex flex-col">
                <label htmlFor={field} className="text-sm font-semibold mb-1 text-gray-700">
                  {field === 'brand' ? 'Marca' : field === 'model' ? 'Modelo' : 'Categoria'}
                </label>
                <input
                  id={field}
                  type="text"
                  name={field}
                  value={formData[field as keyof Veiculo] as string}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}

            {['price', 'speed_original', 'speed_tuned', 'trunk_capacity'].map((field) => (
              <div key={field} className="flex flex-col">
                <label htmlFor={field} className="text-sm font-semibold mb-1 text-gray-700">
                  {field === 'price'
                    ? 'Preço (€)'
                    : field === 'speed_original'
                    ? 'Velocidade Original (km/h)'
                    : field === 'speed_tuned'
                    ? 'Velocidade Tunada (km/h)'
                    : 'Capacidade da Mala (Kg)'}
                </label>
                <input
                  id={field}
                  type="number"
                  name={field}
                  value={formData[field as keyof Veiculo] as number}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <label htmlFor="stock" className="text-sm font-semibold text-gray-700">Disponível em stock:</label>
              <input
                id="stock"
                type="checkbox"
                name="stock"
                checked={Boolean(formData.stock)}
                onChange={handleChange}
                className="w-5 h-5"
              />
            </div>

            {/* Campo de URL da imagem (substitui upload) */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label htmlFor="image_url" className="text-sm font-semibold text-gray-700">
                URL da imagem (http/https)
              </label>
              <input
                id="image_url"
                type="url"
                name="image_url"
                placeholder="https://exemplo.com/imagem.webp"
                value={(formData as any).image_url || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {(formData as any).image_url &&
                /^https?:\/\/.+/i.test(String((formData as any).image_url).trim()) && (
                  <div className="mt-2">
                    <img
                      src={String((formData as any).image_url).trim()}
                      alt="Pré-visualização"
                      className="w-full h-48 object-cover rounded-md border"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  </div>
                )}
            </div>

            {error && (
              <div className="md:col-span-2">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#002447] text-white rounded-md hover:bg-[#003366] transition"
              >
                {loading ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
