'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface Props {
  filial?: any
  action: (id: string | null, formData: FormData) => Promise<any>
}

export default function FilialModal({ filial, action }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const isEdit = !!filial

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const result = await action(filial?.id ?? null, fd)
    if (result?.error) {
      setErrors(result.error)
      setLoading(false)
      return
    }
    toast.success(isEdit ? 'Filial atualizada!' : 'Filial cadastrada!')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit ? 'btn btn-xs' : 'btn btn-primary'}>
        {isEdit ? 'Editar' : '+ Nova filial'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? 'Editar filial' : 'Nova filial'} size="md">
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Código <span className="text-red-400">*</span></label>
              <input name="code" className="form-input uppercase" defaultValue={filial?.code}
                placeholder="Ex: SP-01" required />
              {errors.code && <p className="form-error">{errors.code[0]}</p>}
              <p className="form-hint">Letras maiúsculas, números e hífen</p>
            </div>
            <div>
              <label className="form-label">Nome <span className="text-red-400">*</span></label>
              <input name="nome" className="form-input" defaultValue={filial?.nome} required />
              {errors.nome && <p className="form-error">{errors.nome[0]}</p>}
            </div>
            <div>
              <label className="form-label">Cidade</label>
              <input name="cidade" className="form-input" defaultValue={filial?.cidade ?? ''} />
            </div>
            <div>
              <label className="form-label">Estado</label>
              <select name="estado" className="form-input" defaultValue={filial?.estado ?? ''}>
                <option value="">UF</option>
                {UF.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Responsável</label>
              <input name="responsavel" className="form-input" defaultValue={filial?.responsavel ?? ''} />
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input name="telefone" className="form-input" defaultValue={filial?.telefone ?? ''} />
            </div>
            <div>
              <label className="form-label">E-mail</label>
              <input name="email" type="email" className="form-input" defaultValue={filial?.email ?? ''} />
              {errors.email && <p className="form-error">{errors.email[0]}</p>}
            </div>
            <input type="hidden" name="ativo" value={filial?.ativo !== false ? 'true' : 'false'} />
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Salvando…' : 'Salvar filial'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
