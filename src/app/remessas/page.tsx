import { createClient } from '@/lib/supabase/server'
import { fmt_money } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import NovaRemessaModal from '@/components/modules/NovaRemessaModal'

export const dynamic = 'force-dynamic'

export default async function RemessasPage() {
  const sb = createClient()

  const { data: remessas } = await sb
    .from('remessas')
    .select(`
      id, codigo, status, data_envio, data_recebimento, observacao, criado_em,
      parceiros(id, nome),
      entregas(id, status, valor_entrega)
    `)
    .order('criado_em', { ascending: false })

  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo', true)

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Remessas</h1>
          <p className="page-sub">Malotes diários enviados ao parceiro</p>
        </div>
        <NovaRemessaModal parceiros={parceiros ?? []} />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Todas as remessas</span>
          <span className="badge bg-gray-100 text-gray-600">{remessas?.length ?? 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Parceiro</th>
                <th>Data envio</th>
                <th>Recebimento</th>
                <th>Entregas</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(remessas ?? []).map(r => {
                const entregas = (r.entregas as any[]) ?? []
                const total = entregas.reduce((a: number, e: any) => a + (e.valor_entrega ?? 0), 0)
                const entregues = entregas.filter((e: any) => e.status === 'entregue').length
                return (
                  <tr key={r.id}>
                    <td className="mono font-semibold">{r.codigo}</td>
                    <td className="font-medium">{(r.parceiros as any)?.nome}</td>
                    <td className="muted">{new Date(r.data_envio + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="muted">{r.data_recebimento ? new Date(r.data_recebimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className="text-sm font-medium">{entregues}/{entregas.length}</span>
                      <span className="text-xs text-gray-400 ml-1">entregas</span>
                    </td>
                    <td className="font-semibold">{fmt_money(total)}</td>
                    <td><Badge s={r.status} /></td>
                    <td>
                      <Link href={`/remessas/${r.id}`} className="btn btn-xs">Abrir →</Link>
                    </td>
                  </tr>
                )
              })}
              {!remessas?.length && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-12">Nenhuma remessa cadastrada ainda</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
