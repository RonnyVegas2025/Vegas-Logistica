'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { toast.error('E-mail ou senha inválidos'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* TODO: substituir pela logo <img src="..." /> hospedada no Supabase Storage */}
          <h1 className="text-xl font-bold text-gray-900">Vegas Logística</h1>
          <p className="text-sm text-gray-400 mt-1">Sistema de logística de cartões</p>
        </div>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="form-label">E-mail</label>
                <input type="email" className="form-input" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="form-label">Senha</label>
                <input type="password" className="form-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-1">
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

