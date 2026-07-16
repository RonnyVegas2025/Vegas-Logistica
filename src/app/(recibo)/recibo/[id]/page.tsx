import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ImprimirButton from './ImprimirButton'

export const dynamic = 'force-dynamic'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

export default async function ReciboPage({ params }: { params: { id: string } }) {
  const sb = createClient()

  const { data: fechamento } = await sb
    .from('fechamentos')
    .select(`
      id, tipo_pagamento, quantidade_entregas, valor_total,
      valor_acordado, status, aprovado_em, pago_em, observacoes,
      criado_em,
      parceiros(nome, cnpj),
      entregadores(nome, documento),
      remessas(codigo_op, codigo, data_envio)
    `)
    .eq('id', params.id)
    .single()

  if (!fechamento) notFound()

  const { data: fechamento_malotes } = await sb
    .from('fechamento_malotes')
    .select(`
      valor_autorizado, valor_pago,
      malotes(
        codigo_op, valor_autorizado,
        end_cidade, end_estado,
        empresas(razao_social, cnpj),
        delivery_attempts(data_tentativa, resultado, nome_recebedor)
      )
    `)
    .eq('fechamento_id', params.id)

  const remessa = fechamento.remessas as any
  const parceiro = fechamento.parceiros as any
  const entregador = fechamento.entregadores as any

  // Extrai previsão de pagamento e forma de pagamento das observações
  const obs = fechamento.observacoes ?? ''
  const previsao = obs.match(/Previsão: ([^\n]+)/)?.[1]?.trim()
  const formaPgto = obs.match(/Forma: ([^\n]+)/)?.[1]?.trim()

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm print:shadow-none p-8">

        {/* Botões de ação - não aparecem na impressão */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <a href="/fechamento" className="btn">← Voltar</a>
          <ImprimirButton />
        </div>

        {/* Header do recibo */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-100">
          <div>
            <img
              src="https://oejjjhytfjiyffcohkyp.supabase.co/storage/v1/object/public/assets/Logo_Colorido_4x_1.png"
              alt="Vegas Logística"
              className="h-12 w-auto mb-3"
            />
            <div className="text-sm text-gray-500">Vegas Card do Brasil</div>
            <div className="text-sm text-gray-500">Sistema de Logística de Cartões</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">RECIBO DE PAGAMENTO</div>
            <div className="text-sm text-gray-500 mt-1">
              Emitido em {fmtDate(new Date().toISOString())}
            </div>
            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              fechamento.status === 'pago'
                ? 'bg-green-100 text-green-700'
                : fechamento.status === 'aprovado'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {fechamento.status === 'pago' ? '✓ PAGO' : fechamento.status === 'aprovado' ? 'APROVADO' : 'PENDENTE'}
            </div>
          </div>
        </div>

        {/* Dados do pagamento */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pagar para</div>
            <div className="font-semibold text-gray-800">
              {parceiro?.nome ?? entregador?.nome ?? '—'}
            </div>
            {parceiro?.cnpj && (
              <div className="text-sm text-gray-500">CNPJ: {parceiro.cnpj}</div>
            )}
            {entregador?.documento && (
              <div className="text-sm text-gray-500">CPF: {entregador.documento}</div>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Referente à remessa</div>
            <div className="font-semibold text-gray-800">
              {remessa?.codigo_op ?? remessa?.codigo}
            </div>
            <div className="text-sm text-gray-500">
              Envio: {remessa?.data_envio ? fmtDate(remessa.data_envio) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tipo de pagamento</div>
            <div className="font-semibold text-gray-800">
              {fechamento.tipo_pagamento === 'nex7' ? 'Parceiro (NEX7)' : 'Entregador direto'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Data do pagamento</div>
            <div className="font-semibold text-gray-800">
              {fechamento.pago_em ? fmtDate(fechamento.pago_em) : previsao ? `Previsto: ${previsao}` : '—'}
            </div>
          </div>
          {formaPgto && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Forma de pagamento</div>
              <div className="font-semibold text-gray-800">{formaPgto}</div>
            </div>
          )}
        </div>

        {/* Tabela de malotes */}
        <div className="mb-8">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Detalhamento das entregas
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">Código</th>
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">Empresa</th>
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">Cidade/UF</th>
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">Data entrega</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {(fechamento_malotes ?? []).map((fm, i) => {
                const malote = fm.malotes as any
                const empresa = malote?.empresas as any
                const attempts = (malote?.delivery_attempts as any[]) ?? []
                const entregue = attempts.find((a: any) => a.resultado === 'entregue')
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 font-mono text-xs text-gray-500">{malote?.codigo_op}</td>
                    <td className="py-2.5 font-medium">{empresa?.razao_social}</td>
                    <td className="py-2.5 text-gray-500">
                      {[malote?.end_cidade, malote?.end_estado].filter(Boolean).join('/')}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {entregue?.data_tentativa ? fmtDate(entregue.data_tentativa) : '—'}
                    </td>
                    <td className="py-2.5 text-right font-medium">{fmt(fm.valor_pago ?? fm.valor_autorizado ?? 0)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800">
                <td colSpan={4} className="py-3 font-bold text-gray-800">TOTAL</td>
                <td className="py-3 text-right font-bold text-lg text-gray-800">
                  {fmt(fechamento.valor_total ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-gray-100">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-8">
              <div className="text-sm font-medium text-gray-700">Vegas Card do Brasil</div>
              <div className="text-xs text-gray-500">Emitente</div>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-8">
              <div className="text-sm font-medium text-gray-700">
                {parceiro?.nome ?? entregador?.nome ?? 'Recebedor'}
              </div>
              <div className="text-xs text-gray-500">Recebedor</div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Vegas Logística — Sistema de controle de remessas e entregas de cartões
        </div>

      </div>
    </div>
  )
}
