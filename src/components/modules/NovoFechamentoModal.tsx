'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { criarFechamentoPorRemessa } from '@/lib/actions/fechamento'

interface Props {
  remessas: any[]
  parceiros: any[]
  entregadores: any[]
}

export default function NovoFechamentoModal({ remessas, parceiros, entregadores }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'nex7' | 'entregador'>('nex7')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('tipo_pagamento', tipo)
    const result = await criarFechamentoPorRemessa(fd)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success('Fechamento criado!')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        + Novo fechamento
      </button>
      <Modal open={open} onClose={() => setOpen(false)}
        title="Novo fechamento" size="md">
        <form onSubmit={handleSubmit}>
          <div className="p-5 flex flex-col gap-4">
            {/* Tipo de pagamento */}
            <div>
              <label className="form-label">Pagar para <span className="text-red-400">*</span></label>
              <div className="flex gap-2 mt-1">
                <button type="button"
                  onClick={() => setTipo('nex7')}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    tipo === 'nex7'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}>
                  🏢 NEX7 (Parceiro)
                </button>
                <button type="button"
                  onClick={() => setTipo('entregador')}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    tipo === 'entregador'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}>
                  🚴 Entregador direto
                </button>
              </div>
            </div>

            {/* Remessa */}
            <div>
              <label className="form-label">Remessa <span className="text-red-400">*</span></label>
              <select name="remessa_id" className="form-input" required>
                <option value="">Selecionar remessa...</option>
                {remessas.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.codigo_op ?? r.codigo} — {r.parceiros?.nome} ({new Date(r.data_envio).toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>

            {/* Parceiro (se NEX7) */}
            {tipo === 'nex7' && (
              <div>
                <label className="form-label">Parceiro <span className="text-red-400">*</span></label>
                <select name="parceiro_id" className="form-input" required={tipo === 'nex7'}>
                  <option value="">Selecionar parceiro...</option>
                  {parceiros.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Entregador (se direto) */}
            {tipo === 'entregador' && (
              <div>
                <label className="form-label">Entregador <span className="text-red-400">*</span></label>
                <select name="entregador_id" className="form-input" required={tipo === 'entregador'}>
                  <option value="">Selecionar entregador...</option>
                  {entregadores.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Previsão de pagamento */}
            <div>
              <label className="form-label">Previsão de pagamento</label>
              <input type="date" name="previsao_pagamento" className="form-input" />
              <p className="form-hint">Data prevista para realizar o pagamento</p>
            </div>

            {/* Forma de pagamento */}
            <div>
              <label className="form-label">Forma de pagamento</label>
              <select name="forma_pagamento" className="form-input">
                <option value="">Selecionar...</option>
                <option value="PIX">PIX</option>
                <option value="Depósito bancário">Depósito bancário</option>
                <option value="Transferência bancária">Transferência bancária</option>
                <option value="Crédito cartão Vegas">Crédito cartão Vegas</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>

            {/* Observações */}
            <div>
              <label className="form-label">Observações</label>
              <textarea name="observacoes" className="form-input" rows={2}
                placeholder="Informações adicionais sobre o fechamento..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Criando...' : 'Criar fechamento'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
