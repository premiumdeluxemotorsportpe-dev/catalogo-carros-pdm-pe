'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const sp = useSearchParams()
  const nextPath = sp.get('next') || '/admin'

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
      const data = ct.includes('application/json') ? await res.json() : {}
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border rounded-2xl p-8 shadow">
        <h1 className="text-2xl font-bold mb-4">Login de Admin</h1>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <label className="block text-sm mb-1">Nome</label>
        <input className="w-full border rounded px-3 py-2 mb-4" value={name} onChange={e=>setName(e.target.value)} required />

        <label className="block text-sm mb-1">Senha</label>
        <input type="password" className="w-full border rounded px-3 py-2 mb-6" value={password} onChange={e=>setPassword(e.target.value)} required />

        <button disabled={loading} className="w-full bg-[#002447] text-white rounded py-2 disabled:opacity-60">
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
