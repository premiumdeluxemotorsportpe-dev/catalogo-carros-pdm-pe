'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function SobrePage() {
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
            <Link href="" className="hover:underline">
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
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#002447] mb-6 text-center">
            Sobre a Premium Deluxe Motorsport
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed text-justify">
            A <strong>Premium Deluxe Motorsport </strong>é uma empresa que oferece um serviço completo no mercado
            automobilístico, com uma equipa preparada para responder a todas as questões e um atendimento
            personalizado, focado em encontrar a viatura certa para cada cliente. Acreditamos que o sucesso de uma
            empresa se mede também pela sua ligação à cidade. Por isso, através da realização de eventos, procuramos
            aproximar a PDM da comunidade, criando momentos únicos de partilha, adrenalina e convívio. Para além de
            formarmos excelentes vendedores, temos como missão formar também grandes seres humanos com valores, empatia
            e espírito de equipa.
          </p>
        </motion.section>

        <motion.section
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.15 }}
        >
          {funcionarios.map((f, i) => {
            const isFeatured = f.nome === 'Andre Vidal'
            return (
              <motion.div
                key={f.nome}
                className={`relative bg-white shadow-md rounded-xl overflow-hidden p-6 border border-gray-200 hover:shadow-xl transition-all min-h-[400px] flex flex-col items-center justify-center text-center ${
                  isFeatured ? 'ring-4 ring-[#B8860B]' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                {/* Coroa (apenas para o funcionário do mês) */}
                {isFeatured && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2" aria-hidden>
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      className="drop-shadow-lg"
                      role="img"
                      aria-label="Coroa de destaque"
                    >
                      <path
                        d="M3 7l4 4 5-7 5 7 4-4v10H3V7z"
                        fill="#B8860B"
                        stroke="#8B7500"
                        strokeWidth="0.75"
                      />
                      <rect x="3" y="16" width="18" height="3" rx="0.5" fill="#8B7500" />
                    </svg>
                  </div>
                )}

                <Image
                  src={f.foto}
                  alt={f.nome}
                  width={160}
                  height={160}
                  className={`rounded-full object-cover w-40 h-40 border-4 ${
                    isFeatured ? 'border-[#B8860B]' : 'border-[#002447]'
                  }`}
                />

                <h3 className="mt-4 text-xl font-semibold text-[#002447]">{f.nome}</h3>
                <p className="text-gray-600">{f.cargo}</p>

                {/* Tag de destaque */}
                {isFeatured && (
                  <span className="mt-3 inline-block bg-[#B8860B] text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                    Funcionário do Mês
                  </span>
                )}
              </motion.div>
            )
          })}
        </motion.section>
      </main>

      <footer className="bg-[#002447] text-white text-center py-12 text-lg w-full mt-20">
        <p>&copy; {new Date().getFullYear()} Premium Deluxe Motorsport | Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

const funcionarios = [
  { nome: 'Miguel Silva', cargo: 'CEO', foto: '/colaboradores/simeon.jpg' },
  { nome: 'Enzo Torretto', cargo: 'Diretor de Vendas', foto: '/colaboradores/tony.jpg' },
  { nome: 'Nathan David', cargo: 'Formador/Recrutador', foto: '/colaboradores/mira.jpg' },
  { nome: 'Andre Vidal', cargo: 'Piloto de Testes', foto: '/colaboradores/carlos.jpg' },
  { nome: 'Mika Murakami', cargo: 'Vendedor Senior', foto: '/colaboradores/lana.jpg' },
  { nome: 'Ruan', cargo: 'Vendedor Senior', foto: '/colaboradores/trevor.jpg' },
  { nome: 'Atchim', cargo: 'Vendedor Senior', foto: '/colaboradores/olga.jpg' },
]
