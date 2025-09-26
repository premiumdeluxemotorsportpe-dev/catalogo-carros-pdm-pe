'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function getErrMsg(data: unknown, fallback: string) {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.error === 'string') return obj.error
  }
  return fallback
}

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const nextPath = sp.get('next') || '/admin'

  const [name, setName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // garante que o cookie de sessão vem
        body: JSON.stringify({ name, password }),
      })

      const contentType = res.headers.get('content-type') ?? ''
      const payload: unknown = contentType.includes('application/json')
        ? await res.json()
        : {}

      if (!res.ok) {
        setError(getErrMsg(payload, `Erro (HTTP ${res.status})`))
        return
      }

      // sucesso: cookie foi setado pela API, segue para a página seguinte
      router.replace(nextPath)
    } catch {
      setError('Falha de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold mb-4">Login de Admin</h2>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm mb-1">
            Nome
          </label>
          <input
            id="name"
            type="text"
            autoComplete="username"
            className="w-full px-3 py-2 border rounded"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full px-3 py-2 border rounded"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#002447] text-white py-2 rounded hover:bg-[#003366] disabled:opacity-60"
        >
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
