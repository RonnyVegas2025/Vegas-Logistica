'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { atribuirEntregador } from '@/lib/actions/malotes'
import Link from 'next/link'

interface Props {
  malote: any
  entregadores: any[]
}

export default function AtribuirForm({ malote, entregadores }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await atribuirEntregador(fd)
    router.push(`/remessas/${malote.remessa_id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-body flex flex-col gap-4">
      <input type="hidden" name="malote_id" value={malote.id} />
      <input type="hidden" name="remessa_id" value={malote.remessa_id} />

      <div>
        <label className="form-label">Entregador <span className="text-red-400">*</span></label>
        <select name="entregador_id" className="form-input" required>
          <option value="">Selecionar entregador...</option>
          {entregadores.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.nome} — {e.filiais?.nome ?? 'Sem filial'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Forma de entrega <span className="text-red-400">*</span></label>
        <select name="forma_entrega" className="form-input" required>
          <option value="presencial">Presencial</option>
          <option value="motoboy">Motoboy</option>
          <option value="sedex">SEDEX</option>
          <option value="transportadora">Transportadora</option>
          <option value="retirada">Retirada</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      <div>
        <label className="form-label">Valor autorizado (R$) <span className="text-red-400">*</span></label>
        <input
          name="valor_autorizado"
          type="number"
          step="0.01"
          min="0"
          className="form-input"
          placeholder="0,00"
          defaultValue={malote.valor_autorizado > 0 ? malote.valor_autorizado : ''}
          required
        />
      </div>

      <div>
        <label className="form-label">Prazo de entrega</label>
        <input name="prazo_entrega" type="date" className="form-input" />
      </div>

      <div className="flex gap-2 pt-2">
        <Link href={`/remessas/${malote.remessa_id}`} className="btn flex-1 text-center">
          Cancelar
        </Link>
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          {loading ? 'Salvando...' : 'Confirmar atribuição'}
        </button>
      </div>
    </form>
  )
}
