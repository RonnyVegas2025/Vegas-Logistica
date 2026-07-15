import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  aguardando_atribuicao: 'Aguardando entregador',
  atribuido: 'Atribuído',
  em_transito: 'Em trânsito',
  entregue: 'Entregue',
  insucesso: 'Insucesso',
  reentrega_pendente: 'Reentrega pendente',
  cancelado: 'Cancelado',
}

const STATUS_BADGE: Record<string, string> = {
  aguardando_atribuicao: 'bg-gray-100 text-gray-600',
  atribuido: 'bg-blue-100 text-blue-700',
  em_transito: 'bg-amber-100 text-amber-700',
  entregue: 'bg-green-100 text-green-700',
  insucesso: 'bg-red-100 text-red-700',
  reentrega_pendente: 'bg-orange-100 text-orange-700',
  cancelado: 'bg-gray-100 text-gray-400',
}

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const sb = createClient()
  const filtro = searchParams.status

  let query = sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_cidade, end_estado,
      remessas(codigo_op, codigo, data_envio, parceiros(nome)),
      empresas(razao_social),
      delivery_assignments(
        id, status, forma_entrega, valor_autorizado, autorizado_em,
        entregadores(nome)
      )
    `)
    .order('status')
    .order('codigo_op')

  if (filtro && filtro !== 'todos') {
    query = query.eq('status', filtro)
  }

  const { data: malotes } = await query

  const total = malotes?.length ?? 0
  const pendentes = malotes?.filter(m => m.status === 'aguardando_atribuicao').length ?? 0
  const atribuidos = malotes?.filter(m => m.status === 'atribuido').length ?? 0
  const entregues = malotes?.filter(m => m.status === 'entregue').length ?? 0
  const insucessos = malotes?.filter(m => m.status === 'insucesso').length ?? 0

  const filtros = [
    { label: 'Todos', value: 'todos', count: total },
    { label: 'Pendentes', value: 'aguardando_atribuicao', count: pendentes },
    { label: 'Atribuídos', value: 'atribuido', count: atribuidos },
    { label: 'Entregues', value: 'entregue', count: entregues },
    { label: 'Insucessos', value: 'insucesso', count: insucessos },
  ]

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Entregas</h1>
          <p className="page-sub">Todos os malotes por remessa</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filtros.map(f => (
          <Link
            key={f.value}
            href={`/entregas?status=${f.value}`}
            className={`btn btn-sm ${(!filtro && f.value === 'todos') || filtro === f.value ? 'btn-primary' : ''}`}
          >
            {f.label}
            <span className="ml-1.5 badge text-xs bg-white/20 text-current">{f.count}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Empresa</th>
                <th>Remessa</th>
                <th>Cidade / UF</th>
                <th>Entregador</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(malotes ?? []).map(m => {
                const remessa = m.remessas as any
                const empresa = m.empresas as any
                const assignments = (m.delivery_assignments as any[]) ?? []
                const activeAssignment = assignments.find(a => a.status === 'ativa')
                const entregador = activeAssignment?.entregadores

                return (
                  <tr key={m.id}>
                    <td className="mono text-xs font-semibold">{m.codigo_op}</td>
                    <td className="font-medium text-sm">{empresa?.razao_social ?? '—'}</td>
                    <td>
                      <Link
                        href={`/remessas/${remessa?.id ?? ''}`}
                        className="mono text-xs text-blue-600 hover:underline"
                      >
                        {remessa?.codigo_op ?? remessa?.codigo ?? '—'}
                      </Link>
                    </td>
                    <td className="muted text-sm">
                      {[m.end_cidade, m.end_estado].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="text-sm">
                      {entregador?.nome ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="text-sm font-medium">
                      {m.valor_autorizado > 0
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.valor_autorizado)
                        : <span className="text-gray-400 text-xs">A definir</span>
                      }
                    </td>
                    <td>
                      <span className={`badge text-xs ${STATUS_BADGE[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </td>
                    <td>
                      {m.status === 'aguardando_atribuicao' && (
                        <Link href={`/malotes/${m.id}/atribuir`} className="btn btn-xs btn-primary">
                          Definir entregador
                        </Link>
                      )}
                      {m.status !== 'aguardando_atribuicao' && (
                        <Link href={`/malotes/${m.id}`} className="btn btn-xs">
                          Ver detalhes
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!malotes?.length && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-10">
                    Nenhuma entrega encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
