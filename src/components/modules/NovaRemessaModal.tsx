'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function NovaRemessaModal({ parceiros }: { parceiros: {id:string;nome:string}[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/remessas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parceiro_id: fd.get('parceiro_id'),
        data_envio: fd.get('data_envio'),
        observacao: fd.get('observacao') || null,
      })
    })
    if (!res.ok) { toast.error('Erro ao criar remessa'); setLoading(false); return }
    const data = await res.json()
    toast.success(`Remessa ${data.codigo} criada!`)
    setOpen(false); setLoading(false)
    router.push(`/remessas/${data.id}`)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">+ Nova remessa</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova remessa diária" size="sm">
        <form onSubmit={submit}>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="form-label">Parceiro <span className="text-red-400">*</span></label>
              <select name="parceiro_id" className="form-input" required>
                <option value="">Selecionar parceiro...</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Data de envio <span className="text-red-400">*</span></label>
              <input name="data_envio" type="date" className="form-input" required
                defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Observação interna</label>
              <textarea name="observacao" className="form-input" rows={2} placeholder="Opcional..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Criando…' : 'Criar remessa'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
