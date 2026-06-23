'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  entregaId: string; empresaNome: string
  entregadores: {id:string;nome:string;parceiro_id:string|null}[]
  valorAtual: number
}

export default function RegistrarEntregadorModal({ entregaId, empresaNome, entregadores, valorAtual }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [valor, setValor] = useState(valorAtual?.toFixed(2) ?? '')
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/entregas/${entregaId}/entregador`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entregador_id: fd.get('entregador_id'),
        valor_entrega: parseFloat(fd.get('valor_entrega') as string),
      })
    })
    if (!res.ok) { toast.error('Erro ao registrar'); setLoading(false); return }
    toast.success('Entregador registrado!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-xs">👤 Atribuir</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar entregador" size="sm">
        <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
          <div className="text-sm font-semibold text-blue-800">{empresaNome}</div>
        </div>
        <form onSubmit={submit}>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="form-label">Entregador <span className="text-red-400">*</span></label>
              <select name="entregador_id" className="form-input" required>
                <option value="">Selecionar...</option>
                {entregadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Valor da entrega (R$) <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input name="valor_entrega" type="number" step="0.01" min="0" className="form-input pl-9"
                  required value={valor} onChange={e => setValor(e.target.value)} />
              </div>
              <p className="form-hint">Confirme o valor acordado para esta entrega</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Salvando…' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
