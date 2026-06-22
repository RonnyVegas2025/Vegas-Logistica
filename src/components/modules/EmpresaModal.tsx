'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Empresa = { id:string; razao_social:string; nome_fantasia:string|null; cnpj:string|null; logradouro:string|null; numero:string|null; complemento:string|null; bairro:string|null; cidade:string|null; estado:string|null; cep:string|null; telefone:string|null; email_contato:string|null; valor_entrega_padrao:number|null; parceiro_padrao_id:string|null; observacoes:string|null }
const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function EmpresaModal({ empresa, parceiros }: { empresa?: Empresa; parceiros: {id:string;nome:string}[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isEdit = !!empresa

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd.entries())
    if (body.valor_entrega_padrao) body.valor_entrega_padrao = parseFloat(body.valor_entrega_padrao as string) as any
    const url = isEdit ? `/api/empresas/${empresa!.id}` : '/api/empresas'
    const res = await fetch(url, { method: isEdit?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    if (!res.ok) { toast.error('Erro ao salvar'); setLoading(false); return }
    toast.success(isEdit ? 'Empresa atualizada!' : 'Empresa cadastrada!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit ? 'btn btn-xs' : 'btn btn-primary'}>
        {isEdit ? 'Editar' : '+ Nova empresa'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit?'Editar empresa':'Nova empresa'} size="lg">
        <form onSubmit={submit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="form-label">Razão social *</label><input name="razao_social" className="form-input" required defaultValue={empresa?.razao_social} /></div>
            <div><label className="form-label">Nome fantasia</label><input name="nome_fantasia" className="form-input" defaultValue={empresa?.nome_fantasia??''} /></div>
            <div><label className="form-label">CNPJ</label><input name="cnpj" className="form-input" placeholder="00.000.000/0000-00" defaultValue={empresa?.cnpj??''} /></div>
            <div className="col-span-2"><label className="form-label">Logradouro</label><input name="logradouro" className="form-input" defaultValue={empresa?.logradouro??''} /></div>
            <div><label className="form-label">Número</label><input name="numero" className="form-input" defaultValue={empresa?.numero??''} /></div>
            <div><label className="form-label">Complemento</label><input name="complemento" className="form-input" defaultValue={empresa?.complemento??''} /></div>
            <div><label className="form-label">Bairro</label><input name="bairro" className="form-input" defaultValue={empresa?.bairro??''} /></div>
            <div><label className="form-label">CEP</label><input name="cep" className="form-input" placeholder="00000-000" defaultValue={empresa?.cep??''} /></div>
            <div><label className="form-label">Cidade</label><input name="cidade" className="form-input" defaultValue={empresa?.cidade??''} /></div>
            <div><label className="form-label">Estado</label><select name="estado" className="form-input" defaultValue={empresa?.estado??''}><option value="">UF</option>{UF.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
            <div><label className="form-label">Telefone</label><input name="telefone" className="form-input" defaultValue={empresa?.telefone??''} /></div>
            <div><label className="form-label">E-mail contato</label><input name="email_contato" type="email" className="form-input" defaultValue={empresa?.email_contato??''} /></div>
            <div>
              <label className="form-label">💰 Valor padrão de entrega (R$)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input name="valor_entrega_padrao" type="number" step="0.01" min="0" className="form-input pl-9" placeholder="0,00" defaultValue={empresa?.valor_entrega_padrao??''} /></div>
              <p className="form-hint">Será sugerido automaticamente ao adicionar esta empresa em uma remessa</p>
            </div>
            <div>
              <label className="form-label">Parceiro padrão</label>
              <select name="parceiro_padrao_id" className="form-input" defaultValue={empresa?.parceiro_padrao_id??''}>
                <option value="">Nenhum</option>
                {parceiros.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="form-label">Observações</label><textarea name="observacoes" className="form-input" rows={2} defaultValue={empresa?.observacoes??''} /></div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading?'Salvando…':'Salvar empresa'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
