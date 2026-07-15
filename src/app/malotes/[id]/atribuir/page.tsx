import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AtribuirEntregadorPage({ params }: { params: { id: string } }) {
  const sb = createClient()

  const { data: malote } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_cidade, end_estado, end_logradouro, end_numero,
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

  const { data: filiais } = await sb
    .from('filiais')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  const empresa = malote.empresas as any
  const itens = malote.malote_itens as any[]

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

      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Itens do malote</span></div>
        <div className="card-body">
          <div className="flex flex-col gap-1">
            {itens.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="badge bg-blue-50 text-blue-700 font-mono text-xs">{item.numero_serie}</span>
                <span className="text-gray-600">{item.descricao}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Atribuição</span></div>
        <form className="card-body flex flex-col gap-4" action={async (fd: FormData) => {
          'use server'
          const sb2 = (await import('@/lib/supabase/server')).createClient()
          const entregador_id = fd.get('entregador_id') as string
          const valor = parseFloat(fd.get('valor_autorizado') as string || '0')
          const forma = fd.get('forma_entrega') as string
          const prazo = fd.get('prazo_entrega') as string

          if (!entregador_id) return

          // Cria assignment
          await sb2.from('delivery_assignments').insert({
            malote_id: params.id,
            entregador_id,
            forma_entrega: forma,
            valor_autorizado: valor,
            autorizado_em: new Date().toISOString(),
            prazo_entrega: prazo || null,
            status: 'ativa',
          })

          // Atualiza status do malote
          await sb2.from('malotes').update({
            status: 'atribuido',
            valor_autorizado: valor,
          }).eq('id', params.id)

          redirect(`/remessas/${malote.remessa_id}`)
        }}>
          <div>
            <label className="form-label">Entregador <span className="text-red-400">*</span></label>
            <select name="entregador_id" className="form-input" required>
              <option value="">Selecionar entregador...</option>
              {(entregadores ?? []).map(e => (
                <option key={e.id} value={e.id}>
                  {e.nome} — {(e.filiais as any)?.nome ?? 'Sem filial'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Forma de entrega <span className="text-red-400">*</span></label>
            <select name="forma_entrega" className="form-input" required>
              <option value="presencial">Presencial</option>
              <option value="motoboy">Motoboy</option>
              <option value="sedex">SEDEX</option>
              <option value="transportadora">Transportadora</option>
              <option value="retirada">Retirada</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="form-label">Valor autorizado (R$) <span className="text-red-400">*</span></label>
            <input
              name="valor_autorizado"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0,00"
              defaultValue={malote.valor_autorizado > 0 ? malote.valor_autorizado : ''}
              required
            />
          </div>
          <div>
            <label className="form-label">Prazo de entrega</label>
            <input name="prazo_entrega" type="date" className="form-input" />
          </div>
          <div className="flex gap-2 pt-2">
            <Link href={`/remessas/${malote.remessa_id}`} className="btn flex-1 text-center">
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary flex-1">
              Confirmar atribuição
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
