// src/types/veiculo.ts
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
  published?: boolean
}
