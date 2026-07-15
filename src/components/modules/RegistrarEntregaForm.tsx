'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarEntrega } from '@/lib/actions/malotes'
import Link from 'next/link'

const MOTIVOS = [
  { value: 'ausente', label: 'Destinatário ausente' },
  { value: 'empresa_fechada', label: 'Empresa fechada' },
  { value: 'recusado', label: 'Recusou receber' },
  { value: 'endereco_nao_localizado', label: 'Endereço não localizado' },
  { value: 'reagendar', label: 'Reagendar entrega' },
  { value: 'outros', label: 'Outros' },
]

interface Props {
  malote: any
  resultadoInicial: string
}

export default function RegistrarEntregaForm({ malote, resultadoInicial }: Props) {
  const [resultado, setResultado] = useState(resultadoInicial)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await registrarEntrega(fd)
    router.push(`/remessas/${malote.remessa_id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-body flex flex-col gap-4">
      <input type="hidden" name="malote_id" value={malote.id} />
      <input type="hidden" name="remessa_id" value={malote.remessa_id} />

      {/* Resultado */}
      <div>
        <label className="form-label">Resultado <span className="text-red-400">*</span></label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setResultado('entregue')}
            className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
              resultado === 'entregue'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            ✓ Entregue com sucesso
          </button>
          <button
            type="button"
            onClick={() => setResultado('insucesso')}
            className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
              resultado === 'insucesso'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            ✗ Insucesso
          </button>
        </div>
        <input type="hidden" name="resultado" value={resultado} />
      </div>

      {/* Campos para entregue */}
      {resultado === 'entregue' && (
        <div>
          <label className="form-label">Nome do recebedor</label>
          <input
            name="nome_recebedor"
            className="form-input"
            placeholder="Quem assinou o protocolo"
          />
        </div>
      )}

      {/* Campos para insucesso */}
      {resultado === 'insucesso' && (
        <div>
          <label className="form-label">Motivo do insucesso <span className="text-red-400">*</span></label>
          <select name="motivo_insucesso" className="form-input" required>
            <option value="">Selecionar motivo...</option>
            {MOTIVOS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="form-label">Observação</label>
        <textarea
          name="observacao"
          className="form-input"
          rows={2}
          placeholder="Informações adicionais sobre a entrega..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Link href={`/remessas/${malote.remessa_id}`} className="btn flex-1 text-center">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className={`btn flex-1 ${resultado === 'entregue' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {loading ? 'Salvando...' : resultado === 'entregue' ? '✓ Confirmar entrega' : '✗ Registrar insucesso'}
        </button>
      </div>
    </form>
  )
}
