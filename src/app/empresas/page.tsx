import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import EmpresaModal from '@/components/modules/EmpresaModal'
import { createEmpresa } from '@/lib/actions/empresas'

export const dynamic = 'force-dynamic'

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; endereco?: string }
}) {
  const sb = createClient()

  let query = sb
    .from('empresas')
    .select(`
      id, razao_social, nome_fantasia, cnpj, cidade, estado,
      ativo, valor_entrega_padrao,
      company_delivery_addresses(id)
    `)
    .order('razao_social')

  if (searchParams.q) {
    query = query.or(`razao_social.ilike.%${searchParams.q}%,cnpj.ilike.%${searchParams.q}%`)
  }
  if (searchParams.status) {
    query = query.eq('ativo', searchParams.status === 'ativo')
  }

  const { data: empresasRaw } = await query
  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo',true)

  // Filtro por endereço (baseado na presença de endereços de entrega)
  let empresas = empresasRaw ?? []
  if (searchParams.endereco === 'cadastrado') {
    empresas = empresas.filter(e => ((e.company_delivery_addresses as any[])?.length ?? 0) > 0)
  } else if (searchParams.endereco === 'pendente') {
    empresas = empresas.filter(e => !((e.company_delivery_addresses as any[])?.length))
  }

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="page-sub">Destinatários de cartões</p>
        </div>
        <EmpresaModal action={createEmpresa} parceiros={parceiros??[]}/>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <form className="flex gap-2 flex-1">
          <input
            name="q"
            className="form-input max-w-xs"
            placeholder="Buscar por nome ou CNPJ..."
            defaultValue={searchParams.q ?? ''}
          />
          <select name="status" className="form-input w-36" defaultValue={searchParams.status ?? ''}>
            <option value="">Todos status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <select name="endereco" className="form-input w-44" defaultValue={searchParams.endereco ?? ''}>
            <option value="">Todos endereços</option>
            <option value="cadastrado">✓ Com endereço</option>
            <option value="pendente">✗ Sem endereço</option>
          </select>
          <button type="submit" className="btn btn-primary">Filtrar</button>
          <a href="/empresas" className="btn">Limpar</a>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Empresas cadastradas</span>
          <span className="badge bg-gray-100 text-gray-600">{empresas.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Razão social</th><th>CNPJ</th><th>Cidade / UF</th>
                <th>Valor padrão</th><th>Status</th><th>Endereço</th><th></th>
              </tr>
            </thead>
            <tbody>
              {empresas.map(e=>(
                <tr key={e.id}>
                  <td>
                    <div className="font-semibold">{e.razao_social}</div>
                    {e.nome_fantasia&&<div className="text-xs text-gray-400">{e.nome_fantasia}</div>}
                  </td>
                  <td className="mono">{e.cnpj??'—'}</td>
                  <td className="muted">{[e.cidade,e.estado].filter(Boolean).join(' / ')||'—'}</td>
                  <td className="font-medium text-blue-700">
                    {e.valor_entrega_padrao
                      ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(e.valor_entrega_padrao)
                      : '—'}
                  </td>
                  <td><Badge s={e.ativo?'ativo':'inativo'}/></td>
                  <td>
                    {((e.company_delivery_addresses as any[])?.length > 0)
                      ? <span className="badge bg-green-100 text-green-700 text-xs">✓ Cadastrado</span>
                      : <span className="badge bg-red-100 text-red-600 text-xs">✗ Pendente</span>
                    }
                  </td>
                  <td><Link href={`/empresas/${e.id}`} className="btn btn-xs">Gerenciar →</Link></td>
                </tr>
              ))}
              {!empresas.length&&(
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">Nenhuma empresa encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
