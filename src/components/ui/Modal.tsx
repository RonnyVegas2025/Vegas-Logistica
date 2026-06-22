'use client'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
interface Props { open:boolean; onClose:()=>void; title:string; children:React.ReactNode; size?:'sm'|'md'|'lg'|'xl' }
export default function Modal({ open, onClose, title, children, size='md' }: Props) {
  useEffect(() => {
    if (!open) return
    const h = (e:KeyboardEvent) => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown',h)
    return () => window.removeEventListener('keydown',h)
  },[open,onClose])
  if (!open) return null
  const w = {sm:'max-w-sm',md:'max-w-lg',lg:'max-w-2xl',xl:'max-w-4xl'}[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div className={cn('bg-white rounded-xl border shadow-xl w-full overflow-auto max-h-[92vh]',w)} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 text-lg leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
