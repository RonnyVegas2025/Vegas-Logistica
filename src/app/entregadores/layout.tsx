import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import type { PerfilUsuario } from '@/types/index'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await sb.from('usuarios').select('nome,perfil').eq('id', user.id).single()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar perfil={(u?.perfil ?? 'admin') as PerfilUsuario} nome={u?.nome ?? user.email ?? ''} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0">
          <div className="flex-1" />
          {u?.perfil === 'parceiro' && (
            <span className="badge bg-amber-100 text-amber-700 text-xs">Acesso Parceiro — somente leitura</span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6 fade-in">{children}</main>
      </div>
    </div>
  )
}
