'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'

export default function EventosPage() {
  // evita recalcular em cada render (detalhe perf/ESLint feliz)
  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#eaf0f8] text-black font-sans">
      <header className="bg-[#002447] text-white shadow w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-8 flex justify-between items-center">
          <Link href="/" aria-label="Ir para a página inicial">
            <Image
              src="/logo.webp"
              alt="Logotipo Premium Deluxe Motorsport"
              width={200}
              height={70}
              className="object-contain cursor-pointer transition-transform hover:scale-105 duration-300"
              priority
            />
          </Link>

          <nav className="flex items-center gap-10 text-lg font-semibold" aria-label="Navegação principal">
            <Link href="/" className="hover:underline transition-colors duration-300">
              Home
            </Link>
            <Link href="/" className="hover:underline" aria-current="page">
              Eventos
            </Link>
            <Link href="/sobre" className="hover:underline">
              Sobre
            </Link>
            <Link
              href="/login"
              className="border-2 border-white px-4 py-1 rounded-full hover:bg-white hover:text-[#002447] transition-all duration-300"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-16 py-16">
        {/* conteúdo dos eventos aqui */}
      </main>

      <footer className="bg-[#002447] text-white text-center py-12 text-lg w-full mt-20">
        <p>&copy; {year} Premium Deluxe Motorsport | Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
