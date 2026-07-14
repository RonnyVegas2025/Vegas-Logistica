import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { fmt_money } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import EmpresaModal from '@/components/modules/EmpresaModal'
import EnderecoEntregaModal from '@/components/modules/EnderecoEntregaModal'
import { updateEmpresa, toggleEmpresaStatus } from '@/lib/actions/empresas'
import { createEnderecoEntrega, updateEnderecoEntrega, setPrincipal, copiarEnderecoCadastral, toggleEnderecoStatus } from '@/lib/actions/enderecos-entrega'

export const dynamic = 'force-dynamic'

export default async function EmpresaDetailPage({ params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: usuario } = await sb.from('usuarios').select('perfil').eq('id', user!.id).single()
  const isAdmin = usuario?.perfil === 'admin'

  const { data: empresa } = await sb
    .from('empresas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!empresa) notFound()

  const { data: enderecos } = await sb
    .from('company_delivery_addresses')
    .select('*')
    .eq('empresa_id', params.id)
    .order('principal', { ascending: false })
    .order('nome_identificador')

  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo', true)

  const temEnderecoCadastral = !!(empresa.logradouro && empresa.cidade && empresa.estado)

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/empresas" className="hover:text-gray-600">Empresas</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{empresa.razao_social}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">{empresa.razao_social}</h1>
            <Badge s={empresa.ativo ? 'ativo' : 'inativo'} />
          </div>
          {empresa.nome_fantasia && (
            <p className="page-sub">{empresa.nome_fantasia}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <form action={toggleEmpresaStatus.bind(null, empresa.id, empresa.ativo)}>
              <button className={`btn btn-sm ${empresa.ativo ? 'btn-danger' : ''}`}>
                {empresa.ativo ? 'Inativar' : 'Ativar'}
              </button>
            </form>
            <EmpresaModal empresa={empresa} action={updateEmpresa} parceiros={parceiros ?? []} />
          </div>
        )}
      </div>

      {/* Dados cadastrais */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Dados cadastrais</span></div>
        <div className="card-body grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><div className="text-xs text-gray-400 mb-1">CNPJ</div><div className="font-mono">{empresa.cnpj ?? '—'}</div></div>
          <div><div className="text-xs text-gray-400 mb-1">Telefone</div><div>{empresa.telefone ?? '—'}</div></div>
          <div><div className="text-xs text-gray-400 mb-1">E-mail</div><div>{empresa.email_contato ?? '—'}</div></div>
          <div><div className="text-xs text-gray-400 mb-1">Valor padrão entrega</div><div className="font-semibold text-blue-700">{fmt_money(empresa.valor_entrega_padrao)}</div></div>
          <div className="col-span-2 lg:col-span-2">
            <div className="text-xs text-gray-400 mb-1">Endereço cadastral</div>
            <div>{[empresa.logradouro, empresa.numero, empresa.bairro, empresa.cidade && `${empresa.cidade}/${empresa.estado}`].filter(Boolean).join(', ') || '—'}</div>
          </div>
          {empresa.observacoes && (
            <div className="col-span-2 lg:col-span-3">
              <div className="text-xs text-gray-400 mb-1">Observações</div>
              <div className="text-gray-600">{empresa.observacoes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Endereços de entrega */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Endereços de entrega</span>
          <span className="badge bg-gray-100 text-gray-600">{enderecos?.length ?? 0}</span>
          {isAdmin && (
            <div className="flex gap-2 ml-auto">
              {temEnderecoCadastral && (
                <form action={copiarEnderecoCadastral.bind(null, empresa.id)}>
                  <button className="btn btn-sm">
                    📋 Usar endereço cadastral
                  </button>
                </form>
              )}
              <EnderecoEntregaModal
                empresaId={empresa.id}
                action={createEnderecoEntrega}
              />
            </div>
          )}
        </div>

        {(enderecos ?? []).length === 0 ? (
          <div className="card-body text-center text-gray-400 py-10">
            <div className="text-3xl mb-2">📍</div>
            <div className="font-medium text-gray-600 mb-1">Nenhum endereço de entrega</div>
            <div className="text-sm">
              {temEnderecoCadastral
                ? 'Clique em "Usar endereço cadastral" ou adicione um novo endereço.'
                : 'Adicione um endereço de entrega para esta empresa.'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(enderecos ?? []).map(end => (
              <div key={end.id} className={`p-4 ${!end.ativo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{end.nome_identificador}</span>
                      {end.principal && (
                        <span className="badge bg-blue-100 text-blue-700 text-xs">Principal</span>
                      )}
                      {end.origem === 'cadastral' && (
                        <span className="badge bg-gray-100 text-gray-500 text-xs">Cópia cadastral</span>
                      )}
                      <Badge s={end.ativo ? 'ativo' : 'inativo'} />
                    </div>
                    <div className="text-sm text-gray-600">
                      {[end.logradouro, end.numero, end.complemento, end.bairro, `${end.cidade}/${end.estado}`].filter(Boolean).join(', ')}
                      {end.cep && ` — CEP ${end.cep}`}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2 text-xs text-gray-500">
                      {end.responsavel_nome && <div><span className="font-medium">Responsável:</span> {end.responsavel_nome}</div>}
                      {end.responsavel_telefone && <div><span className="font-medium">Tel:</span> {end.responsavel_telefone}</div>}
                      {end.horario_permitido && <div><span className="font-medium">Horário:</span> {end.horario_permitido}</div>}
                      {end.ponto_referencia && <div><span className="font-medium">Ref:</span> {end.ponto_referencia}</div>}
                    </div>
                    {end.instrucoes_entrega && (
                      <div className="mt-1.5 text-xs bg-amber-50 text-amber-700 rounded px-2 py-1">
                        ⚠ {end.instrucoes_entrega}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                      {!end.principal && end.ativo && (
                        <form action={setPrincipal.bind(null, end.id, empresa.id)}>
                          <button className="btn btn-xs">Definir principal</button>
                        </form>
                      )}
                      <EnderecoEntregaModal
                        empresaId={empresa.id}
                        endereco={end}
                        action={updateEnderecoEntrega}
                      />
                      <form action={toggleEnderecoStatus.bind(null, end.id, empresa.id, end.ativo)}>
                        <button className={`btn btn-xs ${end.ativo ? 'btn-danger' : ''}`}>
                          {end.ativo ? 'Inativar' : 'Ativar'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
