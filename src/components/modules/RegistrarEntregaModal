'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MOTIVO_INSUCESSO } from '@/types/index'

interface Props { entregaId:string; empresaNome:string; statusAtual:string }

export default function RegistrarEntregaModal({ entregaId, empresaNome, statusAtual }: Props) {
  const [open, setOpen] = useState(false)
  const [aba, setAba] = useState<'entregue'|'insucesso'>('entregue')
  const [loading, setLoading] = useState(false)
  const [arquivo, setArquivo] = useState<File|null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    let comprovante_url: string | null = null
    if (arquivo) {
      // Upload do comprovante para o Supabase Storage
      const uploadFd = new FormData()
      uploadFd.append('file', arquivo)
      uploadFd.append('entrega_id', entregaId)
      const upRes = await fetch('/api/upload-comprovante', { method: 'POST', body: uploadFd })
      if (upRes.ok) { const up = await upRes.json(); comprovante_url = up.url }
    }

    const payload = aba === 'entregue'
      ? {
          status: 'entregue',
          data_entrega: fd.get('data_entrega'),
          nome_recebedor: fd.get('nome_recebedor') || null,
          obs_entrega: fd.get('obs_entrega') || null,
          tipo_comprovante: fd.get('tipo_comprovante') || null,
          comprovante_url,
        }
      : {
          status: 'insucesso',
          motivo_insucesso: fd.get('motivo_insucesso'),
          obs_entrega: fd.get('obs_entrega') || null,
          data_entrega: fd.get('data_entrega'),
        }

    const res = await fetch(`/api/entregas/${entregaId}/registrar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) { toast.error('Erro ao registrar'); setLoading(false); return }
    toast.success(aba === 'entregue' ? '✓ Entrega confirmada!' : '⚠ Insucesso registrado')
    setOpen(false); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-xs btn-primary">✓ Registrar</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar resultado da entrega" size="sm">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">{empresaNome}</div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100">
          <button type="button" onClick={() => setAba('entregue')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${aba==='entregue' ? 'text-green-700 border-b-2 border-green-600 bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-600'}`}>
            ✓ Entregue com sucesso
          </button>
          <button type="button" onClick={() => setAba('insucesso')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${aba==='insucesso' ? 'text-amber-700 border-b-2 border-amber-500 bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-600'}`}>
            ⚠ Insucesso / Tentativa
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="form-label">Data da tentativa <span className="text-red-400">*</span></label>
              <input name="data_entrega" type="date" className="form-input" required
                defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            {aba === 'entregue' ? (
              <>
                <div>
                  <label className="form-label">Nome de quem recebeu</label>
                  <input name="nome_recebedor" type="text" className="form-input" placeholder="Nome do recebedor" />
                </div>
                <div>
                  <label className="form-label">Tipo de comprovante</label>
                  <select name="tipo_comprovante" className="form-input">
                    <option value="">Selecionar...</option>
                    <option value="protocolo_fisico">Protocolo físico assinado</option>
                    <option value="sedex">Comprovante de SEDEX</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Anexar comprovante (foto ou PDF)</label>
                  <input type="file" accept="image/*,.pdf" className="form-input"
                    onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
                  <p className="form-hint">Protocolo assinado ou confirmação de SEDEX</p>
                </div>
              </>
            ) : (
              <div>
                <label className="form-label">Motivo do insucesso <span className="text-red-400">*</span></label>
                <select name="motivo_insucesso" className="form-input" required>
                  <option value="">Selecionar...</option>
                  {MOTIVO_INSUCESSO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Observação</label>
              <textarea name="obs_entrega" className="form-input" rows={2} placeholder="Opcional..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading}
              className={`btn ${aba==='entregue' ? 'btn-success' : 'btn-danger'}`}>
              {loading ? 'Salvando…' : aba==='entregue' ? '✓ Confirmar entrega' : '⚠ Confirmar insucesso'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
