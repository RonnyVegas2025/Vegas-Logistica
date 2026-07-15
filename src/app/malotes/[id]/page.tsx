import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

const FORMA_LABEL: Record<string, string> = {
  presencial: 'Presencial', motoboy: 'Motoboy', sedex: 'SEDEX',
  transportadora: 'Transportadora', retirada: 'Retirada', outro: 'Outro'
}

const STATUS_LABEL: Record<string, string> = {
  aguardando_atribuicao: 'Aguardando entregador',
  atribuido: 'Atribuído',
  em_transito: 'Em trânsito',
  entregue: 'Entregue',
  insucesso: 'Insucesso',
  reentrega_pendente: 'Reentrega pendente',
  cancelado: 'Cancelado',
}

export default async function MaloteDetailPage({ params }: { params: { id: string } }) {
  const sb = createClient()

  const { data: malote } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_logradouro, end_numero, end_complemento, end_bairro,
      end_cidade, end_estado, end_cep,
      end_responsavel_nome, end_responsavel_tel, end_instrucoes,
      obs_parceiro, obs_parceiro_em,
      criado_em, atualizado_em,
      remessa_id,
      empresas(id, razao_social, cnpj),
      malote_itens(id, numero_serie, descricao, quantidade),
      delivery_assignments(
        id, status, forma_entrega, valor_autorizado,
        autorizado_em, prazo_entrega, motivo_encerramento,
        entregadores(id, nome, telefone)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!malote) notFound()

  const empresa = malote.empresas as any
  const itens = (malote.malote_itens as any[]) ?? []
  const assignments = ((malote.delivery_assignments as any[]) ?? [])
    .sort((a, b) => new Date(b.autorizado_em).getTime() - new Date(a.autorizado_em).getTime())
  const activeAssignment = assignments.find(a => a.status === 'ativa')

  return (
    <div className="fade-in max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/remessas" className="hover:text-gray-600">Remessas</Link>
        <span>/</span>
        <Link href={`/remessas/${malote.remessa_id}`} className="hover:text-gray-600">Remessa</Link>
        <span>/</span>
        <span className="text-gray-700 font-mono">{malote.codigo_op}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title font-mono">{malote.codigo_op}</h1>
            <span className="badge bg-blue-100 text-blue-700 text-xs">
              {STATUS_LABEL[malote.status] ?? malote.status}
            </span>
          </div>
          <p className="page-sub">{empresa?.razao_social}</p>
        </div>
        {malote.status === 'aguardando_atribuicao' && (
          <Link href={`/malotes/${malote.id}/atribuir`} className="btn btn-primary">
            Definir entregador
          </Link>
        )}
        {malote.status === 'atribuido' && (
          <Link href={`/malotes/${malote.id}/atribuir`} className="btn">
            Trocar entregador
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Dados da empresa */}
        <div className="card">
          <div className="card-header"><span className="card-title">Empresa</span></div>
          <div className="card-body text-sm flex flex-col gap-1">
            <div className="font-semibold">{empresa?.razao_social}</div>
            <div className="text-gray-400 font-mono text-xs">{empresa?.cnpj}</div>
          </div>
        </div>

        {/* Endereço de entrega */}
        <div className="card">
          <div className="card-header"><span className="card-title">Endereço de entrega</span></div>
          <div className="card-body text-sm flex flex-col gap-1">
            {malote.end_logradouro
              ? <>
                  <div>{malote.end_logradouro}{malote.end_numero ? `, ${malote.end_numero}` : ''}</div>
                  {malote.end_bairro && <div className="text-gray-500">{malote.end_bairro}</div>}
                  <div className="text-gray-500">{malote.end_cidade}/{malote.end_estado}</div>
                  {malote.end_responsavel_nome && (
                    <div className="text-gray-500 mt-1">📞 {malote.end_responsavel_nome} {malote.end_responsavel_tel}</div>
                  )}
                  {malote.end_instrucoes && (
                    <div className="text-amber-700 bg-amber-50 rounded px-2 py-1 text-xs mt-1">
                      ⚠ {malote.end_instrucoes}
                    </div>
                  )}
                </>
              : <div className="text-gray-400">{malote.end_cidade}/{malote.end_estado}</div>
            }
          </div>
        </div>
      </div>

      {/* Itens do malote */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Itens do malote</span>
          <span className="badge bg-gray-100 text-gray-600">{itens.length}</span>
        </div>
        <div className="card-body flex flex-col gap-1">
          {itens.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 text-sm py-0.5">
              <span className="badge bg-blue-50 text-blue-700 font-mono text-xs">{item.numero_serie}</span>
              <span className="text-gray-600">{item.descricao}</span>
              {item.quantidade > 1 && <span className="text-gray-400 text-xs">x{item.quantidade}</span>}
            </div>
          ))}
          {!itens.length && <div className="text-gray-400 text-sm">Nenhum item cadastrado</div>}
        </div>
      </div>

      {/* Entregador atual */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Entregador</span></div>
        <div className="card-body">
          {activeAssignment
            ? <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{activeAssignment.entregadores?.nome}</span>
                  <span className="badge bg-green-100 text-green-700 text-xs">Ativo</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-500">
                  <div>Forma: <strong>{FORMA_LABEL[activeAssignment.forma_entrega] ?? activeAssignment.forma_entrega}</strong></div>
                  <div>Valor: <strong className="text-blue-700">
                    {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(activeAssignment.valor_autorizado)}
                  </strong></div>
                  {activeAssignment.prazo_entrega && (
                    <div>Prazo: <strong>{new Date(activeAssignment.prazo_entrega).toLocaleDateString('pt-BR')}</strong></div>
                  )}
                </div>
              </div>
            : <div className="text-gray-400 text-sm">Nenhum entregador atribuído</div>
          }
        </div>
      </div>

      {/* Histórico de atribuições */}
      {assignments.length > 1 && (
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">Histórico de atribuições</span></div>
          <div className="divide-y divide-gray-50">
            {assignments.map((a: any) => (
              <div key={a.id} className="px-4 py-3 text-sm flex items-center justify-between">
                <div>
                  <span className="font-medium">{a.entregadores?.nome}</span>
                  <span className="text-gray-400 ml-2">{FORMA_LABEL[a.forma_entrega]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(a.valor_autorizado)}
                  </span>
                  <span className={`badge text-xs ${a.status === 'ativa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obs parceiro */}
      {malote.obs_parceiro && (
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">Observação do parceiro</span></div>
          <div className="card-body text-sm text-amber-700">{malote.obs_parceiro}</div>
        </div>
      )}

      <div className="flex gap-2">
        <Link href={`/remessas/${malote.remessa_id}`} className="btn">
          ← Voltar à remessa
        </Link>
      </div>
    </div>
  )
}
