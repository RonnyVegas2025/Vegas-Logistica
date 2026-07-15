import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RegistrarEntregaForm from '@/components/modules/RegistrarEntregaForm'

export const dynamic = 'force-dynamic'

export default async function RegistrarEntregaPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { resultado?: string }
}) {
  const sb = createClient()

  const { data: malote } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_cidade, end_estado,
      remessa_id,
      empresas(razao_social, cnpj),
      malote_itens(id, numero_serie, descricao),
      delivery_assignments(
        id, status, forma_entrega,
        entregadores(nome)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!malote) notFound()

  const empresa = malote.empresas as any
  const itens = (malote.malote_itens as any[]) ?? []
  const assignments = (malote.delivery_assignments as any[]) ?? []
  const activeAssignment = assignments.find(a => a.status === 'ativa')
  const resultadoInicial = searchParams.resultado ?? 'entregue'

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/entregas" className="hover:text-gray-600">Entregas</Link>
        <span>/</span>
        <Link href={`/remessas/${malote.remessa_id}`} className="hover:text-gray-600">Remessa</Link>
        <span>/</span>
        <span className="text-gray-700">{malote.codigo_op}</span>
      </div>

      <h1 className="page-title mb-1">Registrar resultado</h1>
      <p className="page-sub mb-5">
        {empresa?.razao_social} — {[malote.end_cidade, malote.end_estado].filter(Boolean).join(' / ')}
      </p>

      {activeAssignment && (
        <div className="card mb-4">
          <div className="card-body text-sm text-gray-600">
            Entregador: <strong>{activeAssignment.entregadores?.nome}</strong>
            {' · '}Forma: <strong>{activeAssignment.forma_entrega}</strong>
          </div>
        </div>
      )}

      {itens.length > 0 && (
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">Itens do malote</span></div>
          <div className="card-body flex flex-col gap-1">
            {itens.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="badge bg-blue-50 text-blue-700 font-mono text-xs">{item.numero_serie}</span>
                <span className="text-gray-600">{item.descricao}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Resultado da entrega</span></div>
        <RegistrarEntregaForm
          malote={malote}
          resultadoInicial={resultadoInicial}
        />
      </div>
    </div>
  )
}
