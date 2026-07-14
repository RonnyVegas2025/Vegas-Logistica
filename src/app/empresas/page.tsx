import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import EmpresaModal from '@/components/modules/EmpresaModal'
import { createEmpresa } from '@/lib/actions/empresas'

export const dynamic = 'force-dynamic'

export default async function EmpresasPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: usuario } = await sb.from('usuarios').select('perfil').eq('id', user!.id).single()
  const isAdmin = usuario?.perfil === 'admin'

  const { data: empresas } = await sb
    .from('empresas')
    .select('id,razao_social,nome_fantasia,cnpj,cidade,estado,ativo,valor_entrega_padrao')
    .order('razao_social')

  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo', true)

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="page-sub">Destinatários de cartões</p>
        </div>
        {isAdmin && <EmpresaModal action={createEmpresa} parceiros={parceiros ?? []} />}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Empresas cadastradas</span>
          <span className="badge bg-gray-100 text-gray-600">{empresas?.length ?? 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Razão social</th>
                <th>CNPJ</th>
                <th>Cidade / UF</th>
                <th>Valor padrão</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(empresas ?? []).map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="font-semibold">{e.razao_social}</div>
                    {e.nome_fantasia && <div className="text-xs text-gray-400">{e.nome_fantasia}</div>}
                  </td>
                  <td className="mono">{e.cnpj ?? '—'}</td>
                  <td className="muted">{[e.cidade, e.estado].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="font-medium text-blue-700">
                    {e.valor_entrega_padrao
                      ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(e.valor_entrega_padrao)
                      : '—'}
                  </td>
                  <td><Badge s={e.ativo ? 'ativo' : 'inativo'} /></td>
                  <td>
                    <Link href={`/empresas/${e.id}`} className="btn btn-xs">
                      Gerenciar →
                    </Link>
                  </td>
                </tr>
              ))}
              {!empresas?.length && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-10">
                    Nenhuma empresa cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
