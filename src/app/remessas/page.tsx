import { createClient } from '@/lib/supabase/server'
import { fmt_money } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import NovaRemessaModal from '@/components/modules/NovaRemessaModal'

export const dynamic = 'force-dynamic'

const filtros = [
  { label: 'Todas', value: 'todas' },
  { label: 'Rascunho', value: 'rascunho' },
  { label: 'Enviada', value: 'enviada' },
  { label: 'Recebida', value: 'recebida' },
  { label: 'Em distribuição', value: 'em_distribuicao' },
  { label: 'Concluída', value: 'concluida' },
]

export default async function RemessasPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const sb = createClient()
  const filtro = searchParams.status

  let query = sb
    .from('remessas')
    .select(`
      id, codigo, codigo_op, status, data_envio, data_recebimento, observacao, criado_em,
      parceiros(id, nome),
      malotes(valor_autorizado)
    `)
    .order('criado_em', { ascending: false })

  if (filtro && filtro !== 'todas') {
    query = query.eq('status', filtro)
  }

  const { data: remessas } = await query

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

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filtros.map(f => (
          <Link
            key={f.value}
            href={`/remessas?status=${f.value}`}
            className={`btn btn-sm ${(!filtro && f.value === 'todas') || filtro === f.value ? 'btn-primary' : ''}`}
          >
            {f.label}
          </Link>
        ))}
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
                <th>Malotes</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(remessas ?? []).map(r => {
                const malotes = (r.malotes as any[]) ?? []
                const total = malotes.reduce((a: number, m: any) => a + (m.valor_autorizado ?? 0), 0)
                return (
                  <tr key={r.id}>
                    <td className="mono font-semibold">{(r as any).codigo_op ?? r.codigo}</td>
                    <td className="font-medium">{(r.parceiros as any)?.nome}</td>
                    <td className="muted">{new Date(r.data_envio + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="muted">{r.data_recebimento ? new Date(r.data_recebimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className="text-sm font-medium">{malotes.length}</span>
                      <span className="text-xs text-gray-400 ml-1">malotes</span>
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
