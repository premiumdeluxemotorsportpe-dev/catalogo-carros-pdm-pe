'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const nextPath = sp.get('next') || '/admin'

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      })

      // Só tenta ler JSON se o servidor mandou JSON
      const ct = res.headers.get('content-type') ?? ''
      const data = ct.includes('application/json') ? await res.json() : {}

      if (!res.ok) {
        setError((data as any)?.message || `Erro (HTTP ${res.status})`)
        return
      }

      // Sessão é por cookie HttpOnly -> redireciona
      router.replace(nextPath)
    } catch {
      setError('Falha de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 md:p-7 rounded-2xl shadow border"
      >
        <h2 className="text-2xl font-semibold mb-4 text-[#002447]">
          Login de Admin
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-3" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="name" className="block text-sm mb-1">
          Nome
        </label>
        <input
          id="name"
          type="text"
          className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password" className="block text-sm mb-1">
          Senha
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 border rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#002447] text-white py-2 rounded hover:bg-[#003366] disabled:opacity-60 transition"
        >
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
