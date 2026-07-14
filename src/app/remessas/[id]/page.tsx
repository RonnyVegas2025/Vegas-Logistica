import { createClient } from '@/lib/supabase/server'
import { fmt_money, fmt_date, endereco_str } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Stat from '@/components/ui/Stat'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdicionarEntregasModal from '@/components/modules/AdicionarEntregasModal'
import RegistrarEntregadorModal from '@/components/modules/RegistrarEntregadorModal'
import RegistrarEntregaModal from '@/components/modules/RegistrarEntregaModal'
import AlterarStatusRemessa from '@/components/modules/AlterarStatusRemessa'

export const dynamic = 'force-dynamic'

export default async function RemessaDetailPage({ params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: usuario } = await sb.from('usuarios').select('perfil,parceiro_id').eq('id', user!.id).single()
  const isParceiro = usuario?.perfil === 'parceiro'

  const { data: remessa } = await sb
    .from('remessas')
    .select(`*, parceiros(id,nome,email,telefone)`)
    .eq('id', params.id)
    .single()

  if (!remessa) notFound()

  const { data: entregas } = await sb
    .from('entregas')
    .select(`
      id, status, valor_entrega, obs_parceiro, obs_parceiro_em,
      data_entrega, nome_recebedor, tipo_comprovante, comprovante_url,
      motivo_insucesso, obs_entrega, atribuido_em,
      empresas(id, razao_social, cnpj),
      entregadores(id, nome)
    `)
    .eq('remessa_id', params.id)
    .order('criado_em', { ascending: true })

  const { data: empresas } = isParceiro ? { data: [] } : await sb
    .from('empresas').select('id,razao_social,cnpj,logradouro,numero,complemento,bairro,cidade,estado,cep,valor_entrega_padrao').eq('ativo', true).order('razao_social')

  const { data: entregadores } = isParceiro ? { data: [] } : await sb
    .from('entregadores').select('id,nome,parceiro_id').eq('ativo', true).order('nome')

  const ents = (entregas ?? [])
  const total = ents.reduce((a, e) => a + (e.valor_entrega ?? 0), 0)
  const entregues = ents.filter(e => e.status === 'entregue').length
  const insucessos = ents.filter(e => e.status === 'insucesso').length
  const pendentes = ents.filter(e => ['pendente', 'em_andamento'].includes(e.status)).length
  const comObs = ents.filter(e => e.obs_parceiro && !(e.entregadores as any)?.length).length

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/remessas" className="hover:text-gray-600">Remessas</Link>
        <span>/</span>
        <span className="font-mono text-gray-700 font-semibold">{remessa.codigo}</span>
        <Badge s={remessa.status} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="page-title">{remessa.codigo}</h1>
          <p className="page-sub">
            Parceiro: <strong>{(remessa.parceiros as any)?.nome}</strong>
            {' · '}Envio: {fmt_date(remessa.data_envio)}
            {remessa.data_recebimento && ` · Recebido: ${fmt_date(remessa.data_recebimento)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isParceiro && (
            <>
              <AlterarStatusRemessa remessaId={remessa.id} statusAtual={remessa.status} />
              <AdicionarEntregasModal remessaId={remessa.id} empresas={empresas ?? []} />
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <Stat label="Total entregas"  value={ents.length} />
        <Stat label="Entregues"       value={entregues}   color="text-green-600" sub={ents.length ? `${Math.round(entregues/ents.length*100)}%` : ''} />
        <Stat label="Pendentes"       value={pendentes}   color="text-amber-600" />
        <Stat label="Insucessos"      value={insucessos}  color="text-red-500" />
        <Stat label="Valor total"     value={fmt_money(total)} />
      </div>

      {/* Alerta obs parceiro */}
      {comObs > 0 && !isParceiro && (
        <div className="alert-warn mb-4">
          ⚠ {comObs} entrega(s) com observação do parceiro aguardando registro do entregador
        </div>
      )}

      {/* Tabela de entregas */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Entregas desta remessa</span>
          <span className="badge bg-gray-100 text-gray-600">{ents.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Endereço</th>
                <th>Valor</th>
                <th>Entregador</th>
                <th>Obs. parceiro</th>
                <th>Status</th>
                <th>Comprovante</th>
                {!isParceiro && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {ents.map(e => {
                const empresa = e.empresas as any
                const entregador = e.entregadores as any
                const temObs = e.obs_parceiro && !(e.entregadores as any)?.length
                return (
                  <tr key={e.id} className={temObs ? 'bg-amber-50/40' : ''}>
                    <td>
                      <div className="font-semibold text-gray-800">{empresa?.razao_social}</div>
                      {empresa?.cnpj && <div className="text-xs text-gray-400 font-mono">{empresa.cnpj}</div>}
                    </td>
                    <td className="muted max-w-[180px] truncate">{endereco_str(e as any) || '—'}</td>
                    <td className="font-semibold">{fmt_money(e.valor_entrega)}</td>
                    <td>
                      {entregador
                        ? <span className="text-sm font-medium text-gray-700">{entregador.nome}</span>
                        : <span className="text-xs text-gray-400 italic">Não atribuído</span>
                      }
                    </td>
                    <td className="max-w-[200px]">
                      {e.obs_parceiro
                        ? (
                          <div className={`text-xs rounded px-2 py-1.5 ${temObs ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-600'}`}>
                            &ldquo;{e.obs_parceiro}&rdquo;
                          </div>
                        )
                        : isParceiro
                          ? <ObsParceiroInline entregaId={e.id} />
                          : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>
                    <td><Badge s={e.status} /></td>
                    <td>
                      {e.comprovante_url
                        ? <a href={e.comprovante_url} target="_blank" className="btn btn-xs">Ver 📎</a>
                        : e.status === 'entregue'
                          ? <span className="text-xs text-gray-400">Sem anexo</span>
                          : <span className="text-gray-300">—</span>
                      }
                      {e.motivo_insucesso && (
                        <div className="text-xs text-amber-600 mt-1">{e.motivo_insucesso}</div>
                      )}
                    </td>
                    {!isParceiro && (
                      <td>
                        <div className="flex items-center gap-1">
                          {!entregador && e.status === 'pendente' && (
                            <RegistrarEntregadorModal
                              entregaId={e.id}
                              empresaNome={empresa?.razao_social}
                              entregadores={entregadores ?? []}
                              valorAtual={e.valor_entrega}
                            />
                          )}
                          {e.status !== 'entregue' && e.status !== 'insucesso' && (
                            <RegistrarEntregaModal
                              entregaId={e.id}
                              empresaNome={empresa?.razao_social}
                              statusAtual={e.status}
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {!ents.length && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-12">
                  Nenhuma entrega adicionada. {!isParceiro && 'Use "Adicionar entregas" para incluir empresas.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Componente inline para parceiro adicionar obs (client component pequeno embutido)
function ObsParceiroInline({ entregaId }: { entregaId: string }) {
  // Renderizado no servidor — o modal real está no client component
  return <span className="text-xs text-gray-300 italic">Clique para adicionar obs.</span>
}
