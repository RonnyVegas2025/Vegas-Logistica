'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface Props {
  empresa?: any
  action: (id: string | null, formData: FormData) => Promise<any>
  parceiros: {id:string;nome:string}[]
}

export default function EmpresaModal({ empresa, action, parceiros }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const isEdit = !!empresa

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const result = await action(empresa?.id ?? null, fd)
    if (result?.error) { setErrors(result.error); setLoading(false); return }
    toast.success(isEdit ? 'Empresa atualizada!' : 'Empresa cadastrada!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit ? 'btn btn-sm' : 'btn btn-primary'}>
        {isEdit ? 'Editar dados' : '+ Nova empresa'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)}
        title={isEdit ? 'Editar empresa' : 'Nova empresa'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Razão social <span className="text-red-400">*</span></label>
              <input name="razao_social" className="form-input" required defaultValue={empresa?.razao_social} />
              {errors.razao_social && <p className="form-error">{errors.razao_social[0]}</p>}
            </div>
            <div>
              <label className="form-label">Nome fantasia</label>
              <input name="nome_fantasia" className="form-input" defaultValue={empresa?.nome_fantasia ?? ''} />
            </div>
            <div>
              <label className="form-label">CNPJ (só números)</label>
              <input name="cnpj" className="form-input font-mono" placeholder="00000000000000" defaultValue={empresa?.cnpj ?? ''} />
              {errors.cnpj && <p className="form-error">{errors.cnpj[0]}</p>}
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Endereço cadastral</div>
            </div>
            <div className="col-span-2">
              <label className="form-label">Logradouro</label>
              <input name="logradouro" className="form-input" defaultValue={empresa?.logradouro ?? ''} />
            </div>
            <div>
              <label className="form-label">Número</label>
              <input name="numero" className="form-input" defaultValue={empresa?.numero ?? ''} />
            </div>
            <div>
              <label className="form-label">Complemento</label>
              <input name="complemento" className="form-input" defaultValue={empresa?.complemento ?? ''} />
            </div>
            <div>
              <label className="form-label">Bairro</label>
              <input name="bairro" className="form-input" defaultValue={empresa?.bairro ?? ''} />
            </div>
            <div>
              <label className="form-label">CEP (só números)</label>
              <input name="cep" className="form-input" placeholder="00000000" defaultValue={empresa?.cep ?? ''} />
            </div>
            <div>
              <label className="form-label">Cidade</label>
              <input name="cidade" className="form-input" defaultValue={empresa?.cidade ?? ''} />
            </div>
            <div>
              <label className="form-label">Estado</label>
              <select name="estado" className="form-input" defaultValue={empresa?.estado ?? ''}>
                <option value="">UF</option>
                {UF.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contato e configurações</div>
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input name="telefone" className="form-input" defaultValue={empresa?.telefone ?? ''} />
            </div>
            <div>
              <label className="form-label">E-mail de contato</label>
              <input name="email_contato" type="email" className="form-input" defaultValue={empresa?.email_contato ?? ''} />
            </div>
            <div>
              <label className="form-label">Valor padrão de entrega (R$)</label>
              <input name="valor_entrega_padrao" type="number" step="0.01" min="0" className="form-input"
                defaultValue={empresa?.valor_entrega_padrao ?? ''} placeholder="0,00" />
              {errors.valor_entrega_padrao && <p className="form-error">{errors.valor_entrega_padrao[0]}</p>}
            </div>
            <div>
              <label className="form-label">Parceiro padrão</label>
              <select name="parceiro_padrao_id" className="form-input" defaultValue={empresa?.parceiro_padrao_id ?? ''}>
                <option value="">Nenhum</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Observações</label>
              <textarea name="observacoes" className="form-input" rows={2} defaultValue={empresa?.observacoes ?? ''} />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Salvando…' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
