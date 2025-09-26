'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type LoginResp = { ok?: boolean; message?: string }

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const nextPath = sp.get('next') || '/admin'

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      })

      const ct = res.headers.get('content-type') ?? ''
      const data: LoginResp = ct.includes('application/json') ? await res.json() : {}

      if (!res.ok) {
        setError(data?.message || `Erro (HTTP ${res.status})`)
        return
      }

      router.replace(nextPath)
    } catch {
      setError('Falha de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-4">Login de Admin</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm mb-1">Nome</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Senha</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#002447] text-white py-2 rounded hover:bg-[#003366] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

// Força o rendering dinâmico (evita pre-render estático) — opcional mas ajuda.
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <LoginForm />
    </Suspense>
  )
}
