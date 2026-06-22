'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Entregador = { id:string; nome:string; documento:string|null; telefone:string|null; email:string|null; parceiro_id:string|null; tipo_chave_pix:string|null; chave_pix:string|null; banco:string|null; agencia:string|null; conta:string|null; observacoes:string|null }

export default function EntregadorModal({ entregador, parceiros }: { entregador?: Entregador; parceiros:{id:string;nome:string}[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isEdit = !!entregador

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd.entries())
    const url = isEdit ? `/api/entregadores/${entregador!.id}` : '/api/entregadores'
    const res = await fetch(url, { method:isEdit?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    if (!res.ok) { toast.error('Erro ao salvar'); setLoading(false); return }
    toast.success(isEdit?'Atualizado!':'Entregador cadastrado!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit?'btn btn-xs':'btn btn-primary'}>
        {isEdit?'Editar':'+ Novo entregador'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit?'Editar entregador':'Novo entregador'} size="md">
        <form onSubmit={submit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="form-label">Nome completo *</label><input name="nome" className="form-input" required defaultValue={entregador?.nome} /></div>
            <div><label className="form-label">CPF / Documento</label><input name="documento" className="form-input" defaultValue={entregador?.documento??''} /></div>
            <div><label className="form-label">Telefone</label><input name="telefone" className="form-input" defaultValue={entregador?.telefone??''} /></div>
            <div className="col-span-2"><label className="form-label">E-mail</label><input name="email" type="email" className="form-input" defaultValue={entregador?.email??''} /></div>
            <div className="col-span-2">
              <label className="form-label">Parceiro (empresa onde trabalha)</label>
              <select name="parceiro_id" className="form-input" defaultValue={entregador?.parceiro_id??''}>
                <option value="">Autônomo</option>
                {parceiros.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dados de pagamento</div>
            </div>
            <div>
              <label className="form-label">Tipo de chave Pix</label>
              <select name="tipo_chave_pix" className="form-input" defaultValue={entregador?.tipo_chave_pix??''}>
                <option value="">Selecionar</option>
                <option value="cpf">CPF</option><option value="email">E-mail</option>
                <option value="telefone">Telefone</option><option value="aleatoria">Chave aleatória</option>
              </select>
            </div>
            <div><label className="form-label">Chave Pix</label><input name="chave_pix" className="form-input" defaultValue={entregador?.chave_pix??''} /></div>
            <div><label className="form-label">Banco</label><input name="banco" className="form-input" defaultValue={entregador?.banco??''} /></div>
            <div><label className="form-label">Agência</label><input name="agencia" className="form-input" defaultValue={entregador?.agencia??''} /></div>
            <div className="col-span-2"><label className="form-label">Observações</label><textarea name="observacoes" className="form-input" rows={2} defaultValue={entregador?.observacoes??''} /></div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading?'Salvando…':'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
