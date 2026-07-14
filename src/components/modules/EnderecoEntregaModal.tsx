'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface Props {
  empresaId: string
  endereco?: any
  action: (id: string | null, empresaId: string, formData: FormData) => Promise<any>
}

export default function EnderecoEntregaModal({ empresaId, endereco, action }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const isEdit = !!endereco

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const result = await action(endereco?.id ?? null, empresaId, fd)
    if (result?.error) { setErrors(result.error); setLoading(false); return }
    toast.success(isEdit ? 'Endereço atualizado!' : 'Endereço adicionado!')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={isEdit ? 'btn btn-xs' : 'btn btn-sm btn-primary'}>
        {isEdit ? 'Editar' : '+ Novo endereço'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)}
        title={isEdit ? 'Editar endereço de entrega' : 'Novo endereço de entrega'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Identificador <span className="text-red-400">*</span></label>
              <input name="nome_identificador" className="form-input" required
                placeholder="Ex: Matriz, Filial Norte, CD São Paulo"
                defaultValue={endereco?.nome_identificador ?? ''} />
              {errors.nome_identificador && <p className="form-error">{errors.nome_identificador[0]}</p>}
            </div>
            <div className="col-span-2">
              <label className="form-label">Logradouro <span className="text-red-400">*</span></label>
              <input name="logradouro" className="form-input" required defaultValue={endereco?.logradouro ?? ''} />
              {errors.logradouro && <p className="form-error">{errors.logradouro[0]}</p>}
            </div>
            <div>
              <label className="form-label">Número</label>
              <input name="numero" className="form-input" defaultValue={endereco?.numero ?? ''} />
            </div>
            <div>
              <label className="form-label">Complemento</label>
              <input name="complemento" className="form-input" defaultValue={endereco?.complemento ?? ''} />
            </div>
            <div>
              <label className="form-label">Bairro</label>
              <input name="bairro" className="form-input" defaultValue={endereco?.bairro ?? ''} />
            </div>
            <div>
              <label className="form-label">CEP (só números)</label>
              <input name="cep" className="form-input" placeholder="00000000" defaultValue={endereco?.cep ?? ''} />
            </div>
            <div>
              <label className="form-label">Cidade <span className="text-red-400">*</span></label>
              <input name="cidade" className="form-input" required defaultValue={endereco?.cidade ?? ''} />
              {errors.cidade && <p className="form-error">{errors.cidade[0]}</p>}
            </div>
            <div>
              <label className="form-label">Estado <span className="text-red-400">*</span></label>
              <select name="estado" className="form-input" required defaultValue={endereco?.estado ?? ''}>
                <option value="">UF</option>
                {UF.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.estado && <p className="form-error">{errors.estado[0]}</p>}
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informações de entrega</div>
            </div>
            <div>
              <label className="form-label">Responsável pelo recebimento</label>
              <input name="responsavel_nome" className="form-input" defaultValue={endereco?.responsavel_nome ?? ''} />
            </div>
            <div>
              <label className="form-label">Telefone do responsável</label>
              <input name="responsavel_telefone" className="form-input" defaultValue={endereco?.responsavel_telefone ?? ''} />
            </div>
            <div>
              <label className="form-label">Horário permitido</label>
              <input name="horario_permitido" className="form-input"
                placeholder="Ex: 08:00–18:00 seg–sex" defaultValue={endereco?.horario_permitido ?? ''} />
            </div>
            <div>
              <label className="form-label">Ponto de referência</label>
              <input name="ponto_referencia" className="form-input" defaultValue={endereco?.ponto_referencia ?? ''} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Instruções de entrega</label>
              <textarea name="instrucoes_entrega" className="form-input" rows={2}
                placeholder="Ex: Entregar na portaria, solicitar João"
                defaultValue={endereco?.instrucoes_entrega ?? ''} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" name="principal" value="true" id="principal"
                defaultChecked={endereco?.principal ?? false} className="w-4 h-4" />
              <label htmlFor="principal" className="text-sm text-gray-700">
                Definir como endereço principal desta empresa
              </label>
            </div>
            <input type="hidden" name="ativo" value="true" />
            <input type="hidden" name="origem" value={endereco?.origem ?? 'manual'} />
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Salvando…' : 'Salvar endereço'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
