import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

const STATUS_MALOTE: Record<string, { label: string; color: string }> = {
  aguardando_atribuicao: { label: 'Aguardando entregador', color: 'bg-gray-100 text-gray-600' },
  atribuido:             { label: 'Atribuído',             color: 'bg-blue-100 text-blue-700' },
  em_transito:           { label: 'Em trânsito',           color: 'bg-amber-100 text-amber-700' },
  entregue:              { label: 'Entregue',              color: 'bg-green-100 text-green-700' },
  insucesso:             { label: 'Insucesso',             color: 'bg-red-100 text-red-700' },
  reentrega_pendente:    { label: 'Reentrega pendente',    color: 'bg-orange-100 text-orange-700' },
  cancelado:             { label: 'Cancelado',             color: 'bg-gray-100 text-gray-400' },
}

export default async function RemessaDetailPage({ params }: { params: { id: string } }) {
  const sb = createClient()

  const { data: remessa } = await sb
    .from('remessas')
    .select('*, parceiros(nome)')
    .eq('id', params.id)
    .single()

  if (!remessa) notFound()

  const { data: malotes } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_cidade, end_estado, end_logradouro, end_numero,
      obs_parceiro, obs_parceiro_em,
      empresas(razao_social, cnpj),
      malote_itens(id, numero_serie, descricao)
    `)
    .eq('remessa_id', params.id)
    .order('status')

  const total = malotes?.length ?? 0
  const entregues = malotes?.filter(m => m.status === 'entregue').length ?? 0
  const pendentes = malotes?.filter(m => ['aguardando_atribuicao','atribuido','em_transito'].includes(m.status)).length ?? 0
  const insucessos = malotes?.filter(m => m.status === 'insucesso').length ?? 0
  const valorTotal = malotes?.reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0) ?? 0

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/remessas" className="hover:text-gray-600">Remessas</Link>
        <span>/</span>
        <span className="font-mono text-gray-700">{remessa.codigo_op ?? remessa.codigo}</span>
        <Badge s={remessa.status} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="page-title font-mono">{remessa.codigo_op ?? remessa.codigo}</h1>
          <p className="page-sub">
            Parceiro: <strong>{(remessa.parceiros as any)?.nome}</strong>
            {' · '}Envio: {new Date(remessa.data_envio).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="stat">
          <div className="stat-label">Total malotes</div>
          <div className="stat-value text-gray-700">{total}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Entregues</div>
          <div className="stat-value text-green-600">{entregues}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pendentes</div>
          <div className="stat-value text-amber-600">{pendentes}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Insucessos</div>
          <div className="stat-value text-red-500">{insucessos}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Valor total</div>
          <div className="stat-value">
            {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(valorTotal)}
          </div>
        </div>
      </div>

      {/* Lista de malotes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Malotes desta remessa</span>
          <span className="badge bg-gray-100 text-gray-600">{total}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Cidade / UF</th>
                <th>Itens</th>
                <th>Valor</th>
                <th>Obs. Parceiro</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(malotes ?? []).map(m => {
                const st = STATUS_MALOTE[m.status] ?? { label: m.status, color: 'bg-gray-100 text-gray-600' }
                const itens = (m.malote_itens as any[]) ?? []
                const empresa = m.empresas as any
                return (
                  <tr key={m.id}>
                    <td className="mono font-semibold text-xs">{m.codigo_op}</td>
                    <td>
                      <div className="font-medium text-sm">{empresa?.razao_social ?? '—'}</div>
                    </td>
                    <td className="mono text-xs text-gray-500">{empresa?.cnpj ?? '—'}</td>
                    <td className="muted text-sm">
                      {[m.end_cidade, m.end_estado].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700 text-xs">
                        {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                      </span>
                    </td>
                    <td className="font-medium text-sm">
                      {m.valor_autorizado > 0
                        ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(m.valor_autorizado)
                        : <span className="text-gray-400 text-xs">A definir</span>
                      }
                    </td>
                    <td className="max-w-xs">
                      {m.obs_parceiro
                        ? <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 max-w-[200px] truncate" title={m.obs_parceiro}>
                            {m.obs_parceiro}
                          </div>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td>
                      <span className={`badge text-xs ${st.color}`}>{st.label}</span>
                    </td>
                    <td>
                      {m.status === 'aguardando_atribuicao' && (
                        <a
                          href={`/malotes/${m.id}/atribuir`}
                          className="btn btn-xs btn-primary"
                        >
                          Definir entregador
                        </a>
                      )}
                      {m.status !== 'aguardando_atribuicao' && (
                        <a
                          href={`/malotes/${m.id}`}
                          className="btn btn-xs"
                        >
                          Ver detalhes
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!malotes?.length && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-10">
                    Nenhum malote nesta remessa
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
