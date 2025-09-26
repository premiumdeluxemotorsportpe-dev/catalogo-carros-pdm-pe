'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Veiculo } from '@/types/veiculo'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

/** Tipagem para permitir escalas por-logo no carrossel */
type PartnerLogo = { src: string; alt: string; scale?: number }

const partners: PartnerLogo[] = [
  { src: '/parceiros/lifeinvader.webp', alt: 'Lifeinvader', scale: 0.60 }, // menor
  { src: '/parceiros/digitalden.webp', alt: 'DigitalDen', scale: 0.50 },   // ainda menor
  { src: '/parceiros/tunetown.webp', alt: 'TuneTown' },
  { src: '/parceiros/rockford.webp', alt: 'Rockford' },
  { src: '/parceiros/esperanzabuy.webp', alt: 'EsperanzaBuy' },
]

/** Carrossel infinito de parceiros, sem cortes, velocidade constante */
function PartnersCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const laneARef = useRef<HTMLDivElement>(null)

  // nº de cópias de logos por faixa (calculado dinamicamente) + largura para animar à velocidade certa
  const [copies, setCopies] = useState(1)
  const [lanePx, setLanePx] = useState(0)

  // Recalcula quantas cópias são necessárias para cobrir várias larguras do ecrã e evitar “buracos”
  useEffect(() => {
    const recalc = () => {
      const container = containerRef.current
      const laneA = laneARef.current
      if (!container || !laneA) return

      const currentCopies = Math.max(1, copies)
      const totalWidthNow = laneA.scrollWidth
      const unitWidth = totalWidthNow / currentCopies // largura de uma cópia da sequência de logos
      const viewportW = container.clientWidth

      const needed = Math.max(2, Math.ceil((viewportW * 3) / unitWidth)) // ~3x viewport para segurança
      setCopies(needed)
      setLanePx(unitWidth * needed)
    }

    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gera os itens da faixa com o nº de cópias calculado
  const items = useMemo(
    () => Array.from({ length: copies }).flatMap(() => partners),
    [copies]
  )

  // Velocidade “constante”: ↓↓↓ mais lenta agora (60px/s)
  const pxPerSec = 60
  const duration = `${Math.max(20, Math.round(lanePx / pxPerSec))}s`

  return (
    <section className="w-full bg-transparent py-4 overflow-hidden mt-[6px]">
      <div ref={containerRef} className="relative h-16 sm:h-20 md:h-24 overflow-hidden">
        {/* Duas faixas idênticas para transição perfeita (A e B) */}
        <div className="absolute inset-0">
          {/* Faixa A */}
          <div
            ref={laneARef}
            className="marquee-lane marquee-lane-a flex flex-nowrap items-center gap-10 sm:gap-14 h-full will-change-transform"
            style={{ animationDuration: duration }}
          >
            {items.map((p, idx) => {
              const heightPct = `${Math.min(1, p.scale ?? 1) * 100}%`
              return (
                <Image
                  key={`laneA-${idx}`}
                  src={p.src}
                  alt={p.alt}
                  width={200}
                  height={100}
                  style={{ height: heightPct, width: 'auto' }}
                  className="object-contain opacity-80"
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 15vw, 10vw"
                  priority={idx < 5}
                />
              )
            })}
          </div>

          {/* Faixa B (arranca imediatamente colada à direita da A) */}
          <div
            className="marquee-lane marquee-lane-b flex flex-nowrap items-center gap-10 sm:gap-14 h-full will-change-transform"
            style={{ animationDuration: duration }}
            aria-hidden="true"
          >
            {items.map((p, idx) => {
              const heightPct = `${Math.min(1, p.scale ?? 1) * 100}%`
              return (
                <Image
                  key={`laneB-${idx}`}
                  src={p.src}
                  alt={p.alt}
                  width={200}
                  height={100}
                  style={{ height: heightPct, width: 'auto' }}
                  className="object-contain opacity-80"
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 15vw, 10vw"
                />
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-lane { width: max-content; }
        .marquee-lane-a { animation: scrollA linear infinite; }
        .marquee-lane-b { animation: scrollB linear infinite; }

        /* A move de 0% até -100% da sua largura total */
        @keyframes scrollA {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        /* B acompanha a A, começando imediatamente colada à direita */
        @keyframes scrollB {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(0%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-lane-a,
          .marquee-lane-b {
            animation-duration: 0s !important;
            animation-iteration-count: 0;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  )
}

/** Componente de imagem com fallback (sem cortes nos cards) */
function VehicleImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false)
  const showFallback = !src || error

  return (
    <div className="relative w-full h-56 bg-gray-100">
      {showFallback ? (
        <Image
          src="/sem-imagem.webp"
          alt={`${alt} (sem imagem)`}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
          onError={() => setError(true)}
        />
      )}
    </div>
  )
}

/** Modal de detalhes do veículo (imagem completa + só a cruz para fechar) */
function VehicleModal({
  v,
  onClose,
}: {
  v: Veiculo
  onClose: () => void
}) {
  // Fechar por ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Bloquear scroll de fundo
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-modal="true"
        role="dialog"
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão fechar (apenas a cruz) */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
          >
            <span className="text-xl leading-none">×</span>
          </button>

          {/* Imagem grande SEM cortes (object-contain) */}
          <div className="relative w-full h-[420px] bg-gray-100">
            <Image
              src={
                v.image_url && /^https?:\/\//i.test(v.image_url)
                  ? v.image_url
                  : '/sem-imagem.webp'
              }
              alt={`${v.brand} ${v.model}`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
          </div>

          {/* Conteúdo */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-[#002447]">
                {v.brand} {v.model}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Categoria: {v.category}</p>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                Preço:{' '}
                <strong>€ {Number(v.price ?? 0).toLocaleString('pt-PT')}</strong>
              </p>
              <p>Vel. de Origem: {v.speed_original ?? 0} km/h</p>
              {v.speed_tuned !== undefined && (
                <p>Vel. Full Tuned: {v.speed_tuned} km/h</p>
              )}
              {v.trunk_capacity !== undefined && (
                <p>Capacidade da mala: {v.trunk_capacity} Kg</p>
              )}
            </div>

            <div className="flex items-start md:items-center">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  v.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {v.stock ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

type SortField = 'brand' | 'model' | 'price' | 'speed_original' | 'speed_tuned' | 'trunk_capacity'
type SortOrder = 'asc' | 'desc'
type ApiResp = { items: Veiculo[]; nextCursor?: string | null }

export default function HomePage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [filteredVeiculos, setFilteredVeiculos] = useState<Veiculo[]>([])

  // Filtros
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [categoria, setCategoria] = useState('')
  const [stock, setStock] = useState('')
  const [minSpeed, setMinSpeed] = useState('')
  const [maxSpeed, setMaxSpeed] = useState('')
  const [minTrunk, setMinTrunk] = useState('')
  const [maxTrunk, setMaxTrunk] = useState('')

  // Ordenação
  const [sortField, setSortField] = useState<SortField>('price')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Modal selection
  const [selected, setSelected] = useState<Veiculo | null>(null)

  // Carregamento inicial / quando mudam filtros principais
  const loadInitial = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const body = {
        search,
        category: categoria,
        stock,
        minPrice,
        maxPrice,
        pageSize: 24,
        cursor: null,
      }
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(`Falha ao carregar veículos (HTTP ${res.status}) ${t}`)
      }
      const data: ApiResp = await res.json()
      setVeiculos(data.items)
      setCursor(data.nextCursor ?? null)
    } catch (err) {
      console.error('loadInitial:', err)
      setErrorMsg('Não foi possível carregar os veículos.')
    } finally {
      setLoading(false)
    }
  }, [search, categoria, stock, minPrice, maxPrice])

  // Paginação (usa cursor atual)
  const loadMore = useCallback(async () => {
    if (!cursor) return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search, category: categoria, stock, minPrice, maxPrice, pageSize: 24, cursor }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(`Falha ao carregar veículos (HTTP ${res.status}) ${t}`)
      }
      const data: ApiResp = await res.json()
      setVeiculos((prev) => [...prev, ...data.items])
      setCursor(data.nextCursor ?? null)
    } catch (err) {
      console.error('loadMore:', err)
      setErrorMsg('Não foi possível carregar mais veículos.')
    } finally {
      setLoading(false)
    }
  }, [cursor, search, categoria, stock, minPrice, maxPrice])

  // Efeito: mudar filtros => reset de cursor e recarregar
  useEffect(() => {
    setCursor(null)
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filtros no cliente
  useEffect(() => {
    let results = veiculos
    if (search) {
      const s = search.toLowerCase()
      results = results.filter((v) => `${v.brand} ${v.model}`.toLowerCase().includes(s))
    }
    if (categoria) results = results.filter((v) => v.category === categoria)
    if (stock) results = results.filter((v) => v.stock === (stock === 'true'))
    if (minPrice) results = results.filter((v) => (v.price ?? 0) >= parseFloat(minPrice))
    if (maxPrice) results = results.filter((v) => (v.price ?? 0) <= parseFloat(maxPrice))
    if (minSpeed) results = results.filter((v) => (v.speed_original ?? 0) >= parseFloat(minSpeed))
    if (maxSpeed) results = results.filter((v) => (v.speed_original ?? 0) <= parseFloat(maxSpeed))
    if (minTrunk) results = results.filter((v) => (v.trunk_capacity ?? 0) >= parseFloat(minTrunk))
    if (maxTrunk) results = results.filter((v) => (v.trunk_capacity ?? 0) <= parseFloat(maxTrunk))
    setFilteredVeiculos(results)
  }, [search, minPrice, maxPrice, categoria, stock, minSpeed, maxSpeed, minTrunk, maxTrunk, veiculos])

  // Ordenação
  const displayedVeiculos = useMemo(() => {
    const list = [...filteredVeiculos]
    const dir = sortOrder === 'asc' ? 1 : -1
    list.sort((a, b) => {
      switch (sortField) {
        case 'brand': return a.brand.localeCompare(b.brand, 'pt', { sensitivity: 'base' }) * dir
        case 'model': return a.model.localeCompare(b.model, 'pt', { sensitivity: 'base' }) * dir
        case 'price': return ((a.price ?? 0) - (b.price ?? 0)) * dir
        case 'speed_original': return ((a.speed_original ?? 0) - (b.speed_original ?? 0)) * dir
        case 'speed_tuned': return ((a.speed_tuned ?? 0) - (b.speed_tuned ?? 0)) * dir
        case 'trunk_capacity': return ((a.trunk_capacity ?? 0) - (b.trunk_capacity ?? 0)) * dir
        default: return 0
      }
    })
    return list
  }, [filteredVeiculos, sortField, sortOrder])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#eaf0f8] text-black font-sans">
      <header className="bg-[#002447] text-white shadow-lg w-full animate-fade-in">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-16 py-8 flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.webp" alt="Logotipo" width={200} height={70} className="object-contain cursor-pointer transition-transform hover:scale-105 duration-300" priority />
          </Link>
          <nav className="flex items-center gap-10 text-lg font-semibold">
            <Link href="/" className="hover:underline transition-colors duration-300">Home</Link>
            <Link href="" className="hover:underline">Eventos</Link>
            <Link href="/sobre" className="hover:underline">Sobre</Link>
            <Link href="/login" className="border-2 border-white px-4 py-1 rounded-full hover:bg-white hover:text-[#002447] transition-all duration-300">Login</Link>
          </nav>
        </div>
      </header>

      <PartnersCarousel />

      <section className="max-w-screen-2xl mx-auto px-6 md:px-16 py-12 grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 md:gap-10">
        {/* Filtros */}
        <AnimatePresence>
          {(!isMobile || showFilters) && (
            <motion.aside
              initial={{ x: isMobile ? '-100%' : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? '-100%' : 0, opacity: isMobile ? 0 : 1 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-6 h-fit z-40"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#002447]">Filtros</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Marca ou Modelo" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm text-gray-700">
                  <option value="">Todas as Categorias</option>
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
                <select value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm text-gray-700">
                  <option value="">Disponibilidade</option>
                  <option value="true">Disponível</option>
                  <option value="false">Indisponível</option>
                </select>
                <input type="number" placeholder="Preço mínimo (€)" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
                <input type="number" placeholder="Preço máximo (€)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
                <input type="number" placeholder="Velocidade mínima (km/h)" value={minSpeed} onChange={(e) => setMinSpeed(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
                <input type="number" placeholder="Velocidade máxima (km/h)" value={maxSpeed} onChange={(e) => setMaxSpeed(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
                <input type="number" placeholder="Mala mínima (Kg)" value={minTrunk} onChange={(e) => setMinTrunk(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
                <input type="number" placeholder="Mala máxima (Kg)" value={maxTrunk} onChange={(e) => setMaxTrunk(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-sm" />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Cards + Ordenação */}
        <main className="md:col-span-1 md:col-start-2 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            {isMobile && (
              <button onClick={() => setShowFilters(!showFilters)} className="bg-[#002447] text-white px-4 py-2 rounded-full shadow-md w-full sm:w-auto">
                {showFilters ? 'Fechar Filtros' : 'Filtros'}
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end w-full">
              <div className="flex items-center gap-2">
                <label htmlFor="sortField" className="text-sm font-medium text-gray-700">Ordenar por</label>
                <select id="sortField" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)} className="p-2 border border-gray-300 rounded text-sm bg-white">
                  <option value="brand">Marca (A–Z/Z–A)</option>
                  <option value="model">Modelo (A–Z/Z–A)</option>
                  <option value="price">Preço</option>
                  <option value="speed_original">Vel. Origem</option>
                  <option value="speed_tuned">Vel. Full Tuned</option>
                  <option value="trunk_capacity">Mala</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sortOrder" className="text-sm font-medium text-gray-700">Ordem</label>
                <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="p-2 border border-gray-300 rounded text-sm bg-white">
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {displayedVeiculos.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum veículo encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayedVeiculos.map((v, i) => (
                <motion.div
                  key={v.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden border border-gray-100 cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(v)}
                >
                  <VehicleImage src={v.image_url} alt={v.model} />
                  <div className="p-5 space-y-2">
                    <h3 className="text-xl font-bold text-[#002447]">{v.brand} {v.model}</h3>
                    <p className="text-sm text-gray-500">Categoria: {v.category}</p>
                    <p className="text-sm">Preço: <strong>€ {v.price?.toLocaleString('pt-PT') ?? 0}</strong></p>
                    <p className="text-sm">Vel. de Origem: {v.speed_original ?? 0} km/h</p>
                    {v.speed_tuned !== undefined && <p className="text-sm">Vel. Full Tuned: {v.speed_tuned} km/h</p>}
                    {v.trunk_capacity !== undefined && <p className="text-sm">Capacidade da mala: {v.trunk_capacity} Kg</p>}
                    <p className="text-sm mt-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${v.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.stock ? 'Disponível' : 'Indisponível'}
                      </span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {cursor && (
            <div className="mt-8 flex justify-center">
              <button className="px-4 py-2 rounded-full bg-[#002447] text-white disabled:opacity-50" onClick={loadMore} disabled={loading}>
                {loading ? 'A carregar...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </main>
      </section>

      <footer className="bg-[#002447] text-white text-center py-12 text-lg w-full">
        <p>&copy; {new Date().getFullYear()} Catálogo GTA | Todos os direitos reservados.</p>
      </footer>

      {/* Modal de detalhes */}
      <AnimatePresence>{selected && <VehicleModal v={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </div>
  )
}
