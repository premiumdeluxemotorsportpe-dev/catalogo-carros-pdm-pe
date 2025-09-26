'use client'

import { useState } from 'react'
import type React from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Veiculo } from '@/app/admin/page'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface Props {
  veiculo: Veiculo
  onClose: () => void
  onSuccess: () => void
}

/**
 * Mantemos os números como number (UI aceita value=number em <input type="number" />)
 * e o URL da imagem como string opcional.
 */
type VeiculoEditable = Veiculo & {
  image_url?: string
}

const textFields = ['brand', 'model', 'category'] as const
type TextField = typeof textFields[number]

const numericFields = ['price', 'speed_original', 'speed_tuned', 'trunk_capacity'] as const
type NumericField = typeof numericFields[number]

export default function EditVeiculoForm({ veiculo, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<VeiculoEditable>(veiculo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  // Handlers tipados por campo para evitar `any` e `as never`
  const handleTextChange =
    (field: TextField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleNumberChange =
    (field: NumericField) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setFormData((prev) => ({
        ...prev,
        [field]: value === '' ? ('' as unknown as number) : Number(value),
      }))
    }

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, stock: e.target.checked }))
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPreview(true)
    setFormData((prev) => ({ ...prev, image_url: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = (formData.image_url ?? '').trim()
      if (url && !/^https?:\/\/.+/i.test(url)) {
        setError('Coloca um URL válido (http:// ou https://).')
        setLoading(false)
        return
      }

      const updatedData: Partial<VeiculoEditable> = {
        brand: formData.brand,
        model: formData.model,
        category: formData.category,
        price: Number(formData.price),
        speed_original: Number(formData.speed_original),
        speed_tuned:
          formData.speed_tuned === ('' as unknown as number)
            ? undefined
            : Number(formData.speed_tuned),
        trunk_capacity:
          formData.trunk_capacity === ('' as unknown as number)
            ? undefined
            : Number(formData.trunk_capacity),
        stock: Boolean(formData.stock),
        image_url: url || '',
      }

      // remove undefined, null e NaN
      const cleanedEntries = Object.entries(updatedData).filter(([_, v]) => {
        if (v === undefined || v === null) return false
        if (typeof v === 'number' && Number.isNaN(v)) return false
        return true
      })
      const cleanedData = Object.fromEntries(cleanedEntries)

      await updateDoc(doc(db, 'vehicles', veiculo.id), cleanedData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error)
      setError('Erro ao atualizar veículo. Verifica os dados e tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  const imageUrl = (formData.image_url ?? '').trim()
  const validPreview = showPreview && !!imageUrl && /^https?:\/\/.+/i.test(imageUrl)

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
            {textFields.map((field) => (
              <div key={field} className="flex flex-col">
                <label htmlFor={field} className="text-sm font-semibold mb-1 text-gray-700">
                  {field === 'brand' ? 'Marca' : field === 'model' ? 'Modelo' : 'Categoria'}
                </label>
                <input
                  id={field}
                  type="text"
                  name={field}
                  value={formData[field] as string}
                  onChange={handleTextChange(field)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}

            {numericFields.map((field) => (
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
                  value={formData[field] as number}
                  onChange={handleNumberChange(field)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required={field !== 'speed_tuned' && field !== 'trunk_capacity'}
                />
              </div>
            ))}

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <label htmlFor="stock" className="text-sm font-semibold text-gray-700">
                Disponível em stock:
              </label>
              <input
                id="stock"
                type="checkbox"
                name="stock"
                checked={Boolean(formData.stock)}
                onChange={handleStockChange}
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
                value={formData.image_url ?? ''}
                onChange={handleImageUrlChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {validPreview && (
                <div className="mt-2 w-full h-48 relative">
                  <Image
                    src={imageUrl}
                    alt="Pré-visualização"
                    fill
                    className="object-cover rounded-md border"
                    sizes="100%"
                    onError={() => setShowPreview(false)}
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
