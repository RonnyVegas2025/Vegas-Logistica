'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { PerfilUsuario } from '@/types/index'

type Item = { label: string; href: string; emoji: string; perfis: PerfilUsuario[] }

const NAV: Item[] = [
  { label:'Dashboard',    href:'/dashboard',    emoji:'◈', perfis:['admin','financeiro','parceiro'] },
  { label:'Remessas',     href:'/remessas',     emoji:'📦', perfis:['admin','financeiro','parceiro'] },
  { label:'Entregas',     href:'/entregas',     emoji:'📍', perfis:['admin','financeiro','parceiro'] },
  { label:'Fechamento',   href:'/fechamento',   emoji:'💰', perfis:['admin','financeiro'] },
]
const CADASTROS: Item[] = [
  { label:'Empresas',     href:'/empresas',     emoji:'🏢', perfis:['admin'] },
  { label:'Entregadores', href:'/entregadores', emoji:'🚴', perfis:['admin'] },
]

export default function Sidebar({ perfil, nome }: { perfil: PerfilUsuario; nome: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login'); router.refresh()
  }

  function NavLink({ item }: { item: Item }) {
    if (!item.perfis.includes(perfil)) return null
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link href={item.href} className={cn('nav-item', active && 'active')}>
        <span className="text-base">{item.emoji}</span>
        <span>{item.label}</span>
      </Link>
    )
  }

  const initials = nome.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
        <img
          src="https://oejjjhytfjiyffcohkyp.supabase.co/storage/v1/object/public/assets/Logo_Colorido_4x_1.png"
          alt="Vegas Logística"
          className="h-8 w-auto"
        />
        <div>
          <div className="text-sm font-bold text-gray-900">Vegas Logística</div>
          <div className="text-[10px] text-gray-400">Sistema logístico</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Menu</div>
        <div className="flex flex-col gap-0.5">
          {NAV.map(i => <NavLink key={i.href} item={i} />)}
        </div>
        {perfil === 'admin' && (
          <>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">Cadastros</div>
            <div className="flex flex-col gap-0.5">
              {CADASTROS.map(i => <NavLink key={i.href} item={i} />)}
            </div>
          </>
        )}
      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{nome}</div>
            <div className="text-[10px] text-gray-400">{perfil}</div>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors text-xs" title="Sair">✕</button>
        </div>
      </div>
    </aside>
  )
}
