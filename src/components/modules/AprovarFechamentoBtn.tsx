'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function AprovarFechamentoBtn({ id, status }: { id:string; status:string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function acao(a: 'aprovar'|'marcar_pago') {
    setLoading(true)
    const res = await fetch(`/api/fechamentos/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ acao: a })
    })
    if (!res.ok) { toast.error('Erro'); setLoading(false); return }
    toast.success(a==='aprovar'?'Aprovado!':'Marcado como pago!')
    setLoading(false); router.refresh()
  }

  if (status==='pendente') return (
    <div className="flex gap-1">
      <button onClick={()=>acao('aprovar')} disabled={loading} className="btn btn-xs btn-success">{loading?'…':'Aprovar'}</button>
    </div>
  )
  if (status==='aprovado') return (
    <button onClick={()=>acao('marcar_pago')} disabled={loading} className="btn btn-xs btn-primary">{loading?'…':'Marcar pago ✓'}</button>
  )
  return null
}
