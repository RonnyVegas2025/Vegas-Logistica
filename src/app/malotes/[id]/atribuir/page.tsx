import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AtribuirForm from '@/components/modules/AtribuirForm'

export const dynamic = 'force-dynamic'

export default async function AtribuirEntregadorPage({ params }: { params: { id: string } }) {
  const sb = createClient()

  const { data: malote } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_cidade, end_estado,
      remessa_id,
      empresas(razao_social, cnpj),
      malote_itens(id, numero_serie, descricao)
    `)
    .eq('id', params.id)
    .single()

  if (!malote) notFound()

  const { data: entregadores } = await sb
    .from('entregadores')
    .select('id, nome, filiais(nome), formas_habilitadas')
    .eq('ativo', true)
    .order('nome')

  const empresa = malote.empresas as any
  const itens = (malote.malote_itens as any[]) ?? []

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/remessas" className="hover:text-gray-600">Remessas</Link>
        <span>/</span>
        <Link href={`/remessas/${malote.remessa_id}`} className="hover:text-gray-600">Voltar à remessa</Link>
        <span>/</span>
        <span className="text-gray-700">{malote.codigo_op}</span>
      </div>

      <h1 className="page-title mb-1">Definir entregador</h1>
      <p className="page-sub mb-5">
        {empresa?.razao_social} — {[malote.end_cidade, malote.end_estado].filter(Boolean).join(' / ')}
      </p>

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
        <div className="card-header"><span className="card-title">Atribuição</span></div>
        <AtribuirForm malote={malote} entregadores={entregadores ?? []} />
      </div>
    </div>
  )
}
