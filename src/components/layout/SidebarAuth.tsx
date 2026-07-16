'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ADMIN = [
  { label:'Dashboard',    href:'/dashboard',    emoji:'◈' },
  { label:'Remessas',     href:'/remessas',     emoji:'📦' },
  { label:'Entregas',     href:'/entregas',     emoji:'📍' },
  { label:'Fechamento',   href:'/fechamento',   emoji:'💰' },
  { label:'Empresas',     href:'/empresas',     emoji:'🏢' },
  { label:'Entregadores', href:'/entregadores', emoji:'🚴' },
  { label:'Filiais',      href:'/filiais',      emoji:'🏬' },
  { label:'Taxas',        href:'/taxas',        emoji:'💲' },
]

const NAV_FINANCEIRO = [
  { label:'Dashboard',  href:'/dashboard',  emoji:'◈' },
  { label:'Remessas',   href:'/remessas',   emoji:'📦' },
  { label:'Entregas',   href:'/entregas',   emoji:'📍' },
  { label:'Fechamento', href:'/fechamento', emoji:'💰' },
  { label:'Empresas',   href:'/empresas',   emoji:'🏢' },
]

interface Props { perfil: string; nome: string }

export default function SidebarAuth({ perfil, nome }: Props) {
  const pathname = usePathname()
  const nav = perfil === 'financeiro' ? NAV_FINANCEIRO : NAV_ADMIN

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
        <img
          src="https://oejjjhytfjiyffcohkyp.supabase.co/storage/v1/object/public/assets/Logo_Colorido_4x_1.png"
          alt="Vegas"
          className="h-8 w-auto"
        />
        <div>
          <div className="text-sm font-bold text-gray-900">Vegas Logística</div>
          <div className="text-[10px] text-gray-400">
            {perfil === 'parceiro' ? 'Portal Parceiro' : perfil === 'financeiro' ? 'Financeiro' : 'Painel Admin'}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {nav.map(i => {
            const active = pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href))
            return (
              <Link key={i.href} href={i.href}
                className={`nav-item ${active ? 'active' : ''}`}>
                <span className="text-base">{i.emoji}</span>
                <span>{i.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 truncate">{nome}</div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-xs text-red-400 hover:text-red-600 mt-1">Sair</button>
        </form>
      </div>
    </aside>
  )
}
