import { createClient } from '@/lib/supabase/server'
import { fmt_money } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Stat from '@/components/ui/Stat'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const sb = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalRemessas },
    { count: remessasAbertas },
    { count: entregasPendentes },
    { count: entregasHoje },
    { count: insucessos },
  ] = await Promise.all([
    sb.from('remessas').select('*',{count:'exact',head:true}),
    sb.from('remessas').select('*',{count:'exact',head:true}).in('status',['enviada','recebida']),
    sb.from('entregas').select('*',{count:'exact',head:true}).in('status',['pendente','em_andamento']),
    sb.from('entregas').select('*',{count:'exact',head:true}).eq('status','entregue').gte('data_entrega', today),
    sb.from('entregas').select('*',{count:'exact',head:true}).eq('status','insucesso'),
  ])

  // Últimas remessas
  const { data: remessas } = await sb
    .from('remessas')
    .select('id,codigo,status,data_envio,parceiros(nome)')
    .order('criado_em',{ascending:false})
    .limit(6)

  // Pendências de obs do parceiro (parceiro adicionou obs mas entregador não registrado)
  const { data: comObs } = await sb
    .from('entregas')
    .select('id,obs_parceiro,obs_parceiro_em,empresas(razao_social),remessas(codigo)')
    .not('obs_parceiro','is',null)
    .is('entregador_id',null)
    .limit(5)

  // Fechamentos pendentes
  const { data: fechamentos } = await sb
    .from('fechamentos')
    .select('id,valor_total,tipo_pagamento,status,parceiros(nome),entregadores(nome)')
    .neq('status','pago')
    .limit(5)

  const valorPendente = (fechamentos??[]).reduce((a,f)=>a+(f.valor_total??0),0)

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Visão geral operacional · {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</p>
        </div>
        <Link href="/remessas" className="btn btn-primary">+ Nova remessa</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat label="Remessas abertas"   value={remessasAbertas??0}   color="text-blue-600" />
        <Stat label="Pendentes entrega"  value={entregasPendentes??0} color="text-amber-600" />
        <Stat label="Entregues hoje"     value={entregasHoje??0}      color="text-green-600" />
        <Stat label="Insucessos"         value={insucessos??0}        color="text-red-500" />
        <Stat label="A pagar"            value={fmt_money(valorPendente)} color="text-gray-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Últimas remessas */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <span className="card-title">Remessas recentes</span>
            <Link href="/remessas" className="btn btn-sm">Ver todas →</Link>
          </div>
          <table className="tbl w-full">
            <thead><tr><th>Código</th><th>Parceiro</th><th>Data envio</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(remessas??[]).map(r=>(
                <tr key={r.id}>
                  <td className="mono">{r.codigo}</td>
                  <td className="font-medium">{(r.parceiros as any)?.nome}</td>
                  <td className="muted">{new Date(r.data_envio+'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td><Badge s={r.status}/></td>
                  <td><Link href={`/remessas/${r.id}`} className="btn btn-xs">Abrir</Link></td>
                </tr>
              ))}
              {!remessas?.length && <tr><td colSpan={5} className="text-center text-gray-400 py-8">Nenhuma remessa ainda</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4">
          {/* Obs do parceiro pendentes */}
          {(comObs??[]).length > 0 && (
            <div className="card border-amber-200 bg-amber-50">
              <div className="card-header bg-amber-50 border-amber-100">
                <span className="card-title text-amber-700">⚠ Obs. do parceiro para registrar</span>
                <span className="badge bg-amber-200 text-amber-800">{comObs?.length}</span>
              </div>
              <div className="divide-y divide-amber-100">
                {(comObs??[]).map(e=>(
                  <div key={e.id} className="px-4 py-3">
                    <div className="text-xs font-semibold text-gray-800">{(e.empresas as any)?.razao_social}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Remessa: {(e.remessas as any)?.codigo}</div>
                    <div className="text-xs bg-white rounded p-2 mt-1.5 border border-amber-200 text-amber-800 italic">
                      &ldquo;{e.obs_parceiro}&rdquo;
                    </div>
                    <Link href={`/entregas/${e.id}`} className="btn btn-xs mt-2 border-amber-300">Registrar entregador</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fechamentos */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Fechamentos pendentes</span>
              <Link href="/fechamento" className="btn btn-sm">Ver →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(fechamentos??[]).map(f=>(
                <div key={f.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-800">
                      {f.tipo_pagamento==='nex7' ? (f.parceiros as any)?.nome : (f.entregadores as any)?.nome}
                    </div>
                    <div className="text-xs text-gray-400">{f.tipo_pagamento==='nex7'?'Parceiro':'Entregador'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{fmt_money(f.valor_total)}</div>
                    <Badge s={f.status} className="mt-0.5"/>
                  </div>
                </div>
              ))}
              {!fechamentos?.length && <p className="text-xs text-gray-400 text-center py-6">Nenhum fechamento pendente</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
