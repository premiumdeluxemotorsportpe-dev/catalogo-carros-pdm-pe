'use client'

import { useState } from 'react'
import type React from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

interface VeiculoForm {
  brand: string
  category: string
  model: string
  price: string
  speed_original: string
  speed_tuned: string
  trunk_capacity: string
  stock: boolean
  image_url: string
}

export default function AddVeiculoForm({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState<VeiculoForm>({
    brand: '',
    category: '',
    model: '',
    price: '',
    speed_original: '',
    speed_tuned: '',
    trunk_capacity: '',
    stock: false,
    image_url: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const updatedValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setForm((prev) => ({
      ...prev,
      [name]: updatedValue as never,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = form.image_url.trim()
      if (url && !/^https?:\/\/.+/i.test(url)) {
        setError('Coloca um URL válido (começando por http:// ou https://).')
        setLoading(false)
        return
      }

      const vehicleData = {
        brand: form.brand,
        category: form.category,
        model: form.model,
        price: Number(form.price),
        speed_original: Number(form.speed_original),
        speed_tuned: form.speed_tuned ? Number(form.speed_tuned) : undefined,
        trunk_capacity: form.trunk_capacity ? Number(form.trunk_capacity) : undefined,
        stock: form.stock,
        image_url: url,
        image_public_id: '',
      }

      // limpa undefined/NaN
      const cleaned = Object.fromEntries(
        Object.entries(vehicleData).filter(([_, v]) => {
          if (v === undefined || v === null) return false
          if (typeof v === 'number' && Number.isNaN(v)) return false
          return true
        })
      )

      await addDoc(collection(db, 'vehicles'), cleaned)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao adicionar veículo no Firestore:', error)
      setError('Erro ao adicionar veículo.')
    } finally {
      setLoading(false)
    }
  }

  const numericFields = ['price', 'speed_original', 'speed_tuned', 'trunk_capacity'] as const
  type NumericField = typeof numericFields[number]

  const validPreview =
    showPreview &&
    !!form.image_url &&
    /^https?:\/\/.+/i.test(form.image_url.trim())

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
          <h2 className="text-3xl font-bold mb-6 text-[#002447]">
            Adicionar Veículo
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label htmlFor="brand" className="text-sm font-semibold mb-1 text-gray-700">
                Marca
              </label>
              <input
                id="brand"
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="model" className="text-sm font-semibold mb-1 text-gray-700">
                Modelo
              </label>
              <input
                id="model"
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="category" className="text-sm font-semibold mb-1 text-gray-700">
                Categoria
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="h-[42px] border border-gray-300 rounded-md px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                required
              >
                <option value="" disabled hidden>
                  Seleciona uma categoria
                </option>
                <option value="Bicicleta">Bicicleta</option>
                <option value="Buggy">Buggy</option>
                <option value="Camião">Camião</option>
                <option value="Carrinha">Carrinha</option>
                <option value="Class">Class</option>
                <option value="Clássico">Clássico</option>
                <option value="Comum">Comum</option>
                <option value="Desportivo">Desportivo</option>
                <option value="Elétrico">Elétrico</option>
                <option value="Presidencial">Presidencial</option>
                <option value="Mota">Mota</option>
                <option value="Offroad">Offroad</option>
                <option value="Outro">Outro</option>
                <option value="SUV">SUV</option>
                <option value="Supercarro">Supercarro</option>
              </select>
            </div>

            {numericFields.map((field: NumericField) => (
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
                  value={form[field]}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                name="stock"
                checked={form.stock}
                onChange={handleChange}
                className="w-5 h-5"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label htmlFor="image_url" className="text-sm font-semibold text-gray-700">
                URL da imagem (http/https)
              </label>
              <input
                id="image_url"
                type="url"
                name="image_url"
                placeholder="https://exemplo.com/imagem.webp"
                value={form.image_url}
                onChange={(e) => {
                  setShowPreview(true)
                  handleChange(e)
                }}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {validPreview && (
                <div className="mt-2 w-full h-48 relative">
                  <Image
                    src={form.image_url.trim()}
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
                className="px-6 py-2 bg-[#002447] text-white rounded-md hover:bg-[#003366] transition"
                disabled={loading}
              >
                {loading ? 'A adicionar...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
