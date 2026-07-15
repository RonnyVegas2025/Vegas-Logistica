'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface Props {
  taxa?: any
  action: (id: string | null, formData: FormData) => Promise<any>
}

export default function TaxaModal({ taxa, action }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const isEdit = !!taxa

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const result = await action(taxa?.id ?? null, fd)
    if (result?.error) { setErrors(result.error); setLoading(false); return }
    toast.success(isEdit ? 'Taxa atualizada!' : 'Taxa cadastrada!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit ? 'btn btn-xs' : 'btn btn-primary'}>
        {isEdit ? 'Editar' : '+ Nova taxa'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)}
        title={isEdit ? 'Editar taxa' : 'Nova taxa por cidade'} size="sm">
        <form onSubmit={handleSubmit}>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="form-label">Cidade <span className="text-red-400">*</span></label>
              <input name="cidade" className="form-input" required defaultValue={taxa?.cidade ?? ''} />
              {errors.cidade && <p className="form-error">{errors.cidade[0]}</p>}
            </div>
            <div>
              <label className="form-label">Estado <span className="text-red-400">*</span></label>
              <select name="estado" className="form-input" required defaultValue={taxa?.estado ?? ''}>
                <option value="">Selecionar UF...</option>
                {UF.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.estado && <p className="form-error">{errors.estado[0]}</p>}
            </div>
            <div>
              <label className="form-label">Valor padrão (R$) <span className="text-red-400">*</span></label>
              <input name="valor_padrao" type="number" step="0.01" min="0"
                className="form-input" required
                defaultValue={taxa?.valor_padrao ?? ''} placeholder="0,00" />
              {errors.valor_padrao && <p className="form-error">{errors.valor_padrao[0]}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Salvando…' : 'Salvar taxa'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
