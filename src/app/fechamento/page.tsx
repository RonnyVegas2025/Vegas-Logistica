import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NovoFechamentoModal from '@/components/modules/NovoFechamentoModal'
import { aprovarFechamento, marcarPago } from '@/lib/actions/fechamento'

export const dynamic = 'force-dynamic'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

export default async function FechamentoPage() {
  const sb = createClient()

  // Malotes elegíveis (entregues, sem fechamento aberto)
  const { data: elegiveis } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, valor_autorizado,
      empresas(razao_social),
      remessas(id, codigo_op, codigo, parceiros(id, nome)),
      delivery_assignments(id, status, valor_autorizado, entregador_id, entregadores(nome))
    `)
    .eq('status', 'entregue')
    .order('codigo_op')

  // Fechamentos
  const { data: fechamentos } = await sb
    .from('fechamentos')
    .select(`
      id, tipo_pagamento, quantidade_entregas, valor_total,
      valor_acordado, status, aprovado_em, pago_em, observacoes,
      criado_em,
      parceiros(nome),
      entregadores(nome),
      remessas(codigo_op, codigo)
    `)
    .order('criado_em', { ascending: false })

  // Remessas com malotes entregues (para o modal)
  const { data: remessasElegiveis } = await sb
    .from('remessas')
    .select('id, codigo_op, codigo, data_envio, parceiros(nome)')
    .in('id', Array.from(new Set((elegiveis ?? []).map(m => (m.remessas as any)?.id).filter(Boolean))))

  const { data: parceiros } = await sb.from('parceiros').select('id, nome').eq('ativo', true)
  const { data: entregadores } = await sb.from('entregadores').select('id, nome').eq('ativo', true).order('nome')

  // KPIs
  const totalElegivel = elegiveis?.reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0) ?? 0
  const totalPendente = fechamentos?.filter(f => f.status === 'pendente').length ?? 0
  const totalAprovado = fechamentos?.filter(f => f.status === 'aprovado').length ?? 0
  const totalPago = fechamentos?.filter(f => f.status === 'pago')
    .reduce((acc, f) => acc + (f.valor_total ?? 0), 0) ?? 0

  // Agrupa elegíveis por remessa
  const porRemessa: Record<string, any> = {}
  for (const m of elegiveis ?? []) {
    const r = m.remessas as any
    const key = r?.id ?? 'sem'
    if (!porRemessa[key]) porRemessa[key] = { remessa: r, malotes: [], total: 0 }
    porRemessa[key].malotes.push(m)
    porRemessa[key].total += m.valor_autorizado ?? 0
  }

  const fechamentosPendentes = (fechamentos ?? []).filter(f => f.status !== 'pago')
  const fechamentosPagos = (fechamentos ?? []).filter(f => f.status === 'pago')

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Fechamento financeiro</h1>
          <p className="page-sub">Controle de pagamentos por remessa</p>
        </div>
        {elegiveis && elegiveis.length > 0 && (
          <NovoFechamentoModal
            remessas={remessasElegiveis ?? []}
            parceiros={parceiros ?? []}
            entregadores={entregadores ?? []}
          />
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="stat">
          <div className="stat-label">A fechar (elegíveis)</div>
          <div className="stat-value text-red-500">{fmt(totalElegivel)}</div>
          <div className="text-xs text-gray-400 mt-1">{elegiveis?.length ?? 0} malotes entregues</div>
        </div>
        <div className="stat">
          <div className="stat-label">Aguardando aprovação</div>
          <div className="stat-value text-amber-600">{totalPendente}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Aprovados s/ pagamento</div>
          <div className="stat-value text-blue-600">{totalAprovado}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pagos (histórico)</div>
          <div className="stat-value text-green-600">{fmt(totalPago)}</div>
        </div>
      </div>

      {/* Malotes elegíveis */}
      {Object.values(porRemessa).length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">Prontos para fechar</span>
            <span className="badge bg-green-100 text-green-700 text-xs">
              {elegiveis?.length} malotes · {fmt(totalElegivel)}
            </span>
          </div>
          {Object.values(porRemessa).map(({ remessa, malotes, total }) => (
            <div key={remessa?.id} className="border-b border-gray-50 last:border-0">
              <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
                <div className="font-semibold text-sm">
                  {remessa?.codigo_op ?? remessa?.codigo}
                  <span className="text-gray-400 font-normal ml-2 text-xs">
                    {(remessa?.parceiros as any)?.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{malotes.length} malotes</span>
                  <span className="font-semibold text-blue-700 text-sm">{fmt(total)}</span>
                </div>
              </div>
              {malotes.map((m: any) => {
                const empresa = m.empresas as any
                const assignments = (m.delivery_assignments as any[]) ?? []
                const enc = assignments.find((a: any) => a.status === 'encerrada') ?? assignments[0]
                return (
                  <div key={m.id} className="px-4 py-2 flex items-center justify-between text-sm border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="mono text-xs text-gray-400">{m.codigo_op}</span>
                      <span>{empresa?.razao_social}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {enc?.entregadores && (
                        <span className="text-xs text-gray-400">🚴 {(enc.entregadores as any).nome}</span>
                      )}
                      <span className="font-medium text-green-700">{fmt(m.valor_autorizado)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Sem elegíveis */}
      {Object.values(porRemessa).length === 0 && (
        <div className="card mb-4">
          <div className="card-body text-center py-8 text-gray-400 text-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-medium text-gray-600 mb-1">Nenhum malote elegível para fechamento</div>
            <div>Malotes precisam estar com status &ldquo;Entregue&rdquo; para aparecer aqui</div>
            <Link href="/entregas" className="btn btn-sm btn-primary mt-3 inline-block">
              Ver entregas →
            </Link>
          </div>
        </div>
      )}

      {/* Fechamentos pendentes */}
      {fechamentosPendentes.length > 0 && (
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">Pendentes de pagamento</span></div>
          <div className="overflow-x-auto">
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Para quem</th>
                  <th>Tipo</th>
                  <th>Remessa</th>
                  <th>Malotes</th>
                  <th>Valor total</th>
                  <th>Previsão pgto</th>
                  <th>Status</th>
                  <th>Ações</th>
                  <th>Recibo</th>
                </tr>
              </thead>
              <tbody>
                {fechamentosPendentes.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium text-sm">
                      {(f.parceiros as any)?.nome ?? (f.entregadores as any)?.nome ?? '—'}
                    </td>
                    <td className="text-xs text-gray-500">
                      {f.tipo_pagamento === 'nex7' ? '🏢 Parceiro' : '🚴 Entregador'}
                    </td>
                    <td className="mono text-xs">
                      {(f.remessas as any)?.codigo_op ?? (f.remessas as any)?.codigo}
                    </td>
                    <td className="text-center">{f.quantidade_entregas}</td>
                    <td className="font-semibold text-blue-700">{fmt(f.valor_total)}</td>
                    <td className="text-sm text-gray-500">
                      {f.observacoes?.includes('Previsão:')
                        ? f.observacoes.split('Previsão:')[1]?.split('\n')[0]?.trim()
                        : '—'
                      }
                    </td>
                    <td>
                      <span className={`badge text-xs ${
                        f.status === 'aprovado' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {f.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {f.status === 'pendente' && (
                          <form action={async () => {
                            'use server'
                            await aprovarFechamento(f.id)
                          }}>
                            <button className="btn btn-xs btn-primary">Aprovar</button>
                          </form>
                        )}
                        {f.status === 'aprovado' && (
                          <form action={async (fd: FormData) => {
                            'use server'
                            fd.append('fechamento_id', f.id)
                            await marcarPago(fd)
                          }}>
                            <button className="btn btn-xs bg-green-600 text-white">
                              ✓ Marcar pago
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                    <td>
                      <a href={`/recibo/${f.id}`} className="btn btn-xs" target="_blank">
                        📄 Recibo
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Histórico de pagamentos */}
      {fechamentosPagos.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Histórico de pagamentos</span></div>
          <div className="overflow-x-auto">
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Para quem</th>
                  <th>Tipo</th>
                  <th>Remessa</th>
                  <th>Malotes</th>
                  <th>Valor pago</th>
                  <th>Pago em</th>
                  <th>Recibo</th>
                </tr>
              </thead>
              <tbody>
                {fechamentosPagos.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium text-sm">
                      {(f.parceiros as any)?.nome ?? (f.entregadores as any)?.nome ?? '—'}
                    </td>
                    <td className="text-xs text-gray-500">
                      {f.tipo_pagamento === 'nex7' ? '🏢 Parceiro' : '🚴 Entregador'}
                    </td>
                    <td className="mono text-xs">
                      {(f.remessas as any)?.codigo_op ?? (f.remessas as any)?.codigo}
                    </td>
                    <td className="text-center">{f.quantidade_entregas}</td>
                    <td className="font-semibold text-green-700">{fmt(f.valor_total)}</td>
                    <td className="text-sm text-gray-500">
                      {f.pago_em ? new Date(f.pago_em).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <a href={`/recibo/${f.id}`} className="btn btn-xs" target="_blank">
                        📄 Recibo
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
