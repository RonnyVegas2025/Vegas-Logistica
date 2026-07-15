'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { label:'Dashboard',    href:'/dashboard',    emoji:'◈' },
  { label:'Remessas',     href:'/remessas',     emoji:'📦' },
  { label:'Entregas',     href:'/entregas',     emoji:'📍' },
  { label:'Fechamento',   href:'/fechamento',   emoji:'💰' },
  { label:'Empresas',     href:'/empresas',     emoji:'🏢' },
  { label:'Entregadores', href:'/entregadores', emoji:'🚴' },
  { label:'Filiais',      href:'/filiais',      emoji:'🏬' },
  { label:'Taxas',        href:'/taxas',        emoji:'💲' },
]

export default function SidebarSimples() {
  const pathname = usePathname()
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
          <div className="text-[10px] text-gray-400">Sistema logístico</div>
        </div>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {NAV.map(i => {
            const active = pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href))
            return (
              <Link key={i.href} href={i.href} className={cn('nav-item', active && 'active')}>
                <span className="text-base">{i.emoji}</span>
                <span>{i.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
