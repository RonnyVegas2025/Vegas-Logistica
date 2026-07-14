'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const FORMAS = [
  { value:'presencial', label:'Presencial' },
  { value:'motoboy', label:'Motoboy' },
  { value:'sedex', label:'SEDEX' },
  { value:'transportadora', label:'Transportadora' },
  { value:'retirada', label:'Retirada' },
  { value:'outro', label:'Outro' },
]

interface Props {
  entregador?: any
  action: (id: string | null, formData: FormData) => Promise<any>
  filiais: {id:string;nome:string}[]
  parceiros: {id:string;nome:string}[]
}

export default function EntregadorModal({ entregador, action, filiais, parceiros }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const isEdit = !!entregador
  const formasAtivas: string[] = entregador?.formas_habilitadas ?? []

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const result = await action(entregador?.id ?? null, fd)
    if (result?.error) { setErrors(result.error); setLoading(false); return }
    toast.success(isEdit ? 'Entregador atualizado!' : 'Entregador cadastrado!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit ? 'btn btn-xs' : 'btn btn-primary'}>
        {isEdit ? 'Editar' : '+ Novo entregador'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)}
        title={isEdit ? 'Editar entregador' : 'Novo entregador'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Nome completo <span className="text-red-400">*</span></label>
              <input name="nome" className="form-input" required defaultValue={entregador?.nome} />
              {errors.nome && <p className="form-error">{errors.nome[0]}</p>}
            </div>
            <div>
              <label className="form-label">CPF / Documento</label>
              <input name="documento" className="form-input font-mono" defaultValue={entregador?.documento ?? ''} />
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input name="telefone" className="form-input" defaultValue={entregador?.telefone ?? ''} />
            </div>
            <div className="col-span-2">
              <label className="form-label">E-mail</label>
              <input name="email" type="email" className="form-input" defaultValue={entregador?.email ?? ''} />
            </div>
            <div>
              <label className="form-label">Filial <span className="text-red-400">*</span></label>
              <select name="filial_id" className="form-input" required defaultValue={entregador?.filial_id ?? ''}>
                <option value="">Selecionar filial...</option>
                {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {errors.filial_id && <p className="form-error">{errors.filial_id[0]}</p>}
            </div>
            <div>
              <label className="form-label">Parceiro (empresa)</label>
              <select name="parceiro_id" className="form-input" defaultValue={entregador?.parceiro_id ?? ''}>
                <option value="">Autônomo</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            {/* Formas habilitadas */}
            <div className="col-span-2">
              <label className="form-label">Formas de entrega habilitadas <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {FORMAS.map(f => (
                  <label key={f.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="formas_habilitadas" value={f.value}
                      defaultChecked={formasAtivas.includes(f.value)} className="w-4 h-4" />
                    {f.label}
                  </label>
                ))}
              </div>
              {errors.formas_habilitadas && <p className="form-error">{errors.formas_habilitadas[0]}</p>}
            </div>

            {/* Dados de pagamento */}
            <div className="col-span-2 border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dados de pagamento</div>
            </div>
            <div>
              <label className="form-label">Tipo de chave Pix</label>
              <select name="tipo_chave_pix" className="form-input" defaultValue={entregador?.tipo_chave_pix ?? ''}>
                <option value="">Selecionar</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave aleatória</option>
              </select>
            </div>
            <div>
              <label className="form-label">Chave Pix</label>
              <input name="chave_pix" className="form-input" defaultValue={entregador?.chave_pix ?? ''} />
            </div>
            <div>
              <label className="form-label">Banco</label>
              <input name="banco" className="form-input" defaultValue={entregador?.banco ?? ''} />
            </div>
            <div>
              <label className="form-label">Agência</label>
              <input name="agencia" className="form-input" defaultValue={entregador?.agencia ?? ''} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Conta</label>
              <input name="conta" className="form-input" defaultValue={entregador?.conta ?? ''} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Observações</label>
              <textarea name="observacoes" className="form-input" rows={2} defaultValue={entregador?.observacoes ?? ''} />
            </div>
            <input type="hidden" name="ativo" value={entregador?.ativo !== false ? 'true' : 'false'} />
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Salvando…' : 'Salvar entregador'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
