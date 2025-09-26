'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function EventosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#eaf0f8] text-black font-sans">
      <header className="bg-[#002447] text-white shadow w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-8 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/logo.webp"
              alt="Logotipo"
              width={200}
              height={70}
              className="object-contain cursor-pointer transition-transform hover:scale-105 duration-300"
            />
          </Link>
          <nav className="flex items-center gap-10 text-lg font-semibold">
            <Link href="/" className="hover:underline transition-colors duration-300">
              Home
            </Link>
            <Link href="/eventos" className="hover:underline">
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
        
      </main>

      <footer className="bg-[#002447] text-white text-center py-12 text-lg w-full mt-20">
        <p>&copy; {new Date().getFullYear()} Premium Deluxe Motorsport | Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

