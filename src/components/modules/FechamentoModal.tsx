'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  remessas: {id:string;codigo:string}[]
  entregadores: {id:string;nome:string}[]
  parceiros: {id:string;nome:string}[]
}

export default function FechamentoModal({ remessas, entregadores, parceiros }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'nex7'|'entregador'>('nex7')
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/fechamentos', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        tipo_pagamento: tipo,
        remessa_id: fd.get('remessa_id')||null,
        parceiro_id: tipo==='nex7' ? fd.get('destino_id') : null,
        entregador_id: tipo==='entregador' ? fd.get('destino_id') : null,
        quantidade_entregas: parseInt(fd.get('quantidade_entregas') as string)||0,
        valor_total: parseFloat(fd.get('valor_total') as string)||0,
        valor_acordado: fd.get('valor_acordado') ? parseFloat(fd.get('valor_acordado') as string) : null,
        observacoes: fd.get('observacoes')||null,
      })
    })
    if (!res.ok) { toast.error('Erro ao criar fechamento'); setLoading(false); return }
    toast.success('Fechamento criado!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">+ Novo fechamento</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Criar fechamento de pagamento" size="md">
        <form onSubmit={submit}>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="form-label">Pagar para *</label>
              <div className="grid grid-cols-2 gap-2">
                {[['nex7','🏢 Parceiro (NEX7)'],['entregador','🚴 Entregador direto']].map(([v,l])=>(
                  <button key={v} type="button" onClick={()=>setTipo(v as any)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${tipo===v?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">{tipo==='nex7'?'Parceiro':'Entregador'} *</label>
              <select name="destino_id" className="form-input" required>
                <option value="">Selecionar...</option>
                {(tipo==='nex7'?parceiros:entregadores).map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Remessa referência</label>
              <select name="remessa_id" className="form-input">
                <option value="">Sem vínculo de remessa</option>
                {remessas.map(r=><option key={r.id} value={r.id}>{r.codigo}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Qtd. de entregas *</label>
                <input name="quantidade_entregas" type="number" min="0" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Valor total (R$) *</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input name="valor_total" type="number" step="0.01" min="0" className="form-input pl-9" required /></div>
              </div>
            </div>
            <div>
              <label className="form-label">Valor acordado (R$) — se diferente do total</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input name="valor_acordado" type="number" step="0.01" min="0" className="form-input pl-9" placeholder="Deixar vazio = igual ao total" /></div>
              <p className="form-hint">Use quando há ajuste de valor em relação ao acordado originalmente</p>
            </div>
            <div><label className="form-label">Observações</label><textarea name="observacoes" className="form-input" rows={2} placeholder="Detalhes do fechamento..." /></div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={()=>setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading?'Criando…':'Criar fechamento'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
