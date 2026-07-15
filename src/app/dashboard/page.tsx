import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const sb = createClient()

  const { data: malotes } = await sb
    .from('malotes')
    .select('id, status, valor_autorizado, criado_em')

  const { data: remessas } = await sb
    .from('remessas')
    .select('id, status, codigo_op, codigo, data_envio, parceiros(nome)')
    .order('criado_em', { ascending: false })
    .limit(5)

  const total = malotes?.length ?? 0
  const pendentes = malotes?.filter(m => ['aguardando_atribuicao','atribuido'].includes(m.status)).length ?? 0
  const entreguesHoje = malotes?.filter(m => {
    if (m.status !== 'entregue') return false
    const hoje = new Date().toISOString().split('T')[0]
    return m.criado_em?.startsWith(hoje)
  }).length ?? 0
  const insucessos = malotes?.filter(m => m.status === 'insucesso').length ?? 0
  const aPagar = malotes
    ?.filter(m => m.status === 'entregue')
    ?.reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0) ?? 0

  const remessasAbertas = remessas?.filter(r =>
    ['rascunho','enviada','recebida','em_distribuicao'].includes(r.status)
  ).length ?? 0

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            Visão geral operacional ·{' '}
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="stat">
          <div className="stat-label">Remessas abertas</div>
          <div className="stat-value text-blue-600">{remessasAbertas}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pendentes entrega</div>
          <div className="stat-value text-amber-600">{pendentes}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Entregues hoje</div>
          <div className="stat-value text-green-600">{entreguesHoje}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Insucessos</div>
          <div className="stat-value text-red-500">{insucessos}</div>
        </div>
        <div className="stat">
          <div className="stat-label">A pagar</div>
          <div className="stat-value">
            {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(aPagar)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Remessas recentes</span>
            <Link href="/remessas" className="text-xs text-blue-600 hover:underline ml-auto">Ver todas →</Link>
          </div>
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Parceiro</th>
                <th>Data envio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(remessas ?? []).map(r => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/remessas/${r.id}`} className="mono text-xs font-semibold text-blue-600 hover:underline">
                      {(r as any).codigo_op ?? r.codigo}
                    </Link>
                  </td>
                  <td className="muted text-sm">{(r.parceiros as any)?.nome ?? '—'}</td>
                  <td className="muted text-sm">
                    {new Date(r.data_envio).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <span className="badge bg-blue-100 text-blue-700 text-xs">{r.status}</span>
                  </td>
                </tr>
              ))}
              {!remessas?.length && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-6 text-sm">
                    Nenhuma remessa ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Malotes pendentes</span>
            <Link href="/entregas?status=aguardando_atribuicao" className="text-xs text-blue-600 hover:underline ml-auto">
              Ver todos →
            </Link>
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-amber-600 mb-1">{pendentes}</div>
            <div className="text-sm text-gray-500">malotes aguardando entregador</div>
            {pendentes > 0 && (
              <Link href="/entregas?status=aguardando_atribuicao" className="btn btn-sm btn-primary mt-3">
                Atribuir entregadores →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
