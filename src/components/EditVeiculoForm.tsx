'use client'

import { useState } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

/** Mantém o shape “oficial” do veículo (DB) */
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
  image_url?: string
  image_public_id?: string
  published: boolean
}

/** Estado local “editável”: campos numéricos aceitam '' durante a edição */
type VeiculoEditable =
  Omit<Veiculo, 'price' | 'speed_original' | 'speed_tuned' | 'trunk_capacity'> & {
    price: number | ''
    speed_original: number | ''
    speed_tuned?: number | ''
    trunk_capacity?: number | ''
  }

interface Props {
  veiculo: Veiculo
  onClose: () => void
  onSuccess: () => void
}

const textFields = ['brand', 'model', 'category'] as const
type TextField = typeof textFields[number]

const numericFields = ['price', 'speed_original', 'speed_tuned', 'trunk_capacity'] as const
type NumericField = typeof numericFields[number]

export default function EditVeiculoForm({ veiculo, onClose, onSuccess }: Props) {
  // inicializa o estado convertendo números -> números (ou undefined) e preserva published/stock
  const [formData, setFormData] = useState<VeiculoEditable>({
    id: veiculo.id,
    brand: veiculo.brand,
    category: veiculo.category,
    model: veiculo.model,
    price: veiculo.price,
    speed_original: veiculo.speed_original,
    speed_tuned: veiculo.speed_tuned,
    trunk_capacity: veiculo.trunk_capacity,
    stock: veiculo.stock,
    image_url: veiculo.image_url,
    image_public_id: veiculo.image_public_id,
    published: veiculo.published,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  const handleTextChange =
    (field: TextField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleNumberChange =
    (field: NumericField) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      // '' durante a edição; caso contrário, número
      setFormData((prev) => ({
        ...prev,
        [field]: value === '' ? '' : Number(value),
      }))
    }

  const handleBool =
    (field: 'stock' | 'published') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.checked }))
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

      // valida os obrigatórios
      const priceNum =
        formData.price === '' ? NaN : Number(formData.price)
      const speedOrigNum =
        formData.speed_original === '' ? NaN : Number(formData.speed_original)

      if (Number.isNaN(priceNum) || Number.isNaN(speedOrigNum)) {
        setError('Preço e Velocidade Original são obrigatórios.')
        setLoading(false)
        return
      }

      const speedTunedNum =
        formData.speed_tuned === '' || formData.speed_tuned === undefined
          ? undefined
          : Number(formData.speed_tuned)

      const trunkNum =
        formData.trunk_capacity === '' || formData.trunk_capacity === undefined
          ? undefined
          : Number(formData.trunk_capacity)

      const payload = {
        id: formData.id,
        brand: formData.brand,
        category: formData.category,
        model: formData.model,
        price: priceNum,
        speed_original: speedOrigNum,
        speed_tuned: Number.isNaN(speedTunedNum!) ? undefined : speedTunedNum,
        trunk_capacity: Number.isNaN(trunkNum!) ? undefined : trunkNum,
        stock: Boolean(formData.stock),
        image_url: url || '',
        published: Boolean(formData.published),
      }

      // remove undefined/NaN
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => {
          if (v === undefined || v === null) return false
          if (typeof v === 'number' && Number.isNaN(v)) return false
          return true
        })
      )

      const res = await fetch('/api/admin/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          (data as { error?: string; message?: string })?.error ||
            (data as { message?: string })?.message ||
            `Erro (HTTP ${res.status})`
        )
        setLoading(false)
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erro ao atualizar veículo:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar veículo.')
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
                  name={field}
                  type="text"
                  value={formData[field] as string}
                  onChange={handleTextChange(field)}
                  className="border border-gray-300 rounded-md px-4 py-2"
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
                  name={field}
                  type="number"
                  value={(formData[field] as number | '') ?? ''}
                  onChange={handleNumberChange(field)}
                  className="border border-gray-300 rounded-md px-4 py-2"
                  required={field === 'price' || field === 'speed_original'}
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
                checked={!!formData.stock}
                onChange={handleBool('stock')}
                className="w-5 h-5"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <label htmlFor="published" className="text-sm font-semibold text-gray-700">
                Publicado (visível ao público):
              </label>
              <input
                id="published"
                type="checkbox"
                checked={!!formData.published}
                onChange={handleBool('published')}
                className="w-5 h-5"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label htmlFor="image_url" className="text-sm font-semibold text-gray-700">
                URL da imagem (http/https)
              </label>
              <input
                id="image_url"
                name="image_url"
                type="url"
                placeholder="https://exemplo.com/imagem.webp"
                value={formData.image_url ?? ''}
                onChange={handleImageUrlChange}
                className="border border-gray-300 rounded-md px-4 py-2"
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
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#002447] text-white rounded-md hover:bg-[#003366]"
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
