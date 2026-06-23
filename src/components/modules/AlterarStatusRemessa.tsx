'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { StatusRemessa } from '@/types/index'

const PROXIMO: Record<StatusRemessa, {label:string; next:StatusRemessa}|null> = {
  rascunho:  { label:'Marcar como enviada', next:'enviada' },
  enviada:   { label:'Confirmar recebimento pela NEX7', next:'recebida' },
  recebida:  { label:'Marcar como concluída', next:'concluida' },
  concluida: null,
}

export default function AlterarStatusRemessa({ remessaId, statusAtual }: { remessaId:string; statusAtual:StatusRemessa }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const prox = PROXIMO[statusAtual]
  if (!prox) return null

  async function avancar() {
    setLoading(true)
    const res = await fetch(`/api/remessas/${remessaId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: prox!.next })
    })
    if (!res.ok) { toast.error('Erro ao atualizar status'); setLoading(false); return }
    toast.success('Status atualizado!')
    setLoading(false); router.refresh()
  }

  return (
    <button onClick={avancar} disabled={loading} className="btn">
      {loading ? '…' : prox.label}
    </button>
  )
}
