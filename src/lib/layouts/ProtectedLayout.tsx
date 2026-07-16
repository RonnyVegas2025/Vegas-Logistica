import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarAuth from '@/components/layout/SidebarAuth'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: usuario } = await sb
    .from('usuarios')
    .select('nome, perfil')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAuth
        perfil={usuario?.perfil ?? 'admin'}
        nome={usuario?.nome ?? user.email ?? ''}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0">
          <div className="flex-1" />
          <div className="text-xs text-gray-400">{usuario?.nome}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 fade-in">{children}</main>
      </div>
    </div>
  )
}
