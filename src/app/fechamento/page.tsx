import { createClient } from '@/lib/supabase/server'
import { fmt_money, fmt_date } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Stat from '@/components/ui/Stat'
import FechamentoModal from '@/components/modules/FechamentoModal'
import AprovarFechamentoBtn from '@/components/modules/AprovarFechamentoBtn'

export const dynamic = 'force-dynamic'

export default async function FechamentoPage() {
  const sb = createClient()
  const { data: fechamentos } = await sb.from('fechamentos')
    .select('*, parceiros(nome), entregadores(nome), remessas(codigo)')
    .order('criado_em',{ascending:false})
  const { data: remessas } = await sb.from('remessas').select('id,codigo').in('status',['recebida','concluida'])
  const { data: entregadores } = await sb.from('entregadores').select('id,nome').eq('ativo',true)
  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo',true)

  const pendentes = (fechamentos??[]).filter(f=>f.status!=='pago')
  const pagos = (fechamentos??[]).filter(f=>f.status==='pago')
  const valorPend = pendentes.reduce((a,f)=>a+(f.valor_total??0),0)
  const valorPago = pagos.reduce((a,f)=>a+(f.valor_total??0),0)

  return (
    <div className="fade-in">
      <div className="page-h">
        <div><h1 className="page-title">Fechamento financeiro</h1><p className="page-sub">Controle de pagamentos para parceiros e entregadores</p></div>
        <FechamentoModal remessas={remessas??[]} entregadores={entregadores??[]} parceiros={parceiros??[]} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="A pagar" value={fmt_money(valorPend)} color="text-red-600"/>
        <Stat label="Aguardando aprovação" value={(fechamentos??[]).filter(f=>f.status==='pendente').length} color="text-amber-600"/>
        <Stat label="Aprovados s/ pagamento" value={(fechamentos??[]).filter(f=>f.status==='aprovado').length} color="text-blue-600"/>
        <Stat label="Pagos (histórico)" value={fmt_money(valorPago)} color="text-green-600"/>
      </div>

      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Pendentes de pagamento</span></div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr><th>Para quem</th><th>Tipo</th><th>Remessa</th><th>Qtd.</th><th>Valor total</th><th>Valor acordado</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {pendentes.map(f=>(
                <tr key={f.id}>
                  <td className="font-semibold">{f.tipo_pagamento==='nex7'?(f.parceiros as any)?.nome:(f.entregadores as any)?.nome}</td>
                  <td><span className={`badge ${f.tipo_pagamento==='nex7'?'bg-indigo-100 text-indigo-700':'bg-teal-100 text-teal-700'}`}>{f.tipo_pagamento==='nex7'?'Parceiro (NEX7)':'Entregador direto'}</span></td>
                  <td className="mono text-xs">{(f.remessas as any)?.codigo??'—'}</td>
                  <td>{f.quantidade_entregas} entregas</td>
                  <td className="font-semibold">{fmt_money(f.valor_total)}</td>
                  <td className={f.valor_acordado && f.valor_acordado!==f.valor_total?'font-bold text-red-600':''}>
                    {fmt_money(f.valor_acordado??f.valor_total)}
                    {f.valor_acordado && f.valor_acordado!==f.valor_total && <div className="text-xs text-gray-400">Ajustado</div>}
                  </td>
                  <td><Badge s={f.status}/></td>
                  <td><AprovarFechamentoBtn id={f.id} status={f.status} /></td>
                </tr>
              ))}
              {!pendentes.length && <tr><td colSpan={8} className="text-center text-gray-400 py-10">Nenhum fechamento pendente</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Histórico de pagamentos</span></div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr><th>Para quem</th><th>Tipo</th><th>Remessa</th><th>Qtd.</th><th>Valor pago</th><th>Pago em</th><th>Comprovante</th></tr></thead>
            <tbody>
              {pagos.map(f=>(
                <tr key={f.id}>
                  <td className="font-semibold">{f.tipo_pagamento==='nex7'?(f.parceiros as any)?.nome:(f.entregadores as any)?.nome}</td>
                  <td><span className={`badge ${f.tipo_pagamento==='nex7'?'bg-indigo-100 text-indigo-700':'bg-teal-100 text-teal-700'}`}>{f.tipo_pagamento==='nex7'?'Parceiro':'Entregador'}</span></td>
                  <td className="mono text-xs">{(f.remessas as any)?.codigo??'—'}</td>
                  <td>{f.quantidade_entregas}</td>
                  <td className="font-semibold text-green-600">{fmt_money(f.valor_acordado??f.valor_total)}</td>
                  <td className="muted">{fmt_date(f.pago_em)}</td>
                  <td>{f.comprovante_pag_url?<a href={f.comprovante_pag_url} target="_blank" className="btn btn-xs">📎</a>:'—'}</td>
                </tr>
              ))}
              {!pagos.length && <tr><td colSpan={7} className="text-center text-gray-400 py-8">Nenhum pagamento realizado ainda</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
