import { createClient } from '@/lib/supabase/server'
import { fmt_money, fmt_date } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

export default async function EntregasPage({ searchParams }: { searchParams: { status?: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: usuario } = await sb.from('usuarios').select('perfil,parceiro_id').eq('id', user!.id).single()
  const isParceiro = usuario?.perfil === 'parceiro'

  let q = sb.from('entregas')
    .select(`id,status,valor_entrega,data_entrega,nome_recebedor,tipo_comprovante,comprovante_url,obs_parceiro,motivo_insucesso,
      empresas(razao_social), entregadores(nome), remessas(codigo,parceiro_id,parceiros(nome))`)
    .order('criado_em',{ascending:false}).limit(200)

  if (searchParams.status) q = q.eq('status', searchParams.status)
  if (isParceiro) q = q.eq('remessas.parceiro_id', usuario!.parceiro_id!)

  const { data: entregas } = await q

  const FILTROS = [
    {label:'Todas', v:''},
    {label:'Pendentes', v:'pendente'},
    {label:'Em andamento', v:'em_andamento'},
    {label:'Entregues', v:'entregue'},
    {label:'Insucessos', v:'insucesso'},
  ]

  return (
    <div className="fade-in">
      <div className="page-h">
        <div><h1 className="page-title">Entregas</h1><p className="page-sub">Todas as entregas por remessa</p></div>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTROS.map(f=>(
          <a key={f.v} href={f.v?`/entregas?status=${f.v}`:'/entregas'}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${(searchParams.status??'')===f.v?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {f.label}
          </a>
        ))}
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr><th>Empresa</th><th>Remessa</th><th>Parceiro</th><th>Entregador</th><th>Valor</th><th>Data entrega</th><th>Comprovante</th><th>Status</th></tr></thead>
            <tbody>
              {(entregas??[]).map((e:any)=>(
                <tr key={e.id}>
                  <td className="font-semibold">{e.empresas?.razao_social??'—'}</td>
                  <td className="mono text-xs">{e.remessas?.codigo??'—'}</td>
                  <td className="muted">{e.remessas?.parceiros?.nome??'—'}</td>
                  <td>{e.entregadores?.nome??<span className="text-gray-300 italic text-xs">Não atribuído</span>}</td>
                  <td className="font-semibold">{fmt_money(e.valor_entrega)}</td>
                  <td className="muted">{fmt_date(e.data_entrega)}</td>
                  <td>
                    {e.comprovante_url ? <a href={e.comprovante_url} target="_blank" className="btn btn-xs">📎 Ver</a> : '—'}
                    {e.tipo_comprovante && <div className="text-xs text-gray-400 mt-0.5">{e.tipo_comprovante==='protocolo_fisico'?'Protocolo':e.tipo_comprovante==='sedex'?'SEDEX':'Outro'}</div>}
                  </td>
                  <td><Badge s={e.status}/></td>
                </tr>
              ))}
              {!entregas?.length && <tr><td colSpan={8} className="text-center text-gray-400 py-10">Nenhuma entrega encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
